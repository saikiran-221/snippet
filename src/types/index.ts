// ─────────────────────────────────────────────
// SnippetVault — Shared TypeScript types
// All types live here; import from "@/types"
// ─────────────────────────────────────────────

// ── Auth / User ──────────────────────────────

export interface Profile {
  id: string;            // == auth.users.id
  username: string;
  display_name: string;
  avatar_url: string | null;
  email: string | null;
  created_at: string | null;
}

// ── Snippets ─────────────────────────────────

export type SnippetVisibility = "public" | "private";

export interface Snippet {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  code: string;
  language: string;
  tags: string[];
  is_public: boolean;
  share_count: number;
  created_at: string;
  updated_at: string;
  profiles?: Profile;   // joined via foreign key
}

/** Payload for creating a new snippet */
export interface CreateSnippetInput {
  title: string;
  description?: string;
  code: string;
  language: string;
  tags?: string[];
  is_public?: boolean;
}

/** Payload for updating an existing snippet */
export interface UpdateSnippetInput {
  id: string;
  title?: string;
  description?: string;
  code?: string;
  language?: string;
  tags?: string[];
  is_public?: boolean;
}

// ── Shares ───────────────────────────────────

// For analytics/tracking public shares (e.g. copied link, export image)
export type SharePlatform = "link" | "twitter" | "image" | "email";

export interface Share {
  id: string;
  snippet_id: string;
  shared_by: string;
  platform: SharePlatform;
  created_at: string;
}

// For granting explicit read access to a specific user
export interface SnippetShare {
  id: string;
  snippet_id: string;
  shared_with: string;
  created_at: string;
  profiles?: Profile; // joined profile of the user it's shared with
}

// ── Filters ──────────────────────────────────

export interface SnippetFilters {
  language?: string;
  tag?: string;
  userId?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

// ── Query key factory (co-located with types) ─

export const snippetKeys = {
  all: ["snippets"] as const,
  lists: () => [...snippetKeys.all, "list"] as const,
  list: (filters: SnippetFilters) =>
    [...snippetKeys.lists(), filters] as const,
  details: () => [...snippetKeys.all, "detail"] as const,
  detail: (id: string) => [...snippetKeys.details(), id] as const,
} as const;
