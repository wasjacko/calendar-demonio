"use client";

import * as React from "react";
import { createClient } from "@/lib/supabase/client";
import { useDataStore } from "@/lib/store";
import { OWNER_USER_ID } from "@/lib/owner";
import type { Post, Template } from "@/lib/types";

export function DataLoader({ children }: { children: React.ReactNode }) {
  const { setPosts, setTemplates, setLoading } = useDataStore();

  React.useEffect(() => {
    const supabase = createClient();
    let postsChannel: ReturnType<typeof supabase.channel> | null = null;

    const load = async () => {
      setLoading(true);
      const [postsRes, templatesRes] = await Promise.all([
        supabase
          .from("posts")
          .select("*")
          .eq("user_id", OWNER_USER_ID)
          .order("scheduled_for", { ascending: true, nullsFirst: false }),
        supabase
          .from("templates")
          .select("*")
          .or(`user_id.eq.${OWNER_USER_ID},is_system.eq.true`)
          .order("created_at", { ascending: false }),
      ]);
      setPosts((postsRes.data ?? []) as Post[]);
      setTemplates((templatesRes.data ?? []) as Template[]);
      setLoading(false);

      postsChannel = supabase
        .channel("posts-changes")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "posts", filter: `user_id=eq.${OWNER_USER_ID}` },
          (payload) => {
            const { posts } = useDataStore.getState();
            if (payload.eventType === "INSERT") {
              setPosts([...posts, payload.new as Post]);
            } else if (payload.eventType === "UPDATE") {
              setPosts(posts.map((p) => (p.id === (payload.new as Post).id ? (payload.new as Post) : p)));
            } else if (payload.eventType === "DELETE") {
              setPosts(posts.filter((p) => p.id !== (payload.old as Post).id));
            }
          }
        )
        .subscribe();
    };

    load();

    return () => {
      if (postsChannel) postsChannel.unsubscribe();
    };
  }, [setPosts, setTemplates, setLoading]);

  return <>{children}</>;
}
