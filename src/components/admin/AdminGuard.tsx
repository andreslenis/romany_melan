"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ok, setOk] = useState(false);

  useEffect(() => {
    const isAdmin = typeof window !== "undefined" && localStorage.getItem("admin") === "true";
    if (!isAdmin) {
      router.push("/admin/login");
    } else {
      setOk(true);
    }
  }, [router]);

  if (!ok) return null;
  return <>{children}</>;
}
