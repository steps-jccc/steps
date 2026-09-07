"use client";

import { useState, useTransition } from "react";
import {
  createWeeklySteps,
  updateWeeklySteps,
} from "@/lib/actions/weekly";
import { useRouter } from "next/navigation";
import type { WeeklyStepWithQuestions } from "@/lib/types";

type WeeklyFormProps =
  | { mode: "create"; nextWeekNumber: number }
  | { mode: "edit"; week: WeeklyStepWithQuestions };

export function WeeklyForm(props: WeeklyFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const isEdit = props.mode === "edit";
  const week = isEdit ? props.week : null;
  const q1 = week?.engagement_questions.find((q) => q.question_number === 1);
  const q2 = week?.engagement_questions.find((q) => q.question_number === 2);

  function onSubmit(formData: FormData) {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const result = isEdit
        ? await updateWeeklySteps(formData)
        : await createWeeklySteps(formData);

      if (result?.error) {
        setError(result.error);
        return;
      }

      if (isEdit) {
        setMessage("Week saved.");
        router.refresh();
        return;
      }

      router.push("/steps");
      router.refresh();
    });
  }

  const fieldClass =
    "min-h-11 w-full rounded-xl border border-line bg-bg-elevated px-3.5 py-2.5 outline-none ring-accent/30 transition focus:ring-2";

  return (
    <form action={onSubmit} className="space-y-5">
      {isEdit && <input type="hidden" name="week_id" value={week!.id} />}

      <label className="block space-y-1.5">
        <span className="text-sm font-medium">Week number</span>
        <input
          name="week_number"
          type="number"
          min={1}
          required
          defaultValue={
            isEdit ? week!.week_number : props.nextWeekNumber
          }
          className={fieldClass}
        />
      </label>

      <div className="grid gap-5 sm:grid-cols-2">
        <label className="block space-y-1.5 sm:col-span-2">
          <span className="text-sm font-medium">Scripture reference</span>
          <input
            name="scripture_reference"
            required
            placeholder="e.g. Philippians 4:6-7"
            defaultValue={week?.scripture_reference || ""}
            className={fieldClass}
          />
        </label>
        <label className="block space-y-1.5 sm:col-span-2">
          <span className="text-sm font-medium">Scripture text</span>
          <textarea
            name="scripture_text"
            required
            rows={4}
            defaultValue={week?.scripture_text || ""}
            className={fieldClass}
          />
        </label>
      </div>

      <label className="block space-y-1.5">
        <span className="text-sm font-medium">Theme title</span>
        <input
          name="theme_title"
          required
          defaultValue={week?.theme_title || ""}
          className={fieldClass}
        />
      </label>

      <label className="block space-y-1.5">
        <span className="text-sm font-medium">Nugget</span>
        <textarea
          name="nugget_text"
          required
          rows={3}
          defaultValue={week?.nugget_text || ""}
          className={fieldClass}
        />
      </label>

      <label className="block space-y-1.5">
        <span className="text-sm font-medium">Engagement question 1</span>
        <textarea
          name="question_1"
          required
          rows={2}
          defaultValue={q1?.question_text || ""}
          className={fieldClass}
        />
      </label>

      <label className="block space-y-1.5">
        <span className="text-sm font-medium">Engagement question 2</span>
        <textarea
          name="question_2"
          required
          rows={2}
          defaultValue={q2?.question_text || ""}
          className={fieldClass}
        />
      </label>

      <label className="block space-y-1.5">
        <span className="text-sm font-medium">Share prompt</span>
        <textarea
          name="share_prompt"
          rows={2}
          defaultValue={
            week?.share_prompt ||
            "Share one way you will live out this week's theme."
          }
          className={fieldClass}
        />
      </label>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-danger" role="alert">
          {error}
        </p>
      )}
      {message && (
        <p className="rounded-lg bg-accent-soft px-3 py-2 text-sm text-accent" role="status">
          {message}
        </p>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <button
          type="submit"
          disabled={pending}
          className="min-h-12 rounded-xl bg-accent px-5 py-3 font-semibold text-white transition hover:brightness-110 disabled:opacity-60"
        >
          {pending
            ? isEdit
              ? "Saving…"
              : "Publishing…"
            : isEdit
              ? "Save changes"
              : "Publish weekly S.T.E.P.S."}
        </button>
        {isEdit && (
          <button
            type="button"
            onClick={() => router.push(`/weeks/${week!.id}`)}
            className="min-h-12 rounded-xl border border-line px-5 py-3 font-medium text-ink-muted transition hover:bg-accent-soft hover:text-ink"
          >
            View week
          </button>
        )}
      </div>
    </form>
  );
}

/** @deprecated Prefer WeeklyForm - kept for existing imports */
export function CreateWeeklyForm({ nextWeekNumber }: { nextWeekNumber: number }) {
  return <WeeklyForm mode="create" nextWeekNumber={nextWeekNumber} />;
}
