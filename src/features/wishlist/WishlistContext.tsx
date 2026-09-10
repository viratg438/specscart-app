// File: WishlistContext.tsx
// In-memory wishlist state shared across screens (heart icon + header badge).

import { createContext, ReactNode, useContext, useMemo, useState } from "react";

type WishlistContextValue = {
  ids: string[];
  count: number;
  has: (id: string) => boolean;
  toggle: (id: string) => void;
};

const WishlistContext = createContext<WishlistContextValue | null>(null);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [ids, setIds] = useState<string[]>([]);

  const value = useMemo<WishlistContextValue>(
    () => ({
      ids,
      count: ids.length,
      has: (id: string) => ids.includes(id),
      toggle: (id: string) => {
        setIds((current) =>
          current.includes(id)
            ? current.filter((item) => item !== id)
            : [...current, id],
        );
      },
    }),
    [ids],
  );

  return (
    <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error("useWishlist must be used inside WishlistProvider");
  }
  return context;
}
