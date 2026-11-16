"use client";

import { usePathname } from "next/navigation";

import CartDrawer from "@/components/cart/CartDrawer";
import AnnouncementBar from "@/components/AnnouncementBar";
import WhatsAppFloatButton from "@/components/WhatsAppFloatButton";

export default function RootLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isCheckout = pathname.startsWith("/checkout");

  return (
    <>
      {!isCheckout && <AnnouncementBar />}
      {children}
      <CartDrawer />
      <WhatsAppFloatButton />
    </>
  );
}