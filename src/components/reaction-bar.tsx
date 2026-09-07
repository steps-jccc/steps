"use client";

import { useOptimistic, useState, useTransition } from "react";
import { toggleReaction } from "@/lib/actions/reactions";
import type { EmojiType } from "@/lib/types";
import { cn } from "@/lib/utils";

const REACTIONS: {
  type: EmojiType;
  emoji: string;
  label: string;
}[] = [
  { type: "HEART", emoji: "❤️", label: "Heart" },
  { type: "PRAYER", emoji: "🙏", label: "Prayer" },
  { type: "THINKING", emoji: "🤔", label: "Thinking" },
];

interface ReactionState {
  heart: number;
  prayer: number;
  thinking: number;
  mine: EmojiType | null;
}

export function ReactionBar({
  commentId,
  heartCount,
  prayerCount,
  thinkingCount,
  myReaction,
  weekId,
}: {
  commentId: string;
  heartCount: number;
  prayerCount: number;
  thinkingCount: number;
  myReaction: EmojiType | null;
  weekId?: string;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [optimistic, setOptimistic] = useOptimistic<ReactionState, EmojiType>(
    {
      heart: heartCount,
      prayer: prayerCount,
      thinking: thinkingCount,
      mine: myReaction,
    },
    (state, next) => {
      const counts = {
        heart: state.heart,
        prayer: state.prayer,
        thinking: state.thinking,
      };
      const key = (t: EmojiType) =>
        t === "HEART" ? "heart" : t === "PRAYER" ? "prayer" : "thinking";

      if (state.mine) counts[key(state.mine)] = Math.max(0, counts[key(state.mine)] - 1);

      if (state.mine === next) {
        return { ...counts, mine: null };
      }

      counts[key(next)] += 1;
      return { ...counts, mine: next };
    }
  );

  function onReact(type: EmojiType) {
    setError(null);
    startTransition(async () => {
      setOptimistic(type);
      const result = await toggleReaction(commentId, type, weekId);
      if (result.error) setError(result.error);
    });
  }

  function countFor(type: EmojiType) {
    if (type === "HEART") return optimistic.heart;
    if (type === "PRAYER") return optimistic.prayer;
    return optimistic.thinking;
  }

  return (
    <div className="mt-2 space-y-1">
      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Reactions">
        {REACTIONS.map(({ type, emoji, label }) => {
          const pressed = optimistic.mine === type;
          const count = countFor(type);
          return (
            <button
              key={type}
              type="button"
              disabled={pending}
              aria-label={`React with ${label}. ${count} current reactions.`}
              aria-pressed={pressed}
              onClick={() => onReact(type)}
              className={cn(
                "inline-flex min-h-10 items-center gap-1.5 rounded-full border border-line bg-bg-elevated px-3 py-1.5 text-sm transition hover:border-accent/40 hover:bg-accent-soft disabled:opacity-60",
                pressed && "reaction-active"
              )}
            >
              <span aria-hidden="true">{emoji}</span>
              <span className="tabular-nums text-ink-muted">{count}</span>
            </button>
          );
        })}
      </div>
      {error && (
        <p className="text-xs text-danger" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
