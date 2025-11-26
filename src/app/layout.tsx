import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Post Maker",
  description: "Generate Reddit posts for your Shopify products with AI",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-950 text-slate-50 antialiased">
        {/* Background effects */}
        <div className="pointer-events-none fixed inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.22),_transparent_60%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,_rgba(129,140,248,0.18),_transparent_60%)]" />
        </div>

        {/* Page content */}
        <div className="min-h-screen">
          {children}
        </div>
      </body>
    </html>
  );
}
