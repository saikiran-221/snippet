/**
 * src/lib/api.ts
 *
 * Central API layer — ALL Supabase calls live here.
 * Components and hooks must never import supabase directly.
 */
import { supabase } from "@/lib/supabase";
import type {
  Snippet,
  CreateSnippetInput,
  UpdateSnippetInput,
  SnippetFilters,
  Profile,
  Share,
  SharePlatform,
} from "@/types";

// ─── Error helper ─────────────────────────────────────────────────────────────

function handleError(error: { message: string }): never {
  throw new Error(error.message);
}

// ─── Snippets ─────────────────────────────────────────────────────────────────

/**
 * Fetch a paginated, optionally filtered list of snippets.
 * Public snippets only unless userId matches the authenticated user.
 */
export async function fetchSnippets(
  filters: SnippetFilters = {}
): Promise<Snippet[]> {
  const { language, tag, userId, search, page = 1, pageSize = 20 } = filters;

  let query = supabase
    .from("snippets")
    .select(
      `
      *,
      profiles (
        id,
        username,
        display_name,
        avatar_url
      ),
      snippet_tags (
        tags (
          name
        )
      )
      `
    )
    .order("created_at", { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);

  // Apply optional filters
  if (userId) {
    query = query.eq("user_id", userId);
  } else {
    query = query.eq("is_public", true);
  }

  if (language) {
    query = query.eq("language", language);
  }

  if (search) {
    query = query.ilike("title", `%${search}%`);
  }

  // Handle relationship tag filtering
  if (tag) {
    const { data: tagData } = await supabase.from('tags').select('id').eq('name', tag).maybeSingle();
    if (tagData) {
      const { data: linkData } = await supabase.from('snippet_tags').select('snippet_id').eq('tag_id', tagData.id);
      const snippetIds = linkData?.map((l: any) => l.snippet_id) || [];
      query = query.in('id', snippetIds);
    } else {
      query = query.in('id', []); // empty result
    }
  }

  const { data, error } = await query;
  if (error) handleError(error);

  // Map relational tags back to string array
  return (data ?? []).map((s: any) => ({
    ...s,
    tags: s.snippet_tags?.map((st: any) => st.tags?.name).filter(Boolean) || [],
    snippet_tags: undefined
  })) as Snippet[];
}

/** Fetch a single snippet by ID (public or owned). */
export async function fetchSnippetById(id: string): Promise<Snippet> {
  const { data, error } = await supabase
    .from("snippets")
    .select(
      `
      *,
      profiles (
        id,
        username,
        display_name,
        avatar_url
      ),
      snippet_tags (
        tags (
          name
        )
      )
      `
    )
    .eq("id", id)
    .single();

  if (error) handleError(error);

  const snippet = data as any;
  return {
    ...snippet,
    tags: snippet.snippet_tags?.map((st: any) => st.tags?.name).filter(Boolean) || [],
    snippet_tags: undefined
  } as Snippet;
}

/** Create a new snippet for the currently authenticated user. */
export async function createSnippet(
  input: CreateSnippetInput
): Promise<Snippet> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("You must be signed in to create a snippet.");

  const { data, error } = await supabase
    .from("snippets")
    .insert({
      user_id: user.id,
      title: input.title,
      description: input.description ?? null,
      code: input.code,
      language: input.language,
      is_public: input.is_public ?? false,
    })
    .select()
    .single();

  if (error) handleError(error);

  const snippet = data as any;
  snippet.tags = [];

  if (input.tags && input.tags.length > 0) {
    for (const tagName of input.tags) {
      if (!tagName.trim()) continue;

      let tagId;
      const { data: existingTag } = await supabase
        .from("tags")
        .select("id")
        .eq("name", tagName.trim())
        .maybeSingle();

      if (existingTag) {
        tagId = existingTag.id;
      } else {
        const { data: newTag, error: newTagErr } = await supabase
          .from("tags")
          .insert({ name: tagName.trim() })
          .select("id")
          .single();

        if (!newTagErr && newTag) {
          tagId = newTag.id;
        }
      }

      if (tagId) {
        await supabase.from("snippet_tags").insert({
          snippet_id: snippet.id,
          tag_id: tagId
        });
        snippet.tags.push(tagName.trim());
      }
    }
  }

  return snippet as Snippet;
}

/** Update an existing snippet. Supabase RLS enforces ownership. */
export async function updateSnippet(
  input: UpdateSnippetInput
): Promise<Snippet> {
  const { id, tags, ...rest } = input;

  // We should not send undefined fields to update
  const payload = {
    ...rest,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("snippets")
    .update(payload)
    .eq("id", id)
    .select()
    .single();

  if (error) handleError(error);

  const snippet = data as any;
  snippet.tags = [];

  if (tags !== undefined) {
    // Clear existing relationship
    await supabase.from("snippet_tags").delete().eq("snippet_id", id);

    if (tags.length > 0) {
      for (const tagName of tags) {
        if (!tagName.trim()) continue;

        let tagId;
        const { data: existingTag } = await supabase
          .from("tags")
          .select("id")
          .eq("name", tagName.trim())
          .maybeSingle();

        if (existingTag) {
          tagId = existingTag.id;
        } else {
          const { data: newTag, error: newTagErr } = await supabase
            .from("tags")
            .insert({ name: tagName.trim() })
            .select("id")
            .single();

          if (!newTagErr && newTag) {
            tagId = newTag.id;
          }
        }

        if (tagId) {
          await supabase.from("snippet_tags").insert({
            snippet_id: snippet.id,
            tag_id: tagId
          });
          snippet.tags.push(tagName.trim());
        }
      }
    }
  } else {
    // Preserve existing tags in the returned object if no edit was made
    const { data: tagData } = await supabase
      .from("snippet_tags")
      .select("tags(name)")
      .eq("snippet_id", id);

    snippet.tags = tagData?.map((st: any) => st.tags?.name).filter(Boolean) || [];
  }

  return snippet as Snippet;
}

/** Delete a snippet by ID. Supabase RLS enforces ownership. */
export async function deleteSnippet(id: string): Promise<void> {
  const { error } = await supabase.from("snippets").delete().eq("id", id);
  if (error) handleError(error);
}

// ─── Profiles ─────────────────────────────────────────────────────────────────

export async function fetchProfile(username: string): Promise<Profile> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("username", username)
    .single();

  if (error) handleError(error);
  return data as Profile;
}

// ─── Shares ───────────────────────────────────────────────────────────────────

export async function recordShare(
  snippetId: string,
  platform: SharePlatform,
  sharedWithEmail?: string
): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error: insertError } = await supabase.from("shares").insert({
    snippet_id: snippetId,
    shared_by: user?.id ?? null,
    platform,
    shared_with: sharedWithEmail ?? null,
  });

  if (insertError) handleError(insertError);

  // Increment share_count on the snippet (best-effort)
  await supabase.rpc("increment_share_count", { snippet_id: snippetId });
}

export async function fetchShares(snippetId: string): Promise<Share[]> {
  const { data, error } = await supabase
    .from("shares")
    .select("*")
    .eq("snippet_id", snippetId)
    .order("created_at", { ascending: false });

  if (error) handleError(error);
  return (data ?? []) as Share[];
}

// ─── Specific User Access (snippet_shares) ───────────────────────────────────

export async function fetchSnippetShares(snippetId: string) {
  const { data, error } = await supabase
    .from("snippet_shares")
    .select("*, profiles!snippet_shares_shared_with_fkey (id, username, display_name, email, avatar_url)")
    .eq("snippet_id", snippetId)
    .order("created_at", { ascending: false });

  if (error) handleError(error);
  return data ?? [];
}

export async function shareSnippetWithEmail(snippetId: string, email: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Must be logged in");

  // Lookup profile
  const { data: profileTarget, error: profileErr } = await supabase
    .from("profiles")
    .select("id, email")
    .eq("email", email.trim().toLowerCase())
    .single();

  if (profileErr || !profileTarget) {
    throw new Error(`No user found with email ${email}`);
  }

  if (profileTarget.id === user.id) {
    throw new Error("You cannot share a snippet with yourself.");
  }

  // Check existing share
  const { data: existing } = await supabase
    .from("snippet_shares")
    .select("id")
    .eq("snippet_id", snippetId)
    .eq("shared_with", profileTarget.id)
    .single();

  if (existing) {
    throw new Error("This snippet is already shared with this user.");
  }

  // Insert share
  const { error: insertErr } = await supabase
    .from("snippet_shares")
    .insert({
      snippet_id: snippetId,
      shared_with: profileTarget.id,
    });

  if (insertErr) handleError(insertErr);
}

export async function removeSnippetShare(shareId: string): Promise<void> {
  const { error } = await supabase
    .from("snippet_shares")
    .delete()
    .eq("id", shareId);

  if (error) handleError(error);
}
