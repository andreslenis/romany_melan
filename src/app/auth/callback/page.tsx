"use client";

import Link from "next/link";
import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { supabase } from "@/lib/supabase/client";

const MENSAJES: Record<string, string> = {
  missing_code: "No recibimos la respuesta del proveedor. Inténtalo de nuevo.",
  exchange_failed: "No pudimos completar el inicio de sesión. Inténtalo de nuevo.",
  access_denied: "Cancelaste el inicio de sesión o el proveedor lo rechazó.",
  server_misconfigured: "El inicio de sesión no está configurado en el servidor.",
};

/** Solo permite redirecciones internas (evita open redirect). */
function safeNext(next: string | null): string {
  if (!next) return "/mi-perfil";
  if (!next.startsWith("/") || next.startsWith("//")) return "/mi-perfil";
  return next;
}

function CallbackInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const enCurso = useRef(false);

  useEffect(() => {
    if (enCurso.current) return;
    enCurso.current = true;

    const next = safeNext(searchParams.get("next"));
    const code = searchParams.get("code");
    // Los proveedores devuelven errores en el fragmento (#error=...). Hay que
    // leerlos antes de que supabase-js limpie el hash al procesar el callback.
    const errorHash =
      typeof window !== "undefined"
        ? new URLSearchParams(window.location.hash.slice(1)).get("error")
        : null;

    if (errorHash) {
      setErrorKey(MENSAJES[errorHash] ? errorHash : "exchange_failed");
      return;
    }

    const redirigir = () => router.replace(next);

    const sincronizarPerfil = async (accessToken: string) => {
      try {
        await fetch("/api/auth/profile-sync", {
          method: "POST",
          headers: { authorization: `Bearer ${accessToken}` },
        });
      } catch {
        // El perfil espejo es best-effort: no bloquea el inicio de sesión.
      }
    };

    const ejecutar = async () => {
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        setErrorKey("server_misconfigured");
        return;
      }

      // Con el flujo implícito (por defecto en supabase-js), los tokens llegan
      // en el fragmento de la URL y la propia librería los procesa al iniciar.
      const { data: sesion } = await supabase.auth.getSession();
      if (sesion.session?.access_token) {
        await sincronizarPerfil(sesion.session.access_token);
        redirigir();
        return;
      }

      if (code) {
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);
        if (error || !data.session) {
          console.error("[auth/callback] exchange falló", error?.message);
          setErrorKey("exchange_failed");
          return;
        }
        await sincronizarPerfil(data.session.access_token);
        redirigir();
        return;
      }

      setErrorKey("missing_code");
    };

    void ejecutar();
  }, [router, searchParams]);

  return (
    <main className="profile-page">
      <div className="container">
        {errorKey ? (
          <>
            <header className="profile-header">
              <div>
                <p className="profile-eyebrow">Iniciar Sesión</p>
                <h1 className="profile-title">No se pudo completar el inicio</h1>
                <p className="profile-email">{MENSAJES[errorKey] ?? MENSAJES.missing_code}</p>
              </div>
            </header>
            <div className="profile-gate-actions">
              <Link href="/inicio-sesion" className="cta-btn">
                Volver a iniciar sesión
              </Link>
            </div>
          </>
        ) : (
          <header className="profile-header">
            <div>
              <p className="profile-eyebrow">Iniciar Sesión</p>
              <h1 className="profile-title">Conectando tu cuenta…</h1>
              <p className="profile-email">Estamos verificando tu sesión, un momento.</p>
            </div>
          </header>
        )}
      </div>
    </main>
  );
}

export default function AuthCallbackPage() {
  return (
    <>
      <SiteHeader />
      <Suspense
        fallback={
          <main className="profile-page">
            <div className="container">
              <header className="profile-header">
                <div>
                  <p className="profile-eyebrow">Iniciar Sesión</p>
                  <h1 className="profile-title">Conectando tu cuenta…</h1>
                </div>
              </header>
            </div>
          </main>
        }
      >
        <CallbackInner />
      </Suspense>
      <SiteFooter />
    </>
  );
}