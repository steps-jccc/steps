import { redirect } from "next/navigation";
import { AppNav } from "@/components/app-nav";
import { WeeklyForm } from "@/components/weekly-form";
import { getCurrentProfile, listWeeklySteps } from "@/lib/data";

export default async function AdminCreatePage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (profile.role !== "ADMIN") redirect("/steps");

  const weeks = await listWeeklySteps();
  const nextWeekNumber =
    weeks.length > 0 ? Math.max(...weeks.map((w) => w.week_number)) + 1 : 1;

  return (
    <>
      <AppNav profile={profile} />
      <main className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
        <p className="section-label">Admin</p>
        <h1 className="mt-2 font-serif text-3xl font-semibold tracking-tight">
          Create weekly S.T.E.P.S.
        </h1>
        <p className="mt-2 text-sm text-ink-muted">
          Publish Scripture, Theme, Nugget, and two engagement questions in one
          step. To change an existing week, open Archive and click Edit.
        </p>
        <div className="surface mt-8 p-5 sm:p-7">
          <WeeklyForm mode="create" nextWeekNumber={nextWeekNumber} />
        </div>
      </main>
    </>
  );
}
