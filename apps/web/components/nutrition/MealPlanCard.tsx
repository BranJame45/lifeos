interface MealPlanCardProps {
  type: string;
  description: string;
  completed: boolean;
  onToggle: () => void;
}

export default function MealPlanCard({ type, description, completed, onToggle }: MealPlanCardProps) {
  return (
    <div
      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
        completed ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'
      }`}
      onClick={onToggle}
    >
      <span className="text-xs font-medium text-gray-500 uppercase w-16">{type}</span>
      <p className="text-sm flex-1">{description}</p>
      {completed && <span className="text-xs text-green-600 font-medium">✓</span>}
    </div>
  );
}
