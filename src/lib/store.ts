"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Post, Reminder, Template, ContentType, ContentStatus } from "./types";

type ViewMode = "month" | "week" | "day" | "list" | "multimonth";

interface FilterState {
  contentType: ContentType[];
  status: ContentStatus[];
  search: string;
}

interface UIStore {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  filters: FilterState;
  setFilters: (filters: Partial<FilterState>) => void;
  resetFilters: () => void;
  selectedDate: string | null;
  setSelectedDate: (date: string | null) => void;
  editorOpen: boolean;
  editorPostId: string | null;
  openEditor: (postId?: string | null, date?: string | null) => void;
  closeEditor: () => void;
}

const defaultFilters: FilterState = {
  contentType: [],
  status: [],
  search: "",
};

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      sidebarOpen: true,
      setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
      viewMode: "month",
      setViewMode: (viewMode) => set({ viewMode }),
      filters: defaultFilters,
      setFilters: (filters) => set((s) => ({ filters: { ...s.filters, ...filters } })),
      resetFilters: () => set({ filters: defaultFilters }),
      selectedDate: null,
      setSelectedDate: (selectedDate) => set({ selectedDate }),
      editorOpen: false,
      editorPostId: null,
      openEditor: (postId = null, date = null) =>
        set({ editorOpen: true, editorPostId: postId, selectedDate: date }),
      closeEditor: () => set({ editorOpen: false, editorPostId: null }),
    }),
    { name: "editorial-ui", partialize: (s) => ({ viewMode: s.viewMode, sidebarOpen: s.sidebarOpen }) }
  )
);

interface DataStore {
  posts: Post[];
  templates: Template[];
  reminders: Reminder[];
  loading: boolean;
  setPosts: (posts: Post[]) => void;
  setTemplates: (templates: Template[]) => void;
  setReminders: (reminders: Reminder[]) => void;
  setLoading: (loading: boolean) => void;
  upsertPost: (post: Post) => void;
  removePost: (id: string) => void;
}

export const useDataStore = create<DataStore>((set) => ({
  posts: [],
  templates: [],
  reminders: [],
  loading: true,
  setPosts: (posts) => set({ posts }),
  setTemplates: (templates) => set({ templates }),
  setReminders: (reminders) => set({ reminders }),
  setLoading: (loading) => set({ loading }),
  upsertPost: (post) =>
    set((s) => {
      const idx = s.posts.findIndex((p) => p.id === post.id);
      if (idx === -1) return { posts: [...s.posts, post] };
      const next = [...s.posts];
      next[idx] = post;
      return { posts: next };
    }),
  removePost: (id) => set((s) => ({ posts: s.posts.filter((p) => p.id !== id) })),
}));
