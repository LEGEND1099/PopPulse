import type { BusinessType, TimeSlot } from "@/lib/types";

type LandingFilterCardProps = {
  businessType: BusinessType;
  timeSlot: TimeSlot;
  minScore: number;
  onBusinessTypeChange: (value: BusinessType) => void;
  onTimeSlotChange: (value: TimeSlot) => void;
  onMinScoreChange: (value: number) => void;
  onSubmit: () => void;
  visible: boolean;
};

export function LandingFilterCard({
  businessType,
  timeSlot,
  minScore,
  onBusinessTypeChange,
  onTimeSlotChange,
  onMinScoreChange,
  onSubmit,
  visible,
}: LandingFilterCardProps) {
  return (
    <section
      className={`absolute inset-0 flex items-center justify-center px-6 transition-all duration-700 ease-out ${
        visible
          ? "opacity-100 translate-y-0 scale-100"
          : "pointer-events-none opacity-0 translate-y-4 scale-[0.98]"
      }`}
    >
      <div className="w-full max-w-xl rounded-[2rem] bg-[rgba(168,18,23,0.92)] p-8 shadow-[0_30px_80px_rgba(88,7,16,0.38)]">
        <div className="text-center text-[#FBF0E3]">
          <h1 className="font-display text-5xl font-bold tracking-tight sm:text-6xl">PopPulse</h1>
          <p className="tagline-sparkle mt-3 text-sm uppercase tracking-[0.28em] text-[#FBF0E3] sm:text-base">
            Pop-up intelligence
          </p>
        </div>

        <div className="mt-8 space-y-5">
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-[#FBF0E3]">Business Type</span>
            <select
              value={businessType}
              onChange={(event) => onBusinessTypeChange(event.target.value as BusinessType)}
              className="w-full rounded-2xl border border-[#f6c7b5]/20 bg-[#FBF0E3] px-4 py-3 text-lg font-semibold text-[#D4161D] outline-none"
            >
              <option value="coffee">Coffee</option>
              <option value="food">Food</option>
              <option value="retail">Retail</option>
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-[#FBF0E3]">Time Slot</span>
            <select
              value={timeSlot}
              onChange={(event) => onTimeSlotChange(event.target.value as TimeSlot)}
              className="w-full rounded-2xl border border-[#f6c7b5]/20 bg-[#FBF0E3] px-4 py-3 text-lg font-semibold text-[#D4161D] outline-none"
            >
              <option value="morning">Morning</option>
              <option value="afternoon">Afternoon</option>
              <option value="evening">Evening</option>
            </select>
          </label>

          <label className="block">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-semibold text-[#FBF0E3]">Minimum Score</span>
              <span className="text-lg font-semibold text-[#FBF0E3]">{minScore}</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={minScore}
              onChange={(event) => onMinScoreChange(Number(event.target.value))}
              className="h-2 w-full cursor-pointer appearance-none rounded-full bg-[#ef6d55] accent-[#FBF0E3]"
            />
          </label>

          <button
            type="button"
            onClick={onSubmit}
            className="mt-2 w-full rounded-2xl bg-[#ff4a29] px-6 py-4 text-lg font-bold text-[#FBF0E3] transition hover:brightness-105"
          >
            Find Zones
          </button>
        </div>
      </div>
    </section>
  );
}
