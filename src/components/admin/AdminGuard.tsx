"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ok, setOk] = useState(false);

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const { data: profile } = await supabase
            .from("admins")
            .select("role")
            .eq("id", session.user.id)
            .single();
          if (profile && (profile.role === "superadmin" || profile.role === "admin")) {
            setOk(true);
            return;
          }
        }
      } catch {
        // ignore
      }
      router.replace("/admin/login");
    };
    checkAdmin();
  }, [router]);

  if (!ok) return null;
  return <>{children}</>;
}
