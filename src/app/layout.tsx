import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Stepper Motor Simulator",
  description: "Interactive 3D NEMA 17 stepper motor simulation",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-[#050505] text-white antialiased">{children}</body>
    </html>
  );
}
