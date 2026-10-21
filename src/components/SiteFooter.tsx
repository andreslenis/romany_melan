import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="footer">
      <div className="container footer-top">
        <p className="footer-poem">
          Cada pieza nace del diálogo entre la materia, la emoción y la memoria.
          Minerales, gemas y nudos hechos a mano se entrelazan para dar forma a
          historias vivas que se adhieren a la piel.
        </p>
        <ul className="footer-links">
          <li>
            <Link className="footer-link" href="/#policies">
              Políticas
            </Link>
          </li>
          <li>
            <Link className="footer-link" href="/#contacto">
              Contacto
            </Link>
          </li>
          <li>
            <Link className="footer-link" href="/mi-perfil">
              Círculo Romany Melan
            </Link>
          </li>
        </ul>
        <div className="socials">
          <a className="social-link" href="#" aria-label="Instagram">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="1.2" />
              <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.2" />
              <circle cx="17" cy="7" r="1" fill="currentColor" />
            </svg>
          </a>
          <a className="social-link" href="#" aria-label="Pinterest">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.2" />
              <path d="M12 7C9.5 7 8 8.5 8 10.5C8 11.5 8.5 12.5 9.5 13C9.25 13.75 9 14.5 8.75 15.25C8.75 15.5 8.75 15.75 9 15.75C9.25 15.75 9.5 15.5 9.75 15.25C10.25 14.5 10.75 13.75 11 13C11.33 13.05 11.66 13.08 12 13.08C14.5 13.08 16 11.58 16 9.58C16 8.08 14.5 7 12 7Z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>
        </div>
      </div>
      <div className="container footer-bottom">
        <span>© 2026 Romany Melan. Todos los derechos reservados.</span>
      </div>
    </footer>
  );
}
