export interface Departamento {
  nombre: string;
  ciudades: string[];
}

export const DEPARTAMENTOS: Departamento[] = [
  {
    nombre: "Amazonas",
    ciudades: ["Leticia", "Puerto Nariño"],
  },
  {
    nombre: "Antioquia",
    ciudades: ["Medellín", "Bello", "Itagüí", "Envigado", "Apartadó", "Rionegro"],
  },
  {
    nombre: "Arauca",
    ciudades: ["Arauca", "Arauquita", "Cravo Norte", "Fortul", "Puerto Rondón", "Saravena", "Tame"],
  },
  {
    nombre: "Atlántico",
    ciudades: ["Barranquilla", "Soledad", "Malambo", "Sabanalarga", "Puerto Colombia"],
  },
  {
    nombre: "Bogotá D.C.",
    ciudades: ["Bogotá D.C."],
  },
  {
    nombre: "Bolívar",
    ciudades: ["Cartagena", "Magangué", "Turbaco", "El Carmen de Bolívar", "Mompox"],
  },
  {
    nombre: "Boyacá",
    ciudades: ["Tunja", "Duitama", "Sogamoso", "Chiquinquirá", "Paipa"],
  },
  {
    nombre: "Caldas",
    ciudades: ["Manizales", "La Dorada", "Chinchiná", "Villamaría", "Riosucio"],
  },
  {
    nombre: "Caquetá",
    ciudades: ["Florencia", "Belén de los Andaquíes", "Cartagena del Chairá", "Curillo", "El Doncello", "El Paujil", "La Montañita", "Milan", "Morelia", "Puerto Rico", "San José del Fragua", "San Vicente del Caguán", "Solano", "Solita", "Valparaíso"],
  },
  {
    nombre: "Casanare",
    ciudades: ["Yopal", "Aguazul", "Chámeza", "Hato Corozal", "La Salina", "Maní", "Monterrey", "Nunchía", "Orocué", "Paz de Ariporo", "Pore", "Recetor", "Sabanalarga", "Sácama", "San Luis de Palenque", "Támara", "Tauramena", "Trinidad", "Villanueva"],
  },
  {
    nombre: "Cauca",
    ciudades: ["Popayán", "Santander de Quilichao", "Puerto Tejada", "Santander de Quilichao"],
  },
  {
    nombre: "Cesar",
    ciudades: ["Valledupar", "Aguachica", "Codazzi", "La Jagua de Ibirico"],
  },
  {
    nombre: "Chocó",
    ciudades: ["Quibdó", "Istmina", "Condoto", "Nóvita", "Tadó", "Medio Atrato", "Medio Baudó", "Baudó", "Bojayá", "Carmen del Darién", "Río Iró", "Río Quito", "Unión Panamericana"],
  },
  {
    nombre: "Córdoba",
    ciudades: ["Montería", "Lorica", "Sahagún", "Cereté", "Ciénaga de Oro"],
  },
  {
    nombre: "Cundinamarca",
    ciudades: [
      "Soacha",
      "Zipaquirá",
      "Facatativá",
      "Chía",
      "Girardot",
      "Fusagasugá",
      "Madrid",
    ],
  },
  {
    nombre: "Guainía",
    ciudades: ["Inírida", "Puerto Inírida"],
  },
  {
    nombre: "Guaviare",
    ciudades: ["San José del Guaviare", "Calamar", "El Retorno"],
  },
  {
    nombre: "Huila",
    ciudades: ["Neiva", "Pitalito", "Garzón", "La Plata", "Campoalegre"],
  },
  {
    nombre: "La Guajira",
    ciudades: ["Riohacha", "Maicao", "Uribia", "Dibulla"],
  },
  {
    nombre: "Magdalena",
    ciudades: ["Santa Marta", "Ciénaga", "Fundación", "Puebloviejo", "Guacamayo"],
  },
  {
    nombre: "Meta",
    ciudades: ["Villavicencio", "Acacías", "Granada", "Cumaral", "Restrepo"],
  },
  {
    nombre: "Nariño",
    ciudades: ["Pasto", "Tumaco", "Ipiales", "Túquerres", "La Unión"],
  },
  {
    nombre: "Norte de Santander",
    ciudades: ["Cúcuta", "Ocaña", "Pamplona", "Villa del Rosario"],
  },
  {
    nombre: "Putumayo",
    ciudades: ["Mocoa", "Colón", "Orito", "Puerto Asís", "Puerto Caicedo", "Puerto Guzmán", "Puerto Leguízamo", "San Francisco", "San Miguel", "Santiago", "Sibundoy", "Villagarzón"],
  },
  {
    nombre: "Quindío",
    ciudades: ["Armenia", "Calarcá", "Montenegro", "Quimbaya", "Circasia"],
  },
  {
    nombre: "Risaralda",
    ciudades: ["Pereira", "Dosquebradas", "Santa Rosa de Cabal", "Armenia", "La Virginia"],
  },
  {
    nombre: "San Andrés y Providencia",
    ciudades: ["San Andrés", "Providencia"],
  },
  {
    nombre: "Santander",
    ciudades: [
      "Bucaramanga",
      "Floridablanca",
      "Barrancabermeja",
      "Girón",
      "San Gil",
      "Socorro",
    ],
  },
  {
    nombre: "Sucre",
    ciudades: ["Sincelejo", "Corozal", "Tolú", "Sampués", "San Onofre"],
  },
  {
    nombre: "Tolima",
    ciudades: ["Ibagué", "Espinal", "Melgar", "Honda", "Saldaña"],
  },
  {
    nombre: "Valle del Cauca",
    ciudades: ["Cali", "Palmira", "Buenaventura", "Tuluá", "Buga", "Cartago"],
  },
  {
    nombre: "Vaupés",
    ciudades: ["Mitú", "Carurú"],
  },
  {
    nombre: "Vichada",
    ciudades: ["Puerto Carreño", "La Primavera"],
  },
];

export function ciudadesPorDepartamento(departamento: string): string[] {
  return (
    DEPARTAMENTOS.find((d) => d.nombre === departamento)?.ciudades ?? []
  );
}
