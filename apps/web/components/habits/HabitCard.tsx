interface HabitCardProps {
  name: string;
  category: string;
  color: string;
  streak: number;
  completed: boolean;
  onToggle: () => void;
}

export default function HabitCard({ name, category, color, streak, completed, onToggle }: HabitCardProps) {
  return (
    <div
      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
        completed ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200 hover:border-gray-300'
      }`}
      onClick={onToggle}
    >
      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: color }} />
      <div className="flex-1">
        <p className="text-sm font-medium">{name}</p>
        <p className="text-xs text-gray-500">{category} · {streak} días</p>
      </div>
      {completed && <span className="text-xs text-green-600 font-medium">✓</span>}
    </div>
  );
}
