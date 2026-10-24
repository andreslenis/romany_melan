"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

const ADMIN_EMAIL = "superadmin@romany.com";
const ADMIN_PASSWORD = "Romany2026!";

export default function AdminLogin() {
  const [email, setEmail] = useState(ADMIN_EMAIL);
  const [password, setPassword] = useState(ADMIN_PASSWORD);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
        localStorage.setItem("admin", "true");
        router.push("/admin/dashboard");
        setLoading(false);
        return;
      }
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        alert("Credenciales inválidas");
        setLoading(false);
        return;
      }
      if (data.session) {
        localStorage.setItem("admin", "true");
        router.push("/admin/dashboard");
      }
    } catch {
      alert("Credenciales inválidas");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SiteHeader />
      <main className="profile-page">
        <div className="container" style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <header className="profile-header" style={{ width: "min(520px, 100%)", justifyContent: "center" }}>
            <div style={{ textAlign: "center" }}>
              <p className="profile-eyebrow">Acceso Privado</p>
              <h1 className="profile-title">Panel de Administración</h1>
              <p className="profile-email">Accede al gestor de Romany Melan</p>
            </div>
          </header>

          <div className="crear-perfil">
            <form className="auth-form" onSubmit={submit} noValidate>
              <label className="form-field">
                <span className="form-label">Correo Electrónico</span>
                <input
                  className="form-input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="superadmin@romany.com"
                  autoComplete="email"
                  required
                />
              </label>
              <label className="form-field">
                <span className="form-label">Contraseña</span>
                <input
                  className="form-input"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Romany2026!"
                  autoComplete="current-password"
                  required
                />
              </label>
              <button type="submit" className="pdp-add-btn" disabled={loading}>
                {loading ? "Ingresando..." : "Iniciar Sesión"}
              </button>
            </form>
            <div style={{ display: "flex", justifyContent: "center", gap: "1rem" }}>
              <button onClick={() => router.back()} className="cta-btn" style={{ fontSize: "0.75rem", padding: "0.6rem 1.5rem" }}>
                Volver Atrás
              </button>
              <Link href="/" className="cta-btn" style={{ fontSize: "0.75rem", padding: "0.6rem 1.5rem" }}>
                Ir al Inicio
              </Link>
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
