export default function TrustBar() {
  return (
    <section className="trust-bar">
      <div className="container trust-bar-grid">
        <div className="trust-item">
          <span className="trust-title">Alta Artesanía Garantizada</span>
          <p>Cada pieza es elaborada a mano con Oro Laminado 18K / Oro Macizo 18K y gemas naturales.</p>
        </div>
        <div className="trust-item">
          <span className="trust-title">Envío Seguro a Colombia</span>
          <p>Despachos asegurados con guía de rastreo a todo el país.</p>
        </div>
        <div className="trust-item">
          <span className="trust-title">Certificado de Autenticidad</span>
          <p>Incluye relato impreso, certificado de garantía y estuche protector de lujo.</p>
        </div>
        <div className="trust-item">
          <span className="trust-title">Atención Personalizada</span>
          <p>
            <a href="https://wa.me/573000000000" target="_blank" rel="noreferrer">
              ¿Tienes dudas sobre la medida o la pieza? Habla directamente con el taller.
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}
