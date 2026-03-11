"use client";

import { useMemo } from "react";
import { useSnippets } from "@/hooks/useSnippets";
import { useSnippetStore } from "@/store/snippetStore";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Plus, Info } from "lucide-react";
import Link from "next/link";

export default function SnippetFilters({ userId }: { userId?: string }) {
  const { data: snippets } = useSnippets({ userId });
  const { filterTag, setTagFilter, filterLanguage, setLanguageFilter, clearFilters, searchQuery, setSearchQuery } = useSnippetStore();

  // Extract unique tags and languages from current snippets
  const { uniqueTags, uniqueLanguages, languageCounts } = useMemo(() => {
    if (!snippets) return { uniqueTags: [], uniqueLanguages: [], languageCounts: {} };

    const tags = new Set<string>();
    const langs = new Set<string>();
    const langCounts: Record<string, number> = {};

    snippets.forEach((s) => {
      s.tags.forEach((t) => tags.add(t));
      langs.add(s.language);
      langCounts[s.language] = (langCounts[s.language] || 0) + 1;
    });

    return {
      uniqueTags: Array.from(tags).sort(),
      uniqueLanguages: Array.from(langs).sort(),
      languageCounts: langCounts,
    };
  }, [snippets]);

  // We always want to render the top search bar even if there are no snippets.
  const hasActiveFilters = filterTag || filterLanguage || searchQuery;

  return (
    <div className="flex flex-col gap-6 mb-8">

      {/* ── Action Bar: Search & Create ── */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between w-full">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search snippets by title or description..."
            className="pl-9 h-11 bg-background border-muted-foreground/20 hover:border-primary/50 focus-visible:ring-primary/50 transition-all duration-300 shadow-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {userId && (
          <Link href="/dashboard/create" className="w-full sm:w-auto">
            <Button size="lg" className="w-full gap-2 cursor-pointer hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300">
              <Plus className="h-4 w-4" />
              Add Snippet
            </Button>
          </Link>
        )}
      </div>

      {/* ── Navigation Directions Callout ── */}
      <div className="bg-primary/5 border border-primary/20 hover:border-primary/40 rounded-lg p-4 flex gap-3 text-sm text-muted-foreground transition-all duration-300 hover:shadow-sm">
        <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
        <div>
          <p className="font-medium text-foreground mb-1">Getting around SnippetVault</p>
          <ul className="space-y-1 list-disc list-inside">
            <li>Click <strong>Add Snippet</strong> to write data here and save a new code block.</li>
            <li>Use the <strong>Global Search</strong> toggle above to find public code from other developers.</li>
            <li>Click any <strong>Snippet Card</strong> below to view its details, copy the code, or share it with others.</li>
            <li>Use the colored language bars or tag chips to filter your view.</li>
          </ul>
        </div>
      </div>

      {/* ── Filters Container ── */}
      {(uniqueLanguages.length > 0 || uniqueTags.length > 0) && (
        <div className="flex flex-col gap-4 p-4 bg-muted/30 border rounded-lg hover:border-primary/30 transition-colors duration-300">
          {/* ── Bonus C: Language Stats Bar ── */}
          {uniqueLanguages.length > 0 && (
            <div className="w-full space-y-2">
              <span className="text-sm font-medium text-muted-foreground">Languages:</span>
              <div className="flex w-full h-2 rounded-full overflow-hidden">
                {uniqueLanguages.map((lang, i) => {
                  // Basic deterministic color generator based on string
                  const hues = [210, 140, 280, 45, 30, 320, 190, 0];
                  const hue = hues[i % hues.length];
                  const isSelected = filterLanguage === lang;
                  const opacity = filterLanguage ? (isSelected ? 1 : 0.3) : 1;
                  const width = `${(languageCounts[lang] / (snippets?.length || 1)) * 100}%`;

                  return (
                    <div
                      key={lang}
                      style={{ width, backgroundColor: `hsl(${hue}, 70%, 50%)`, opacity }}
                      className="h-full cursor-pointer hover:opacity-80 transition-opacity"
                      title={`${lang} (${languageCounts[lang]})`}
                      onClick={() => setLanguageFilter(isSelected ? null : lang)}
                    />
                  );
                })}
              </div>
              <div className="flex flex-wrap gap-2 text-[10px] text-muted-foreground pt-1">
                {uniqueLanguages.map((lang, i) => {
                  const hues = [210, 140, 280, 45, 30, 320, 190, 0];
                  const hue = hues[i % hues.length];
                  const isSelected = filterLanguage === lang;
                  return (
                    <button
                      key={lang}
                      className={`flex items-center gap-1 hover:text-foreground transition-colors ${isSelected ? "text-foreground font-medium" : ""}`}
                      onClick={() => setLanguageFilter(isSelected ? null : lang)}
                    >
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: `hsl(${hue}, 70%, 50%)` }} />
                      {lang} ({languageCounts[lang]})
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* ── Tag Filter Chips ── */}
          {uniqueTags.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t">
              <span className="text-sm font-medium text-muted-foreground mr-1">Tags:</span>
              {uniqueTags.map((tag) => (
                <Badge
                  key={tag}
                  variant={filterTag === tag ? "default" : "outline"}
                  className="cursor-pointer hover:bg-primary/80 hover:scale-105 hover:shadow-sm transition-all duration-300"
                  onClick={() => setTagFilter(filterTag === tag ? null : tag)}
                >
                  #{tag}
                </Badge>
              ))}
            </div>
          )}

          {hasActiveFilters && (
            <div className="flex items-center mt-2 pt-2 border-t">
              <button
                onClick={clearFilters}
                className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
