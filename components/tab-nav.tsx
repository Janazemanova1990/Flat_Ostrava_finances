"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  TrendingUp, KeyRound, Receipt, FileText, BarChart2, Info, Menu, X,
} from "lucide-react";

const tabs = [
  { href: "/",                  label: "Dashboard",        icon: TrendingUp },
  { href: "/purchase",          label: "Purchase",         icon: KeyRound   },
  { href: "/expenses",          label: "Expenses",         icon: Receipt    },
  { href: "/inventarni-karta",  label: "Inventární karta", icon: FileText   },
  { href: "/odpisy",            label: "Odpisy",           icon: BarChart2  },
  { href: "/info",              label: "Info",             icon: Info       },
];

export function TabNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const current = tabs.find((t) => t.href === pathname);

  return (
    <nav className="mb-8">
      {/* Mobile: hamburger */}
      <div className="sm:hidden">
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium"
          style={{ background: "white", border: "1px solid #E2D9CC", color: "#1E3A4A" }}
        >
          {open ? <X size={16} /> : <Menu size={16} />}
          <span>{current?.label ?? "Menu"}</span>
        </button>

        {open && (
          <div
            className="mt-2 rounded-xl overflow-hidden"
            style={{ background: "white", border: "1px solid #E2D9CC" }}
          >
            {tabs.map(({ href, label, icon: Icon }) => {
              const active = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setOpen(false)}
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
      </div>

      {/* Desktop: full-width horizontal bar */}
      <div
        className="hidden sm:flex gap-1 p-1 rounded-xl w-full"
        style={{ background: "white", border: "1px solid #E2D9CC" }}
      >
        {tabs.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className="flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
              style={
                active
                  ? { background: "#1E3A4A", color: "#F5F0E8" }
                  : { color: "#3D8070" }
              }
            >
              <Icon size={15} />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
