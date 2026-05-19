import { fmtCZK, fmtDate } from "@/lib/constants";
import type { Entry } from "@/db/schema";

export function RecentActivity({ entries }: { entries: Entry[] }) {
  const recent = [...entries]
    .sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""))
    .slice(0, 8);

  return (
    <div className="bg-white border border-[#E2D9CC] rounded-xl overflow-hidden">
      <div className="px-4 sm:px-5 py-4" style={{ borderBottom: "1px solid #E2D9CC" }}>
        <h3 className="font-display text-xl" style={{ color: "#1E3A4A" }}>Recent activity</h3>
      </div>
      {recent.length === 0 ? (
        <p className="text-sm py-8 text-center" style={{ color: "rgba(30,58,74,0.5)" }}>
          No transactions yet - start by adding a purchase cost or expense.
        </p>
      ) : (
        <div className="divide-y divide-[#E2D9CC]">
          {recent.map((tx) => {
            const isIncome = tx.section === "income";
            const amountColor = isIncome ? "#3D8070" : "#D4684A";

            return (
              <div key={tx.id} className="flex items-center justify-between gap-3 px-4 sm:px-5 py-3">
                {/* Left */}
                <div className="flex-1 min-w-0">
                  {/* Line 1: date + tags */}
                  <div className="flex items-center gap-1.5 flex-wrap mb-1">
                    <span className="text-xs tabular-nums" style={{ color: "rgba(30,58,74,0.45)" }}>
                      {fmtDate(tx.date)}
                    </span>
                    {tx.taxDeductible && (
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full uppercase tracking-wide" style={{ background: "rgba(212,104,74,0.1)", color: "#D4684A" }}>
                        tax
                      </span>
                    )}
                    {tx.section === "purchase" && (
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full uppercase tracking-wide" style={{ background: "rgba(30,58,74,0.08)", color: "rgba(30,58,74,0.5)" }}>
                        purchase
                      </span>
                    )}
                  </div>
                  {/* Line 2: bold name + category */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-semibold truncate" style={{ color: "#1E3A4A" }}>
                      {tx.description || tx.category}
                    </span>
                    {tx.description && (
                      <span className="text-xs truncate" style={{ color: "rgba(30,58,74,0.4)" }}>
                        {tx.category}
                      </span>
                    )}
                  </div>
                </div>

                {/* Right: amount */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  {tx.recurring && (
                    <span className="text-xs" style={{ color: "rgba(30,58,74,0.4)" }}>↻</span>
                  )}
                  <span className="text-sm font-semibold tabular-nums" style={{ color: amountColor }}>
                    {isIncome ? "+" : "−"}{fmtCZK(Number(tx.amount))}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
