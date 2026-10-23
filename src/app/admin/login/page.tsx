"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email === "superadmin@romany.com" && password === "Romany2026!") {
      localStorage.setItem("admin", "true");
      router.push("/admin/dashboard");
    } else {
      alert("Credenciales inválidas");
    }
  };

  return (
    <main className="container">
      <h1>Superadmin</h1>
      <form onSubmit={submit}>
        <input className="form-input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="correo" />
        <input className="form-input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="contraseña" />
        <button className="cta-btn" type="submit">Ingresar</button>
      </form>
    </main>
  );
}
