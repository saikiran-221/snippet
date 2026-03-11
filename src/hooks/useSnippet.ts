/**
 * src/hooks/useSnippet.ts
 *
 * TanStack Query hook for fetching a single snippet by ID.
 * Accepts string | null — query is disabled when id is null/empty.
 */
import { useQuery } from "@tanstack/react-query";
import { fetchSnippetById } from "@/lib/api";
import { snippetKeys } from "@/types";

export function useSnippet(id: string | null) {
  // Coerce null → "" for the key; `enabled: false` prevents the fetch
  const safeId = id ?? "";

  return useQuery({
    queryKey: snippetKeys.detail(safeId),
    queryFn: () => fetchSnippetById(id!),
    enabled: safeId.length > 0,
    staleTime: 1000 * 60, // 1 minute
  });
}
