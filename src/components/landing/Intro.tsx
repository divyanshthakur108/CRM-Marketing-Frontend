import { useState } from 'react';
import { Play, Sparkles, Clapperboard, MessageSquare, CalendarCheck, Shield } from 'lucide-react';

export function Intro() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    {
      title: 'Instant Multi-Channel Capture',
      desc: 'Sync leads automatically from Meta, Google Search Ads, 99acres & MagicBricks with zero leakage.',
      icon: MessageSquare,
    },
    {
      title: 'Verified WhatsApp Follow-up',
      desc: 'Send verified brochures, floor plans, and interactive WhatsApp site-visit booking buttons in <30 seconds.',
      icon: Sparkles,
    },
    {
      title: 'Video Lab Reel Generation',
      desc: 'Transform raw presenter clips into viral 9:16 reels with punch-in zoom, animated hooks & speech captions.',
      icon: Clapperboard,
    },
    {
      title: 'Broker Handover & Site Visit',
      desc: 'Intelligent round-robin lead allocation to top brokers with GPS-verified site visit check-ins.',
      icon: CalendarCheck,
    },
  ];

  return (
    <section id="intro" className="py-20 sm:py-28 bg-white border-b border-neutral-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Intro Copy Header */}
        <div className="max-w-3xl mx-auto text-center space-y-4 mb-16">
          <span className="text-[12px] font-bold text-neutral-500 uppercase tracking-widest">
            Autonomous Real Estate Pipeline
          </span>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-[#0A0A0A] tracking-tight">
            Stop losing 60% of property leads to slow follow-ups.
          </h2>
          <p className="text-base sm:text-lg text-neutral-600 leading-relaxed font-normal">
            Real estate buyers expect instant replies and video walkthroughs. RealCRM unifies AI content creation, automated WhatsApp qualification, and broker accountability in one seamless platform.
          </p>
        </div>

        {/* Media Block / Video Showcase Container */}
        <div className="max-w-5xl mx-auto rounded-3xl border border-neutral-200/90 bg-neutral-900 text-white overflow-hidden shadow-2xl relative">
          {/* Header of Video Preview */}
          <div className="px-6 py-4 bg-neutral-950/80 border-b border-neutral-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span className="text-[12px] font-mono text-neutral-400 ml-2">
                RealCRM-Product-Walkthrough.mp4 (4K 60fps)
              </span>
            </div>
            <div className="flex items-center gap-2 text-[12px] font-medium text-neutral-400">
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              SOC2 &amp; RERA Ready
            </div>
          </div>

          {/* Video Player Display Screen */}
          <div className="relative aspect-video w-full bg-neutral-950 flex flex-col items-center justify-center p-6 text-center overflow-hidden group">
            {/* Ambient Background Glow in Player */}
            <div className="absolute inset-0 bg-radial from-neutral-800/40 via-transparent to-neutral-950 -z-10" />

            {!isPlaying ? (
              <div className="space-y-6 z-10 max-w-xl">
                <button
                  type="button"
                  onClick={() => setIsPlaying(true)}
                  aria-label="Play RealCRM product tour video"
                  className="w-20 h-20 rounded-full bg-white text-[#0A0A0A] flex items-center justify-center mx-auto shadow-2xl hover:scale-105 active:scale-95 transition-all group-hover:bg-neutral-100"
                >
                  <Play className="w-8 h-8 fill-[#0A0A0A] ml-1 text-[#0A0A0A]" />
                </button>
                <div className="space-y-2">
                  <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                    Watch RealCRM in action (2 min)
                  </h3>
                  <p className="text-sm text-neutral-400">
                    See how a top developer generated 400+ qualified site visits and ₹18 Cr in bookings using RealCRM automated workflows.
                  </p>
                </div>
              </div>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-neutral-800 flex items-center justify-center animate-pulse">
                  <Play className="w-6 h-6 text-white" />
                </div>
                <p className="text-sm text-neutral-300">
                  Interactive live demo player initialized.
                </p>
                <button
                  type="button"
                  onClick={() => setIsPlaying(false)}
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-neutral-800 hover:bg-neutral-700 text-neutral-200"
                >
                  Close Preview
                </button>
              </div>
            )}

            {/* Bottom Scrubber Overlay */}
            <div className="absolute bottom-4 left-6 right-6 flex items-center justify-between text-[11px] text-neutral-400 font-mono">
              <span>01:14 / 02:30</span>
              <div className="flex-1 mx-4 h-1 bg-neutral-800 rounded-full overflow-hidden">
                <div className="h-full w-1/2 bg-white rounded-full" />
              </div>
              <span>1080p HD</span>
            </div>
          </div>

          {/* Stepper Strip below the video */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-neutral-800 bg-neutral-950/60 border-t border-neutral-800">
            {steps.map((s, idx) => {
              const Icon = s.icon;
              return (
                <div
                  key={s.title}
                  onClick={() => setActiveStep(idx)}
                  className={`p-5 transition-colors cursor-pointer select-none text-left ${
                    activeStep === idx ? 'bg-neutral-800/60' : 'hover:bg-neutral-900/50'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] font-bold tracking-wider uppercase px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-300">
                      Step {idx + 1}
                    </span>
                    <Icon className="w-4 h-4 text-neutral-400" />
                  </div>
                  <h4 className="text-[13px] font-bold text-white mb-1">{s.title}</h4>
                  <p className="text-[11px] text-neutral-400 leading-snug">{s.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
