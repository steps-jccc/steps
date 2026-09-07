import { redirect } from "next/navigation";
import { AppNav } from "@/components/app-nav";
import { hidePrayer, deletePrayer } from "@/lib/actions/prayers";
import { getCurrentProfile } from "@/lib/data";
import { isLocalMode } from "@/lib/local/mode";
import { localListAllPrayers } from "@/lib/local/store";
import { createClient } from "@/lib/supabase/server";
import { formatDistanceToNow } from "date-fns";

export default async function ModeratePage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (profile.role !== "ADMIN") redirect("/steps");

  const prayers = isLocalMode()
    ? localListAllPrayers()
    : await (async () => {
        const supabase = await createClient();
        const { data } = await supabase
          .from("prayer_requests")
          .select(
            "*, users(display_name), weekly_steps(week_number, theme_title)"
          )
          .order("created_at", { ascending: false })
          .limit(50);
        return data || [];
      })();

  return (
    <>
      <AppNav profile={profile} />
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <p className="section-label">Admin</p>
        <h1 className="mt-2 font-serif text-3xl font-semibold tracking-tight">
          Prayer moderation
        </h1>
        <p className="mt-2 max-w-prose text-sm text-ink-muted">
          Hide or remove requests that expose third-party sensitive details
          without consent. Prefer gentle guidance over rewriting spiritual intent.
        </p>

        <ul className="mt-8 space-y-4">
          {prayers.length === 0 && (
            <li className="text-sm text-ink-muted">No prayer requests yet.</li>
          )}
          {prayers.map((prayer) => {
            const user = prayer.users as { display_name: string } | null;
            const week = prayer.weekly_steps as {
              week_number: number;
              theme_title: string;
            } | null;

            return (
              <li key={prayer.id} className="surface p-5">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="text-sm font-semibold">
                    {prayer.is_anonymous
                      ? `Anonymous (author: ${user?.display_name || "-"})`
                      : user?.display_name || "Member"}
                  </p>
                  <time
                    className="text-xs text-ink-muted"
                    dateTime={prayer.created_at}
                  >
                    {formatDistanceToNow(new Date(prayer.created_at), {
                      addSuffix: true,
                    })}
                  </time>
                </div>
                {week && (
                  <p className="mt-1 text-xs text-ink-muted">
                    Week {week.week_number} · {week.theme_title}
                  </p>
                )}
                <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed">
                  {prayer.content}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <form
                    action={async () => {
                      "use server";
                      await hidePrayer(prayer.id, !prayer.is_hidden);
                    }}
                  >
                    <button
                      type="submit"
                      className="rounded-lg border border-line px-3 py-1.5 text-sm hover:bg-accent-soft"
                    >
                      {prayer.is_hidden ? "Unhide" : "Hide"}
                    </button>
                  </form>
                  <form
                    action={async () => {
                      "use server";
                      await deletePrayer(prayer.id);
                    }}
                  >
                    <button
                      type="submit"
                      className="rounded-lg border border-line px-3 py-1.5 text-sm text-danger hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </form>
                  {prayer.is_hidden && (
                    <span className="self-center text-xs font-medium uppercase tracking-wide text-amber">
                      Hidden
                    </span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </main>
    </>
  );
}
