export interface Departamento {
  nombre: string;
  ciudades: string[];
}

export const DEPARTAMENTOS: Departamento[] = [
  {
    nombre: "Antioquia",
    ciudades: ["Medellín", "Bello", "Itagüí", "Envigado", "Apartadó", "Rionegro"],
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
    ciudades: ["Cartagena", "Magangué", "Turbaco", "El Carmen de Bolívar", "Montería"],
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
    nombre: "Cauca",
    ciudades: ["Popayán", "Santander de Quilichao", "Puerto Tejada", "Cauca"],
  },
  {
    nombre: "Cesar",
    ciudades: ["Valledupar", "Aguachica", "Codazzi", "La Jagua de Ibirico"],
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
    nombre: "Quindío",
    ciudades: ["Armenia", "Calarcá", "Montenegro", "Quimbaya", "Circasia"],
  },
  {
    nombre: "Risaralda",
    ciudades: ["Pereira", "Dosquebradas", "Santa Rosa de Cabal", "Armenia", "Quibdó"],
  },
  {
    nombre: "Santander",
    ciudades: [
      "Bucaramanga",
      "Floridablanca",
      "Barrancabermeja",
      "Girón",
      "San Gil",
      "Soca",
    ],
  },
  {
    nombre: "Sucre",
    ciudades: ["Sincelejo", "Corozal", "Tolú", "Sampués", "Magangué"],
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
