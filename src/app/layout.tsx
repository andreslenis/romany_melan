import type { Metadata } from "next";
import "./globals.css";

import CartDrawer from "@/components/cart/CartDrawer";
import { CartProvider } from "@/context/CartContext";
import { ProfileProvider } from "@/context/ProfileContext";

export const metadata: Metadata = {
  title: "Romany Melan | Historias tejidas para llevar en la piel",
  description: "Romany Melan celebra la belleza que habita entre la imperfección y la perfección, explorando la verdad de las emociones humanas. Cada pieza es un tributo atemporal donde el arte y la sofisticación se entrelazan para contar una historia viva entre la joya y lo que expresas al llevarla.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="antialiased">
        <CartProvider>
          <ProfileProvider>
            {children}
            <CartDrawer />
          </ProfileProvider>
        </CartProvider>
      </body>
    </html>
  );
}
