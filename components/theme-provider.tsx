"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";

// next-themes needs a client component. It toggles the `dark` class on <html>, which the
// `dark:` variant in globals.css keys off.
export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
