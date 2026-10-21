"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { randomId, readStorage, removeStorage, writeStorage } from "@/lib/storage";
import type {
  CartItem,
  DireccionEnvio,
  Linea,
  Pedido,
  Perfil,
  SolicitudEspera,
} from "@/lib/types";
import { formatCOP } from "@/utils/format";

const PERFIL_KEY = "perfil_v1";
const PEDIDOS_KEY = "pedidos_v1";
const SOLICITUDES_KEY = "solicitudes_v1";

interface CrearPedidoInput {
  items: CartItem[];
  total: number;
  direccion: DireccionEnvio;
  metodoPago: string;
  referencia: string;
  esMiembro: boolean;
}

interface ProfileContextValue {
  perfil: Perfil | null;
  pedidos: Pedido[];
  solicitudes: SolicitudEspera[];
  hydrated: boolean;
  esMiembro: boolean;
  registrar: (datos: {
    nombre: string;
    email: string;
    telefono: string;
    miembro: boolean;
    proveedor?: Perfil["proveedor"];
  }) => void;
  crearPedido: (datos: CrearPedidoInput) => Pedido;
  solicitarEspera: (datos: {
    slug: string;
    nombre: string;
    email: string;
    linea: Linea;
  }) => SolicitudEspera;
  cerrarSesion: () => void;
}

const ProfileContext = createContext<ProfileContextValue | null>(null);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [solicitudes, setSolicitudes] = useState<SolicitudEspera[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const pedidosRef = useRef<Pedido[]>([]);
  const solicitudesRef = useRef<SolicitudEspera[]>([]);

  useEffect(() => {
    const guardados = readStorage<Pedido[]>(PEDIDOS_KEY, []);
    const guardadasSolicitudes = readStorage<SolicitudEspera[]>(SOLICITUDES_KEY, []);
    pedidosRef.current = guardados;
    solicitudesRef.current = guardadasSolicitudes;
    setPerfil(readStorage<Perfil | null>(PERFIL_KEY, null));
    setPedidos(guardados);
    setSolicitudes(guardadasSolicitudes);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    writeStorage(PERFIL_KEY, perfil);
  }, [perfil, hydrated]);

  const registrar = useCallback(
    (datos: {
      nombre: string;
      email: string;
      telefono: string;
      miembro: boolean;
      proveedor?: Perfil["proveedor"];
    }) => {
      setPerfil({
        nombre: datos.nombre,
        email: datos.email,
        telefono: datos.telefono,
        miembro: datos.miembro,
        proveedor: datos.proveedor ?? "manual",
        desde: new Date().toISOString(),
      });
    },
    []
  );

  const crearPedido = useCallback((datos: CrearPedidoInput): Pedido => {
    const pedido: Pedido = {
      id: randomId("ped"),
      referencia: datos.referencia,
      fecha: new Date().toISOString(),
      items: datos.items,
      total: datos.total,
      totalFormato: formatCOP(datos.total),
      direccion: datos.direccion,
      metodoPago: datos.metodoPago,
      estado: "confirmado",
      certificado: `CERT-${randomId("RM")}`,
      esMiembro: datos.esMiembro,
    };
    const next = [pedido, ...pedidosRef.current];
    pedidosRef.current = next;
    writeStorage(PEDIDOS_KEY, next);
    setPedidos(next);
    return pedido;
  }, []);

  const solicitarEspera = useCallback(
    (datos: {
      slug: string;
      nombre: string;
      email: string;
      linea: Linea;
    }): SolicitudEspera => {
      const solicitud: SolicitudEspera = {
        id: randomId("sol"),
        slug: datos.slug,
        nombre: datos.nombre,
        email: datos.email,
        linea: datos.linea,
        fecha: new Date().toISOString(),
      };
      const next = [solicitud, ...solicitudesRef.current];
      solicitudesRef.current = next;
      writeStorage(SOLICITUDES_KEY, next);
      setSolicitudes(next);
      return solicitud;
    },
    []
  );

  const cerrarSesion = useCallback(() => {
    setPerfil(null);
    removeStorage(PERFIL_KEY);
  }, []);

  const value = useMemo<ProfileContextValue>(
    () => ({
      perfil,
      pedidos,
      solicitudes,
      hydrated,
      esMiembro: Boolean(perfil?.miembro),
      registrar,
      crearPedido,
      solicitarEspera,
      cerrarSesion,
    }),
    [
      perfil,
      pedidos,
      solicitudes,
      hydrated,
      registrar,
      crearPedido,
      solicitarEspera,
      cerrarSesion,
    ]
  );

  return (
    <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
  );
}

export function usePerfil(): ProfileContextValue {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error("usePerfil debe usarse dentro de <ProfileProvider>");
  }
  return context;
}
