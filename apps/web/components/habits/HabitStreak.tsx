interface HabitStreakProps {
  streak: number;
}

export default function HabitStreak({ streak }: HabitStreakProps) {
  const days = Array.from({ length: 7 }, (_, i) => i < streak);
  return (
    <div className="flex gap-1">
      {days.map((active, i) => (
        <div
          key={i}
          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
            active ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-400'
          }`}
        >
          {i + 1}
        </div>
      ))}
    </div>
  );
}
