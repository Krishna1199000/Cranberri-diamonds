"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CART_UPDATED_EVENT, getCartCount } from "@/lib/utils/cart";

interface CartButtonProps {
  /** Match notification bell style — icon only, no label */
  compact?: boolean;
}

export function CartButton({ compact = true }: CartButtonProps) {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [count, setCount] = useState(0);

  useEffect(() => {
    let active = true;

    const loadUser = async () => {
      try {
        const res = await fetch("/api/auth/me", { credentials: "include" });
        if (!res.ok || !active) return;
        const user = await res.json();
        if (user.role !== "admin" && user.role !== "employee") return;
        setUserId(user.id);
        setCount(getCartCount(user.id));
      } catch {
        // ignore — cart badge is non-critical
      }
    };

    loadUser();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!userId) return;

    const refresh = () => setCount(getCartCount(userId));
    refresh();

    window.addEventListener(CART_UPDATED_EVENT, refresh);
    return () => window.removeEventListener(CART_UPDATED_EVENT, refresh);
  }, [userId]);

  if (!userId) return null;

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        className="relative"
        onClick={() => router.push("/cart")}
        aria-label={`Cart${count > 0 ? `, ${count} items` : ""}`}
      >
        <ShoppingCart className="h-4 w-4" />
        {!compact && <span className="ml-2 hidden sm:inline">Cart</span>}
        {count > 0 && (
          <Badge
            variant="destructive"
            className="absolute -top-2 -right-2 h-5 min-w-5 rounded-full px-1 flex items-center justify-center text-xs"
          >
            {count > 99 ? "99+" : count}
          </Badge>
        )}
      </Button>
    </div>
  );
}
