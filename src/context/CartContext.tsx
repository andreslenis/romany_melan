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

import { readStorage, writeStorage } from "@/lib/storage";
import type { CartItem } from "@/lib/types";

const CART_KEY = "carrito_v1";

export type CambioPrecio = {
  slug: string;
  nombre: string;
  antes: number;
  ahora: number;
};

type PrecioApi = Record<string, { nombre: string; precio: number; activo: boolean }>;

interface CartContextValue {
  items: CartItem[];
  count: number;
  subtotal: number;
  isOpen: boolean;
  hydrated: boolean;
  cambiosPrecio: CambioPrecio[];
  addItem: (item: Omit<CartItem, "cantidad">, cantidad?: number) => void;
  removeItem: (slug: string, talla?: string | null, color?: string | null) => void;
  updateQuantity: (
    slug: string,
    talla: string | null,
    color: string | null,
    cantidad: number
  ) => void;
  clear: () => void;
  open: () => void;
  close: () => void;
  syncPrices: () => Promise<CambioPrecio[]>;
  descartarCambiosPrecio: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

/** Una línea del carrito = pieza + talla + color de hilo. */
function clave(
  item: Pick<CartItem, "slug" | "talla" | "colorHilo">
): string {
  return `${item.slug}::${item.talla ?? "-"}::${item.colorHilo ?? "-"}`;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [cambiosPrecio, setCambiosPrecio] = useState<CambioPrecio[]>([]);
  const itemsRef = useRef<CartItem[]>([]);

  useEffect(() => {
    const guardadas = readStorage<CartItem[]>(CART_KEY, []);
    itemsRef.current = guardadas;
    setItems(guardadas);
    setHydrated(true);
  }, []);

  const persist = useCallback((next: CartItem[]) => {
    itemsRef.current = next;
    writeStorage(CART_KEY, next);
    setItems(next);
  }, []);

  const addItem = useCallback(
    (item: Omit<CartItem, "cantidad">, cantidad = 1) => {
      const prev = itemsRef.current;
      const index = prev.findIndex((i) => clave(i) === clave(item));
      let next: CartItem[];
      if (index === -1) {
        next = [...prev, { ...item, cantidad }];
      } else {
        next = [...prev];
        next[index] = { ...next[index], cantidad: next[index].cantidad + cantidad };
      }
      persist(next);
      setIsOpen(true);
    },
    [persist]
  );

  const removeItem = useCallback(
    (slug: string, talla?: string | null, color?: string | null) => {
      persist(
        itemsRef.current.filter(
          (i) =>
            clave(i) !==
            clave({ slug, talla: talla ?? null, colorHilo: color ?? null })
        )
      );
    },
    [persist]
  );

  const updateQuantity = useCallback(
    (slug: string, talla: string | null, color: string | null, cantidad: number) => {
      persist(
        itemsRef.current
          .map((i) =>
            clave(i) === clave({ slug, talla, colorHilo: color })
              ? { ...i, cantidad: Math.max(0, cantidad) }
              : i
          )
          .filter((i) => i.cantidad > 0)
      );
    },
    [persist]
  );

  const clear = useCallback(() => persist([]), [persist]);
  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const descartarCambiosPrecio = useCallback(() => setCambiosPrecio([]), []);

  /**
   * Refresca los precios del carrito contra la base de datos.
   * Si el admin cambió el precio de una pieza, el carrito se actualiza y se
   * reportan los cambios para avisar al cliente.
   */
  const syncPrices = useCallback(async (): Promise<CambioPrecio[]> => {
    const slugs = Array.from(
      new Set(itemsRef.current.map((i) => i.slug).filter((slug) => Boolean(slug)))
    );
    if (!slugs.length) return [];

    try {
      const res = await fetch("/api/cart/pricing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slugs }),
      });
      if (!res.ok) return [];
      const json = (await res.json().catch(() => ({}))) as { precios?: PrecioApi };
      const precios = json.precios ?? {};

      const cambios: CambioPrecio[] = [];
      const next = itemsRef.current.map((item) => {
        const info = precios[item.slug];
        if (!info) return item;
        const ahora = Math.max(0, Math.round(Number(info.precio) || 0));
        if (ahora <= 0 || ahora === item.precio) return item;
        cambios.push({
          slug: item.slug,
          nombre: item.nombre || info.nombre,
          antes: item.precio,
          ahora,
        });
        return { ...item, precio: ahora };
      });

      if (cambios.length) {
        persist(next);
        setCambiosPrecio(cambios);
      }
      return cambios;
    } catch (e) {
      console.error("[cart] no se pudieron sincronizar los precios", e);
      return [];
    }
  }, [persist]);

  const slugsKey = items.map((i) => i.slug).sort().join("|");

  useEffect(() => {
    if (!hydrated || !slugsKey) return;
    void syncPrices();
  }, [hydrated, slugsKey, syncPrices]);

  const value = useMemo<CartContextValue>(
    () => {
      const itemsSanitizados = items.map((i) => ({
        ...i,
        precio: Number(i.precio) || 0,
        cantidad: Number(i.cantidad) || 0,
      }));
      return {
        items: itemsSanitizados,
        count: itemsSanitizados.reduce((acc, i) => acc + (Number(i.cantidad) || 0), 0),
        subtotal: itemsSanitizados.reduce((acc, i) => acc + (Number(i.cantidad) || 0) * (Number(i.precio) || 0), 0),
        isOpen,
        hydrated,
        cambiosPrecio,
        addItem,
        removeItem,
        updateQuantity,
        clear,
        open,
        close,
        syncPrices,
        descartarCambiosPrecio,
      };
    },
    [
      items,
      isOpen,
      hydrated,
      cambiosPrecio,
      addItem,
      removeItem,
      updateQuantity,
      clear,
      open,
      close,
      syncPrices,
      descartarCambiosPrecio,
    ]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart debe usarse dentro de <CartProvider>");
  }
  return context;
}
