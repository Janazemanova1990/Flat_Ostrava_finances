"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { TrendingUp, KeyRound, Receipt, ArrowDownCircle } from "lucide-react";

const tabs = [
  { href: "/", label: "Dashboard", icon: TrendingUp },
  { href: "/purchase", label: "Purchase", icon: KeyRound },
  { href: "/expenses", label: "Expenses", icon: Receipt },
  { href: "/income", label: "Income", icon: ArrowDownCircle },
];

export function TabNav() {
  const pathname = usePathname();
  return (
    <nav className="mb-8">
      <div className="flex gap-1 bg-white p-1 rounded-xl border border-[#d4e0d4] w-full sm:w-fit">
      {tabs.map(({ href, label, icon: Icon }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            aria-label={label}
            className={`flex-1 sm:flex-initial px-3 py-2 sm:px-4 rounded-lg text-sm font-medium transition flex items-center justify-center gap-2 ${
              active
                ? "bg-[#3d5c3d] text-[#f4f7f4]"
                : "text-[#5f7a5f] hover:text-[#2d3b2d]"
            }`}
          >
            <Icon size={16} />
            <span className="hidden sm:inline">{label}</span>
          </Link>
        );
      })}
      </div>
    </nav>
  );
}
