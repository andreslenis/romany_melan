"use client";

import Link from "next/link";

export default function Hero() {
  return (
    <div className="w-full bg-[#FAF9F6] text-[#2C2A29]">
      {/* 1. Barra Superior de Anuncio */}
      <div className="bg-[#1A1918] text-[#D4AF37] text-xs md:text-sm text-center py-2 px-4 font-medium tracking-wider">
        💎 ORO LAMINADO + PIEDRAS NATURALES | ENVÍO GRATIS A TODA COLOMBIA
      </div>

      {/* 2. Hero Section Principal */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20 flex flex-col md:flex-row items-center justify-between gap-12">
        
        {/* Columna de Texto */}
        <div className="flex-1 text-center md:text-left space-y-6">
          <span className="inline-block text-xs uppercase tracking-widest text-[#8C7A5B] bg-[#EFECE6] px-3 py-1 rounded-full font-semibold">
            Colección Inaugural • Pecados Capitales
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif tracking-tight text-[#1A1918] leading-tight">
            Joyería de Autor en <span className="italic text-[#8C7A5B]">Micro-Macramé</span>
          </h1>
          <p className="text-base sm:text-lg text-[#6B6560] max-w-xl mx-auto md:mx-0 font-light leading-relaxed">
            Piezas únicas tejidas a mano entrelazando la fuerza de la amatista natural con la elegancia atemporal del oro laminado.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center md:justify-start gap-4 pt-2">
            <Link 
              href="/coleccion/soberbia" 
              className="w-full sm:w-auto px-8 py-4 bg-[#1A1918] text-white rounded-none hover:bg-[#33312F] transition-all text-sm font-medium tracking-widest uppercase text-center shadow-sm"
            >
              Ver Colección
            </Link>
            <Link 
              href="/circulo" 
              className="w-full sm:w-auto px-8 py-4 border border-[#1A1918] text-[#1A1918] rounded-none hover:bg-[#1A1918] hover:text-white transition-all text-sm font-medium tracking-widest uppercase text-center"
            >
              Círculo Romany Melan
            </Link>
          </div>
        </div>

        {/* Columna de Imagen Principal (Hero Image) */}
        <div className="flex-1 w-full max-w-md md:max-w-none">
          <div className="relative aspect-[4/5] bg-[#EFECE6] overflow-hidden shadow-2xl rounded-sm">
            <img 
              src="/resources/colecciones/soberbia/origen/gargantilla_soberbia_sutil/gargantilla_soberbia_sutil_soberbia.jpg" 
              alt="Choker Romany Melan" 
              className="object-cover w-full h-full hover:scale-105 transition-transform duration-700"
            />
          </div>
        </div>
      </section>

      {/* 3. Manifiesto Breve (Espacio Conceptual) */}
      <section className="border-t border-[#E5E0D8] py-12 px-4 text-center">
        <div className="max-w-2xl mx-auto space-y-3">
          <h2 className="text-xs uppercase tracking-widest text-[#8C7A5B] font-semibold">El Arte del Detalle</h2>
          <p className="text-sm md:text-base font-serif text-[#4A4540] italic">
            &ldquo;Cada nudo es una pausa en el tiempo; una dualidad entre la soberbia de destacar y la avaricia de conservar una obra irrepetible.&rdquo;
          </p>
        </div>
      </section>
    </div>
  );
}