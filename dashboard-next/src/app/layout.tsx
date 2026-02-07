import "./globals.css";
import Link from "next/link";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {/* ===== Header ===== */}
        <header className="argus-header">
          <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
            <div className="font-semibold tracking-tight">
              Argus Alliance
            </div>
            <nav className="flex gap-6 text-sm font-semibold">
              <Link href="/solutions">Solutions</Link>
              <Link href="/pricing">Pricing</Link>
              <Link href="/docs">Docs</Link>
              <Link href="/contact">Contact</Link>
            </nav>
          </div>
        </header>

        {/* ===== Content ===== */}
        {children}

        {/* ===== Footer ===== */}
        <footer className="argus-footer mt-12">
          <div className="mx-auto max-w-6xl px-6 py-8 grid gap-4 md:grid-cols-3">
            <div>
              <div className="font-semibold">Argus Alliance</div>
              <p className="text-sm opacity-90 mt-1">
                Global Trust Standard for Healthcare & Logistics
              </p>
            </div>
            <div className="text-sm">
              <div className="font-semibold mb-2">Company</div>
              <ul className="space-y-1 opacity-90">
                <li><Link href="/security">Security</Link></li>
                <li><Link href="/docs">Docs</Link></li>
                <li><Link href="/contact">Contact</Link></li>
              </ul>
            </div>
            <div className="text-sm">
              <div className="font-semibold mb-2">Legal</div>
              <ul className="space-y-1 opacity-90">
                <li><Link href="/privacy">Privacy</Link></li>
                <li><Link href="/terms">Terms</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/20">
            <div className="mx-auto max-w-6xl px-6 py-3 text-xs opacity-90">
              © {new Date().getFullYear()} Argus Alliance
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
