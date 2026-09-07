import { createHash, randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import path from "path";
import type {
  EmojiType,
  EngagementQuestion,
  PrayerRequest,
  Profile,
  UserRole,
  WeeklyStep,
} from "@/lib/types";

const DATA_DIR = path.join(process.cwd(), ".data");
const DATA_FILE = path.join(DATA_DIR, "local-store.json");

export interface LocalUser extends Profile {
  password_hash: string;
}

export interface LocalComment {
  id: string;
  user_id: string;
  target_question_id: string;
  parent_id: string | null;
  content: string;
  created_at: string;
}

export interface LocalReaction {
  id: string;
  user_id: string;
  comment_id: string;
  emoji_type: EmojiType;
  created_at: string;
}

interface Store {
  users: LocalUser[];
  weekly_steps: WeeklyStep[];
  engagement_questions: EngagementQuestion[];
  comments: LocalComment[];
  reactions: LocalReaction[];
  prayer_requests: PrayerRequest[];
}

function hashPassword(password: string, salt?: string) {
  const usedSalt = salt || randomBytes(16).toString("hex");
  const hash = scryptSync(password, usedSalt, 64).toString("hex");
  return `${usedSalt}:${hash}`;
}

function verifyPassword(password: string, stored: string) {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const next = scryptSync(password, salt, 64);
  const prev = Buffer.from(hash, "hex");
  if (next.length !== prev.length) return false;
  return timingSafeEqual(next, prev);
}

function id() {
  return randomBytes(16).toString("hex").replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/, "$1-$2-$3-$4-$5");
}

function now() {
  return new Date().toISOString();
}

function seedStore(): Store {
  const dadId = id();
  const memberId = id();
  const weekId = id();
  const q1 = id();
  const q2 = id();

  return {
    users: [
      {
        id: dadId,
        email: "dad@steps.local",
        display_name: "Dad",
        role: "ADMIN",
        email_opt_in: true,
        email_bounced: false,
        created_at: now(),
        password_hash: hashPassword("steps1234"),
      },
      {
        id: memberId,
        email: "test@steps.local",
        display_name: "Test Member",
        role: "USER",
        email_opt_in: true,
        email_bounced: false,
        created_at: now(),
        password_hash: hashPassword("steps1234"),
      },
    ],
    weekly_steps: [
      {
        id: weekId,
        week_number: 1,
        scripture_reference: "Philippians 4:6-7",
        scripture_text:
          "Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God. And the peace of God, which transcends all understanding, will guard your hearts and your minds in Christ Jesus.",
        theme_title: "Peace That Guards",
        nugget_text:
          "Anxiety shrinks when thanksgiving and prayer open the door for God's peace to stand watch over your heart.",
        share_prompt:
          "Share one worry you will turn into a thanksgiving prayer this week.",
        created_at: now(),
        created_by: dadId,
      },
    ],
    engagement_questions: [
      {
        id: q1,
        weekly_step_id: weekId,
        question_number: 1,
        question_text:
          "Where have you felt anxious lately, and how might thanksgiving reshape that moment?",
      },
      {
        id: q2,
        weekly_step_id: weekId,
        question_number: 2,
        question_text:
          "What would it look like for God's peace to 'guard' your heart in a practical way this week?",
      },
    ],
    comments: [],
    reactions: [],
    prayer_requests: [],
  };
}

function readStore(): Store {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
  if (!existsSync(DATA_FILE)) {
    const seeded = seedStore();
    writeFileSync(DATA_FILE, JSON.stringify(seeded, null, 2));
    return seeded;
  }
  return JSON.parse(readFileSync(DATA_FILE, "utf8")) as Store;
}

function writeStore(store: Store) {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
  writeFileSync(DATA_FILE, JSON.stringify(store, null, 2));
}

export function localSignUp(input: {
  email: string;
  password: string;
  displayName: string;
}) {
  const store = readStore();
  const email = input.email.toLowerCase();
  if (store.users.some((u) => u.email?.toLowerCase() === email)) {
    return { error: "An account with this email already exists." as const };
  }

  const user: LocalUser = {
    id: id(),
    email,
    display_name: input.displayName,
    role: "USER",
    email_opt_in: true,
    email_bounced: false,
    created_at: now(),
    password_hash: hashPassword(input.password),
  };
  store.users.push(user);
  writeStore(store);
  return { user };
}

export function localSignIn(email: string, password: string) {
  const store = readStore();
  const user = store.users.find(
    (u) => u.email?.toLowerCase() === email.toLowerCase()
  );
  if (!user || !verifyPassword(password, user.password_hash)) {
    return { error: "Invalid email or password." as const };
  }
  return { user };
}

export function localGetProfile(userId: string): Profile | null {
  const user = readStore().users.find((u) => u.id === userId);
  if (!user) return null;
  const { password_hash: _, ...profile } = user;
  return profile;
}

export function localUpdateProfile(
  userId: string,
  data: { display_name: string; email_opt_in: boolean }
) {
  const store = readStore();
  const user = store.users.find((u) => u.id === userId);
  if (!user) return { error: "User not found." as const };
  user.display_name = data.display_name;
  user.email_opt_in = data.email_opt_in;
  writeStore(store);
  return { success: true as const };
}

export function localListWeeklySteps(): WeeklyStep[] {
  return [...readStore().weekly_steps].sort(
    (a, b) => b.week_number - a.week_number
  );
}

export function localGetWeeklyStep(idOrLatest?: string) {
  const store = readStore();
  const week = idOrLatest
    ? store.weekly_steps.find((w) => w.id === idOrLatest)
    : [...store.weekly_steps].sort((a, b) => b.week_number - a.week_number)[0];
  if (!week) return null;
  const questions = store.engagement_questions
    .filter((q) => q.weekly_step_id === week.id)
    .sort((a, b) => a.question_number - b.question_number);
  return { ...week, engagement_questions: questions };
}

export function localCreateWeekly(input: {
  week_number: number;
  scripture_text: string;
  scripture_reference: string;
  theme_title: string;
  nugget_text: string;
  share_prompt: string;
  question_1: string;
  question_2: string;
  created_by: string;
}) {
  const store = readStore();
  const profile = store.users.find((u) => u.id === input.created_by);
  if (!profile || profile.role !== "ADMIN") {
    return { error: "Only ADMIN users can create weekly S.T.E.P.S." as const };
  }
  if (store.weekly_steps.some((w) => w.week_number === input.week_number)) {
    return { error: "That week number already exists." as const };
  }

  const weekId = id();
  store.weekly_steps.push({
    id: weekId,
    week_number: input.week_number,
    scripture_text: input.scripture_text,
    scripture_reference: input.scripture_reference,
    theme_title: input.theme_title,
    nugget_text: input.nugget_text,
    share_prompt: input.share_prompt,
    created_at: now(),
    created_by: input.created_by,
  });
  store.engagement_questions.push(
    {
      id: id(),
      weekly_step_id: weekId,
      question_number: 1,
      question_text: input.question_1,
    },
    {
      id: id(),
      weekly_step_id: weekId,
      question_number: 2,
      question_text: input.question_2,
    }
  );
  writeStore(store);
  return { id: weekId };
}

export function localUpdateWeekly(input: {
  id: string;
  week_number: number;
  scripture_text: string;
  scripture_reference: string;
  theme_title: string;
  nugget_text: string;
  share_prompt: string;
  question_1: string;
  question_2: string;
  actorId: string;
}) {
  const store = readStore();
  const profile = store.users.find((u) => u.id === input.actorId);
  if (!profile || profile.role !== "ADMIN") {
    return { error: "Only ADMIN users can edit weekly S.T.E.P.S." as const };
  }

  const week = store.weekly_steps.find((w) => w.id === input.id);
  if (!week) return { error: "Week not found." as const };

  const clash = store.weekly_steps.find(
    (w) => w.week_number === input.week_number && w.id !== input.id
  );
  if (clash) return { error: "That week number already exists." as const };

  week.week_number = input.week_number;
  week.scripture_text = input.scripture_text;
  week.scripture_reference = input.scripture_reference;
  week.theme_title = input.theme_title;
  week.nugget_text = input.nugget_text;
  week.share_prompt = input.share_prompt;

  const q1 = store.engagement_questions.find(
    (q) => q.weekly_step_id === week.id && q.question_number === 1
  );
  const q2 = store.engagement_questions.find(
    (q) => q.weekly_step_id === week.id && q.question_number === 2
  );
  if (q1) q1.question_text = input.question_1;
  if (q2) q2.question_text = input.question_2;

  writeStore(store);
  return { id: week.id };
}

export function localGetCommentRows(questionId: string, currentUserId: string) {
  const store = readStore();
  const comments = store.comments.filter(
    (c) => c.target_question_id === questionId
  );

  const byParent = new Map<string | null, LocalComment[]>();
  for (const c of comments) {
    const key = c.parent_id;
    if (!byParent.has(key)) byParent.set(key, []);
    byParent.get(key)!.push(c);
  }

  const rows: {
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
  }[] = [];

  function walk(parentId: string | null, depth: number) {
    const kids = (byParent.get(parentId) || []).sort((a, b) =>
      a.created_at.localeCompare(b.created_at)
    );
    for (const c of kids) {
      const user = store.users.find((u) => u.id === c.user_id);
      const reactions = store.reactions.filter((r) => r.comment_id === c.id);
      const mine = reactions.find((r) => r.user_id === currentUserId);
      rows.push({
        id: c.id,
        user_id: c.user_id,
        display_name: user?.display_name || "Member",
        target_question_id: c.target_question_id,
        parent_id: c.parent_id,
        content: c.content,
        created_at: c.created_at,
        depth,
        heart_count: reactions.filter((r) => r.emoji_type === "HEART").length,
        prayer_count: reactions.filter((r) => r.emoji_type === "PRAYER").length,
        thinking_count: reactions.filter((r) => r.emoji_type === "THINKING")
          .length,
        my_reaction: mine?.emoji_type || null,
      });
      walk(c.id, depth + 1);
    }
  }

  walk(null, 0);
  return rows;
}

export function localPostComment(input: {
  userId: string;
  questionId: string;
  parentId: string | null;
  content: string;
}) {
  const store = readStore();
  store.comments.push({
    id: id(),
    user_id: input.userId,
    target_question_id: input.questionId,
    parent_id: input.parentId,
    content: input.content,
    created_at: now(),
  });
  writeStore(store);
  return { success: true as const };
}

export function localDeleteComment(commentId: string, userId: string, isAdmin: boolean) {
  const store = readStore();
  const comment = store.comments.find((c) => c.id === commentId);
  if (!comment) return { error: "Comment not found." as const };
  if (comment.user_id !== userId && !isAdmin) {
    return { error: "Not allowed." as const };
  }

  const toDelete = new Set<string>();
  function collect(idValue: string) {
    toDelete.add(idValue);
    for (const c of store.comments) {
      if (c.parent_id === idValue) collect(c.id);
    }
  }
  collect(commentId);
  store.comments = store.comments.filter((c) => !toDelete.has(c.id));
  store.reactions = store.reactions.filter((r) => !toDelete.has(r.comment_id));
  writeStore(store);
  return { success: true as const };
}

export function localToggleReaction(
  commentId: string,
  userId: string,
  emoji: EmojiType
) {
  const store = readStore();
  const existing = store.reactions.find(
    (r) => r.comment_id === commentId && r.user_id === userId
  );
  if (!existing) {
    store.reactions.push({
      id: id(),
      user_id: userId,
      comment_id: commentId,
      emoji_type: emoji,
      created_at: now(),
    });
    writeStore(store);
    return { reaction: emoji };
  }
  if (existing.emoji_type === emoji) {
    store.reactions = store.reactions.filter((r) => r.id !== existing.id);
    writeStore(store);
    return { reaction: null };
  }
  existing.emoji_type = emoji;
  writeStore(store);
  return { reaction: emoji };
}

export function localGetPrayers(weekId: string) {
  const store = readStore();
  return store.prayer_requests
    .filter((p) => p.weekly_step_id === weekId && !p.is_hidden)
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .map((p) => {
      const user = store.users.find((u) => u.id === p.user_id);
      return {
        ...p,
        display_name: p.is_anonymous
          ? "Anonymous Member"
          : user?.display_name || "Member",
      };
    });
}

export function localPostPrayer(input: {
  weekId: string;
  userId: string;
  content: string;
  isAnonymous: boolean;
}) {
  const store = readStore();
  store.prayer_requests.push({
    id: id(),
    weekly_step_id: input.weekId,
    user_id: input.userId,
    content: input.content,
    is_anonymous: input.isAnonymous,
    is_hidden: false,
    created_at: now(),
  });
  writeStore(store);
  return { success: true as const };
}

export function localDeletePrayer(prayerId: string, userId: string, isAdmin: boolean) {
  const store = readStore();
  const prayer = store.prayer_requests.find((p) => p.id === prayerId);
  if (!prayer) return { error: "Not found." as const };
  if (prayer.user_id !== userId && !isAdmin) return { error: "Not allowed." as const };
  store.prayer_requests = store.prayer_requests.filter((p) => p.id !== prayerId);
  writeStore(store);
  return { success: true as const };
}

export function localHidePrayer(prayerId: string, hide: boolean) {
  const store = readStore();
  const prayer = store.prayer_requests.find((p) => p.id === prayerId);
  if (!prayer) return { error: "Not found." as const };
  prayer.is_hidden = hide;
  writeStore(store);
  return { success: true as const };
}

export function localListAllPrayers() {
  const store = readStore();
  return store.prayer_requests
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .map((p) => {
      const user = store.users.find((u) => u.id === p.user_id);
      const week = store.weekly_steps.find((w) => w.id === p.weekly_step_id);
      return {
        ...p,
        users: { display_name: user?.display_name || "Member" },
        weekly_steps: week
          ? { week_number: week.week_number, theme_title: week.theme_title }
          : null,
      };
    });
}

export function sessionSecret() {
  return (
    process.env.LOCAL_AUTH_SECRET ||
    process.env.CRON_SECRET ||
    "local-steps-dev-secret"
  );
}

export function signSession(userId: string) {
  const sig = createHash("sha256")
    .update(`${userId}.${sessionSecret()}`)
    .digest("hex")
    .slice(0, 32);
  return `${userId}.${sig}`;
}

export function verifySession(token: string | undefined) {
  if (!token) return null;
  const [userId, sig] = token.split(".");
  if (!userId || !sig) return null;
  const expected = createHash("sha256")
    .update(`${userId}.${sessionSecret()}`)
    .digest("hex")
    .slice(0, 32);
  try {
    if (!timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  } catch {
    return null;
  }
  return localGetProfile(userId);
}

export type { UserRole };
