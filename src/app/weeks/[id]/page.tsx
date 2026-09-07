import { notFound, redirect } from "next/navigation";
import { AppNav } from "@/components/app-nav";
import { StepsView } from "@/components/steps-view";
import {
  getCommentRows,
  getCurrentProfile,
  getPrayers,
  getWeeklyStepById,
} from "@/lib/data";
import { buildCommentTree } from "@/lib/utils";

export function generateStaticParams() {
  return [{ id: "preview" }];
}

export const dynamicParams = false;

export default async function WeekDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const week = await getWeeklyStepById(id);
  if (!week) notFound();

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
