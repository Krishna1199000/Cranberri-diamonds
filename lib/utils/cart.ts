"use client";

export interface CartStone {
  id: string;
  stockId: string;
  certificateNo?: string | null;
  shape: string;
  size: number;
  color: string;
  clarity: string;
  cut?: string | null;
  polish?: string | null;
  sym?: string | null;
  flourence?: string | null;
  lab?: string | null;
  pricePerCarat: number;
  greenPricePerCarat: number;
  redPricePerCarat: number;
  enteredPricePerCarat: number;
}

export const CART_UPDATED_EVENT = "diamond-cart-updated";

const CART_KEY_PREFIX = "diamond-cart";

function getCartKey(userId: string) {
  return `${CART_KEY_PREFIX}:${userId}`;
}

function notifyCartUpdated() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(CART_UPDATED_EVENT));
  }
}

export function getCart(userId: string): CartStone[] {
  if (typeof window === "undefined") return [];
  const raw = sessionStorage.getItem(getCartKey(userId));
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function getCartCount(userId: string): number {
  return getCart(userId).length;
}

export function setCart(userId: string, items: CartStone[]) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(getCartKey(userId), JSON.stringify(items));
  notifyCartUpdated();
}

export function addToCart(userId: string, item: CartStone) {
  const cart = getCart(userId);
  const exists = cart.some((stone) => stone.id === item.id);
  if (exists) return cart;
  const next = [...cart, item];
  setCart(userId, next);
  return next;
}

export function updateCartItemPrice(userId: string, id: string, enteredPricePerCarat: number) {
  const cart = getCart(userId);
  const next = cart.map((item) =>
    item.id === id ? { ...item, enteredPricePerCarat } : item
  );
  setCart(userId, next);
  return next;
}

export function removeFromCart(userId: string, id: string) {
  const cart = getCart(userId);
  const next = cart.filter((item) => item.id !== id);
  setCart(userId, next);
  return next;
}

export function clearCart(userId: string) {
  setCart(userId, []);
}

export function buildCartStoneFromInventory(item: {
  id: string;
  stockId: string;
  certificateNo?: string | null;
  shape: string;
  size: number;
  color: string;
  clarity: string;
  cut?: string | null;
  polish?: string | null;
  sym?: string | null;
  flourence?: string | null;
  lab?: string | null;
  pricePerCarat: number | null;
  greenPricePerCarat: number | null;
  redPricePerCarat: number | null;
}): CartStone | null {
  if (
    item.pricePerCarat == null ||
    item.greenPricePerCarat == null ||
    item.redPricePerCarat == null
  ) {
    return null;
  }

  return {
    id: item.id,
    stockId: item.stockId,
    certificateNo: item.certificateNo,
    shape: item.shape,
    size: item.size,
    color: item.color,
    clarity: item.clarity,
    cut: item.cut,
    polish: item.polish,
    sym: item.sym,
    flourence: item.flourence,
    lab: item.lab,
    pricePerCarat: item.pricePerCarat,
    greenPricePerCarat: item.greenPricePerCarat,
    redPricePerCarat: item.redPricePerCarat,
    enteredPricePerCarat: item.pricePerCarat,
  };
}
