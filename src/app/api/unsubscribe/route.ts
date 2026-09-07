import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { createServiceClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

function verifyToken(userId: string, token: string) {
  const secret = process.env.CRON_SECRET || process.env.UNSUBSCRIBE_SECRET || "";
  const expected = createHmac("sha256", secret)
    .update(userId)
    .digest("hex")
    .slice(0, 32);

  try {
    return timingSafeEqual(Buffer.from(expected), Buffer.from(token));
  } catch {
    return false;
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const uid = searchParams.get("uid");
  const token = searchParams.get("token");

  if (!uid || !token || !verifyToken(uid, token)) {
    return new NextResponse("Invalid unsubscribe link.", { status: 400 });
  }

  const supabase = await createServiceClient();
  const { error } = await supabase
    .from("users")
    .update({ email_opt_in: false })
    .eq("id", uid);

  if (error) {
    return new NextResponse("Unable to unsubscribe right now.", { status: 500 });
  }

  return new NextResponse(
    `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Unsubscribed</title></head>
    <body style="font-family:system-ui;max-width:32rem;margin:3rem auto;padding:0 1rem;color:#1a2e24">
      <h1 style="color:#1f5c45">You're unsubscribed</h1>
      <p>You will no longer receive weekly S.T.E.P.S. reminder emails. You can re-enable them anytime from your profile.</p>
    </body></html>`,
    {
      status: 200,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    }
  );
}
