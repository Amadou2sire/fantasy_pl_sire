export default function DifficultyBadge({ value }) {
  let colorClass = "bg-slate-500"; // fallback
  if (value <= 2) colorClass = "bg-emerald-500";
  else if (value === 3) colorClass = "bg-yellow-500";
  else if (value === 4) colorClass = "bg-orange-500";
  else if (value >= 5) colorClass = "bg-red-600";

  return (
    <div className="flex justify-center">
      <span className={`w-8 h-8 flex items-center justify-center rounded-lg text-white font-bold shadow-sm ${colorClass}`}>
        {value || "-"}
      </span>
    </div>
  );
}
