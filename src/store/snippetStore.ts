/**
 * src/store/snippetStore.ts
 *
 * Zustand store for UI-only state.
 * Server data (snippets, profiles) lives in TanStack Query — not here.
 */
import { create } from "zustand";

interface SnippetUIStore {
  // ── Selection ──────────────────────────────
  activeSnippetId: string | null;
  setActiveSnippet: (id: string | null) => void;

  // ── Filters (drive useSnippets query params) ──
  searchQuery: string;
  filterLanguage: string | null;
  filterTag: string | null;
  searchGlobalPublic: boolean;
  setSearchQuery: (q: string) => void;
  setLanguageFilter: (lang: string | null) => void;
  setTagFilter: (tag: string | null) => void;
  setSearchGlobalPublic: (val: boolean) => void;
  clearFilters: () => void;

  // ── Form modal ─────────────────────────────
  /** id of snippet being edited, or null when creating */
  editingSnippetId: string | null;
  isFormOpen: boolean;
  openCreateForm: () => void;
  openEditForm: (id: string) => void;
  closeForm: () => void;

  // ── Sidebar ────────────────────────────────
  sidebarOpen: boolean;
  toggleSidebar: () => void;
}

export const useSnippetStore = create<SnippetUIStore>((set) => ({
  // Selection
  activeSnippetId: null,
  setActiveSnippet: (id) => set({ activeSnippetId: id }),

  // Filters
  searchQuery: "",
  filterLanguage: null,
  filterTag: null,
  searchGlobalPublic: false,
  setSearchQuery: (q) => set({ searchQuery: q }),
  setLanguageFilter: (lang) => set({ filterLanguage: lang }),
  setTagFilter: (tag) => set({ filterTag: tag }),
  setSearchGlobalPublic: (val) => set({ searchGlobalPublic: val }),
  clearFilters: () =>
    set({ searchQuery: "", filterLanguage: null, filterTag: null }),

  // Form modal
  editingSnippetId: null,
  isFormOpen: false,
  openCreateForm: () => set({ isFormOpen: true, editingSnippetId: null }),
  openEditForm: (id) => set({ isFormOpen: true, editingSnippetId: id }),
  closeForm: () => set({ isFormOpen: false, editingSnippetId: null }),

  // Sidebar
  sidebarOpen: true,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
}));
