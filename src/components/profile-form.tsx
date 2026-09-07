"use client";

import { useState, useTransition } from "react";
import { updateProfile } from "@/lib/actions/auth";
import type { Profile } from "@/lib/types";

export function ProfileForm({ profile }: { profile: Profile }) {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(formData: FormData) {
    setMessage(null);
    setError(null);
    startTransition(async () => {
      const result = await updateProfile(formData);
      if (result?.error) setError(result.error);
      else setMessage("Profile saved.");
    });
  }

  return (
    <form action={onSubmit} className="space-y-4">
      <label className="block space-y-1.5">
        <span className="text-sm font-medium">Display name</span>
        <input
          name="display_name"
          required
          defaultValue={profile.display_name}
          className="w-full rounded-xl border border-line bg-bg-elevated px-3.5 py-2.5 outline-none ring-accent/30 focus:ring-2"
        />
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="email_opt_in"
          defaultChecked={profile.email_opt_in}
          className="size-4 accent-accent"
        />
        Email me weekly S.T.E.P.S. reminders
      </label>
      {profile.email_bounced && (
        <p className="rounded-lg bg-amber-soft px-3 py-2 text-sm text-ink">
          Your email was marked unreachable after a bounce. Update your address
          with an admin or contact support to resume reminders.
        </p>
      )}
      {error && (
        <p className="text-sm text-danger" role="alert">
          {error}
        </p>
      )}
      {message && (
        <p className="text-sm text-accent" role="status">
          {message}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
      >
        {pending ? "Saving…" : "Save profile"}
      </button>
    </form>
  );
}
