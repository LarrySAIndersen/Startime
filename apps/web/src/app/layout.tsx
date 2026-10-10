import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "STAR Hub",
  description: "Fravær — sygdom, fri og ferie",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="da">
      <body>{children}</body>
    </html>
  );
}
