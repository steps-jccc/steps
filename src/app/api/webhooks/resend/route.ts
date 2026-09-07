import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

/**
 * Resend bounce webhook.
 * Configure in Resend dashboard → Webhooks → email.bounced
 * Optionally protect with RESEND_WEBHOOK_SECRET header check.
 */
export async function POST(request: Request) {
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  if (secret) {
    const header = request.headers.get("x-resend-signature") ||
      request.headers.get("authorization");
    if (header !== secret && header !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  let payload: {
    type?: string;
    data?: { to?: string[] | string; email?: string };
  };

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const type = payload.type || "";
  if (!type.includes("bounce") && type !== "email.bounced") {
    return NextResponse.json({ ok: true, ignored: true });
  }

  const to = payload.data?.to;
  const email =
    payload.data?.email ||
    (Array.isArray(to) ? to[0] : typeof to === "string" ? to : null);

  if (!email) {
    return NextResponse.json({ error: "No email in payload" }, { status: 400 });
  }

  const supabase = await createServiceClient();
  const { error } = await supabase
    .from("users")
    .update({ email_bounced: true, email_opt_in: false })
    .eq("email", email);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
