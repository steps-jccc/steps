import { NextResponse } from "next/server";
import { Resend } from "resend";
import { render } from "@react-email/components";
import { WeeklyReminderEmail } from "@/emails/weekly-reminder";
import { createServiceClient } from "@/lib/supabase/server";
import { scriptureSnippet } from "@/lib/utils";
import { createHmac } from "crypto";

export const runtime = "nodejs";

function unsubscribeToken(userId: string) {
  const secret = process.env.CRON_SECRET || process.env.UNSUBSCRIBE_SECRET || "";
  return createHmac("sha256", secret).update(userId).digest("hex").slice(0, 32);
}

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json(
      { error: "RESEND_API_KEY is not configured" },
      { status: 500 }
    );
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const fromEmail =
    process.env.RESEND_FROM_EMAIL || "S.T.E.P.S. <onboarding@resend.dev>";

  const supabase = await createServiceClient();

  const { data: week, error: weekError } = await supabase
    .from("weekly_steps")
    .select("*")
    .order("week_number", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (weekError) {
    return NextResponse.json({ error: weekError.message }, { status: 500 });
  }

  if (!week) {
    return NextResponse.json({ ok: true, sent: 0, message: "No week published" });
  }

  const { data: users, error: usersError } = await supabase
    .from("users")
    .select("id, email, display_name")
    .eq("email_opt_in", true)
    .eq("email_bounced", false)
    .not("email", "is", null);

  if (usersError) {
    return NextResponse.json({ error: usersError.message }, { status: 500 });
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  let sent = 0;
  const failures: string[] = [];

  for (const user of users || []) {
    if (!user.email) continue;

    const token = unsubscribeToken(user.id);
    const unsubscribeUrl = `${appUrl}/api/unsubscribe?uid=${user.id}&token=${token}`;
    const weekUrl = `${appUrl}/steps`;

    try {
      const html = await render(
        WeeklyReminderEmail({
          displayName: user.display_name,
          themeTitle: week.theme_title,
          scriptureReference: week.scripture_reference,
          scriptureSnippet: scriptureSnippet(week.scripture_text),
          weekUrl,
          unsubscribeUrl,
        })
      );

      const { error } = await resend.emails.send({
        from: fromEmail,
        to: user.email,
        subject: `Get your S.T.E.P.S. in this week - ${week.theme_title}`,
        html,
      });

      if (error) {
        failures.push(`${user.email}: ${error.message}`);
      } else {
        sent += 1;
      }
    } catch (err) {
      failures.push(
        `${user.email}: ${err instanceof Error ? err.message : "unknown error"}`
      );
    }
  }

  return NextResponse.json({ ok: true, sent, failures });
}
