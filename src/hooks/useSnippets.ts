/**
 * src/hooks/useSnippets.ts
 *
 * TanStack Query hooks for listing + mutating snippets.
 * All data access goes through /lib/api.ts — never import supabase here.
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import {
  fetchSnippets,
  createSnippet,
  updateSnippet,
  deleteSnippet,
} from "@/lib/api";
import { snippetKeys } from "@/types";
import type { CreateSnippetInput, UpdateSnippetInput, SnippetFilters } from "@/types";
import { toast } from "sonner";

// ── List query ─────────────────────────────────────────────────────────────────

export function useSnippets(filters: SnippetFilters = {}) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel("snippets_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "snippets" },
        (payload) => {
          // Immediately refetch list when any snippet is added, updated, or deleted
          queryClient.invalidateQueries({ queryKey: snippetKeys.lists() });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  // We only re-fetch if the userId changes. Local UI filters (search, language, tag)
  // are handled in useMemo on the client side now to prevent unnecessary network requests.
  return useQuery({
    queryKey: snippetKeys.list({ userId: filters.userId }),
    queryFn: () => fetchSnippets({ userId: filters.userId }),
    staleTime: 1000 * 60, // 60 seconds (per assessment requirements)
  });
}

// ── Create mutation ────────────────────────────────────────────────────────────

export function useCreateSnippet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateSnippetInput) => createSnippet(input),

    onSuccess: (newSnippet) => {
      // Invalidate all snippet lists so the new one appears instantly
      queryClient.invalidateQueries({ queryKey: snippetKeys.lists() });

      // Optimistically seed the detail cache
      queryClient.setQueryData(snippetKeys.detail(newSnippet.id), newSnippet);

      toast.success("Snippet created!");
    },

    onError: (error: Error) => {
      toast.error(error.message ?? "Failed to create snippet.");
    },
  });
}

// ── Update mutation ────────────────────────────────────────────────────────────

export function useUpdateSnippet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateSnippetInput) => updateSnippet(input),

    onMutate: async (input) => {
      // Cancel in-flight queries for this snippet
      await queryClient.cancelQueries({
        queryKey: snippetKeys.detail(input.id),
      });

      // Snapshot previous value for rollback
      const previous = queryClient.getQueryData(snippetKeys.detail(input.id));

      // Optimistic update in detail cache
      queryClient.setQueryData(snippetKeys.detail(input.id), (old: unknown) =>
        old ? { ...(old as object), ...input } : old
      );

      return { previous };
    },

    onSuccess: (updatedSnippet) => {
      queryClient.setQueryData(
        snippetKeys.detail(updatedSnippet.id),
        updatedSnippet
      );
      queryClient.invalidateQueries({ queryKey: snippetKeys.lists() });
      toast.success("Snippet updated!");
    },

    onError: (error: Error, input, context) => {
      // Roll back optimistic update
      if (context?.previous) {
        queryClient.setQueryData(snippetKeys.detail(input.id), context.previous);
      }
      toast.error(error.message ?? "Failed to update snippet.");
    },
  });
}

// ── Delete mutation ────────────────────────────────────────────────────────────

export function useDeleteSnippet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteSnippet(id),

    onSuccess: (_data, deletedId) => {
      // Remove from detail cache immediately
      queryClient.removeQueries({ queryKey: snippetKeys.detail(deletedId) });

      // Optimistically remove from every list
      queryClient.setQueriesData(
        { queryKey: snippetKeys.lists() },
        (old: unknown) => {
          if (!Array.isArray(old)) return old;
          return old.filter((s: { id: string }) => s.id !== deletedId);
        }
      );

      toast.success("Snippet deleted.");
    },

    onError: (error: Error) => {
      toast.error(error.message ?? "Failed to delete snippet.");
    },
  });
}
