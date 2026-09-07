"use client";

import { useState, useTransition } from "react";
import { formatDistanceToNow } from "date-fns";
import { deletePrayer, postPrayer } from "@/lib/actions/prayers";
import type { PrayerRequest } from "@/lib/types";

export function PrayerSection({
  weekId,
  prayers,
  currentUserId,
  isAdmin,
}: {
  weekId: string;
  prayers: (PrayerRequest & { display_name: string })[];
  currentUserId: string;
  isAdmin: boolean;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await postPrayer(formData);
      if (result?.error) {
        setError(result.error);
        return;
      }
      const form = document.getElementById("prayer-form") as HTMLFormElement;
      form?.reset();
    });
  }

  return (
    <section id="prayer" className="surface animate-fade-up-delay-2 p-5 sm:p-7">
      <p className="section-label">
        <span aria-hidden="true">P</span> Prayer
      </p>
      <h2 className="mt-2 font-serif text-2xl font-semibold tracking-tight text-ink">
        Prayer requests
      </h2>
      <p className="mt-2 max-w-prose text-sm leading-relaxed text-ink-muted">
        Share what is on your heart. Toggle anonymity if you prefer privacy -
        your request remains editable by you either way.
      </p>

      <form id="prayer-form" action={onSubmit} className="mt-5 space-y-3">
        <input type="hidden" name="week_id" value={weekId} />
        <textarea
          name="content"
          required
          rows={3}
          placeholder="How can we pray with you this week?"
          className="w-full resize-y rounded-xl border border-line bg-bg px-3.5 py-2.5 text-sm outline-none ring-accent/30 transition focus:ring-2"
        />
        <label className="flex items-center gap-2 text-sm text-ink">
          <input
            type="checkbox"
            name="is_anonymous"
            className="size-4 rounded border-line accent-accent"
          />
          Post anonymously
        </label>
        {error && (
          <p className="text-sm text-danger" role="alert">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={pending}
          className="rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-60"
        >
          {pending ? "Submitting…" : "Submit prayer"}
        </button>
      </form>

      <ul className="mt-6 space-y-3">
        {prayers.length === 0 && (
          <li className="text-sm text-ink-muted">No prayer requests yet.</li>
        )}
        {prayers.map((prayer) => {
          const canDelete = prayer.user_id === currentUserId || isAdmin;
          return (
            <li
              key={prayer.id}
              className="rounded-2xl border border-line/80 bg-bg px-4 py-3"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="text-sm font-semibold text-ink">
                  {prayer.display_name}
                </p>
                <time
                  dateTime={prayer.created_at}
                  className="text-xs text-ink-muted"
                >
                  {formatDistanceToNow(new Date(prayer.created_at), {
                    addSuffix: true,
                  })}
                </time>
              </div>
              <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed">
                {prayer.content}
              </p>
              {canDelete && (
                <button
                  type="button"
                  className="mt-2 text-xs text-ink-muted hover:text-danger"
                  onClick={() =>
                    startTransition(async () => {
                      await deletePrayer(prayer.id, weekId);
                    })
                  }
                >
                  Delete
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
