"use client";

import { ShoppingCart } from "lucide-react";
import Link from "next/link";
import { cartStorageKey } from "@/lib/session";

type CartLine = {
  id: string;
  qty: number;
};

export function ProductDetailActions({ productId }: { productId: string }) {
  const addToCart = () => {
    const current = JSON.parse(localStorage.getItem(cartStorageKey) || "[]") as CartLine[];
    const existing = current.find((line) => line.id === productId);
    const next = existing
      ? current.map((line) => (line.id === productId ? { ...line, qty: line.qty + 1 } : line))
      : [...current, { id: productId, qty: 1 }];

    localStorage.setItem(cartStorageKey, JSON.stringify(next));
    window.dispatchEvent(new Event("cart-updated"));
  };

  return (
    <Link className="btn primary large" href="/cart" onClick={addToCart}>
      <ShoppingCart size={17} aria-hidden="true" />
      加入询价车
    </Link>
  );
}
