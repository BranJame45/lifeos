interface ProgressBarProps { value: number; max: number; label?: string; color?: string; }

export default function ProgressBar({ value, max, label, color = 'bg-emerald-500' }: ProgressBarProps) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div>
      {label && <div className="flex justify-between text-sm mb-1"><span>{label}</span><span>{pct}%</span></div>}
      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
