import { Href } from "expo-router";

import { STATIC_URL } from "@/constants/cdn";

export type HomeCategory = {
  title: string;
  image: string;
  url: Href;
};

export const HOME_CATEGORIES: HomeCategory[] = [
  {
    title: "Glasses",
    image: STATIC_URL("menu-passion.webp"),
    url: "/glasses",
  },
  {
    title: "Sunglasses",
    image: STATIC_URL("men-sunglasses-menu-25-7-2026.webp"),
    url: "/sunglasses",
  },
  {
    title: "Sports",
    image: STATIC_URL("sports/Sports-menu-Mob.webp"),
    url: "/home",
  },
  {
    title: "Goggles",
    image: STATIC_URL("goggles/GOGGLES-menu.webp"),
    url: "/home",
  },
  {
    title: "Accessories",
    image: STATIC_URL("menu-passion.webp"),
    url: "/home",
  },
  {
    title: "Swimming Goggles",
    image: STATIC_URL("goggles/Swimming-menu.webp"),
    url: "/home",
  },
];
