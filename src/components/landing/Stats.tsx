import { useEffect, useRef, useState } from 'react';
import { Award, TrendingUp, Clock, BarChart2 } from 'lucide-react';
import { landingStatsConfig } from './landingConfig';

export function Stats() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hasAnimated, setHasAnimated] = useState(false);
  const [counts, setCounts] = useState<{ [key: string]: number }>({});

  const icons = [Award, TrendingUp, Clock, BarChart2];

  useEffect(() => {
    // Initialize counts to 0
    const initial: { [key: string]: number } = {};
    landingStatsConfig.forEach((s) => {
      initial[s.id] = 0;
    });
    setCounts(initial);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true);
        }
      },
      { threshold: 0.25 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [hasAnimated]);

  useEffect(() => {
    if (!hasAnimated) return;

    const duration = 1600; // 1.6 seconds
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const easeOut = 1 - Math.pow(1 - progress, 3);

      const nextCounts: { [key: string]: number } = {};
      landingStatsConfig.forEach((item) => {
        if (item.decimals && item.decimals > 0) {
          nextCounts[item.id] = Number((item.targetValue * easeOut).toFixed(item.decimals));
        } else {
          nextCounts[item.id] = Math.round(item.targetValue * easeOut);
        }
      });

      setCounts(nextCounts);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    const animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [hasAnimated]);

  return (
    <section
      ref={containerRef}
      aria-label="Platform Benchmarks"
      className="py-20 sm:py-24 bg-white border-b border-neutral-200/80"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <span className="text-[12px] font-bold text-neutral-500 uppercase tracking-widest">
            Operational Benchmarks
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0A0A0A] tracking-tight">
            Performance targets built into RealCRM.
          </h2>
        </div>

        {/* Dynamic Stats Grid based on landingStatsConfig */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {landingStatsConfig.map((item, index) => {
            const Icon = icons[index % icons.length];
            const rawVal = counts[item.id] ?? 0;
            const formattedVal =
              item.decimals && item.decimals > 0
                ? rawVal.toFixed(item.decimals)
                : rawVal.toLocaleString('en-IN');

            return (
              <div
                key={item.id}
                className="p-8 rounded-3xl bg-neutral-50/70 border border-neutral-200/80 hover:border-neutral-300 transition-all text-center flex flex-col items-center justify-between shadow-2xs hover:shadow-md"
              >
                <div className="w-12 h-12 rounded-2xl bg-white border border-neutral-200 flex items-center justify-center text-[#0A0A0A] mb-6 shadow-2xs">
                  <Icon className="w-6 h-6" />
                </div>

                <div className="space-y-2 mb-4">
                  <div className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[#0A0A0A] tracking-tight tabular-nums">
                    {item.prefix || ''}
                    {formattedVal}
                    {item.suffix}
                  </div>
                  <h3 className="text-lg font-bold text-neutral-900">{item.label}</h3>
                </div>

                <p className="text-sm text-neutral-600 max-w-xs leading-relaxed font-normal">
                  {item.sublabel}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
