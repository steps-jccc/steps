import Link from "next/link";
import { CommentThread } from "@/components/comment-thread";
import { PrayerSection } from "@/components/prayer-section";
import type {
  CommentNode,
  PrayerRequest,
  Profile,
  WeeklyStepWithQuestions,
} from "@/lib/types";

export function StepsView({
  week,
  profile,
  threads,
  prayers,
}: {
  week: WeeklyStepWithQuestions;
  profile: Profile;
  threads: Record<string, CommentNode[]>;
  prayers: (PrayerRequest & { display_name: string })[];
}) {
  const isAdmin = profile.role === "ADMIN";
  const q1 = week.engagement_questions.find((q) => q.question_number === 1);
  const q2 = week.engagement_questions.find((q) => q.question_number === 2);

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-6 sm:space-y-8 sm:px-6 sm:py-10">
      <header className="animate-fade-up">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="section-label">Week {week.week_number}</p>
          {isAdmin && (
            <Link
              href={`/admin/edit/${week.id}`}
              className="inline-flex min-h-10 items-center rounded-lg border border-line bg-bg-elevated px-3 py-1.5 text-sm font-medium text-accent transition hover:bg-accent-soft"
            >
              Edit week
            </Link>
          )}
        </div>
        <h1 className="mt-3 font-serif text-[2rem] font-semibold leading-tight tracking-tight text-ink sm:text-5xl">
          {week.theme_title}
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-ink-muted">
          Walk through Scripture, Theme, Engagement, Prayer, and Share - get your
          S.T.E.P.S. in this week.
        </p>
        <nav
          aria-label="S.T.E.P.S. sections"
          className="mt-5 flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-ink-muted"
        >
          {[
            ["#scripture", "Scripture"],
            ["#theme", "Theme"],
            ["#engagement", "Engage"],
            ["#prayer", "Prayer"],
            ["#share", "Share"],
          ].map(([href, label]) => (
            <a
              key={href}
              href={href}
              className="inline-flex min-h-10 items-center rounded-full border border-line bg-bg-elevated px-3 py-1.5 transition hover:border-accent/40 hover:bg-accent-soft hover:text-accent"
            >
              {label}
            </a>
          ))}
        </nav>
      </header>

      <section id="scripture" className="surface animate-fade-up p-5 sm:p-7">
        <p className="section-label">
          <span aria-hidden="true">S</span> Scripture
        </p>
        <p className="mt-3 text-sm font-semibold tracking-wide text-amber">
          {week.scripture_reference}
        </p>
        <blockquote className="prose-scripture mt-4">{week.scripture_text}</blockquote>
      </section>

      <section id="theme" className="surface animate-fade-up-delay p-5 sm:p-7">
        <p className="section-label">
          <span aria-hidden="true">T</span> Theme
        </p>
        <h2 className="mt-2 font-serif text-2xl font-semibold text-ink">
          {week.theme_title}
        </h2>
        <p className="mt-4 whitespace-pre-wrap text-[1.05rem] leading-relaxed text-ink">
          {week.nugget_text}
        </p>
      </section>

      <section id="engagement" className="space-y-6">
        <div className="px-1">
          <p className="section-label">
            <span aria-hidden="true">E</span> Engagement
          </p>
          <h2 className="mt-2 font-serif text-2xl font-semibold text-ink">
            Reflect together
          </h2>
        </div>

        {[q1, q2].filter(Boolean).map((question, index) => (
          <article
            key={question!.id}
            className="surface animate-fade-up-delay p-5 sm:p-7"
          >
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-ink-muted">
              Question {index + 1}
            </p>
            <h3 className="mt-2 font-serif text-xl font-semibold leading-snug text-ink">
              {question!.question_text}
            </h3>
            <CommentThread
              questionId={question!.id}
              weekId={week.id}
              comments={threads[question!.id] || []}
              currentUserId={profile.id}
              isAdmin={isAdmin}
            />
          </article>
        ))}
      </section>

      <PrayerSection
        weekId={week.id}
        prayers={prayers}
        currentUserId={profile.id}
        isAdmin={isAdmin}
      />

      <section id="share" className="surface animate-fade-up-delay-2 p-5 sm:p-7">
        <p className="section-label">
          <span aria-hidden="true">S</span> Share
        </p>
        <h2 className="mt-2 font-serif text-2xl font-semibold text-ink">
          Live it out
        </h2>
        <p className="mt-3 max-w-prose text-[1.05rem] leading-relaxed text-ink">
          {week.share_prompt}
        </p>
        <p className="mt-4 rounded-xl bg-amber-soft/70 px-4 py-3 text-sm leading-relaxed text-ink">
          Use the engagement threads above to share your commitment with the
          group, or reply to a peer who inspired you.
        </p>
      </section>
    </div>
  );
}
