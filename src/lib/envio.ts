import { ESTADOS_ENVIO, type EstadoEnvio, type Pedido } from "./types";

/**
 * Cada etapa del envío se simula con una ventana de tiempo para que el
 * tracker de /mi-perfil se comporte como un seguimiento en vivo.
 */
const MINUTOS_POR_ETAPA = 3;

export const SEGUNDOS_POR_ETAPA = MINUTOS_POR_ETAPA * 60;

export function indiceEstado(estado: EstadoEnvio): number {
  return ESTADOS_ENVIO.findIndex((e) => e.id === estado);
}

export function etapaActual(pedido: Pedido, ahora: number): EstadoEnvio {
  const transcurrido = Math.max(
    0,
    Math.floor((ahora - new Date(pedido.fecha).getTime()) / 1000)
  );
  const avance = Math.floor(transcurrido / SEGUNDOS_POR_ETAPA);
  const indice = Math.min(avance, ESTADOS_ENVIO.length - 1);
  return ESTADOS_ENVIO[indice].id;
}

export function progresoEnvio(pedido: Pedido, ahora: number): number {
  const indice = indiceEstado(etapaActual(pedido, ahora));
  return Math.round((indice / (ESTADOS_ENVIO.length - 1)) * 100);
}

export function tiempoRestante(pedido: Pedido, ahora: number): string {
  const transcurrido = Math.max(
    0,
    Math.floor((ahora - new Date(pedido.fecha).getTime()) / 1000)
  );
  const restante = SEGUNDOS_POR_ETAPA * (ESTADOS_ENVIO.length - 1) - transcurrido;
  if (restante <= 0) return "Tu pedido ya fue entregado.";

  const minutos = Math.floor(restante / 60);
  const segundos = restante % 60;
  if (minutos <= 0) return `Entrega estimada en ${segundos} s (demo).`;
  return `Entrega estimada en ${minutos} min (demo).`;
}
