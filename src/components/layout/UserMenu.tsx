"use client";

import type { User } from "@supabase/supabase-js";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";

export function UserMenu() {
  const t = useTranslations();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [cargado, setCargado] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setCargado(true);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_evento, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  if (!cargado) return <div className="h-9 w-24" aria-hidden="true" />;

  if (!user) {
    return (
      <Link
        href="/login"
        className="rounded-full bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground hover:opacity-90"
      >
        {t("nav.login")}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      className="rounded-full border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-accent"
    >
      {t("auth.logout")}
    </button>
  );
}
