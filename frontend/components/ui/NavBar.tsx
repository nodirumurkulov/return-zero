"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

export default function NavBar() {
  const path = usePathname();
  const isDashboard = path.startsWith("/dashboard");

  if (isDashboard) {
    return (
      <header className="bg-pf-black text-white sticky top-0 z-50 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/store" className="text-white/40 hover:text-white transition-colors">
              ←
            </Link>
            <div>
              <span className="font-black text-sm tracking-tightest uppercase">Return Zero</span>
              <span className="ml-3 text-xs text-white/40">Operator Dashboard · Pretty Fly</span>
            </div>
          </div>
          <Link
            href="/store"
            className="text-xs text-white/50 border border-white/20 rounded px-3 py-1.5
                       hover:text-white hover:border-white/50 transition-colors"
          >
            View Storefront →
          </Link>
        </div>
      </header>
    );
  }

  return (
    <header className="bg-pf-white border-b border-pf-dust sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-8 h-14 flex items-center justify-between">
        <Link
          href="/store"
          className="font-black text-lg tracking-tightest uppercase text-pf-black"
        >
          Pretty Fly
        </Link>

        <nav className="flex items-center gap-8">
          {["Mens", "Womens", "New In"].map((label) => (
            <span
              key={label}
              className="text-sm text-pf-charcoal hover:text-pf-black cursor-pointer transition-colors"
            >
              {label}
            </span>
          ))}
        </nav>

        <Link
          href="/dashboard"
          className={clsx(
            "text-xs border rounded px-3 py-1.5 transition-colors",
            "text-pf-charcoal border-pf-dust hover:text-pf-black hover:border-pf-charcoal"
          )}
        >
          Operator View →
        </Link>
      </div>
    </header>
  );
}
