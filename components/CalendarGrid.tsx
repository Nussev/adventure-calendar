export default function CalendarGrid({ totalDays = 30, completedDays = 7, activeDay = 8 }) {
  return (
    <div className="grid grid-cols-7 gap-1.5">
      {Array.from({ length: totalDays }, (_, i) => {
        const day = i + 1;
        const isCompleted = day <= completedDays;
        const isActive = day === activeDay;
        const isLocked = day > activeDay;

        return (
          <div
            key={day}
            className={[
              "aspect-square flex flex-col items-center justify-center rounded-lg text-xs font-bold select-none",
              isCompleted
                ? "bg-[#D85A30] text-white shadow-sm"
                : isActive
                ? "border-2 border-[#D85A30] text-[#D85A30] bg-orange-50 shadow-md ring-2 ring-[#D85A30]/20"
                : "bg-gray-100 text-gray-400",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            {isCompleted ? (
              <>
                <span className="text-[10px] leading-none opacity-70">{day}</span>
                <span className="text-sm leading-none mt-0.5">✓</span>
              </>
            ) : (
              <span>{day}</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
