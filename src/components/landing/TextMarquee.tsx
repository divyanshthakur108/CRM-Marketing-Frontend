import { Sparkles } from 'lucide-react';

export function TextMarquee() {
  const marqueeItems = [
    'AUTOMATED LEAD CAPTURE',
    'CREATOR PROPERTY REELS',
    'VERIFIED WHATSAPP JOURNEYS',
    'VIRTUAL STAGING & ENHANCEMENT',
    'BROKER SITE VISIT TRACKING',
    'AI CAMPAIGN OPTIMIZATION',
    'ZERO LEAD LEAKAGE',
    'REAL ESTATE SALES INTELLIGENCE',
  ];

  // Repeat for seamless loop
  const list = [...marqueeItems, ...marqueeItems];

  return (
    <section
      aria-label="Platform Highlights"
      className="py-8 bg-[#0A0A0A] text-white border-y border-neutral-800 overflow-hidden select-none"
    >
      <div className="relative w-full overflow-hidden mask-gradient-x">
        <div className="animate-marquee-slow pause-on-hover py-1 flex items-center">
          {list.map((item, index) => (
            <div
              key={`${item}-${index}`}
              className="inline-flex items-center gap-6 mx-6 shrink-0"
            >
              <span className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-wider uppercase text-neutral-200 hover:text-white transition-colors">
                {item}
              </span>
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-neutral-600 shrink-0" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

