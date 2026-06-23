interface WorkoutCardProps {
  muscleGroup: string;
  completed: boolean;
  children?: React.ReactNode;
}

export default function WorkoutCard({ muscleGroup, completed, children }: WorkoutCardProps) {
  return (
    <div className={`rounded-xl p-4 border ${completed ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-sm">{muscleGroup}</h3>
        {completed && <span className="text-xs text-green-600 font-medium">✓ Completado</span>}
      </div>
      {children}
    </div>
  );
}
