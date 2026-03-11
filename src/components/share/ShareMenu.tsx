"use client";

import { useState, useRef } from "react";
import { toPng } from "html-to-image";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Check, Copy, Download, Mail, Share2, Loader2, X } from "lucide-react";
import { toast } from "sonner";

import { useRecordShare, useShareWithEmail, useRemoveShare, useSnippetShares } from "@/hooks/useShares";
import type { Snippet, SnippetShare } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";

interface ShareMenuProps {
  snippet: Snippet;
  /** Selectors for the DOM node to capture as an image. */
  captureContextId?: string;
}

export default function ShareMenu({ snippet, captureContextId }: ShareMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [tab, setTab] = useState<"public" | "users">("public");
  const [hasCopied, setHasCopied] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [email, setEmail] = useState("");

  const recordShare = useRecordShare();
  const shareWithEmail = useShareWithEmail();
  const removeShare = useRemoveShare();

  // Only fetch shares if on the users tab
  const { data: shares, isLoading: isLoadingShares } = useSnippetShares(snippet.id);

  const shareUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/s/${snippet.id}`;

  // ── Copy Link ──────────────────────────────────────────────────────────────

  function handleCopyLink() {
    navigator.clipboard.writeText(shareUrl);
    setHasCopied(true);
    setTimeout(() => setHasCopied(false), 2000);
    recordShare.mutate({ snippetId: snippet.id, platform: "link" });
  }

  // ── Export Image ──────────────────────────────────────────────────────────

  const hiddenExportRef = useRef<HTMLDivElement>(null);

  async function handleExportImage() {
    const node = hiddenExportRef.current;
    if (!node) {
      toast.error("Could not find the snippet to export.");
      return;
    }

    setIsExporting(true);
    try {
      // Small delay to ensure any CSS transitions finish
      await new Promise((r) => setTimeout(r, 100));

      const dataUrl = await toPng(node, {
        quality: 1,
        pixelRatio: 2,
        backgroundColor: "#1e1e1e", // VSC Dark Plus bg matching logic
        style: {
          margin: "0",
          borderRadius: "8px",
        },
      });

      const link = document.createElement("a");
      link.download = `snippet-${snippet.id.slice(0, 8)}.png`;
      link.href = dataUrl;
      link.click();

      toast.success("Snippet exported as PNG!");
      recordShare.mutate({ snippetId: snippet.id, platform: "image" });
    } catch (err) {
      console.error("Export error:", err);
      toast.error("Failed to export image.");
    } finally {
      setIsExporting(false);
    }
  }

  // ── Share via Email ───────────────────────────────────────────────────────

  function handleEmailShare(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !email.includes("@")) {
      toast.error("Please enter a valid email address.");
      return;
    }

    shareWithEmail.mutate(
      { snippetId: snippet.id, email: email.trim() },
      {
        onSuccess: () => {
          setEmail("");
        },
      }
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger
        className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3 hover:-translate-y-0.5 hover:shadow-sm cursor-pointer"
      >
        <Share2 className="h-4 w-4" />
        <span>Share</span>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[320px] p-0 overflow-hidden">
        <div className="flex border-b">
          <button
            className={`flex-1 py-2 text-xs font-semibold ${tab === "public" ? "bg-background border-b-2 border-primary" : "bg-muted/50 text-muted-foreground hover:bg-muted"}`}
            onClick={() => setTab("public")}
          >
            Link & Export
          </button>
          {!snippet.is_public && (
            <button
              className={`flex-1 py-2 text-xs font-semibold ${tab === "users" ? "bg-background border-b-2 border-primary" : "bg-muted/50 text-muted-foreground hover:bg-muted"}`}
              onClick={() => setTab("users")}
            >
              Specific Users
            </button>
          )}
        </div>

        <div className="p-4 max-h-[350px] overflow-y-auto">
          {tab === "public" ? (
            <div className="flex flex-col space-y-4">
              <div className="space-y-1">
                <h4 className="font-medium leading-none">Share public link</h4>
                <p className="text-sm text-muted-foreground">
                  {snippet.is_public ? "Anyone with the link can view." : "This snippet is private. Only you can view it via link."}
                </p>
              </div>

              {/* Copy Link */}
              <div className="flex space-x-2">
                <Input readOnly value={shareUrl} className="h-9 font-mono text-xs" />
                <Button
                  type="button"
                  size="sm"
                  className="px-3 min-w-[80px] transition-all duration-300 hover:scale-105"
                  onClick={handleCopyLink}
                >
                  {hasCopied ? (
                    <span className="flex items-center gap-1">
                      <Check className="h-3.5 w-3.5 text-green-500" />
                      Copied
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <Copy className="h-3.5 w-3.5" />
                      Copy
                    </span>
                  )}
                </Button>
              </div>

              <Separator />

              {/* Export PNG */}
              {captureContextId && (
                <Button
                  variant="outline"
                  className="w-full justify-start gap-2 h-9 transition-all duration-300 hover:border-primary/40 hover:bg-muted/50"
                  onClick={handleExportImage}
                  disabled={isExporting}
                >
                  {isExporting ? (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  ) : (
                    <Download className="h-4 w-4 text-muted-foreground" />
                  )}
                  Export as Image (PNG)
                </Button>
              )}
            </div>
          ) : (
            <div className="flex flex-col space-y-4">
              <div className="space-y-1">
                <h4 className="font-medium leading-none">Grant Access</h4>
                <p className="text-sm text-muted-foreground">
                  Give a specific user read access to this snippet.
                </p>
              </div>

              <form onSubmit={handleEmailShare} className="space-y-3">
                <div className="flex space-x-2">
                  <Input
                    type="email"
                    placeholder="user@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-9 text-xs"
                    disabled={shareWithEmail.isPending}
                  />
                  <Button
                    type="submit"
                    size="sm"
                    className="h-9 px-3"
                    disabled={shareWithEmail.isPending || !email.trim()}
                  >
                    {shareWithEmail.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <span className="text-xs">Share</span>
                    )}
                  </Button>
                </div>
              </form>

              <Separator />

              <div className="space-y-3">
                <Label className="text-xs font-semibold text-muted-foreground">Shared With</Label>
                {isLoadingShares ? (
                  <div className="flex justify-center p-4"><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /></div>
                ) : shares?.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">Not shared with anyone yet.</p>
                ) : (
                  <div className="space-y-2">
                    {shares?.map((share: SnippetShare) => (
                      <div key={share.id} className="flex items-center justify-between group">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden shrink-0">
                            {share.profiles?.avatar_url ? (
                              <img src={share.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-[10px] font-bold text-primary">
                                {share.profiles?.username?.[0]?.toUpperCase() ?? "U"}
                              </span>
                            )}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-xs font-medium leading-none truncate max-w-[140px]">{share.profiles?.display_name || share.profiles?.username}</span>
                            <span className="text-[10px] text-muted-foreground leading-none mt-1 truncate max-w-[140px]">{share.profiles?.email}</span>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => removeShare.mutate({ shareId: share.id, snippetId: snippet.id })}
                          disabled={removeShare.isPending && removeShare.variables?.shareId === share.id}
                        >
                          {removeShare.isPending && removeShare.variables?.shareId === share.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <X className="h-3 w-3 text-destructive" />
                          )}
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── Hidden Export Node ── */}
        <div
          className="absolute pointer-events-none opacity-0"
          style={{ top: "-9999px", left: "-9999px", width: "800px" }}
        >
          <div ref={hiddenExportRef} className="p-6 bg-[#1e1e1e] rounded-xl font-mono">
            <div className="flex items-center justify-between border-b border-[#333] bg-[#252526] px-4 py-2 text-xs font-mono text-[#cccccc] mb-2 rounded-t-lg">
              <span>{snippet.language}</span>
              <span className="opacity-50 text-[10px]">SnippetVault</span>
            </div>
            <SyntaxHighlighter
              language={snippet.language}
              style={vscDarkPlus}
              customStyle={{
                margin: 0,
                padding: "1rem",
                background: "transparent",
                fontSize: "14px",
                lineHeight: "1.5",
              }}
            >
              {(() => {
                const lines = snippet.code.split("\n");
                if (lines.length > 50) {
                  return lines.slice(0, 50).join("\n") + "\n\n// ...truncated";
                }
                return snippet.code;
              })()}
            </SyntaxHighlighter>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
