import { cookies } from "next/headers";
import { signSession, verifySession } from "@/lib/local/store";
import type { Profile } from "@/lib/types";

export const LOCAL_SESSION_COOKIE = "steps_local_session";

export async function setLocalSession(userId: string) {
  const jar = await cookies();
  jar.set(LOCAL_SESSION_COOKIE, signSession(userId), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearLocalSession() {
  const jar = await cookies();
  jar.delete(LOCAL_SESSION_COOKIE);
}

export async function getLocalSessionProfile(): Promise<Profile | null> {
  const jar = await cookies();
  return verifySession(jar.get(LOCAL_SESSION_COOKIE)?.value);
}
