import Link from "next/link";
import { redirect } from "next/navigation";
import { AppNav } from "@/components/app-nav";
import { getCurrentProfile, listWeeklySteps } from "@/lib/data";

export default async function WeeksPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const weeks = await listWeeklySteps();
  const isAdmin = profile.role === "ADMIN";

  return (
    <>
      <AppNav profile={profile} />
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-serif text-3xl font-semibold tracking-tight">
              Past weeks
            </h1>
            <p className="mt-2 text-sm text-ink-muted">
              Revisit previous S.T.E.P.S. studies and conversations.
            </p>
          </div>
          {isAdmin && (
            <Link
              href="/admin/create"
              className="rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white"
            >
              Create week
            </Link>
          )}
        </div>
        <ul className="mt-8 space-y-3">
          {weeks.length === 0 && (
            <li className="text-sm text-ink-muted">No weeks published yet.</li>
          )}
          {weeks.map((week) => (
            <li key={week.id} className="surface px-5 py-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <Link href={`/weeks/${week.id}`} className="min-w-0 flex-1">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-accent">
                    Week {week.week_number}
                  </p>
                  <p className="mt-1 font-serif text-xl font-semibold">
                    {week.theme_title}
                  </p>
                  <p className="mt-1 text-sm text-ink-muted">
                    {week.scripture_reference}
                  </p>
                </Link>
                {isAdmin && (
                  <Link
                    href={`/admin/edit/${week.id}`}
                    className="rounded-lg border border-line px-3 py-1.5 text-sm font-medium text-accent transition hover:bg-accent-soft"
                  >
                    Edit
                  </Link>
                )}
              </div>
            </li>
          ))}
        </ul>
      </main>
    </>
  );
}
