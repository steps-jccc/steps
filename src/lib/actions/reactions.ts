"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isLocalMode } from "@/lib/local/mode";
import { getLocalSessionProfile } from "@/lib/local/session";
import { localToggleReaction } from "@/lib/local/store";
import type { EmojiType } from "@/lib/types";

export async function toggleReaction(
  commentId: string,
  emojiType: EmojiType,
  weekId?: string
) {
  if (isLocalMode()) {
    const profile = await getLocalSessionProfile();
    if (!profile) return { error: "Not authenticated." };
    const { reaction } = localToggleReaction(commentId, profile.id, emojiType);
    revalidatePath("/steps");
    if (weekId) revalidatePath(`/weeks/${weekId}`);
    return { success: true, reaction };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("toggle_reaction", {
    p_comment_id: commentId,
    p_emoji_type: emojiType,
  });

  if (error) return { error: error.message };

  revalidatePath("/steps");
  if (weekId) revalidatePath(`/weeks/${weekId}`);
  return { success: true, reaction: data as EmojiType | null };
}
