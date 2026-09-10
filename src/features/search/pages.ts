import { Href } from "expo-router";

import { HOME_CATEGORIES } from "@/features/home/data/categories";
import { MENU_ITEMS } from "@/features/menu/data/menu-items";

export type SearchPage = {
  id: string;
  title: string;
  subtitle: string;
  href: Href;
  keywords: string[];
};

const CORE_PAGES: SearchPage[] = [
  {
    id: "home",
    title: "Home",
    subtitle: "Bestsellers and categories",
    href: "/home",
    keywords: ["home", "shop", "ghar"],
  },
  {
    id: "glasses",
    title: "Glasses",
    subtitle: "Prescription frames",
    href: "/glasses",
    keywords: ["glasses", "frames", "spectacles", "chashma", "chashme"],
  },
  {
    id: "sunglasses",
    title: "Sunglasses",
    subtitle: "Sun and polarised styles",
    href: "/sunglasses",
    keywords: ["sunglasses", "sun", "polarised", "goggles"],
  },
  {
    id: "account",
    title: "My Account",
    subtitle: "Profile and settings",
    href: "/account",
    keywords: ["account", "profile", "login", "signup"],
  },
  {
    id: "orders",
    title: "Orders",
    subtitle: "Track your orders",
    href: "/orders",
    keywords: ["orders", "order", "history"],
  },
  {
    id: "cart",
    title: "Cart",
    subtitle: "Your bag and checkout items",
    href: "/cart" as Href,
    keywords: ["cart", "bag", "basket", "checkout"],
  },
  {
    id: "notifications",
    title: "Notification",
    subtitle: "Order and offer alerts",
    href: "/notifications" as Href,
    keywords: ["notification", "notifications", "alerts"],
  },
  {
    id: "wallet",
    title: "Wallet",
    subtitle: "Balance and cashback",
    href: "/wallet" as Href,
    keywords: ["wallet", "cashback", "credit"],
  },
  {
    id: "gift-card",
    title: "E-Gift Card",
    subtitle: "Gift cards and remaining balance",
    href: "/gift-card" as Href,
    keywords: ["gift", "gift card", "egift", "voucher"],
  },
];

function uniquePages(pages: SearchPage[]): SearchPage[] {
  const seen = new Set<string>();
  const unique: SearchPage[] = [];
  for (const page of pages) {
    const key = `${page.href}:${page.title.toLowerCase()}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    unique.push(page);
  }
  return unique;
}

export const SEARCHABLE_PAGES: SearchPage[] = uniquePages([
  ...CORE_PAGES,
  ...HOME_CATEGORIES.map((category) => ({
    id: `category-${category.title}`,
    title: category.title,
    subtitle: "Shop category",
    href: category.url,
    keywords: [category.title],
  })),
  ...MENU_ITEMS.flatMap((item) => {
    const parent: SearchPage = {
      id: `menu-${item.id}`,
      title: item.label,
      subtitle: "Menu",
      href: item.href ?? "/home",
      keywords: [item.label],
    };
    const children = (item.children ?? []).map((child) => ({
      id: `menu-${child.id}`,
      title: child.label,
      subtitle: item.label,
      href: child.href,
      keywords: [child.label, item.label],
    }));
    return [parent, ...children];
  }),
]);
