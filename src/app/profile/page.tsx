import { redirect } from "next/navigation";
import { AppNav } from "@/components/app-nav";
import { ProfileForm } from "@/components/profile-form";
import { getCurrentProfile } from "@/lib/data";

export default async function ProfilePage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  return (
    <>
      <AppNav profile={profile} />
      <main className="mx-auto max-w-lg px-4 py-10 sm:px-6">
        <h1 className="font-serif text-3xl font-semibold tracking-tight">
          Your profile
        </h1>
        <p className="mt-2 text-sm text-ink-muted">
          {profile.email} · Role: {profile.role}
        </p>
        <div className="surface mt-8 p-5 sm:p-6">
          <ProfileForm profile={profile} />
        </div>
      </main>
    </>
  );
}
