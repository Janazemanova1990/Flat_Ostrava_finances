"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Menu, X, TrendingUp, Receipt, ArrowDownCircle, FileText, BarChart2, Info } from "lucide-react";
import type { Meta } from "@/db/schema";

const tabs = [
  { href: "/",                  label: "Dashboard",        icon: TrendingUp      },
  { href: "/expenses",          label: "Expenses",         icon: Receipt         },
  { href: "/income",            label: "Income",           icon: ArrowDownCircle },
  { href: "/inventarni-karta",  label: "Inventární karta", icon: FileText        },
  { href: "/odpisy",            label: "Odpisy",           icon: BarChart2       },
  { href: "/info",              label: "Info",             icon: Info            },
];

export function PropertyHeader({ meta }: { meta: Meta }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="mb-8">
      {/* Eyebrow row: label left, hamburger right (mobile only) */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2" style={{ color: "rgba(30,58,74,0.5)", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.1em" }}>
          <Home size={12} />
          <span>Property Finance</span>
        </div>
        <button
          className="sm:hidden p-1"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Menu"
        >
          {menuOpen
            ? <X size={20} style={{ color: "#1E3A4A" }} />
            : (
              <svg width="22" height="16" viewBox="0 0 22 16" fill="none">
                <rect y="0"  width="22" height="2" rx="1" fill="#1E3A4A"/>
                <rect y="7"  width="22" height="2" rx="1" fill="#1E3A4A"/>
                <rect y="14" width="22" height="2" rx="1" fill="#1E3A4A"/>
              </svg>
            )
          }
        </button>
      </div>

      {/* Property name */}
      <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-medium tracking-tight leading-tight break-words mb-0" style={{ color: "#1E3A4A" }}>
        {meta.propertyName}
      </h1>

      {/* Mobile dropdown menu */}
      {menuOpen && (
        <div
          className="sm:hidden mt-4 rounded-xl overflow-hidden"
          style={{ background: "white", border: "1px solid #E2D9CC" }}
        >
          {tabs.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors"
                style={{
                  background: active ? "#1E3A4A" : "transparent",
                  color: active ? "#F5F0E8" : "#1E3A4A",
                }}
              >
                <Icon size={16} />
                {label}
              </Link>
            );
          })}
        </div>
      )}
    </header>
  );
}
