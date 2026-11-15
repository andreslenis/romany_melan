import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";

import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import {
  PAGINA_POLITICA,
  POLITICA_DEVOLUCIONES,
  POLITICA_ENVIOS,
} from "@/lib/politicas";

export const metadata: Metadata = {
  title: PAGINA_POLITICA.titulo,
  description: PAGINA_POLITICA.descripcion,
  alternates: {
    canonical: PAGINA_POLITICA.href,
  },
};

export default function PoliticaDevolucionesPage() {
  return (
    <>
      <SiteHeader />
      <main className="policy-page">
        <div className="container">
          <h1 className="policy-title">{PAGINA_POLITICA.titulo}</h1>

          <section className="policy-section">
            <h2 className="policy-section-title">{POLITICA_ENVIOS.titulo}</h2>
            {POLITICA_ENVIOS.parrafos.map((parrafo) => (
              <p key={parrafo} className="policy-text">
                {parrafo}
              </p>
            ))}
          </section>

          {POLITICA_DEVOLUCIONES.secciones.map((seccion) => (
            <section key={seccion.titulo} className="policy-section">
              <h2 className="policy-section-title">{seccion.titulo}</h2>
              <p className="policy-text">{seccion.texto}</p>
            </section>
          ))}

          <section className="policy-section policy-contact">
            <h2 className="policy-section-title">Canales oficiales de atención</h2>
            <ul className="policy-contact-list">
              <li>
                <Image
                  src="/resources/icons/whatsapp.png"
                  alt=""
                  width={20}
                  height={20}
                  className="contact-icon"
                />
                <a href="https://wa.me/573122608873" target="_blank" rel="noreferrer">
                  WhatsApp +57 312 260 8873
                </a>
              </li>
              <li>
                <Image
                  src="/resources/icons/instagram.png"
                  alt=""
                  width={20}
                  height={20}
                  className="contact-icon"
                />
                <a
                  href="https://www.instagram.com/romanymelan?cplk=eGwzaGluNWg4amRs&utm_source=qr"
                  target="_blank"
                  rel="noreferrer"
                >
                  Instagram @romanymelan
                </a>
              </li>
              <li>
                <a href="mailto:romanymelanstudio@gmail.com">
                  romanymelanstudio@gmail.com
                </a>
              </li>
            </ul>
            <Link href="/coleccion/soberbia" className="cta-btn policy-cta">
              Volver a las colecciones
            </Link>
          </section>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}