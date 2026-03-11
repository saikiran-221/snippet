/**
 * src/hooks/useShares.ts
 *
 * TanStack Query hooks for sharing functionality
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  recordShare,
  fetchShares,
  fetchSnippetShares,
  shareSnippetWithEmail,
  removeSnippetShare
} from "@/lib/api";
import type { SharePlatform } from "@/types";
import { toast } from "sonner";

export function useShares(snippetId: string) {
  return useQuery({
    queryKey: ["shares", snippetId] as const,
    queryFn: () => fetchShares(snippetId),
    enabled: !!snippetId,
    staleTime: 1000 * 30, // 30 seconds
  });
}

export function useRecordShare() {
  return useMutation({
    mutationFn: ({
      snippetId,
      platform,
      email,
    }: {
      snippetId: string;
      platform: SharePlatform;
      email?: string;
    }) => recordShare(snippetId, platform, email),

    onSuccess: (_, variables) => {
      if (variables.platform === "email") {
        toast.success(`Shared snippet with ${variables.email}`);
      }
    },
    onError: (error: Error) => {
      toast.error(error.message ?? "Failed to record share");
    },
  });
}

// ─── Specific User Access (snippet_shares) ───────────────────────────────────

export function useSnippetShares(snippetId: string) {
  return useQuery({
    queryKey: ["snippet_shares", snippetId] as const,
    queryFn: () => fetchSnippetShares(snippetId),
    enabled: !!snippetId,
  });
}

export function useShareWithEmail() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ snippetId, email }: { snippetId: string; email: string }) =>
      shareSnippetWithEmail(snippetId, email),

    onSuccess: (_, variables) => {
      // Refresh the shares list
      queryClient.invalidateQueries({ queryKey: ["snippet_shares", variables.snippetId] });
      toast.success("Snippet shared successfully!");
    },
    onError: (error: Error) => {
      toast.error(error.message ?? "Failed to share snippet.");
    }
  });
}

export function useRemoveShare() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ shareId, snippetId }: { shareId: string, snippetId: string }) =>
      removeSnippetShare(shareId),

    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["snippet_shares", variables.snippetId] });
      toast.success("Access removed.");
    },
    onError: (error: Error) => {
      toast.error("Failed to remove access.");
    }
  });
}
