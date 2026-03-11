"use client";

import { useMemo } from "react";
import { useSnippets } from "@/hooks/useSnippets";
import { useSnippetStore } from "@/store/snippetStore";
import SnippetCard from "./SnippetCard";
import { Skeleton } from "@/components/ui/skeleton";
import { CopyX } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function SnippetGrid({ userId }: { userId?: string }) {
  const { searchQuery, filterLanguage, filterTag, clearFilters } = useSnippetStore();

  const { data: snippets, isLoading, isError } = useSnippets({ userId });

  const filteredSnippets = useMemo(() => {
    if (!snippets) return [];

    return snippets.filter((snippet) => {
      // 1. Search Query
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        const matchesTitle = snippet.title.toLowerCase().includes(searchLower);
        const matchesDesc = snippet.description?.toLowerCase().includes(searchLower);
        if (!matchesTitle && !matchesDesc) return false;
      }

      // 2. Language Filter
      if (filterLanguage && snippet.language !== filterLanguage) return false;

      // 3. Tag Filter
      if (filterTag && !snippet.tags.includes(filterTag)) return false;

      return true;
    });
  }, [snippets, searchQuery, filterLanguage, filterTag]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-64 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex h-64 flex-col items-center justify-center p-8 text-center text-destructive border rounded-xl bg-destructive/5">
        <p>Failed to load snippets. Please try again later.</p>
      </div>
    );
  }

  if (!snippets || snippets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 px-4 text-center border-2 border-dashed rounded-xl bg-card/40 hover:bg-card/60 transition-colors duration-300 shadow-sm">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6 text-primary">
          <CopyX className="h-8 w-8" />
        </div>
        <h3 className="text-2xl font-bold mb-3 tracking-tight">Your vault is empty</h3>
        <p className="text-base text-muted-foreground max-w-md mx-auto mb-8 leading-relaxed">
          Welcome! Get started by storing your first code snippet. Once saved, you can click any snippet card to copy the code, edit it, or share explicitly with others.
        </p>
        {userId && (
          <Link href="/dashboard/create">
            <Button size="lg" className="gap-2 cursor-pointer shadow-md hover:shadow-lg transition-shadow">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
              Add Your First Snippet
            </Button>
          </Link>
        )}
      </div>
    );
  }

  // Filter empty states
  if (filteredSnippets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center bg-card/30 rounded-xl border border-dashed">
        <p className="text-lg font-medium text-foreground mb-4">
          No snippets found matching your filters.
        </p>
        <Button variant="outline" size="lg" onClick={clearFilters} className="cursor-pointer">
          Clear all filters
        </Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 stagger-children">
      {filteredSnippets.map((snippet) => (
        <SnippetCard key={snippet.id} snippet={snippet} />
      ))}
    </div>
  );
}
