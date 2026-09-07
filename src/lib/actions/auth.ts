"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isLocalMode } from "@/lib/local/mode";
import {
  clearLocalSession,
  getLocalSessionProfile,
  setLocalSession,
} from "@/lib/local/session";
import {
  localSignIn,
  localSignUp,
  localUpdateProfile,
} from "@/lib/local/store";

export async function signUp(formData: FormData) {
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  const displayName = String(formData.get("display_name") || "").trim();

  if (!email || !password || !displayName) {
    return { error: "All fields are required." };
  }

  if (isLocalMode()) {
    const result = localSignUp({ email, password, displayName });
    if ("error" in result && result.error) return { error: result.error };
    await setLocalSession(result.user!.id);
    redirect("/steps");
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: displayName } },
    });
    if (error) return { error: error.message };
  } catch (err) {
    const message =
      err instanceof Error && err.message.includes("fetch")
        ? "Cannot reach Supabase. Check NEXT_PUBLIC_SUPABASE_URL in .env.local (or use local mode)."
        : err instanceof Error
          ? err.message
          : "Signup failed.";
    return { error: message };
  }

  redirect("/steps");
}

export async function signIn(formData: FormData) {
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  if (isLocalMode()) {
    const result = localSignIn(email, password);
    if ("error" in result && result.error) return { error: result.error };
    await setLocalSession(result.user!.id);
    redirect("/steps");
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) return { error: error.message };
  } catch (err) {
    const message =
      err instanceof Error && err.message.includes("fetch")
        ? "Cannot reach Supabase. Check NEXT_PUBLIC_SUPABASE_URL in .env.local."
        : err instanceof Error
          ? err.message
          : "Sign in failed.";
    return { error: message };
  }

  redirect("/steps");
}

export async function signOut() {
  if (isLocalMode()) {
    await clearLocalSession();
    redirect("/login");
  }

  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function updateProfile(formData: FormData) {
  const displayName = String(formData.get("display_name") || "").trim();
  const emailOptIn = formData.get("email_opt_in") === "on";

  if (!displayName) return { error: "Display name is required." };

  if (isLocalMode()) {
    const profile = await getLocalSessionProfile();
    if (!profile) return { error: "Not authenticated." };
    return localUpdateProfile(profile.id, {
      display_name: displayName,
      email_opt_in: emailOptIn,
    });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const { error } = await supabase
    .from("users")
    .update({ display_name: displayName, email_opt_in: emailOptIn })
    .eq("id", user.id);

  if (error) return { error: error.message };
  return { success: true };
}
