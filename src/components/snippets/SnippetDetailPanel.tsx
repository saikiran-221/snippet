"use client";

import { useState, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Copy, Code2, Clock, User, Check, Loader2 } from "lucide-react";

import { useSnippetStore } from "@/store/snippetStore";
import { useSnippet } from "@/hooks/useSnippet";
import { useDeleteSnippet } from "@/hooks/useSnippets";
import ShareMenu from "@/components/share/ShareMenu";
import Link from "next/link";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function SnippetDetailPanel() {
  const { activeSnippetId, setActiveSnippet } = useSnippetStore();
  const [hasCopied, setHasCopied] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Fetch full snippet data (enabled only when panel is open)
  const { data: snippet, isLoading, error } = useSnippet(activeSnippetId);
  const deleteMutation = useDeleteSnippet();

  // Reset states when panel closes or snippet changes
  useEffect(() => {
    // eslint-disable-next-line
    setHasCopied(false);
    setShowDeleteConfirm(false);
  }, [activeSnippetId]);

  function handleCopy() {
    if (!snippet?.code) return;
    navigator.clipboard.writeText(snippet.code);
    setHasCopied(true);
    setTimeout(() => setHasCopied(false), 2000);
  }

  async function handleDelete() {
    if (!snippet) return;
    await deleteMutation.mutateAsync(snippet.id);
    setActiveSnippet(null); // Close the panel on success
  }

  const isOpen = activeSnippetId !== null;
  const isDeleting = deleteMutation.isPending;

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && setActiveSnippet(null)}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto border-l sm:w-[50vw]">
        {isLoading && (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {error && (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-destructive">
            <Code2 className="h-10 w-10 opacity-50" />
            <p>Failed to load snippet.</p>
            <Button variant="outline" onClick={() => setActiveSnippet(null)}>
              Close
            </Button>
          </div>
        )}

        {snippet && (
          <div className="space-y-6 pb-12 pt-2">
            {/* Header: Title, Actions */}
            <SheetHeader className="space-y-4">
              <div className="flex items-start justify-between gap-4">
                <SheetTitle className="text-2xl font-bold leading-tight flex items-center gap-2">
                  {snippet.title}
                  {snippet.is_public ? (
                    <Badge variant="outline" className="ml-2 font-normal text-xs bg-green-500/10 text-green-600 hover:bg-green-500/10 border-green-500/20">Public</Badge>
                  ) : (
                    <Badge variant="outline" className="ml-2 font-normal text-xs bg-amber-500/10 text-amber-600 hover:bg-amber-500/10 border-amber-500/20">Private</Badge>
                  )}
                </SheetTitle>
                <div className="flex shrink-0 items-center gap-2">
                  <ShareMenu
                    snippet={snippet}
                    captureContextId={`snippet-code-${snippet.id}`}
                  />
                  <Button
                    variant={hasCopied ? "secondary" : "outline"}
                    onClick={handleCopy}
                    className="min-w-[100px] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-sm cursor-pointer"
                  >
                    {hasCopied ? (
                      <>
                        <Check className="mr-2 h-4 w-4 text-green-500" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="mr-2 h-4 w-4" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Actions row: Edit / Delete */}
              <div className="flex items-center gap-2 pb-2">
                <Link href={`/dashboard/edit/${snippet.id}`}>
                  <Button variant="secondary" size="sm" onClick={() => setActiveSnippet(null)} className="transition-all duration-300 hover:-translate-y-0.5 hover:shadow-sm cursor-pointer hover:bg-secondary/80">
                    Edit Snippet
                  </Button>
                </Link>

                {!showDeleteConfirm ? (
                  <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10 transition-colors duration-300 cursor-pointer" onClick={() => setShowDeleteConfirm(true)}>
                    Delete
                  </Button>
                ) : (
                  <div className="flex items-center gap-2 bg-destructive/10 px-3 py-1 rounded-md border border-destructive/20">
                    <span className="text-xs text-destructive font-medium">Are you sure?</span>
                    <Button variant="destructive" size="sm" className="h-7 text-xs" onClick={handleDelete} disabled={isDeleting}>
                      {isDeleting ? <Loader2 className="h-3 w-3 animate-spin" /> : "Yes, drop it"}
                    </Button>
                    <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground" onClick={() => setShowDeleteConfirm(false)} disabled={isDeleting}>
                      Cancel
                    </Button>
                  </div>
                )}
              </div>

              {/* Metadata */}
              <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <User className="h-4 w-4" />
                  <span>
                    {snippet.profiles?.display_name ??
                      snippet.profiles?.username ??
                      "Unknown User"}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4" />
                  <span>
                    {formatDistanceToNow(new Date(snippet.created_at), {
                      addSuffix: true,
                    })}
                  </span>
                </div>
                <Badge variant="secondary" className="rounded-md font-mono">
                  {snippet.language}
                </Badge>
              </div>

              {/* Description */}
              {snippet.description && (
                <SheetDescription className="text-sm leading-relaxed text-foreground">
                  {snippet.description}
                </SheetDescription>
              )}
            </SheetHeader>

            {/* Tags array */}
            {snippet.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {snippet.tags.map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    #{tag}
                  </Badge>
                ))}
              </div>
            )}

            {/* Code Block */}
            <div
              id={`snippet-code-${snippet.id}`}
              className="relative mt-6 overflow-hidden rounded-lg border bg-[#1e1e1e]"
            >
              <div className="flex items-center justify-between border-b border-[#333] bg-[#252526] px-4 py-2 text-xs font-mono text-[#cccccc]">
                <span>{snippet.language}</span>
                <span className="opacity-50 text-[10px]">
                  {snippet.code.split("\n").length} lines
                </span>
              </div>
              <SyntaxHighlighter
                language={snippet.language}
                style={vscDarkPlus}
                customStyle={{
                  margin: 0,
                  padding: "1.25rem",
                  background: "transparent",
                  fontSize: "0.875rem",
                  lineHeight: "1.5",
                }}
                showLineNumbers={true}
                wrapLines={true}
                lineNumberStyle={{
                  minWidth: "3em",
                  paddingRight: "1em",
                  color: "#6e7681",
                  textAlign: "right",
                }}
              >
                {snippet.code}
              </SyntaxHighlighter>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
