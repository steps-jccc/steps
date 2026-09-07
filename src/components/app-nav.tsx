"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useDevice } from "@/components/device-provider";
import { signOut } from "@/lib/actions/auth";
import type { Profile } from "@/lib/types";
import { cn } from "@/lib/utils";

export function AppNav({ profile }: { profile: Profile }) {
  const pathname = usePathname();
  const device = useDevice();
  const isAdmin = profile.role === "ADMIN";
  const [open, setOpen] = useState(false);
  const firstName = profile.display_name.split(" ")[0];
  const compact = device.useCompactUi;

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // When resizing from phone → laptop/tablet, close the drawer automatically
  useEffect(() => {
    if (!compact) setOpen(false);
  }, [compact]);

  useEffect(() => {
    if (!open || !compact) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, compact]);

  const links = [
    { href: "/steps", label: "Current week" },
    { href: "/weeks", label: "Archive" },
    ...(isAdmin
      ? [
          { href: "/admin/create", label: "Create week" },
          { href: "/admin/moderate", label: "Moderate" },
        ]
      : []),
    { href: "/profile", label: "Profile" },
  ];

  return (
    <header
      className="sticky top-0 z-40 border-b border-line/80 bg-[color-mix(in_srgb,var(--bg)_82%,white)]/90 pt-[env(safe-area-inset-top)] backdrop-blur-md"
      data-nav-mode={compact ? "compact" : "full"}
    >
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Link href="/steps" className="group flex min-w-0 items-baseline gap-2">
          <span className="font-serif text-2xl font-semibold tracking-tight text-accent transition group-hover:opacity-80">
            S.T.E.P.S.
          </span>
          <span
            className={cn(
              "text-xs font-medium uppercase tracking-[0.16em] text-ink-muted",
              compact ? "hidden" : "inline"
            )}
          >
            Weekly Study
          </span>
        </Link>

        {/* Laptop / tablet: full horizontal nav */}
        {!compact && (
          <nav
            className="flex items-center gap-1 text-sm"
            aria-label="Primary"
          >
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-lg px-2.5 py-2 text-ink-muted transition hover:bg-accent-soft hover:text-ink",
                  pathname === link.href &&
                    "bg-accent-soft font-medium text-accent"
                )}
              >
                {link.label === "Current week"
                  ? "Current"
                  : link.label === "Create week"
                    ? "Create"
                    : link.label}
              </Link>
            ))}
            <form action={signOut}>
              <button
                type="submit"
                className="rounded-lg px-2.5 py-2 text-ink-muted transition hover:bg-accent-soft hover:text-ink"
              >
                Log out
              </button>
            </form>
          </nav>
        )}

        {/* Phone: hamburger */}
        {compact && (
          <button
            type="button"
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-line bg-bg-elevated text-ink"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((v) => !v)}
          >
            <span className="sr-only">{open ? "Close" : "Menu"}</span>
            <span aria-hidden="true" className="flex w-5 flex-col gap-1.5">
              <span
                className={cn(
                  "block h-0.5 w-full rounded-full bg-ink transition",
                  open && "translate-y-[7px] rotate-45"
                )}
              />
              <span
                className={cn(
                  "block h-0.5 w-full rounded-full bg-ink transition",
                  open && "opacity-0"
                )}
              />
              <span
                className={cn(
                  "block h-0.5 w-full rounded-full bg-ink transition",
                  open && "-translate-y-[7px] -rotate-45"
                )}
              />
            </span>
          </button>
        )}
      </div>

      {compact && open && (
        <div>
          <button
            type="button"
            className="fixed inset-0 z-40 bg-ink/25"
            aria-label="Close menu overlay"
            onClick={() => setOpen(false)}
          />
          <nav
            id="mobile-nav"
            className="absolute inset-x-0 top-full z-50 border-b border-line bg-bg-elevated px-4 py-3 shadow-lg"
            aria-label="Primary"
          >
            <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-[0.14em] text-ink-muted">
              Signed in as {firstName}
            </p>
            <ul className="space-y-1">
              {links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className={cn(
                      "flex min-h-12 items-center rounded-xl px-3 text-base font-medium text-ink transition hover:bg-accent-soft",
                      pathname === link.href && "bg-accent-soft text-accent"
                    )}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
              <li>
                <form action={signOut}>
                  <button
                    type="submit"
                    className="flex min-h-12 w-full items-center rounded-xl px-3 text-left text-base font-medium text-ink-muted transition hover:bg-accent-soft hover:text-ink"
                  >
                    Log out
                  </button>
                </form>
              </li>
            </ul>
          </nav>
        </div>
      )}
    </header>
  );
}
