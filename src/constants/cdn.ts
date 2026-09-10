export function STATIC_URL(path: string) {
  const base = (process.env.EXPO_PUBLIC_CDN_URL ?? "").replace(/\/$/, "");
  const cleanPath = path.replace(/^\//, "");

  if (!base) {
    return "";
  }

  return `${base}/${cleanPath}`;
}
