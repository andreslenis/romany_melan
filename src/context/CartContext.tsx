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

interface CartContextValue {
  items: CartItem[];
  count: number;
  subtotal: number;
  isOpen: boolean;
  hydrated: boolean;
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

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      count: items.reduce((acc, i) => acc + i.cantidad, 0),
      subtotal: items.reduce((acc, i) => acc + i.cantidad * i.precio, 0),
      isOpen,
      hydrated,
      addItem,
      removeItem,
      updateQuantity,
      clear,
      open,
      close,
    }),
    [items, isOpen, hydrated, addItem, removeItem, updateQuantity, clear, open, close]
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
