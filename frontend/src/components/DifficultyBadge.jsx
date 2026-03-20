export default function DifficultyBadge({ value }) {
  let colorClass = "bg-slate-500"; // fallback
  if (value <= 2) colorClass = "bg-emerald-500";
  else if (value === 3) colorClass = "bg-yellow-500";
  else if (value === 4) colorClass = "bg-orange-500";
  else if (value >= 5) colorClass = "bg-red-600";

  return (
    <div className="flex justify-center">
      <div 
        title={`Difficulté: ${value}`}
        className={`w-4 h-4 rounded-full shadow-sm ${colorClass} ring-4 ring-slate-50 dark:ring-slate-800 transition-transform hover:scale-125`}
      />
    </div>
  );
}

