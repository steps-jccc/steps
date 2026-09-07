"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isLocalMode } from "@/lib/local/mode";
import { getLocalSessionProfile } from "@/lib/local/session";
import { localCreateWeekly, localUpdateWeekly } from "@/lib/local/store";

function parseWeeklyForm(formData: FormData) {
  return {
    weekNumber: Number(formData.get("week_number")),
    scriptureText: String(formData.get("scripture_text") || "").trim(),
    scriptureReference: String(
      formData.get("scripture_reference") || ""
    ).trim(),
    themeTitle: String(formData.get("theme_title") || "").trim(),
    nuggetText: String(formData.get("nugget_text") || "").trim(),
    sharePrompt: String(
      formData.get("share_prompt") ||
        "Share one way you will live out this week's theme."
    ).trim(),
    question1: String(formData.get("question_1") || "").trim(),
    question2: String(formData.get("question_2") || "").trim(),
  };
}

function validateWeeklyFields(fields: ReturnType<typeof parseWeeklyForm>) {
  if (
    !fields.weekNumber ||
    !fields.scriptureText ||
    !fields.scriptureReference ||
    !fields.themeTitle ||
    !fields.nuggetText ||
    !fields.question1 ||
    !fields.question2
  ) {
    return "Please fill in all required fields.";
  }
  return null;
}

function revalidateWeekPaths(weekId?: string) {
  revalidatePath("/steps");
  revalidatePath("/weeks");
  revalidatePath("/admin/create");
  if (weekId) {
    revalidatePath(`/weeks/${weekId}`);
    revalidatePath(`/admin/edit/${weekId}`);
  }
}

export async function createWeeklySteps(formData: FormData) {
  const fields = parseWeeklyForm(formData);
  const validationError = validateWeeklyFields(fields);
  if (validationError) return { error: validationError };

  if (isLocalMode()) {
    const profile = await getLocalSessionProfile();
    if (!profile) return { error: "Not authenticated." };
    const result = localCreateWeekly({
      week_number: fields.weekNumber,
      scripture_text: fields.scriptureText,
      scripture_reference: fields.scriptureReference,
      theme_title: fields.themeTitle,
      nugget_text: fields.nuggetText,
      share_prompt: fields.sharePrompt,
      question_1: fields.question1,
      question_2: fields.question2,
      created_by: profile.id,
    });
    if ("error" in result && result.error) return { error: result.error };
    revalidateWeekPaths(result.id);
    return { success: true, id: result.id };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_weekly_steps", {
    p_week_number: fields.weekNumber,
    p_scripture_text: fields.scriptureText,
    p_scripture_reference: fields.scriptureReference,
    p_theme_title: fields.themeTitle,
    p_nugget_text: fields.nuggetText,
    p_share_prompt: fields.sharePrompt,
    p_question_1: fields.question1,
    p_question_2: fields.question2,
  });

  if (error) return { error: error.message };

  revalidateWeekPaths(data as string);
  return { success: true, id: data as string };
}

export async function updateWeeklySteps(formData: FormData) {
  const weekId = String(formData.get("week_id") || "").trim();
  if (!weekId) return { error: "Missing week id." };

  const fields = parseWeeklyForm(formData);
  const validationError = validateWeeklyFields(fields);
  if (validationError) return { error: validationError };

  if (isLocalMode()) {
    const profile = await getLocalSessionProfile();
    if (!profile) return { error: "Not authenticated." };
    const result = localUpdateWeekly({
      id: weekId,
      week_number: fields.weekNumber,
      scripture_text: fields.scriptureText,
      scripture_reference: fields.scriptureReference,
      theme_title: fields.themeTitle,
      nugget_text: fields.nuggetText,
      share_prompt: fields.sharePrompt,
      question_1: fields.question1,
      question_2: fields.question2,
      actorId: profile.id,
    });
    if ("error" in result && result.error) return { error: result.error };
    revalidateWeekPaths(weekId);
    return { success: true, id: weekId };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("update_weekly_steps", {
    p_id: weekId,
    p_week_number: fields.weekNumber,
    p_scripture_text: fields.scriptureText,
    p_scripture_reference: fields.scriptureReference,
    p_theme_title: fields.themeTitle,
    p_nugget_text: fields.nuggetText,
    p_share_prompt: fields.sharePrompt,
    p_question_1: fields.question1,
    p_question_2: fields.question2,
  });

  if (error) return { error: error.message };

  revalidateWeekPaths(weekId);
  return { success: true, id: data as string };
}
