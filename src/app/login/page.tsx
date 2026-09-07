import Link from "next/link";
import { AuthForm } from "@/components/auth-form";

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-screen min-h-dvh max-w-md flex-col justify-center px-4 py-8 sm:py-12">
      <div className="surface animate-fade-up p-5 sm:p-8">
        <p className="font-serif text-3xl font-semibold tracking-tight text-accent">
          S.T.E.P.S.
        </p>
        <h1 className="mt-3 text-xl font-semibold text-ink">Welcome back</h1>
        <p className="mt-2 text-sm text-ink-muted">
          Sign in to get your S.T.E.P.S. in this week.
        </p>

        <div className="mt-6">
          <AuthForm mode="login" />
        </div>
        <p className="mt-5 text-center text-sm text-ink-muted">
          New here?{" "}
          <Link href="/signup" className="font-semibold text-accent hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </main>
  );
}
