import Link from "next/link";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="argus-header">
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <div className="font-semibold tracking-tight">Argus Alliance</div>
          <nav className="flex gap-6 text-sm font-semibold">
            <Link href="/solutions">Solutions</Link>
            <Link href="/pricing">Pricing</Link>
            <Link href="/docs">Docs</Link>
            <Link href="/contact">Contact</Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        {children}
      </main>
    </div>
  );
}