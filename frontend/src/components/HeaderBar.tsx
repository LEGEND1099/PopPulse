type HeaderTickerItem = {
  suburb: string
  score: number
}

type HeaderBarProps = {
  tickerItems: HeaderTickerItem[]
}

function SydneyDoodles() {
  return (
    <svg
      viewBox="0 0 860 170"
      className="h-[138px] w-[620px]"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <filter id="softShadow" x="-10%" y="-20%" width="130%" height="150%">
          <feDropShadow dx="0" dy="8" stdDeviation="7" floodColor="#A21A20" floodOpacity="0.12" />
        </filter>
      </defs>

      <g
        filter="url(#softShadow)"
        fill="none"
        stroke="#D4151C"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M4 115H130" />
        <path d="M130 115C150 115 165 112 182 112" />

        <path d="M200 112C208 68 220 39 232 18" />
        <path d="M216 18H248" />
        <path d="M219 28H245" />
        <path d="M222 39H242" />
        <path d="M232 18V6" />
        <path d="M232 41V112" />
        <path d="M224 67H240" />
        <path d="M227 81H237" />

        <path d="M254 112H282" />
        <path d="M278 112C284 96 295 80 312 66C308 81 309 96 315 112" />
        <path d="M312 112C323 83 341 62 367 50C359 69 360 94 367 112" />
        <path d="M366 112C381 77 406 57 440 48C428 68 429 94 438 112" />
        <path d="M438 112C450 87 466 72 487 64C481 79 481 97 486 112" />
        <path d="M486 112C495 93 507 81 522 76C518 88 519 100 522 112" />

        <path d="M525 112H552" />
        <path d="M552 112C567 104 581 94 596 80" />
        <path d="M596 80H620" />
        <path d="M620 80L644 103" />
        <path d="M644 103L658 90" />
        <path d="M658 90L672 103" />
        <path d="M672 103L686 87" />
        <path d="M686 87L700 103" />
        <path d="M700 103L716 86" />
        <path d="M716 86L730 102" />
        <path d="M730 102L746 84" />
        <path d="M596 112H748" />
        <path d="M646 112V88" />
        <path d="M729 112V86" />

        <path d="M758 112C766 112 774 98 774 82C774 67 779 57 785 51C789 72 795 97 804 112" />
        <path d="M798 112H856" />

        <path d="M104 110C110 94 120 82 136 74" />
        <path d="M108 112C113 103 119 95 127 89" />
        <path d="M109 120C118 118 126 113 132 105" />

        <path d="M162 101C170 93 176 87 183 80" />
        <path d="M162 113C170 110 177 103 184 95" />

        <path d="M305 26L311 36L322 40L311 44L305 56L299 44L288 40L299 36Z" />
        <path d="M585 24L590 33L600 37L590 41L585 51L580 41L570 37L580 33Z" />
      </g>
    </svg>
  )
}

function ScoreTicker({ items }: { items: HeaderTickerItem[] }) {
  const tickerItems = [...items, ...items]
  return (
    <div className="mt-3 overflow-hidden rounded-full bg-[#D4151C] px-4 py-2 text-[#F9F0E1]">
      <div className="ticker-track flex min-w-max items-center gap-6 whitespace-nowrap">
        {tickerItems.map((item, index) => (
          <div key={`${item.suburb}-${index}`} className="flex items-center gap-2 text-sm">
            <span className="font-semibold uppercase tracking-[0.14em]">{item.suburb}</span>
            <span className="rounded-full bg-[#F9F0E1] px-2 py-0.5 text-xs font-semibold text-[#D4151C]">
              {item.score.toFixed(1)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function HeaderBar({ tickerItems }: HeaderBarProps) {
  return (
    <header className="rounded-[2rem] bg-[#F9F0E1] px-6 py-5 text-[#D4151C] shadow-[0_22px_55px_rgba(109,17,21,0.16)]">
      <div className="flex items-center justify-between gap-1">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <h1 className="font-display text-5xl font-bold tracking-tight">PopPulse</h1>
          <p className="max-w-xl text-sm font-semibold uppercase tracking-[0.18em] text-[#1B120B]/78">
            Pop-up intelligence for Sydney retail, activations, and rollout timing.
          </p>
        </div>
        <div className="-ml-20 hidden shrink-0 lg:block">
          <SydneyDoodles />
        </div>
      </div>
      <ScoreTicker items={tickerItems} />
    </header>
  )
}
