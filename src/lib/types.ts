export type UserRole = "USER" | "ADMIN";
export type EmojiType = "HEART" | "PRAYER" | "THINKING";

export interface Profile {
  id: string;
  email: string | null;
  display_name: string;
  role: UserRole;
  email_opt_in: boolean;
  email_bounced: boolean;
  created_at: string;
}

export interface WeeklyStep {
  id: string;
  week_number: number;
  scripture_text: string;
  scripture_reference: string;
  theme_title: string;
  nugget_text: string;
  share_prompt: string;
  created_at: string;
  created_by: string | null;
}

export interface EngagementQuestion {
  id: string;
  weekly_step_id: string;
  question_number: 1 | 2;
  question_text: string;
}

export interface CommentRow {
  id: string;
  user_id: string;
  display_name: string;
  target_question_id: string;
  parent_id: string | null;
  content: string;
  created_at: string;
  depth: number;
  heart_count: number;
  prayer_count: number;
  thinking_count: number;
  my_reaction: EmojiType | null;
}

export interface CommentNode extends CommentRow {
  children: CommentNode[];
}

export interface PrayerRequest {
  id: string;
  weekly_step_id: string;
  user_id: string;
  content: string;
  is_anonymous: boolean;
  is_hidden: boolean;
  created_at: string;
  display_name?: string;
}

export interface WeeklyStepWithQuestions extends WeeklyStep {
  engagement_questions: EngagementQuestion[];
}
