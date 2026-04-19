type IntroScreenProps = {
  onContinue: () => void;
  visible: boolean;
};

export function IntroScreen({ onContinue, visible }: IntroScreenProps) {
  return (
    <section
      className={`absolute inset-0 flex items-center justify-center px-6 transition-all duration-700 ease-out ${
        visible ? "opacity-100 scale-100" : "pointer-events-none opacity-0 scale-[1.02]"
      }`}
      onClick={onContinue}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          onContinue();
        }
      }}
    >
      <div className="text-center text-[#FBF0E3]">
        <h1 className="font-display text-7xl font-bold leading-none tracking-tight sm:text-8xl md:text-9xl">
          PopPulse
        </h1>
        <p className="tagline-sparkle mt-4 text-lg uppercase tracking-[0.28em] text-[#FBF0E3] sm:text-xl">
          Pop-up intelligence
        </p>
      </div>
    </section>
  );
}
