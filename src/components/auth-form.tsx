"use client";

import { useState, useTransition } from "react";
import { signIn, signUp } from "@/lib/actions/auth";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      try {
        const result =
          mode === "login" ? await signIn(formData) : await signUp(formData);
        if (result?.error) setError(result.error);
      } catch (err) {
        // Next.js redirect() throws; ignore successful navigations.
        const digest =
          err && typeof err === "object" && "digest" in err
            ? String((err as { digest?: string }).digest)
            : "";
        if (digest.startsWith("NEXT_REDIRECT")) return;
        setError(err instanceof Error ? err.message : "Something went wrong.");
      }
    });
  }

  return (
    <form action={onSubmit} className="space-y-4">
      {mode === "signup" && (
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-ink">Display name</span>
          <input
            name="display_name"
            required
            autoComplete="name"
            placeholder="How others will see you"
            className="min-h-11 w-full rounded-xl border border-line bg-bg-elevated px-3.5 py-2.5 outline-none ring-accent/30 transition focus:ring-2"
          />
        </label>
      )}
      <label className="block space-y-1.5">
        <span className="text-sm font-medium text-ink">Email</span>
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          className="min-h-11 w-full rounded-xl border border-line bg-bg-elevated px-3.5 py-2.5 outline-none ring-accent/30 transition focus:ring-2"
        />
      </label>
      <label className="block space-y-1.5">
        <span className="text-sm font-medium text-ink">Password</span>
        <input
          name="password"
          type="password"
          required
          minLength={6}
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          className="min-h-11 w-full rounded-xl border border-line bg-bg-elevated px-3.5 py-2.5 outline-none ring-accent/30 transition focus:ring-2"
        />
      </label>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-danger" role="alert">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="min-h-12 w-full rounded-xl bg-accent px-4 py-3 font-semibold text-white transition hover:brightness-110 disabled:opacity-60"
      >
        {pending
          ? "Please wait…"
          : mode === "login"
            ? "Sign in"
            : "Create account"}
      </button>
    </form>
  );
}
