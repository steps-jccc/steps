import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isLocalMode } from "@/lib/local/mode";
import { getLocalSessionProfile } from "@/lib/local/session";

export default async function HomePage() {
  if (isLocalMode()) {
    const profile = await getLocalSessionProfile();
    redirect(profile ? "/steps" : "/login");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  redirect(user ? "/steps" : "/login");
}
