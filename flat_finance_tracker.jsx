import React, { useState, useEffect, useMemo } from "react";
import {
  Plus,
  Trash2,
  Home,
  TrendingUp,
  Wallet,
  Receipt,
  KeyRound,
  CalendarClock,
  ArrowDownCircle,
  ArrowUpCircle,
  PiggyBank,
  Percent,
  AlertCircle,
  Pencil,
  X,
  Check,
  Download,
  Upload,
} from "lucide-react";

// ─── Constants ────────────────────────────────────────────────────────────────
const STORAGE_KEY = "flat_finance_v1";

const PURCHASE_CATEGORIES = [
  "Escrow deposit",
  "Mortgage drawdown",
  "Legal & notary",
  "Cadastral fees",
  "Property insurance",
  "Mortgage fees",
  "Renovation / furnishing",
  "Other one-off",
];

const ONGOING_CATEGORIES = [
  "Mortgage payment",
  "SVJ fees",
  "Utilities — electricity",
  "Utilities — gas",
  "Utilities — water",
  "Internet",
  "Property insurance",
  "Repairs & maintenance",
  "Property management",
  "Tax",
  "Other",
];

const INCOME_CATEGORIES = [
  "Rent",
  "Deposit received",
  "Reimbursement",
  "Other",
];

const fmtCZK = (n) =>
  new Intl.NumberFormat("cs-CZ", {
    style: "currency",
    currency: "CZK",
    maximumFractionDigits: 0,
  }).format(n || 0);

const todayISO = () => new Date().toISOString().slice(0, 10);

const uid = () => Math.random().toString(36).slice(2, 10);

// ─── Default state ────────────────────────────────────────────────────────────
const defaultState = {
  meta: {
    propertyName: "Ostrava — Nádražní 2965/9",
    purchasePrice: 0,
    mortgageAmount: 0,
    targetMonthlyRent: 0,
  },
  purchase: [],
  ongoing: [],
  income: [],
};

// ─── Main component ───────────────────────────────────────────────────────────
export default function FlatFinanceTracker() {
  const [state, setState] = useState(defaultState);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("dashboard");
  const [editingMeta, setEditingMeta] = useState(false);

  // Load from persistent storage on mount
  useEffect(() => {
    (async () => {
      try {
        const result = await window.storage.get(STORAGE_KEY);
        if (result?.value) {
          setState(JSON.parse(result.value));
        }
      } catch {
        // first run, no data yet
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Save whenever state changes (after initial load)
  useEffect(() => {
    if (loading) return;
    (async () => {
      try {
        await window.storage.set(STORAGE_KEY, JSON.stringify(state));
      } catch (e) {
        console.error("Failed to save:", e);
      }
    })();
  }, [state, loading]);

  // ─── Mutators ───────────────────────────────────────────────────────────────
  const addEntry = (section, entry) =>
    setState((s) => ({ ...s, [section]: [...s[section], { id: uid(), ...entry }] }));

  const removeEntry = (section, id) =>
    setState((s) => ({ ...s, [section]: s[section].filter((e) => e.id !== id) }));

  const updateMeta = (meta) => setState((s) => ({ ...s, meta }));

  // ─── Export / Import ────────────────────────────────────────────────────────
  const exportData = () => {
    const dataStr = JSON.stringify(state, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const date = new Date().toISOString().slice(0, 10);
    const a = document.createElement("a");
    a.href = url;
    a.download = `flat-finance-backup-${date}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportCSV = () => {
    const rows = [["Section", "Date", "Category", "Description", "Amount (CZK)", "Recurring", "Notes"]];
    state.purchase.forEach((e) =>
      rows.push(["Purchase", e.date, e.category, e.description || "", e.amount, "", e.notes || ""])
    );
    state.ongoing.forEach((e) =>
      rows.push(["Expense", e.date, e.category, e.description || "", e.amount, e.recurring ? "Monthly" : "", e.notes || ""])
    );
    state.income.forEach((e) =>
      rows.push(["Income", e.date, e.category, e.description || "", e.amount, e.recurring ? "Monthly" : "", e.notes || ""])
    );
    const csv = rows
      .map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const date = new Date().toISOString().slice(0, 10);
    const a = document.createElement("a");
    a.href = url;
    a.download = `flat-finance-${date}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const importData = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target.result);
        if (!imported.meta || !Array.isArray(imported.purchase)) {
          alert("Invalid backup file format.");
          return;
        }
        const confirmed = window.confirm(
          "This will REPLACE all current data with the imported backup. Continue?"
        );
        if (confirmed) setState(imported);
      } catch {
        alert("Could not read the file. Make sure it's a valid backup JSON.");
      }
    };
    reader.readAsText(file);
    event.target.value = ""; // reset so same file can be re-imported
  };

  // ─── Derived values ─────────────────────────────────────────────────────────
  const totals = useMemo(() => {
    const purchaseTotal = state.purchase.reduce((sum, e) => sum + Number(e.amount || 0), 0);
    const ongoingTotal = state.ongoing.reduce((sum, e) => sum + Number(e.amount || 0), 0);
    const incomeTotal = state.income.reduce((sum, e) => sum + Number(e.amount || 0), 0);

    // Monthly recurring (ongoing entries flagged recurring)
    const monthlyOngoing = state.ongoing
      .filter((e) => e.recurring)
      .reduce((sum, e) => sum + Number(e.amount || 0), 0);

    const monthlyIncome = state.income
      .filter((e) => e.recurring)
      .reduce((sum, e) => sum + Number(e.amount || 0), 0);

    const netMonthly = monthlyIncome - monthlyOngoing;
    const annualNet = netMonthly * 12;
    const grossYield = state.meta.purchasePrice
      ? ((monthlyIncome * 12) / state.meta.purchasePrice) * 100
      : 0;
    const netYield = state.meta.purchasePrice
      ? (annualNet / state.meta.purchasePrice) * 100
      : 0;

    const totalInvested = purchaseTotal + ongoingTotal - incomeTotal;

    return {
      purchaseTotal,
      ongoingTotal,
      incomeTotal,
      monthlyOngoing,
      monthlyIncome,
      netMonthly,
      annualNet,
      grossYield,
      netYield,
      totalInvested,
    };
  }, [state]);

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-stone-400 text-sm tracking-widest uppercase">Loading…</div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-stone-50 text-stone-900"
      style={{
        fontFamily: '"Inter", system-ui, sans-serif',
        backgroundImage:
          "radial-gradient(circle at 100% 0%, rgba(173, 162, 204, 0.08) 0%, transparent 50%), radial-gradient(circle at 0% 100%, rgba(159, 215, 213, 0.08) 0%, transparent 50%)",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=Inter:wght@400;500;600&display=swap');
        .font-display { font-family: 'Fraunces', Georgia, serif; font-variation-settings: "opsz" 144; }
        .tab-active { background: #1c1917; color: #fafaf9; }
        .card { background: white; border: 1px solid rgba(28, 25, 23, 0.08); border-radius: 12px; }
        .input-base {
          background: white;
          border: 1px solid rgba(28, 25, 23, 0.12);
          border-radius: 8px;
          padding: 8px 12px;
          font-size: 14px;
          color: #1c1917;
          outline: none;
          transition: border-color 0.15s;
        }
        .input-base:focus { border-color: #1c1917; }
        .btn-primary {
          background: #1c1917;
          color: #fafaf9;
          padding: 8px 16px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          transition: opacity 0.15s;
        }
        .btn-primary:hover { opacity: 0.85; }
        .btn-secondary {
          background: white;
          color: #1c1917;
          padding: 6px 12px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 500;
          border: 1px solid rgba(28, 25, 23, 0.12);
          display: inline-flex;
          align-items: center;
          gap: 6px;
          transition: all 0.15s;
        }
        .btn-secondary:hover { background: #fafaf9; border-color: rgba(28, 25, 23, 0.25); }
        .btn-ghost {
          color: #57534e;
          padding: 6px;
          border-radius: 6px;
          transition: all 0.15s;
        }
        .btn-ghost:hover { background: rgba(28, 25, 23, 0.06); color: #1c1917; }
      `}</style>

      <div className="max-w-6xl mx-auto px-6 py-10">
        {/* Header */}
        <header className="mb-10">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2 text-stone-500 text-xs tracking-widest uppercase mb-2">
                <Home size={12} />
                <span>Property Finance</span>
              </div>
              {editingMeta ? (
                <MetaEditor
                  meta={state.meta}
                  onSave={(m) => {
                    updateMeta(m);
                    setEditingMeta(false);
                  }}
                  onCancel={() => setEditingMeta(false)}
                />
              ) : (
                <div>
                  <h1 className="font-display text-4xl md:text-5xl font-medium tracking-tight">
                    {state.meta.propertyName}
                  </h1>
                  <button
                    onClick={() => setEditingMeta(true)}
                    className="text-stone-500 text-xs hover:text-stone-900 mt-2 flex items-center gap-1"
                  >
                    <Pencil size={11} /> Edit property details
                  </button>
                </div>
              )}
            </div>
            <div className="flex flex-col gap-2 items-end">
              <div className="flex gap-2 flex-wrap">
                <button onClick={exportData} className="btn-secondary" title="Download full backup as JSON">
                  <Download size={13} /> Backup (JSON)
                </button>
                <button onClick={exportCSV} className="btn-secondary" title="Export entries as CSV for Excel">
                  <Download size={13} /> CSV
                </button>
                <label className="btn-secondary cursor-pointer" title="Restore from a JSON backup">
                  <Upload size={13} /> Import
                  <input type="file" accept=".json" onChange={importData} className="hidden" />
                </label>
              </div>
              <span className="text-[10px] text-stone-400 tracking-wider uppercase">
                Backup regularly · data lives in Claude
              </span>
            </div>
          </div>
        </header>

        {/* Tabs */}
        <nav className="flex gap-1 mb-8 bg-white p-1 rounded-xl border border-stone-200 w-fit">
          {[
            { id: "dashboard", label: "Dashboard", icon: TrendingUp },
            { id: "purchase", label: "Purchase", icon: KeyRound },
            { id: "ongoing", label: "Expenses", icon: Receipt },
            { id: "income", label: "Income", icon: ArrowDownCircle },
          ].map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 ${
                  tab === t.id ? "tab-active" : "text-stone-600 hover:text-stone-900"
                }`}
              >
                <Icon size={14} />
                {t.label}
              </button>
            );
          })}
        </nav>

        {/* Content */}
        {tab === "dashboard" && <Dashboard totals={totals} meta={state.meta} state={state} />}
        {tab === "purchase" && (
          <EntrySection
            title="Purchase costs"
            subtitle="One-off costs to acquire the property — escrow, fees, mortgage drawdown, renovation."
            entries={state.purchase}
            categories={PURCHASE_CATEGORIES}
            onAdd={(e) => addEntry("purchase", e)}
            onRemove={(id) => removeEntry("purchase", id)}
            color="stone"
            showRecurring={false}
          />
        )}
        {tab === "ongoing" && (
          <EntrySection
            title="Ongoing expenses"
            subtitle="Monthly and ad-hoc costs — mortgage, SVJ, utilities, repairs. Flag the recurring ones."
            entries={state.ongoing}
            categories={ONGOING_CATEGORIES}
            onAdd={(e) => addEntry("ongoing", e)}
            onRemove={(id) => removeEntry("ongoing", id)}
            color="stone"
            showRecurring={true}
          />
        )}
        {tab === "income" && (
          <EntrySection
            title="Income"
            subtitle="Rent, deposits, reimbursements. Flag recurring rent for yield calculations."
            entries={state.income}
            categories={INCOME_CATEGORIES}
            onAdd={(e) => addEntry("income", e)}
            onRemove={(id) => removeEntry("income", id)}
            color="emerald"
            showRecurring={true}
          />
        )}

        <footer className="mt-16 pt-6 border-t border-stone-200 text-xs text-stone-400 text-center">
          Data saved automatically · all amounts in CZK
        </footer>
      </div>
    </div>
  );
}

// ─── Property meta editor ─────────────────────────────────────────────────────
function MetaEditor({ meta, onSave, onCancel }) {
  const [draft, setDraft] = useState(meta);
  return (
    <div className="card p-4 mt-2 max-w-xl">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label className="text-xs text-stone-500 col-span-2">
          Property name
          <input
            className="input-base w-full mt-1"
            value={draft.propertyName}
            onChange={(e) => setDraft({ ...draft, propertyName: e.target.value })}
          />
        </label>
        <label className="text-xs text-stone-500">
          Purchase price (CZK)
          <input
            type="number"
            className="input-base w-full mt-1"
            value={draft.purchasePrice}
            onChange={(e) => setDraft({ ...draft, purchasePrice: Number(e.target.value) })}
          />
        </label>
        <label className="text-xs text-stone-500">
          Mortgage amount (CZK)
          <input
            type="number"
            className="input-base w-full mt-1"
            value={draft.mortgageAmount}
            onChange={(e) => setDraft({ ...draft, mortgageAmount: Number(e.target.value) })}
          />
        </label>
        <label className="text-xs text-stone-500 col-span-2">
          Target monthly rent (CZK)
          <input
            type="number"
            className="input-base w-full mt-1"
            value={draft.targetMonthlyRent}
            onChange={(e) => setDraft({ ...draft, targetMonthlyRent: Number(e.target.value) })}
          />
        </label>
      </div>
      <div className="flex gap-2 mt-4">
        <button onClick={() => onSave(draft)} className="btn-primary">
          <Check size={14} /> Save
        </button>
        <button onClick={onCancel} className="btn-ghost">
          <X size={14} />
        </button>
      </div>
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
function Dashboard({ totals, meta, state }) {
  const equityInvested = totals.purchaseTotal - meta.mortgageAmount + totals.ongoingTotal - totals.incomeTotal;
  const recentTransactions = useMemo(() => {
    const all = [
      ...state.purchase.map((e) => ({ ...e, kind: "purchase", sign: -1 })),
      ...state.ongoing.map((e) => ({ ...e, kind: "expense", sign: -1 })),
      ...state.income.map((e) => ({ ...e, kind: "income", sign: 1 })),
    ];
    return all.sort((a, b) => (b.date || "").localeCompare(a.date || "")).slice(0, 8);
  }, [state]);

  return (
    <div className="space-y-6">
      {/* Top KPI row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KpiCard
          label="Total invested"
          value={fmtCZK(totals.totalInvested)}
          sublabel="Purchase + expenses − income received"
          icon={PiggyBank}
          accent="#1c1917"
        />
        <KpiCard
          label="Net monthly cash flow"
          value={fmtCZK(totals.netMonthly)}
          sublabel={`${fmtCZK(totals.monthlyIncome)} rent − ${fmtCZK(totals.monthlyOngoing)} costs`}
          icon={Wallet}
          accent={totals.netMonthly >= 0 ? "#059669" : "#dc2626"}
        />
        <KpiCard
          label="Net yield"
          value={`${totals.netYield.toFixed(2)} %`}
          sublabel={`Gross: ${totals.grossYield.toFixed(2)} %`}
          icon={Percent}
          accent="#1c1917"
        />
      </div>

      {/* Second row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MiniStat label="Purchase costs" value={fmtCZK(totals.purchaseTotal)} icon={KeyRound} />
        <MiniStat label="Expenses to date" value={fmtCZK(totals.ongoingTotal)} icon={ArrowUpCircle} />
        <MiniStat label="Income received" value={fmtCZK(totals.incomeTotal)} icon={ArrowDownCircle} accent="#059669" />
      </div>

      {/* Mortgage progress */}
      {meta.purchasePrice > 0 && (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-xs uppercase tracking-widest text-stone-500 mb-1">Financing breakdown</div>
              <div className="font-display text-2xl">{fmtCZK(meta.purchasePrice)}</div>
            </div>
            <div className="text-right text-xs text-stone-500">
              Equity invested: <span className="text-stone-900 font-medium">{fmtCZK(Math.max(0, equityInvested))}</span>
            </div>
          </div>
          <div className="h-3 bg-stone-100 rounded-full overflow-hidden flex">
            <div
              className="bg-stone-900"
              style={{
                width: `${Math.min(100, (meta.mortgageAmount / meta.purchasePrice) * 100)}%`,
              }}
              title="Mortgage"
            />
            <div
              className="bg-emerald-500"
              style={{
                width: `${Math.min(
                  100 - (meta.mortgageAmount / meta.purchasePrice) * 100,
                  ((meta.purchasePrice - meta.mortgageAmount) / meta.purchasePrice) * 100
                )}%`,
              }}
              title="Equity"
            />
          </div>
          <div className="flex justify-between text-xs text-stone-500 mt-2">
            <span>● Mortgage {fmtCZK(meta.mortgageAmount)}</span>
            <span>● Equity {fmtCZK(meta.purchasePrice - meta.mortgageAmount)}</span>
          </div>
        </div>
      )}

      {/* Recent transactions */}
      <div className="card p-6">
        <h3 className="font-display text-xl mb-4">Recent activity</h3>
        {recentTransactions.length === 0 ? (
          <div className="text-stone-400 text-sm py-8 text-center">
            No transactions yet — start by adding a purchase cost or expense.
          </div>
        ) : (
          <div className="divide-y divide-stone-100">
            {recentTransactions.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between py-3 text-sm">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      tx.kind === "income" ? "bg-emerald-500" : "bg-stone-400"
                    }`}
                  />
                  <div>
                    <div className="font-medium text-stone-900">{tx.description || tx.category}</div>
                    <div className="text-xs text-stone-500">
                      {tx.category} · {tx.date}
                    </div>
                  </div>
                </div>
                <div
                  className={`font-medium tabular-nums ${
                    tx.kind === "income" ? "text-emerald-600" : "text-stone-900"
                  }`}
                >
                  {tx.sign > 0 ? "+" : "−"} {fmtCZK(tx.amount)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Target rent comparison */}
      {meta.targetMonthlyRent > 0 && totals.monthlyIncome > 0 && (
        <div className="card p-6 flex items-center gap-4">
          <AlertCircle size={20} className="text-stone-400 flex-shrink-0" />
          <div className="text-sm text-stone-600">
            Current recurring rent <span className="font-medium text-stone-900">{fmtCZK(totals.monthlyIncome)}</span> vs.
            target <span className="font-medium text-stone-900">{fmtCZK(meta.targetMonthlyRent)}</span> —{" "}
            <span
              className={
                totals.monthlyIncome >= meta.targetMonthlyRent ? "text-emerald-600" : "text-amber-600"
              }
            >
              {totals.monthlyIncome >= meta.targetMonthlyRent ? "on target" : "below target"}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

function KpiCard({ label, value, sublabel, icon: Icon, accent }) {
  return (
    <div className="card p-6 relative overflow-hidden">
      <div className="flex items-start justify-between mb-3">
        <div className="text-xs uppercase tracking-widest text-stone-500">{label}</div>
        <Icon size={16} className="text-stone-400" />
      </div>
      <div className="font-display text-3xl font-medium tabular-nums" style={{ color: accent }}>
        {value}
      </div>
      <div className="text-xs text-stone-500 mt-2">{sublabel}</div>
    </div>
  );
}

function MiniStat({ label, value, icon: Icon, accent = "#1c1917" }) {
  return (
    <div className="card p-4 flex items-center gap-3">
      <div className="p-2 bg-stone-50 rounded-lg">
        <Icon size={16} style={{ color: accent }} />
      </div>
      <div>
        <div className="text-xs text-stone-500">{label}</div>
        <div className="font-medium tabular-nums" style={{ color: accent }}>
          {value}
        </div>
      </div>
    </div>
  );
}

// ─── Generic entry section ────────────────────────────────────────────────────
function EntrySection({ title, subtitle, entries, categories, onAdd, onRemove, color, showRecurring }) {
  const [showForm, setShowForm] = useState(false);
  const [draft, setDraft] = useState({
    date: todayISO(),
    category: categories[0],
    description: "",
    amount: "",
    recurring: false,
    notes: "",
  });

  const handleAdd = () => {
    if (!draft.amount || Number(draft.amount) <= 0) return;
    onAdd({ ...draft, amount: Number(draft.amount) });
    setDraft({
      date: todayISO(),
      category: categories[0],
      description: "",
      amount: "",
      recurring: false,
      notes: "",
    });
    setShowForm(false);
  };

  const total = entries.reduce((s, e) => s + Number(e.amount || 0), 0);

  // Group by category
  const grouped = useMemo(() => {
    const g = {};
    entries.forEach((e) => {
      if (!g[e.category]) g[e.category] = [];
      g[e.category].push(e);
    });
    return g;
  }, [entries]);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="font-display text-3xl font-medium mb-1">{title}</h2>
          <p className="text-sm text-stone-500 max-w-xl">{subtitle}</p>
        </div>
        <div className="text-right">
          <div className="text-xs uppercase tracking-widest text-stone-500">Total</div>
          <div
            className="font-display text-2xl font-medium tabular-nums"
            style={{ color: color === "emerald" ? "#059669" : "#1c1917" }}
          >
            {fmtCZK(total)}
          </div>
        </div>
      </div>

      <button onClick={() => setShowForm(!showForm)} className="btn-primary">
        <Plus size={14} /> Add entry
      </button>

      {showForm && (
        <div className="card p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <label className="text-xs text-stone-500">
              Date
              <input
                type="date"
                className="input-base w-full mt-1"
                value={draft.date}
                onChange={(e) => setDraft({ ...draft, date: e.target.value })}
              />
            </label>
            <label className="text-xs text-stone-500">
              Category
              <select
                className="input-base w-full mt-1"
                value={draft.category}
                onChange={(e) => setDraft({ ...draft, category: e.target.value })}
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs text-stone-500">
              Amount (CZK)
              <input
                type="number"
                className="input-base w-full mt-1"
                value={draft.amount}
                placeholder="0"
                onChange={(e) => setDraft({ ...draft, amount: e.target.value })}
              />
            </label>
            <label className="text-xs text-stone-500">
              Description
              <input
                className="input-base w-full mt-1"
                value={draft.description}
                placeholder="e.g. Escrow deposit Raiffeisen"
                onChange={(e) => setDraft({ ...draft, description: e.target.value })}
              />
            </label>
            <label className="text-xs text-stone-500 sm:col-span-2 lg:col-span-4">
              Notes (optional)
              <input
                className="input-base w-full mt-1"
                value={draft.notes}
                onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
              />
            </label>
            {showRecurring && (
              <label className="flex items-center gap-2 text-sm text-stone-700 sm:col-span-2 lg:col-span-4">
                <input
                  type="checkbox"
                  checked={draft.recurring}
                  onChange={(e) => setDraft({ ...draft, recurring: e.target.checked })}
                  className="rounded"
                />
                <CalendarClock size={14} className="text-stone-400" />
                This is a monthly recurring amount
              </label>
            )}
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={handleAdd} className="btn-primary">
              <Check size={14} /> Save entry
            </button>
            <button onClick={() => setShowForm(false)} className="btn-ghost px-3">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Grouped list */}
      {entries.length === 0 ? (
        <div className="card p-12 text-center text-stone-400 text-sm">
          No entries yet. Click "Add entry" to start tracking.
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped).map(([cat, items]) => {
            const catTotal = items.reduce((s, e) => s + Number(e.amount || 0), 0);
            return (
              <div key={cat} className="card overflow-hidden">
                <div className="px-5 py-3 bg-stone-50 border-b border-stone-100 flex items-center justify-between">
                  <span className="text-sm font-medium text-stone-700">{cat}</span>
                  <span
                    className="text-sm font-medium tabular-nums"
                    style={{ color: color === "emerald" ? "#059669" : "#1c1917" }}
                  >
                    {fmtCZK(catTotal)}
                  </span>
                </div>
                <div className="divide-y divide-stone-100">
                  {items
                    .sort((a, b) => (b.date || "").localeCompare(a.date || ""))
                    .map((e) => (
                      <div key={e.id} className="px-5 py-3 flex items-center justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-medium text-stone-900 truncate">
                              {e.description || e.category}
                            </span>
                            {e.recurring && (
                              <span className="text-[10px] uppercase tracking-wider bg-stone-100 text-stone-600 px-2 py-0.5 rounded-full flex items-center gap-1">
                                <CalendarClock size={10} /> monthly
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-stone-500 mt-0.5">
                            {e.date}
                            {e.notes && ` · ${e.notes}`}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span
                            className="text-sm font-medium tabular-nums"
                            style={{ color: color === "emerald" ? "#059669" : "#1c1917" }}
                          >
                            {fmtCZK(e.amount)}
                          </span>
                          <button
                            onClick={() => onRemove(e.id)}
                            className="btn-ghost"
                            title="Delete entry"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
