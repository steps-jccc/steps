"use client";

import { useState, useTransition } from "react";
import { formatDistanceToNow } from "date-fns";
import { postComment, deleteComment } from "@/lib/actions/comments";
import { ReactionBar } from "@/components/reaction-bar";
import type { CommentNode } from "@/lib/types";
import { cn } from "@/lib/utils";

function CommentForm({
  questionId,
  weekId,
  parentId,
  onDone,
  placeholder = "Share your reflection…",
}: {
  questionId: string;
  weekId: string;
  parentId?: string;
  onDone?: () => void;
  placeholder?: string;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await postComment(formData);
      if (result?.error) {
        setError(result.error);
        return;
      }
      onDone?.();
      const form = document.getElementById(
        `comment-form-${parentId || questionId}`
      ) as HTMLFormElement | null;
      form?.reset();
    });
  }

  return (
    <form
      id={`comment-form-${parentId || questionId}`}
      action={onSubmit}
      className="mt-3 space-y-2"
    >
      <input type="hidden" name="question_id" value={questionId} />
      <input type="hidden" name="week_id" value={weekId} />
      {parentId && <input type="hidden" name="parent_id" value={parentId} />}
      <textarea
        name="content"
        required
        rows={parentId ? 2 : 3}
        placeholder={placeholder}
        className="w-full resize-y rounded-xl border border-line bg-bg-elevated px-3.5 py-2.5 text-sm outline-none ring-accent/30 transition focus:ring-2"
      />
      {error && (
        <p className="text-xs text-danger" role="alert">
          {error}
        </p>
      )}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="min-h-11 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-60"
        >
          {pending ? "Posting…" : parentId ? "Reply" : "Post"}
        </button>
        {onDone && (
          <button
            type="button"
            onClick={onDone}
            className="min-h-11 rounded-lg px-3 py-2 text-sm text-ink-muted hover:bg-accent-soft"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

function CommentItem({
  comment,
  questionId,
  weekId,
  currentUserId,
  isAdmin,
  depth = 0,
}: {
  comment: CommentNode;
  questionId: string;
  weekId: string;
  currentUserId: string;
  isAdmin: boolean;
  depth?: number;
}) {
  const [replyOpen, setReplyOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const canDelete = comment.user_id === currentUserId || isAdmin;

  return (
    <li
      className={cn(
        "animate-fade-up border-l border-line/80",
        depth === 0 ? "pl-0 border-l-0" : "thread-indent"
      )}
    >
      <article className="rounded-2xl bg-bg-elevated/60 px-3.5 py-3 sm:px-4">
        <header className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="font-semibold text-ink">{comment.display_name}</p>
          <time
            dateTime={comment.created_at}
            className="text-xs text-ink-muted"
          >
            {formatDistanceToNow(new Date(comment.created_at), {
              addSuffix: true,
            })}
          </time>
        </header>
        <p className="mt-1.5 whitespace-pre-wrap text-[0.95rem] leading-relaxed text-ink">
          {comment.content}
        </p>

        <ReactionBar
          commentId={comment.id}
          heartCount={comment.heart_count}
          prayerCount={comment.prayer_count}
          thinkingCount={comment.thinking_count}
          myReaction={comment.my_reaction}
          weekId={weekId}
        />

        <div className="mt-2 flex flex-wrap gap-2 text-sm">
          <button
            type="button"
            onClick={() => setReplyOpen((v) => !v)}
            className="min-h-10 rounded-lg px-2 font-medium text-accent hover:bg-accent-soft"
          >
            Reply
          </button>
          {canDelete && (
            <button
              type="button"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  await deleteComment(comment.id, weekId);
                })
              }
              className="min-h-10 rounded-lg px-2 text-ink-muted hover:bg-red-50 hover:text-danger"
            >
              Delete
            </button>
          )}
        </div>

        {replyOpen && (
          <CommentForm
            questionId={questionId}
            weekId={weekId}
            parentId={comment.id}
            onDone={() => setReplyOpen(false)}
            placeholder={`Reply to ${comment.display_name}…`}
          />
        )}
      </article>

      {comment.children.length > 0 && (
        <ul className="mt-3 space-y-3">
          {comment.children.map((child) => (
            <CommentItem
              key={child.id}
              comment={child}
              questionId={questionId}
              weekId={weekId}
              currentUserId={currentUserId}
              isAdmin={isAdmin}
              depth={depth + 1}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

export function CommentThread({
  questionId,
  weekId,
  comments,
  currentUserId,
  isAdmin,
}: {
  questionId: string;
  weekId: string;
  comments: CommentNode[];
  currentUserId: string;
  isAdmin: boolean;
}) {
  return (
    <div className="mt-4">
      <CommentForm questionId={questionId} weekId={weekId} />
      {comments.length === 0 ? (
        <p className="mt-4 text-sm text-ink-muted">
          Be the first to share a reflection.
        </p>
      ) : (
        <ul className="mt-5 space-y-4">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              questionId={questionId}
              weekId={weekId}
              currentUserId={currentUserId}
              isAdmin={isAdmin}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
