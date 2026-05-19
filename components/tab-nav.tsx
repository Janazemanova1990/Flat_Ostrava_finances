"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { TrendingUp, KeyRound, Receipt, FileText, BarChart2, Info } from "lucide-react";

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

  return (
    <nav className="mb-8 hidden sm:block">
      <div
        className="flex gap-1 p-1 rounded-xl w-full"
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
