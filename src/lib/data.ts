import { createClient } from "@/lib/supabase/server";
import { isLocalMode } from "@/lib/local/mode";
import { getLocalSessionProfile } from "@/lib/local/session";
import {
  localGetCommentRows,
  localGetPrayers,
  localGetWeeklyStep,
  localListWeeklySteps,
} from "@/lib/local/store";
import type {
  CommentRow,
  EngagementQuestion,
  PrayerRequest,
  Profile,
  WeeklyStep,
  WeeklyStepWithQuestions,
} from "@/lib/types";

export async function getCurrentProfile(): Promise<Profile | null> {
  if (isLocalMode()) return getLocalSessionProfile();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();

  return data as Profile | null;
}

export async function getLatestWeeklyStep(): Promise<WeeklyStepWithQuestions | null> {
  if (isLocalMode()) {
    return localGetWeeklyStep() as WeeklyStepWithQuestions | null;
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("weekly_steps")
    .select("*, engagement_questions(*)")
    .order("week_number", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data) return null;

  const questions = (data.engagement_questions as EngagementQuestion[]).sort(
    (a, b) => a.question_number - b.question_number
  );

  return { ...data, engagement_questions: questions } as WeeklyStepWithQuestions;
}

export async function getWeeklyStepById(
  id: string
): Promise<WeeklyStepWithQuestions | null> {
  if (isLocalMode()) {
    return localGetWeeklyStep(id) as WeeklyStepWithQuestions | null;
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("weekly_steps")
    .select("*, engagement_questions(*)")
    .eq("id", id)
    .maybeSingle();

  if (!data) return null;

  const questions = (data.engagement_questions as EngagementQuestion[]).sort(
    (a, b) => a.question_number - b.question_number
  );

  return { ...data, engagement_questions: questions } as WeeklyStepWithQuestions;
}

export async function listWeeklySteps(): Promise<WeeklyStep[]> {
  if (isLocalMode()) return localListWeeklySteps();

  const supabase = await createClient();
  const { data } = await supabase
    .from("weekly_steps")
    .select("*")
    .order("week_number", { ascending: false });

  return (data as WeeklyStep[]) || [];
}

export async function getCommentRows(
  questionId: string
): Promise<CommentRow[]> {
  if (isLocalMode()) {
    const profile = await getLocalSessionProfile();
    return localGetCommentRows(questionId, profile?.id || "") as CommentRow[];
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_comment_tree", {
    p_question_id: questionId,
  });

  if (error) {
    console.error("get_comment_tree", error.message);
    return [];
  }

  return (data as CommentRow[]) || [];
}

export async function getPrayers(
  weekId: string
): Promise<(PrayerRequest & { display_name: string })[]> {
  if (isLocalMode()) return localGetPrayers(weekId);

  const supabase = await createClient();
  const { data } = await supabase
    .from("prayer_requests")
    .select("*, users(display_name)")
    .eq("weekly_step_id", weekId)
    .eq("is_hidden", false)
    .order("created_at", { ascending: false });

  return (
    data?.map((row) => {
      const users = row.users as { display_name: string } | null;
      return {
        id: row.id,
        weekly_step_id: row.weekly_step_id,
        user_id: row.user_id,
        content: row.content,
        is_anonymous: row.is_anonymous,
        is_hidden: row.is_hidden,
        created_at: row.created_at,
        display_name: row.is_anonymous
          ? "Anonymous Member"
          : users?.display_name || "Member",
      };
    }) || []
  );
}
