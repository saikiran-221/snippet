"use client";

import { useState, useEffect, useRef, KeyboardEvent } from "react";
import { useCreateSnippet, useUpdateSnippet } from "@/hooks/useSnippets";
import { useSnippetStore } from "@/store/snippetStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Snippet, CreateSnippetInput, UpdateSnippetInput } from "@/types";
import { X, Loader2 } from "lucide-react";

// ── Constants ─────────────────────────────────────────────────────────────────

const LANGUAGES = [
  "typescript",
  "javascript",
  "python",
  "rust",
  "go",
  "java",
  "c",
  "cpp",
  "csharp",
  "ruby",
  "php",
  "swift",
  "kotlin",
  "html",
  "css",
  "sql",
  "bash",
  "json",
  "yaml",
  "markdown",
  "other",
] as const;

// ── Types ─────────────────────────────────────────────────────────────────────

interface FormValues {
  title: string;
  language: string;
  description: string;
  code: string;
  tags: string[];
  is_public: boolean;
}

interface FormErrors {
  title?: string;
  language?: string;
  code?: string;
}

interface SnippetFormProps {
  /** When provided, form operates in edit mode */
  snippet?: Snippet;
  /** Called after create/update/delete completes */
  onClose?: () => void;
}

// ── Validation ────────────────────────────────────────────────────────────────

function validate(values: FormValues): FormErrors {
  const errors: FormErrors = {};
  if (!values.title.trim()) errors.title = "Title is required.";
  if (!values.language) errors.language = "Please select a language.";
  if (!values.code.trim()) errors.code = "Code cannot be empty.";
  return errors;
}

// ── Defaults ──────────────────────────────────────────────────────────────────

function defaultValues(snippet?: Snippet): FormValues {
  return {
    title: snippet?.title ?? "",
    language: snippet?.language ?? "",
    description: snippet?.description ?? "",
    code: snippet?.code ?? "",
    tags: snippet?.tags ?? [],
    is_public: snippet?.is_public ?? false,
  };
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function SnippetForm({ snippet, onClose }: SnippetFormProps) {
  const isEditing = !!snippet;

  const createMutation = useCreateSnippet();
  const updateMutation = useUpdateSnippet();
  const closeForm = useSnippetStore((s) => s.closeForm);

  const [values, setValues] = useState<FormValues>(defaultValues(snippet));
  const [errors, setErrors] = useState<FormErrors>({});
  const [tagInput, setTagInput] = useState("");

  const tagInputRef = useRef<HTMLInputElement>(null);

  // Re-populate when the snippet prop changes (e.g. switching edit targets)
  useEffect(() => {
    // eslint-disable-next-line
    setValues(defaultValues(snippet));
    setErrors({});
    setTagInput("");
  }, [snippet, snippet?.id]);

  const isPending =
    createMutation.isPending ||
    updateMutation.isPending;

  // ── Field helpers ──────────────────────────────────────────────────────────

  function set<K extends keyof FormValues>(key: K, value: FormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  // ── Tag Management ─────────────────────────────────────────────────────────

  function addTag(raw: string) {
    const tag = raw.trim().toLowerCase().replace(/\s+/g, "-");
    if (!tag || values.tags.includes(tag) || values.tags.length >= 8) return;
    set("tags", [...values.tags, tag]);
    setTagInput("");
  }

  function removeTag(index: number) {
    set("tags", values.tags.filter((_, i) => i !== index));
  }

  function handleTagKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(tagInput);
    } else if (e.key === "Backspace" && tagInput === "" && values.tags.length) {
      removeTag(values.tags.length - 1);
    }
  }

  // ── Submit ─────────────────────────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const fieldErrors = validate(values);
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      return;
    }

    if (isEditing) {
      const payload: UpdateSnippetInput = {
        id: snippet.id,
        title: values.title.trim(),
        language: values.language,
        description: values.description.trim() || undefined,
        code: values.code,
        tags: values.tags,
        is_public: values.is_public,
      };
      await updateMutation.mutateAsync(payload);
    } else {
      const payload: CreateSnippetInput = {
        title: values.title.trim(),
        language: values.language,
        description: values.description.trim() || undefined,
        code: values.code,
        tags: values.tags,
        is_public: values.is_public,
      };
      await createMutation.mutateAsync(payload);
    }

    handleClose();
  }

  // ── Close ──────────────────────────────────────────────────────────────────

  function handleClose() {
    closeForm();
    onClose?.();
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="pt-2">
      <div className="mb-6 px-1">
        <h2 className="text-2xl font-bold">
          {isEditing ? "Edit Snippet" : "Add Snippet"}
        </h2>
      </div>
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6 px-1">
        {/* ── Title ─────────────────────────────── */}
        <div className="space-y-1.5">
          <Label htmlFor="snippet-title">
            Title <span className="text-destructive">*</span>
          </Label>
          <Input
            id="snippet-title"
            placeholder="My awesome snippet"
            value={values.title}
            onChange={(e) => set("title", e.target.value)}
            aria-invalid={!!errors.title}
            aria-describedby={errors.title ? "title-error" : undefined}
            disabled={isPending}
            className="transition-all duration-300 hover:border-primary/50 focus-visible:ring-primary/50"
          />
          {errors.title && (
            <p id="title-error" className="text-xs text-destructive">
              {errors.title}
            </p>
          )}
        </div>

        {/* ── Language ──────────────────────────── */}
        <div className="space-y-1.5">
          <Label htmlFor="snippet-language">
            Language <span className="text-destructive">*</span>
          </Label>
          <Select
            value={values.language}
            onValueChange={(val) => set("language", val as string)}
            disabled={isPending}
          >
            <SelectTrigger
              id="snippet-language"
              aria-invalid={!!errors.language}
              className="transition-all duration-300 hover:border-primary/50 focus:ring-primary/50"
            >
              <SelectValue placeholder="Select a language…" />
            </SelectTrigger>
            <SelectContent>
              {LANGUAGES.map((lang) => (
                <SelectItem key={lang} value={lang}>
                  {lang.charAt(0).toUpperCase() + lang.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.language && (
            <p className="text-xs text-destructive">{errors.language}</p>
          )}
        </div>

        {/* ── Description ───────────────────────── */}
        <div className="space-y-1.5">
          <Label htmlFor="snippet-description">
            Description{" "}
            <span className="text-muted-foreground text-xs">(optional)</span>
          </Label>
          <Input
            id="snippet-description"
            placeholder="A short description of what this snippet does"
            value={values.description}
            onChange={(e) => set("description", e.target.value)}
            disabled={isPending}
            className="transition-all duration-300 hover:border-primary/50 focus-visible:ring-primary/50"
          />
        </div>

        {/* ── Code ──────────────────────────────── */}
        <div className="space-y-1.5">
          <Label htmlFor="snippet-code">
            Code <span className="text-destructive">*</span>
          </Label>
          <Textarea
            id="snippet-code"
            placeholder="Paste your code here…"
            value={values.code}
            onChange={(e) => set("code", e.target.value)}
            aria-invalid={!!errors.code}
            aria-describedby={errors.code ? "code-error" : undefined}
            disabled={isPending}
            rows={10}
            className="font-mono text-sm resize-y transition-all duration-300 hover:border-primary/50 focus-visible:ring-primary/50"
            spellCheck={false}
          />
          {errors.code && (
            <p id="code-error" className="text-xs text-destructive">
              {errors.code}
            </p>
          )}
        </div>

        {/* ── Tags ──────────────────────────────── */}
        <div className="space-y-1.5">
          <Label htmlFor="snippet-tags">
            Tags{" "}
            <span className="text-muted-foreground text-xs">
              (press Enter or comma to add, max 8)
            </span>
          </Label>

          {/* Chip container */}
          <div
            className="flex flex-wrap gap-1.5 min-h-[2.5rem] w-full rounded-md border border-input bg-background px-3 py-2 cursor-text transition-all duration-300 hover:border-primary/50 focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/50"
            onClick={() => tagInputRef.current?.focus()}
          >
            {values.tags.map((tag, i) => (
              <Badge
                key={tag}
                variant="secondary"
                className="flex items-center gap-1 pr-1"
              >
                {tag}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeTag(i);
                  }}
                  aria-label={`Remove tag ${tag}`}
                  className="rounded-full hover:bg-muted-foreground/20 p-0.5"
                  disabled={isPending}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}

            <input
              ref={tagInputRef}
              id="snippet-tags"
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagKeyDown}
              onBlur={() => addTag(tagInput)}
              placeholder={values.tags.length === 0 ? "e.g. react, hooks…" : ""}
              disabled={isPending || values.tags.length >= 8}
              className="flex-1 min-w-[8rem] bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
        </div>

        {/* ── Visibility ────────────────────────── */}
        <div className="flex items-center justify-between rounded-lg border border-input px-4 py-3 transition-colors duration-300 hover:border-primary/50">
          <div>
            <p className="text-sm font-medium leading-none">Public snippet</p>
            <p className="text-xs text-muted-foreground mt-1">
              {values.is_public
                ? "Anyone can view this snippet"
                : "Only you can view this snippet"}
            </p>
          </div>
          <Switch
            id="snippet-visibility"
            checked={values.is_public}
            onCheckedChange={(checked) => set("is_public", checked)}
            disabled={isPending}
            aria-label="Toggle snippet visibility"
          />
        </div>

        {/* ── Actions ───────────────────────────── */}
        <div className="flex items-center gap-2 pt-1">
          {/* Submit */}
          <Button type="submit" disabled={isPending} className="flex-1 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md cursor-pointer">
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditing ? "Save changes" : "Add snippet"}
          </Button>

          {/* Cancel */}
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isPending}
            className="transition-all duration-300 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 cursor-pointer"
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
