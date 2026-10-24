"use client";

import Link from "next/link";
import { useState } from "react";

import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { usePerfil } from "@/context/ProfileContext";

export default function InicioSesionPage() {
  const { signInWithGoogle, signInWithApple, signInWithEmail } = usePerfil() as any;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleGoogle = async () => {
    if (signInWithGoogle) await signInWithGoogle();
  };
  const handleApple = async () => {
    if (signInWithApple) await signInWithApple();
  };
  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (signInWithEmail) await signInWithEmail(email, password);
  };

  return (
    <>
      <SiteHeader />
      <main className="profile-page">
        <div className="container">
          <header className="profile-header">
            <div>
              <p className="profile-eyebrow">Iniciar Sesión</p>
              <h1 className="profile-title">Bienvenido de nuevo</h1>
              <p className="profile-email">
                Ingresa tus datos para acceder al Círculo y ver tus pedidos y
                lanzamientos privados.
              </p>
            </div>
          </header>

          <div className="crear-perfil">
            <div className="auth-buttons">
              <button type="button" className="auth-btn" onClick={handleGoogle}>
                <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fill="#4285F4"
                    d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.4a5.5 5.5 0 0 1-2.4 3.6v3h3.9c2.3-2.1 3.6-5.2 3.6-8.8Z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.2 0 5.9-1.1 7.9-2.9l-3.9-3c-1.1.7-2.4 1.2-4 1.2-3.1 0-5.7-2-6.6-4.8H1.4v3A12 12 0 0 0 12 24Z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.4 14.5a7.2 7.2 0 0 1 0-4.6V7H1.4a12 12 0 0 0 0 10.4l4-3Z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.7c1.8 0 3.3 .6 4.6 1.8l3.4-3.4C17.9 1.2 15.2 0 12 0A12 12 0 0 0 1.4 7l4 3c.9-2.9 3.5-5.3 6.6-5.3Z"
                  />
                </svg>
                <span>Continuar con Google</span>
              </button>
              <button type="button" className="auth-btn auth-btn--apple" onClick={handleApple}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M16.4 12.6c0-2 1.6-3 1.7-3.1-1-1.4-2.4-1.5-2.9-1.6-1.2-.1-2.4.7-3 .7-.6 0-1.6-.7-2.6-.7-1.3 0-2.6.8-3.2 2-1.4 2.4-.4 5.9 1 7.8.7.9 1.5 2 2.5 1.9 1-.1 1.4-.6 2.6-.6 1.2 0 1.5.6 2.6.6 1.1 0 1.7-1 2.4-1.9.7-1.1 1-2.1 1-2.2 0 0-2-1-2-3.9ZM14.4 6.6c.5-.7.9-1.6.8-2.6-.8 0-1.8.6-2.4 1.2-.5.6-1 1.5-.8 2.5.9.1 1.8-.4 2.4-1.1Z" />
                </svg>
                <span>Continuar con Apple</span>
              </button>
            </div>

            <p className="auth-pending">
              El inicio de sesión con Google y Apple se habilita en la siguiente
              fase. Deja tu correo y contraseña para entrar.
            </p>

            <div className="auth-divider">
              <span>o inicia sesión con tu correo</span>
            </div>

            <form className="auth-form" onSubmit={handleEmail} noValidate>
              <label className="form-field">
                <span className="form-label">Email</span>
                <input
                  className="form-input"
                  type="email"
                  placeholder="tu@email.com"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </label>
              <label className="form-field">
                <span className="form-label">Contraseña</span>
                <input
                  className="form-input"
                  type="password"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </label>
              <button type="submit" className="pdp-add-btn">
                Iniciar sesión
              </button>
              <p className="auth-note">
                ¿No tienes perfil?{" "}
                <Link href="/crear-perfil">Crea tu perfil aquí</Link>.
              </p>
            </form>
          </div>

          <div className="profile-gate-actions">
            <Link href="/coleccion/soberbia" className="cta-btn">
              Ver la Colección
            </Link>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
