import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "GitStat: GitHub, clearly", template: "%s | GitStat" },
  description: "A fast, private GitHub statistics dashboard.",
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" suppressHydrationWarning><body>{children}</body></html>;
}
