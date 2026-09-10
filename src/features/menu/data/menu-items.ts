import { Href } from "expo-router";

export type MenuChild = {
  id: string;
  label: string;
  href: Href;
};

export type MenuItem = {
  id: string;
  label: string;
  href?: Href;
  children?: MenuChild[];
};

export const MENU_ITEMS: MenuItem[] = [
  {
    id: "glasses",
    label: "Glasses",
    href: "/glasses",
    children: [
      { id: "glasses-all", label: "All glasses", href: "/glasses" },
      { id: "glasses-men", label: "Men", href: "/glasses" },
      { id: "glasses-women", label: "Women", href: "/glasses" },
      { id: "glasses-kids", label: "Kids", href: "/glasses" },
    ],
  },
  {
    id: "sunglasses",
    label: "Sunglasses",
    href: "/sunglasses",
    children: [
      { id: "sun-all", label: "All sunglasses", href: "/sunglasses" },
      { id: "sun-polarised", label: "Polarised", href: "/sunglasses" },
      { id: "sun-non-polarised", label: "Non-polarised", href: "/sunglasses" },
      {
        id: "sun-prescription",
        label: "Prescription sunglasses",
        href: "/sunglasses",
      },
    ],
  },
  { id: "sports", label: "Sports", href: "/home" },
  { id: "goggles", label: "Goggles", href: "/home" },
  { id: "accessories", label: "Accessories", href: "/home" },
  { id: "account", label: "Account", href: "/account" },
];
