"use client"

type IntroOverlayProps = {
  visible: boolean
  onEnter: () => void
}

export function IntroOverlay({ visible, onEnter }: IntroOverlayProps) {
  return (
    <div
      className={`fixed inset-0 z-[80] flex items-center justify-center bg-[linear-gradient(180deg,#e56b6f_0%,#d4151c_100%)] transition-all duration-700 ${
        visible ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
      }`}
    >
      <button
        type="button"
        onClick={onEnter}
        className={`group relative rounded-[2.5rem] px-12 py-10 text-center transition-all duration-700 ${
          visible ? "scale-100 opacity-100" : "scale-90 opacity-0"
        }`}
      >
        <span className="sparkle sparkle-one" />
        <span className="sparkle sparkle-two" />
        <span className="sparkle sparkle-three" />
        <span className="sparkle sparkle-four" />
        <span className="relative block font-display text-7xl font-bold tracking-tight text-[#F9F0E1] drop-shadow-[0_18px_35px_rgba(92,12,17,0.28)] md:text-8xl">
          PopPulse
        </span>
      </button>
    </div>
  )
}
