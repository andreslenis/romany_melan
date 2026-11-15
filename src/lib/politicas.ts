export interface SeccionPolitica {
  titulo: string;
  texto: string;
}

export interface BloquePolitica {
  titulo: string;
  parrafos: string[];
}

export const PAGINA_POLITICA = {
  href: "/politicas/devoluciones-y-garantias",
  titulo: "Política de Devoluciones y Garantías",
  enlaceFooter: "Garantías y Cambios",
  descripcion:
    "Conoce la política de devoluciones, cambios y garantías de Romany Melan: garantía de 30 días por defectos de fabricación, condiciones de devolución y procedimiento de atención.",
} as const;

export const POLITICA_ENVIOS: BloquePolitica = {
  titulo: "Envíos",
  parrafos: [
    "Tiempo de taller: al ser piezas de alta joyería artesanal elaboradas a mano bajo pedido, cada pieza requiere entre 3 y 5 días hábiles de fabricación antes de ser despachada.",
    "Tiempos de entrega: una vez despachado, el envío tarda entre 2 y 5 días hábiles según la ciudad de destino a nivel nacional.",
    "Costos de envío: el costo de envío está incluido en el precio del producto; no cobramos un valor adicional. Cada pieza se despacha asegurada y con guía de rastreo.",
  ],
};

export const POLITICA_DEVOLUCIONES: {
  titulo: string;
  secciones: SeccionPolitica[];
} = {
  titulo: PAGINA_POLITICA.titulo,
  secciones: [
    {
      titulo: "Compromiso Artesanal y Calidad",
      texto:
        "En Romany Melan, cada pieza de alta joyería es elaborada a mano bajo pedido, utilizando hilos de alta tenacidad, metales nobles y gemas naturales. Debido a la naturaleza artesanal de nuestros procesos, cada creación es única.",
    },
    {
      titulo: "Cambios y Garantías",
      texto:
        "Ofrecemos garantía por defectos de fabricación o en los materiales (hilos, estructura de micro-macramé, componentes metálicos o gemas) dentro de los 30 días siguientes a la recepción de tu pedido. Si tu pieza presenta alguna inconsistencia al llegar, contáctanos de inmediato para gestionarla.",
    },
    {
      titulo: "Condiciones para Devolución o Cambio",
      texto:
        "La pieza debe encontrarse en perfecto estado, sin signos de uso indebido y conservando su empaque original. Debido a la exclusividad de nuestras colecciones y a que muchas piezas se elaboran de manera personalizada, no realizamos devoluciones de dinero por cambios de opinión o preferencia personal, únicamente por garantía o desperfecto de fabricación debidamente verificado.",
    },
    {
      titulo: "Procedimiento",
      texto:
        "Para iniciar una solicitud de garantía o revisión, comunícate con nosotros a través de nuestros canales oficiales de atención (WhatsApp, Mensaje Instagram o Correo Electrónico). Te indicaremos los pasos para el envío de la pieza a nuestro taller.",
    },
  ],
};

/** Texto de la nota que se muestra bajo el botón de compra en la ficha de producto. */
export const NOTA_PRODUCTO = {
  antes:
    "✨ Pieza hecha a mano bajo pedido (3 a 5 días de fabricación). Conoce nuestras ",
  enlace: "Políticas de Envío y Garantía",
  despues: ".",
} as const;