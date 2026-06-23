interface ExerciseChecklistProps {
  exercises: { id: string; name: string; sets: number; reps: string; weight?: number }[];
  onToggle: (id: string) => void;
}

export default function ExerciseChecklist({ exercises, onToggle }: ExerciseChecklistProps) {
  return (
    <div className="space-y-2">
      {exercises.map((ex) => (
        <label key={ex.id} className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" onChange={() => onToggle(ex.id)} className="rounded" />
          <span>{ex.name}</span>
          <span className="text-gray-400 text-xs">{ex.sets}×{ex.reps}{ex.weight ? ` (${ex.weight}kg)` : ''}</span>
        </label>
      ))}
    </div>
  );
}
