import { useState } from 'react';
import { Sparkles, ArrowRight, X } from 'lucide-react';

interface AnnouncementBarProps {
  onLearnMore?: () => void;
}

export function AnnouncementBar({ onLearnMore }: AnnouncementBarProps) {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <aside
      aria-label="Product Announcement"
      className="relative z-50 bg-gradient-to-r from-neutral-950 via-slate-900 to-neutral-950 text-white text-[12.5px] font-medium border-b border-amber-500/20 shadow-xs"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex items-center justify-between gap-4">
        {/* Centered Announcement Message */}
        <div className="flex-1 flex items-center justify-center gap-2.5 text-center text-slate-300">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500/20 to-emerald-500/20 text-amber-300 text-[10.5px] font-bold tracking-wider uppercase border border-amber-500/30">
            <Sparkles className="w-3 h-3 text-amber-400 animate-pulse" />
            New Release
          </span>
          <span className="hidden sm:inline text-slate-200">
            Video Lab 2.0 &amp; Creative Studio V3 are live — synthesize 1080×1920 luxury reels in seconds.
          </span>
          <span className="sm:hidden text-slate-200 font-medium">
            Video Lab 2.0 is live!
          </span>
          <a
            href="#features"
            onClick={(e) => {
              if (onLearnMore) {
                e.preventDefault();
                onLearnMore();
              }
            }}
            className="inline-flex items-center gap-1 text-amber-300 hover:text-amber-200 font-semibold underline underline-offset-4 decoration-amber-400/40 hover:decoration-amber-300 transition-colors ml-1 text-[12px]"
          >
            Explore features
            <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* Dismiss Button */}
        <button
          type="button"
          onClick={() => setIsVisible(false)}
          aria-label="Dismiss announcement banner"
          className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-white/10 transition-colors shrink-0 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-400"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </aside>
  );
}
