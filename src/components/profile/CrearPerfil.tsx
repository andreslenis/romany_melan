"use client";

import { useState, type FormEvent } from "react";

import { usePerfil } from "@/context/ProfileContext";
import type { Perfil } from "@/lib/types";

type Proveedor = "google" | "apple";

const PROVEEDORES: {
  id: Proveedor;
  nombre: string;
  className: string;
  icono: React.ReactNode;
}[] = [
  {
    id: "google",
    nombre: "Continuar con Google",
    className: "auth-btn auth-btn--google",
    icono: (
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
          d="M12 4.7c1.8 0 3.3.6 4.6 1.8l3.4-3.4C17.9 1.2 15.2 0 12 0A12 12 0 0 0 1.4 7l4 3c.9-2.9 3.5-5.3 6.6-5.3Z"
        />
      </svg>
    ),
  },
  {
    id: "apple",
    nombre: "Continuar con Apple",
    className: "auth-btn auth-btn--apple",
    icono: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M16.4 12.6c0-2 1.6-3 1.7-3.1-1-1.4-2.4-1.5-2.9-1.6-1.2-.1-2.4.7-3 .7-.6 0-1.6-.7-2.6-.7-1.3 0-2.6.8-3.2 2-1.4 2.4-.4 5.9 1 7.8.7.9 1.5 2 2.5 1.9 1-.1 1.4-.6 2.6-.6 1.2 0 1.5.6 2.6.6 1.1 0 1.7-1 2.4-1.9.7-1.1 1-2.1 1-2.2 0 0-2-1-2-3.9ZM14.4 6.6c.5-.7.9-1.6.8-2.6-.8 0-1.8.6-2.4 1.2-.5.6-1 1.5-.8 2.5.9.1 1.8-.4 2.4-1.1Z" />
      </svg>
    ),
  },
];

export default function CrearPerfil({ compacto = false }: { compacto?: boolean }) {
  const { registrar, perfil, signInWithGoogle, signInWithApple } = usePerfil();
  const [proveedor, setProveedor] = useState<Proveedor | null>(null);
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");
  const [password, setPassword] = useState("");
  const [miembro, setMiembro] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleProveedor = async (id: Proveedor) => {
    setProveedor(id);
    setError(null);
    if (id === "google" && signInWithGoogle) {
      await signInWithGoogle();
      return;
    }
    if (id === "apple" && signInWithApple) {
      await signInWithApple();
      return;
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!nombre.trim()) {
      setError("Ingresa tu nombre completo.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) {
      setError("Ingresa un correo válido.");
      return;
    }
    if (!password || password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    await registrar({
      nombre: nombre.trim(),
      email: email.trim(),
      telefono: telefono.trim(),
      miembro,
      proveedor: (proveedor ?? "manual") as Perfil["proveedor"],
      password,
    });
  };

  if (perfil) return null;

  return (
    <div className={`crear-perfil ${compacto ? "crear-perfil--compacto" : ""}`}>
      <div className="auth-buttons">
        {PROVEEDORES.map((opcion) => (
          <button
            key={opcion.id}
            type="button"
            className={`${opcion.className} ${
              proveedor === opcion.id ? "active" : ""
            }`}
            onClick={() => handleProveedor(opcion.id)}
          >
            {opcion.icono}
            <span>{opcion.nombre}</span>
          </button>
        ))}
      </div>

      {proveedor && (
        <p className="auth-pending">
          La conexión con{" "}
          {proveedor === "google" ? "Google" : "Apple"} se habilita en la
          siguiente fase. Deja tu correo y te avisamos apenas esté activa.
        </p>
      )}

      <div className="auth-divider">
        <span>o crea tu perfil con tu correo</span>
      </div>

      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <label className="form-field">
          <span className="form-label">Nombre completo</span>
          <input
            className="form-input"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Nombre y apellido"
            autoComplete="name"
          />
        </label>
        <label className="form-field">
          <span className="form-label">Email</span>
          <input
            className="form-input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@email.com"
            autoComplete="email"
          />
        </label>
        <label className="form-field">
          <span className="form-label">Teléfono <em>(opcional)</em></span>
          <input
            className="form-input"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            placeholder="300 123 4567"
            autoComplete="tel"
          />
        </label>
        <label className="form-field">
          <span className="form-label">Contraseña</span>
          <input
            className="form-input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete="new-password"
          />
        </label>
        <label className="register-option">
          <input
            type="checkbox"
            checked={miembro}
            onChange={(e) => setMiembro(e.target.checked)}
          />
          <span className="register-option-body">
          <span className="register-option-label">Crear mi Perfil</span>
            <span className="register-option-desc register-option-desc--quote">
              &ldquo;Deseo registrarme para recibir acceso privado a la futura
              Línea Singular (Oro Macizo 18K) y colecciones de edición
              limitada.&rdquo;
            </span>
          </span>
        </label>

        {error && <span className="form-error">{error}</span>}

        <button type="submit" className="pdp-add-btn">
          Crear mi Perfil
        </button>
        <p className="auth-note">
          Crear el perfil no requiere comprar. Cuando estés lista para tu
          primera pieza, tus certificados y tu acceso al Círculo ya te esperan.
        </p>
      </form>
    </div>
  );
}
