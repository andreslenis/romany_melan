import Link from "next/link";

import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import CrearPerfil from "@/components/profile/CrearPerfil";

export const metadata = {
  title: "Crear Perfil | Romany Melan",
  description:
    "Crea tu perfil para acceder al Círculo Romany Melan, productos privados, certificados y lanzamientos de edición limitada.",
};

export default function CrearPerfilPage() {
  return (
    <>
      <SiteHeader />
      <main className="profile-page">
        <div className="container">
          <header className="profile-header">
            <div>
              <p className="profile-eyebrow">Crear mi Perfil</p>
              <h1 className="profile-title">Únete al Círculo</h1>
              <p className="profile-email">
                Crea tu perfil para recibir acceso privado a la futura Línea
                Singular (Oro Macizo 18K) y colecciones de edición limitada.
              </p>
            </div>
          </header>
          <CrearPerfil />
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
