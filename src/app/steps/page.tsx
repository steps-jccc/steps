import { redirect } from "next/navigation";
import { AppNav } from "@/components/app-nav";
import { StepsView } from "@/components/steps-view";
import {
  getCommentRows,
  getCurrentProfile,
  getLatestWeeklyStep,
  getPrayers,
} from "@/lib/data";
import { buildCommentTree } from "@/lib/utils";
import Link from "next/link";

export default async function StepsPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const week = await getLatestWeeklyStep();

  if (!week) {
    return (
      <>
        <AppNav profile={profile} />
        <main className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6">
          <p className="font-serif text-3xl font-semibold text-accent">S.T.E.P.S.</p>
          <h1 className="mt-4 text-2xl font-semibold">No week published yet</h1>
          <p className="mt-2 text-ink-muted">
            {profile.role === "ADMIN"
              ? "Create the first weekly template to get started."
              : "Check back soon - your leader is preparing this week's study."}
          </p>
          {profile.role === "ADMIN" && (
            <Link
              href="/admin/create"
              className="mt-6 inline-flex rounded-xl bg-accent px-5 py-3 font-semibold text-white"
            >
              Create weekly S.T.E.P.S.
            </Link>
          )}
        </main>
      </>
    );
  }

  const threads: Record<string, ReturnType<typeof buildCommentTree>> = {};
  for (const q of week.engagement_questions) {
    const rows = await getCommentRows(q.id);
    threads[q.id] = buildCommentTree(rows);
  }
  const prayers = await getPrayers(week.id);

  return (
    <>
      <AppNav profile={profile} />
      <main>
        <StepsView
          week={week}
          profile={profile}
          threads={threads}
          prayers={prayers}
        />
      </main>
    </>
  );
}
