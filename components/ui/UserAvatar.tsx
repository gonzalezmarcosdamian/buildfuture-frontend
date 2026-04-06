"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export function UserAvatar() {
  const [initial, setInitial] = useState<string>("·");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const user = data.session?.user;
      if (!user) return;
      const name = (user.user_metadata?.full_name as string) ?? "";
      const derived = (name || user.email || "?")[0].toUpperCase();
      setInitial(derived);
    });
  }, []);

  return (
    <Link
      href="/settings"
      className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-sm font-bold text-white hover:bg-blue-500 transition-colors"
    >
      {initial}
    </Link>
  );
}
