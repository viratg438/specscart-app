import { createContext, ReactNode, useContext, useMemo, useState } from "react";

export type CartOption = "lenses" | "frame";

export type CartItem = {
  id: string;
  productId: string;
  name: string;
  brand: string;
  image: string;
  price: number;
  qty: number;
  option: CartOption;
};

type AddCartItem = Omit<CartItem, "qty">;

type CartContextValue = {
  items: CartItem[];
  count: number;
  total: number;
  add: (item: AddCartItem) => void;
  remove: (id: string) => void;
  setQty: (id: string, qty: number) => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  const value = useMemo<CartContextValue>(() => {
    const count = items.reduce((sum, item) => sum + item.qty, 0);
    const total = items.reduce((sum, item) => sum + item.price * item.qty, 0);

    return {
      items,
      count,
      total,
      add: (item) => {
        setItems((current) => {
          const existing = current.find((row) => row.id === item.id);
          if (existing) {
            return current.map((row) =>
              row.id === item.id ? { ...row, qty: row.qty + 1 } : row,
            );
          }
          return [...current, { ...item, qty: 1 }];
        });
      },
      remove: (id) => {
        setItems((current) => current.filter((row) => row.id !== id));
      },
      setQty: (id, qty) => {
        setItems((current) => {
          if (qty < 1) {
            return current.filter((row) => row.id !== id);
          }
          return current.map((row) => (row.id === id ? { ...row, qty } : row));
        });
      },
    };
  }, [items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used inside CartProvider");
  }
  return context;
}
