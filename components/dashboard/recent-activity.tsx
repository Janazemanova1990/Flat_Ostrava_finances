import { fmtCZK, fmtDate } from "@/lib/constants";
import type { Entry } from "@/db/schema";

export function RecentActivity({ entries }: { entries: Entry[] }) {
  const recent = [...entries]
    .sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""))
    .slice(0, 8);

  return (
    <div className="bg-white border border-[#E2D9CC] rounded-xl p-4 sm:p-6">
      <h3 className="font-display text-xl mb-4" style={{ color: "#1E3A4A" }}>Recent activity</h3>
      {recent.length === 0 ? (
        <p className="text-sm py-8 text-center" style={{ color: "rgba(30,58,74,0.5)" }}>
          No transactions yet - start by adding a purchase cost or expense.
        </p>
      ) : (
        <div className="divide-y" style={{ borderColor: "#E2D9CC" }}>
          {recent.map((tx) => (
            <div key={tx.id} className="flex items-center justify-between py-3 text-sm">
              <div className="flex items-center gap-3">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ background: tx.section === "income" ? "#3D8070" : "#D4684A" }}
                />
                <div>
                  <div className="font-medium" style={{ color: "#1E3A4A" }}>{tx.description || tx.category}</div>
                  <div className="text-sm" style={{ color: "rgba(30,58,74,0.5)" }}>{tx.category} · {fmtDate(tx.date)}</div>
                </div>
              </div>
              <div className="font-medium tabular-nums" style={{ color: tx.section === "income" ? "#3D8070" : "#D4684A" }}>
                {tx.section === "income" ? "+" : "−"} {fmtCZK(Number(tx.amount))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
