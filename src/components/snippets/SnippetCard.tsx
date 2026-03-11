"use client";

import { useSnippetStore } from "@/store/snippetStore";
import type { Snippet } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";
import { Globe, Lock } from "lucide-react";
// Minimal syntax highlighter for the card preview
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

export default function SnippetCard({ snippet }: { snippet: Snippet }) {
  const { setActiveSnippet } = useSnippetStore();

  const previewCode = snippet.code.split("\n").slice(0, 5).join("\n") + (snippet.code.split("\n").length > 5 ? "\n..." : "");

  return (
    <Card
      className="flex flex-col cursor-pointer card-lift hover:-translate-y-1 hover:shadow-xl hover:border-primary/50 group overflow-hidden bg-card/80 backdrop-blur-sm shadow-sm border-border/70"
      onClick={() => setActiveSnippet(snippet.id)}
    >
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
        <div className="space-y-1 overflow-hidden pr-2">
          <CardTitle className="text-xl font-bold truncate group-hover:text-primary transition-colors duration-200" title={snippet.title}>
            {snippet.title}
          </CardTitle>
          <div className="flex items-center text-sm text-foreground/70 font-medium gap-2">
            <time dateTime={snippet.updated_at}>
              {formatDistanceToNow(new Date(snippet.updated_at), { addSuffix: true })}
            </time>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 bg-muted/50 p-1.5 rounded-full" title={snippet.is_public ? "Public" : "Private"}>
          {snippet.is_public ? (
            <Globe className="h-4 w-4 text-foreground/80" />
          ) : (
            <Lock className="h-4 w-4 text-foreground/80" />
          )}
        </div>
      </CardHeader>

      <CardContent className="py-2 flex-grow">
        <div className="relative rounded-md overflow-hidden bg-[#1e1e1e] border h-36 border-border/50 shadow-inner text-sm">
          <div className="absolute top-0 right-0 px-3 py-1.5 bg-[#252526] text-muted-foreground border-b border-l border-border/50 rounded-bl-md text-[11px] uppercase font-bold z-10 tracking-wider">
            {snippet.language}
          </div>
          <SyntaxHighlighter
            language={snippet.language}
            style={vscDarkPlus}
            customStyle={{
              margin: 0,
              padding: "1rem",
              background: "transparent",
              fontSize: "0.85rem",
              lineHeight: "1.6",
              height: "100%",
            }}
            wrapLines={false}
          >
            {previewCode}
          </SyntaxHighlighter>
          {/* Fading bottom edge */}
          <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-[#1e1e1e] to-transparent pointer-events-none" />
        </div>
      </CardContent>

      <CardFooter className="flex flex-wrap gap-2 pt-3">
        {snippet.tags.slice(0, 3).map((tag) => (
          <Badge key={tag} variant="secondary" className="text-[11px] px-2 py-0.5 font-medium hover:bg-secondary/80 transition-colors">
            {tag}
          </Badge>
        ))}
        {snippet.tags.length > 3 && (
          <span className="text-xs text-muted-foreground font-medium pt-0.5">+{snippet.tags.length - 3} more</span>
        )}
      </CardFooter>
    </Card>
  );
}

