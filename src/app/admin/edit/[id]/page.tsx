import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AppNav } from "@/components/app-nav";
import { WeeklyForm } from "@/components/weekly-form";
import { getCurrentProfile, getWeeklyStepById } from "@/lib/data";

export function generateStaticParams() {
  return [{ id: "preview" }];
}

export const dynamicParams = false;

export default async function AdminEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (profile.role !== "ADMIN") redirect("/steps");

  const week = await getWeeklyStepById(id);
  if (!week) notFound();

  return (
    <>
      <AppNav profile={profile} />
      <main className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
        <p className="section-label">Admin</p>
        <h1 className="mt-2 font-serif text-3xl font-semibold tracking-tight">
          Edit week {week.week_number}
        </h1>
        <p className="mt-2 text-sm text-ink-muted">
          Update the title, scripture, nugget, questions, or share prompt.
          Existing comments and prayers stay attached to this week.
        </p>
        <p className="mt-3 text-sm">
          <Link href="/weeks" className="font-medium text-accent hover:underline">
            &larr; Back to archive
          </Link>
        </p>
        <div className="surface mt-8 p-5 sm:p-7">
          <WeeklyForm mode="edit" week={week} />
        </div>
      </main>
    </>
  );
}
