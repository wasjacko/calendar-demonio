"use client";

import { createClient } from "./supabase/client";
import type { Post, FunnelStage, ContentStatus, ContentFormat, ContentPillar } from "./types";

export interface PostInput {
  title: string;
  hook?: string | null;
  caption?: string | null;
  hashtags?: string[];
  cta?: string | null;
  visual_brief?: string | null;
  visual_url?: string | null;
  audio_reference?: string | null;
  format: ContentFormat;
  funnel_stage: FunnelStage;
  pillar?: ContentPillar | null;
  status: ContentStatus;
  scheduled_for?: string | null;
  notes?: string | null;
  template_id?: string | null;
}

export async function fetchPosts(rangeStart?: Date, rangeEnd?: Date): Promise<Post[]> {
  const supabase = createClient();
  let query = supabase.from("posts").select("*").order("scheduled_for", { ascending: true, nullsFirst: false });
  if (rangeStart && rangeEnd) {
    query = query.gte("scheduled_for", rangeStart.toISOString()).lte("scheduled_for", rangeEnd.toISOString());
  }
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as Post[];
}

export async function fetchPost(id: string): Promise<Post | null> {
  const supabase = createClient();
  const { data, error } = await supabase.from("posts").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data as Post | null;
}

export async function createPost(input: PostInput): Promise<Post> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("posts")
    .insert({ ...input, user_id: user.id })
    .select()
    .single();
  if (error) throw error;
  return data as Post;
}

export async function updatePost(id: string, input: Partial<PostInput>): Promise<Post> {
  const supabase = createClient();
  const { data, error } = await supabase.from("posts").update(input).eq("id", id).select().single();
  if (error) throw error;
  return data as Post;
}

export async function deletePost(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("posts").delete().eq("id", id);
  if (error) throw error;
}

export async function reschedulePost(id: string, newDate: Date): Promise<Post> {
  return updatePost(id, { scheduled_for: newDate.toISOString() });
}

export async function publishPost(id: string): Promise<Post> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("posts")
    .update({ status: "PUBLISHED", published_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as Post;
}

export async function fetchTemplates() {
  const supabase = createClient();
  const { data, error } = await supabase.from("templates").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function fetchSettings() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data, error } = await supabase.from("settings").select("*").eq("user_id", user.id).maybeSingle();
  if (error) throw error;
  return data;
}

export async function updateSettings(input: Record<string, unknown>) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { data, error } = await supabase
    .from("settings")
    .upsert({ user_id: user.id, ...input })
    .select()
    .single();
  if (error) throw error;
  return data;
}
