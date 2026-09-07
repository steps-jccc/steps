"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isLocalMode } from "@/lib/local/mode";
import { getLocalSessionProfile } from "@/lib/local/session";
import { localDeleteComment, localPostComment } from "@/lib/local/store";

export async function postComment(formData: FormData) {
  const content = String(formData.get("content") || "").trim();
  const questionId = String(formData.get("question_id") || "");
  const parentId = String(formData.get("parent_id") || "") || null;
  const weekId = String(formData.get("week_id") || "");

  if (!content || !questionId) {
    return { error: "Comment content is required." };
  }

  if (isLocalMode()) {
    const profile = await getLocalSessionProfile();
    if (!profile) return { error: "Not authenticated." };
    localPostComment({
      userId: profile.id,
      questionId,
      parentId,
      content,
    });
    revalidatePath("/steps");
    if (weekId) revalidatePath(`/weeks/${weekId}`);
    return { success: true };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const { error } = await supabase.from("comments").insert({
    user_id: user.id,
    target_question_id: questionId,
    parent_id: parentId,
    content,
  });

  if (error) return { error: error.message };

  revalidatePath("/steps");
  if (weekId) revalidatePath(`/weeks/${weekId}`);
  return { success: true };
}

export async function deleteComment(commentId: string, weekId?: string) {
  if (isLocalMode()) {
    const profile = await getLocalSessionProfile();
    if (!profile) return { error: "Not authenticated." };
    const result = localDeleteComment(
      commentId,
      profile.id,
      profile.role === "ADMIN"
    );
    if ("error" in result && result.error) return { error: result.error };
    revalidatePath("/steps");
    if (weekId) revalidatePath(`/weeks/${weekId}`);
    return { success: true };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("comments")
    .delete()
    .eq("id", commentId);

  if (error) return { error: error.message };

  revalidatePath("/steps");
  if (weekId) revalidatePath(`/weeks/${weekId}`);
  return { success: true };
}
