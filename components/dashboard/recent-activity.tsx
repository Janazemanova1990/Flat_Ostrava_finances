import { fmtCZK } from "@/lib/constants";
import type { Entry } from "@/db/schema";

export function RecentActivity({ entries }: { entries: Entry[] }) {
  const recent = [...entries]
    .sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""))
    .slice(0, 8);

  return (
    <div className="bg-white border border-[#d4e0d4] rounded-xl p-6">
      <h3 className="font-display text-xl text-[#2d3b2d] mb-4">Recent activity</h3>
      {recent.length === 0 ? (
        <p className="text-sm text-[#8faa8f] py-8 text-center">
          No transactions yet — start by adding a purchase cost or expense.
        </p>
      ) : (
        <div className="divide-y divide-[#f0f5f0]">
          {recent.map((tx) => (
            <div key={tx.id} className="flex items-center justify-between py-3 text-sm">
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${tx.section === "income" ? "bg-[#2d6a2d]" : "bg-[#8faa8f]"}`} />
                <div>
                  <div className="font-medium text-[#2d3b2d]">{tx.description || tx.category}</div>
                  <div className="text-xs text-[#8faa8f]">{tx.category} · {tx.date}</div>
                </div>
              </div>
              <div className={`font-medium tabular-nums ${tx.section === "income" ? "text-[#2d6a2d]" : "text-[#2d3b2d]"}`}>
                {tx.section === "income" ? "+" : "−"} {fmtCZK(Number(tx.amount))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
