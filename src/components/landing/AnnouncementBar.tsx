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
      className="relative z-50 bg-[#0A0A0A] text-white text-[13px] font-medium border-b border-neutral-800 transition-all duration-200"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between gap-4">
        {/* Centered Announcement Message */}
        <div className="flex-1 flex items-center justify-center gap-2 text-center text-neutral-300">
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-200 text-[11px] font-semibold tracking-wide uppercase border border-neutral-700">
            <Sparkles className="w-3 h-3 text-amber-400" />
            New in RealCRM
          </span>
          <span className="hidden sm:inline text-neutral-200">
            Video Lab 2.0 &amp; AI Creative Studio are now live for luxury real estate teams.
          </span>
          <span className="sm:hidden text-neutral-200">
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
            className="inline-flex items-center gap-1 text-white font-semibold underline underline-offset-4 decoration-neutral-500 hover:decoration-white hover:text-white transition-colors ml-1"
          >
            Learn more
            <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* Dismiss Button */}
        <button
          type="button"
          onClick={() => setIsVisible(false)}
          aria-label="Dismiss announcement banner"
          className="p-1 rounded-md text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
}

