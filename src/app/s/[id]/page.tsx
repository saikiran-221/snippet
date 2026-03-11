export const dynamic = "force-dynamic";

import { formatDistanceToNow } from "date-fns";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { CopyCodeButton } from "./copy-button";
import { createClient } from "@/lib/supabase-server";
import { Badge } from "@/components/ui/badge";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function SnippetPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  const { data: snippet, error: snippetError } = await supabase
    .from("snippets")
    .select(
      `
      *,
      profiles (
        username,
        display_name
      )
      `
    )
    .eq("id", id)
    .single();

  let hasAccess = false;

  if (snippet) {
    if (snippet.is_public) {
      hasAccess = true;
    } else if (user && snippet.user_id === user.id) {
      hasAccess = true;
    } else if (user) {
      // Check if explicitly shared with the user
      const { data: share } = await supabase
        .from("snippet_shares")
        .select("id")
        .eq("snippet_id", id)
        .eq("shared_with", user.id)
        .single();

      if (share) hasAccess = true;
    }
  }

  // If there's an error (e.g. invalid UUID) or access is denied
  if (snippetError || !snippet || !hasAccess) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center">
        <h1 className="text-3xl font-bold tracking-tight">Snippet not found</h1>
        <p className="text-muted-foreground">
          This snippet might be private, deleted, or the URL is incorrect.
        </p>
      </div>
    );
  }

  const authorName =
    snippet.profiles?.display_name ?? snippet.profiles?.username ?? "Unknown Author";

  return (
    <div className="container mx-auto max-w-4xl px-4 py-12">
      <div className="mb-8 space-y-4">
        {/* Header content */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">{snippet.title}</h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>by {authorName}</span>
              <span>•</span>
              <time dateTime={snippet.created_at}>
                {formatDistanceToNow(new Date(snippet.created_at), {
                  addSuffix: true,
                })}
              </time>
            </div>
          </div>
          <CopyCodeButton code={snippet.code} />
        </div>

        {/* Tags */}
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="font-mono">
            {snippet.language}
          </Badge>
          {snippet.tags?.map((tag: string) => (
            <Badge key={tag} variant="outline" className="text-xs">
              #{tag}
            </Badge>
          ))}
        </div>

        {/* Description */}
        {snippet.description && (
          <p className="text-muted-foreground max-w-3xl leading-relaxed">
            {snippet.description}
          </p>
        )}
      </div>

      {/* Code Region */}
      <div className="relative overflow-hidden rounded-lg border bg-[#1e1e1e] shadow-md">
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
  );
}
