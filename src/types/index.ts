// Shared TypeScript types for SnippetVault

export interface Snippet {
  id: string;
  title: string;
  description?: string;
  code: string;
  language: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  avatar_url?: string;
}

export interface Share {
  id: string;
  snippet_id: string;
  shared_with?: string;
  is_public: boolean;
  created_at: string;
}
