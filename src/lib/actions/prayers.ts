"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isLocalMode } from "@/lib/local/mode";
import { getLocalSessionProfile } from "@/lib/local/session";
import {
  localDeletePrayer,
  localHidePrayer,
  localPostPrayer,
} from "@/lib/local/store";

export async function postPrayer(formData: FormData) {
  const content = String(formData.get("content") || "").trim();
  const weekId = String(formData.get("week_id") || "");
  const isAnonymous = formData.get("is_anonymous") === "on";

  if (!content || !weekId) {
    return { error: "Prayer content is required." };
  }

  if (isLocalMode()) {
    const profile = await getLocalSessionProfile();
    if (!profile) return { error: "Not authenticated." };
    localPostPrayer({
      weekId,
      userId: profile.id,
      content,
      isAnonymous,
    });
    revalidatePath("/steps");
    revalidatePath(`/weeks/${weekId}`);
    return { success: true };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const { error } = await supabase.from("prayer_requests").insert({
    weekly_step_id: weekId,
    user_id: user.id,
    content,
    is_anonymous: isAnonymous,
  });

  if (error) return { error: error.message };

  revalidatePath("/steps");
  revalidatePath(`/weeks/${weekId}`);
  return { success: true };
}

export async function deletePrayer(prayerId: string, weekId?: string) {
  if (isLocalMode()) {
    const profile = await getLocalSessionProfile();
    if (!profile) return { error: "Not authenticated." };
    const result = localDeletePrayer(
      prayerId,
      profile.id,
      profile.role === "ADMIN"
    );
    if ("error" in result && result.error) return { error: result.error };
    revalidatePath("/steps");
    revalidatePath("/admin/moderate");
    if (weekId) revalidatePath(`/weeks/${weekId}`);
    return { success: true };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("prayer_requests")
    .delete()
    .eq("id", prayerId);

  if (error) return { error: error.message };

  revalidatePath("/steps");
  revalidatePath("/admin/moderate");
  if (weekId) revalidatePath(`/weeks/${weekId}`);
  return { success: true };
}

export async function hidePrayer(prayerId: string, hide = true) {
  if (isLocalMode()) {
    const profile = await getLocalSessionProfile();
    if (!profile || profile.role !== "ADMIN") {
      return { error: "Not allowed." };
    }
    const result = localHidePrayer(prayerId, hide);
    if ("error" in result && result.error) return { error: result.error };
    revalidatePath("/steps");
    revalidatePath("/admin/moderate");
    return { success: true };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("prayer_requests")
    .update({ is_hidden: hide })
    .eq("id", prayerId);

  if (error) return { error: error.message };

  revalidatePath("/steps");
  revalidatePath("/admin/moderate");
  return { success: true };
}
