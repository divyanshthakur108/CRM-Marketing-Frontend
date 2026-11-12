import { Building2 } from 'lucide-react';
import { landingBadgesConfig } from './landingConfig';

export function LogoMarquee() {
  // Duplicate for seamless 0 -> -50% infinite loop
  const marqueeList = [...landingBadgesConfig, ...landingBadgesConfig];

  return (
    <section aria-label="Target Real Estate Segments" className="py-12 sm:py-16 border-y border-neutral-200/80 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8 text-center">
        <p className="text-[12px] sm:text-[13px] font-bold text-neutral-500 uppercase tracking-widest">
          Built for real estate teams
        </p>
      </div>

      {/* Infinite Scrolling Track */}
      <div className="relative w-full overflow-hidden mask-gradient-x">
        {/* Soft edge fade overlays */}
        <div className="absolute left-0 top-0 bottom-0 w-16 sm:w-28 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-16 sm:w-28 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />

        <div className="animate-marquee pause-on-hover py-2">
          {marqueeList.map((item, index) => (
            <div
              key={`${item.name}-${index}`}
              className="inline-flex items-center gap-2.5 mx-3 sm:mx-5 px-4 py-2.5 rounded-xl border border-neutral-200/80 bg-neutral-50/60 hover:bg-neutral-100 transition-colors shrink-0 group select-none"
            >
              <div className="w-7 h-7 rounded-lg bg-neutral-900 text-white flex items-center justify-center font-bold text-xs group-hover:scale-105 transition-transform">
                <Building2 className="w-3.5 h-3.5" />
              </div>
              <div className="text-left">
                <div className="text-[14px] font-bold text-[#0A0A0A] tracking-tight whitespace-nowrap">
                  {item.name}
                </div>
                <div className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">
                  {item.tag}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
