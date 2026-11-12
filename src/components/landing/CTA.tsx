import { ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';

interface CTAProps {
  onGetDemo?: () => void;
}

export function CTA({ onGetDemo }: CTAProps) {
  return (
    <section id="contact" className="py-20 sm:py-28 bg-[#0A0A0A] text-white relative overflow-hidden">
      {/* Subtle radial glow in background */}
      <div
        aria-hidden="true"
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-gradient-to-tr from-neutral-800/40 via-neutral-700/20 to-transparent blur-3xl -z-10 rounded-full pointer-events-none"
      />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-neutral-300 text-[12px] font-semibold tracking-wide uppercase">
          <Sparkles className="w-3 h-3 text-amber-400" />
          <span>Transform Your Sales Engine Today</span>
        </div>

        <h2 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight max-w-3xl mx-auto">
          Ready to scale your property transactions with AI?
        </h2>

        <p className="text-base sm:text-lg text-neutral-400 max-w-2xl mx-auto font-normal leading-relaxed">
          Start closing more luxury apartments and commercial units today. Automate your lead intake, video reels, and WhatsApp cadences in under 15 minutes.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={onGetDemo}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl text-[15px] font-bold text-[#0A0A0A] bg-white hover:bg-neutral-100 transition-all shadow-xl active:scale-[0.98]"
          >
            Get a demo
            <ArrowRight className="w-4 h-4" />
          </button>
          <Link
            to="/signup"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-4 rounded-2xl text-[15px] font-semibold text-white bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 transition-all"
          >
            Start free 14-day trial
          </Link>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-y-2 gap-x-6 text-[13px] text-neutral-400 pt-4 font-medium">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            No credit card required
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            5-minute onboarding
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            Dedicated real estate specialist
          </span>
        </div>
      </div>
    </section>
  );
}

