import type { LucideIcon } from "lucide-react";

type Props = { label: string; value: string; icon: LucideIcon; valueColor?: string };

export function MiniStat({ label, value, icon: Icon, valueColor = "#2d3b2d" }: Props) {
  return (
    <div className="bg-white border border-[#d4e0d4] rounded-xl p-4 flex items-center gap-3">
      <div className="p-2 bg-[#f4f7f4] rounded-lg">
        <Icon size={16} style={{ color: valueColor }} />
      </div>
      <div>
        <div className="text-xs text-[#8faa8f]">{label}</div>
        <div className="font-medium tabular-nums text-sm" style={{ color: valueColor }}>{value}</div>
      </div>
    </div>
  );
}
