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
          setOk(true);
          return;
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
