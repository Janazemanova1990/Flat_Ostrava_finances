import type { LucideIcon } from "lucide-react";

type Props = {
  label: string;
  value: string;
  sublabel: string;
  icon: LucideIcon;
  valueColor?: string;
};

export function KpiCard({ label, value, sublabel, icon: Icon, valueColor = "#2d3b2d" }: Props) {
  return (
    <div className="bg-white border border-[#d4e0d4] rounded-xl p-4 sm:p-6">
      <div className="flex items-start justify-between mb-3">
        <div className="text-xs uppercase tracking-widest text-[#8faa8f]">{label}</div>
        <Icon size={16} className="text-[#8faa8f]" />
      </div>
      <div className="font-display text-3xl font-medium tabular-nums" style={{ color: valueColor }}>
        {value}
      </div>
      <div className="text-xs text-[#8faa8f] mt-2">{sublabel}</div>
    </div>
  );
}
