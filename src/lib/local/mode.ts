export function isLocalMode() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  return (
    process.env.USE_LOCAL_AUTH === "true" ||
    url.includes("placeholder.supabase.co") ||
    !url
  );
}
