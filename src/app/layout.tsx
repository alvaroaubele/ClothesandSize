import type { Metadata, Viewport } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Shanai & Rhea — Wedding Wardrobe",
  description:
    "Share your measurements and pick outfits for each wedding event so the couple can help you get dressed in Mumbai.",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1 };

// Every page reads the database; never freeze data into static HTML at build time.
export const dynamic = "force-dynamic";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="flex min-h-dvh flex-col">
        <header className="border-b border-line bg-paper/90 backdrop-blur">
          <nav className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-3">
            <Link href="/" className="font-display text-lg font-semibold text-ink">
              Shanai <span className="text-rose">&amp;</span> Rhea
            </Link>
            <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm">
              <Link href="/register" className="hover:text-saffron-deep">
                Your sizes
              </Link>
              <Link href="/stores" className="hover:text-saffron-deep">
                Stores in Mumbai
              </Link>
              <Link href="/#events" className="hover:text-saffron-deep">
                Events
              </Link>
            </div>
          </nav>
        </header>
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">{children}</main>
        <footer className="border-t border-line px-4 py-6 text-center text-xs text-ink-soft">
          <p>
            This site collects sizes and preferences for the couple. It does not place orders with any store.
            Measurements are personal data; delete yours any time from your private link.
          </p>
          <p className="mt-2">
            <Link href="/admin" className="underline">
              Couple&apos;s admin
            </Link>
          </p>
        </footer>
      </body>
    </html>
  );
}
