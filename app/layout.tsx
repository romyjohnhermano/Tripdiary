import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = { title: "tripdiary", description: "A safe place to be heard." };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}
