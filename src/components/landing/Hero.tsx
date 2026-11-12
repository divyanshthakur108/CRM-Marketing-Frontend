import { ArrowRight, Sparkles, CheckCircle2, Play, Users, MessageSquare, Video, TrendingUp } from 'lucide-react';

interface HeroProps {
  onGetDemo?: () => void;
}

export function Hero({ onGetDemo }: HeroProps) {
  return (
    <section className="relative pt-12 pb-20 md:pt-20 md:pb-32 overflow-hidden bg-gradient-to-b from-neutral-50/60 via-white to-neutral-50/40">
      {/* Subtle background glow */}
      <div
        aria-hidden="true"
        className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-gradient-to-tr from-neutral-200/50 via-neutral-100/30 to-transparent blur-3xl -z-10 rounded-full pointer-events-none"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Copy */}
        <div className="text-center max-w-4xl mx-auto space-y-6">
          {/* Eyebrow Pill */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-100 border border-neutral-200 text-neutral-800 text-[12px] font-semibold tracking-wide uppercase shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>AI Real Estate Sales &amp; Marketing OS</span>
          </div>

          {/* Main Heading */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-[#0A0A0A] leading-[1.08]">
            The all-in-one AI CRM built for{' '}
            <span className="bg-gradient-to-r from-neutral-900 via-neutral-700 to-neutral-900 bg-clip-text text-transparent">
              high-growth property teams.
            </span>
          </h1>

          {/* Subtext */}
          <p className="text-lg sm:text-xl text-neutral-600 max-w-2xl mx-auto font-normal leading-relaxed">
            Capture enquiries from Meta and property portals, trigger instant verified WhatsApp follow-ups, synthesize studio-grade marketing reels with Video Lab, and close deals faster.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={onGetDemo}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-2xl text-[15px] font-bold text-white bg-[#0A0A0A] hover:bg-neutral-800 transition-all shadow-md hover:shadow-xl active:scale-[0.98]"
            >
              Get a demo
              <ArrowRight className="w-4 h-4" />
            </button>
            <a
              href="#intro"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl text-[15px] font-semibold text-neutral-800 bg-white hover:bg-neutral-100 border border-neutral-200 transition-all shadow-2xs"
            >
              <Play className="w-4 h-4 fill-neutral-800 text-neutral-800" />
              Watch 2-min tour
            </a>
          </div>

          {/* Micro Trust Proof */}
          <div className="flex flex-wrap items-center justify-center gap-y-2 gap-x-6 text-[13px] text-neutral-500 pt-2 font-medium">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              14-day free trial
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Zero setup fees
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Meta &amp; WhatsApp Cloud verified
            </span>
          </div>
        </div>

        {/* Dashboard Preview Section */}
        <div className="mt-12 sm:mt-16 relative max-w-6xl mx-auto">
          {/* Subtle outer glow */}
          <div className="absolute -inset-2 sm:-inset-4 bg-gradient-to-b from-neutral-200/60 to-neutral-300/20 rounded-3xl sm:rounded-[32px] blur-xl -z-10" />

          {/* Mockup Frame */}
          <div className="rounded-2xl sm:rounded-3xl border border-neutral-200/90 bg-white shadow-2xl overflow-hidden">
            {/* Mock Window Controls Header */}
            <div className="h-10 bg-neutral-100/90 border-b border-neutral-200 px-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-neutral-300" />
                <div className="w-3 h-3 rounded-full bg-neutral-300" />
                <div className="w-3 h-3 rounded-full bg-neutral-300" />
                <span className="ml-3 text-[11px] font-medium text-neutral-500">app.realcrm.io/dashboard</span>
              </div>
              <div className="flex items-center gap-2 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                Live Sync Active
              </div>
            </div>

            {/* Mock Dashboard Body */}
            <div className="p-4 sm:p-6 lg:p-8 bg-neutral-50/60 space-y-6">
              {/* Stat Cards Strip */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                <div className="p-4 bg-white rounded-2xl border border-neutral-200 shadow-2xs">
                  <div className="flex items-center justify-between text-neutral-500 text-[12px] font-medium">
                    <span>Active Leads</span>
                    <Users className="w-4 h-4 text-neutral-400" />
                  </div>
                  <div className="text-xl sm:text-2xl font-bold text-[#0A0A0A] mt-1 tabular-nums">2,480</div>
                  <span className="text-[11px] text-emerald-600 font-medium">+18% this month</span>
                </div>

                <div className="p-4 bg-white rounded-2xl border border-neutral-200 shadow-2xs">
                  <div className="flex items-center justify-between text-neutral-500 text-[12px] font-medium">
                    <span>Site Visits Booked</span>
                    <TrendingUp className="w-4 h-4 text-neutral-400" />
                  </div>
                  <div className="text-xl sm:text-2xl font-bold text-[#0A0A0A] mt-1 tabular-nums">142</div>
                  <span className="text-[11px] text-emerald-600 font-medium">94% response rate</span>
                </div>

                <div className="p-4 bg-white rounded-2xl border border-neutral-200 shadow-2xs">
                  <div className="flex items-center justify-between text-neutral-500 text-[12px] font-medium">
                    <span>AI Reels Produced</span>
                    <Video className="w-4 h-4 text-neutral-400" />
                  </div>
                  <div className="text-xl sm:text-2xl font-bold text-[#0A0A0A] mt-1 tabular-nums">38</div>
                  <span className="text-[11px] text-emerald-600 font-medium">Auto-synced to Meta</span>
                </div>

                <div className="p-4 bg-white rounded-2xl border border-neutral-200 shadow-2xs">
                  <div className="flex items-center justify-between text-neutral-500 text-[12px] font-medium">
                    <span>Pipeline Value</span>
                    <Sparkles className="w-4 h-4 text-neutral-400" />
                  </div>
                  <div className="text-xl sm:text-2xl font-bold text-[#0A0A0A] mt-1 tabular-nums">₹46.2 Cr</div>
                  <span className="text-[11px] text-neutral-500 font-medium">16 luxury units in token</span>
                </div>
              </div>

              {/* Mock Two-Column Core Feature UI */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                {/* Left: Video Lab & AI Reel Studio Preview */}
                <div className="lg:col-span-7 bg-white rounded-2xl p-5 border border-neutral-200 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-neutral-900 text-white flex items-center justify-center">
                        <Video className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-[14px] font-bold text-[#0A0A0A]">Video Lab: Creator Reel Builder</h4>
                        <p className="text-[11px] text-neutral-500">Automated A-roll speech captions, animated hook &amp; B-roll cuts</p>
                      </div>
                    </div>
                    <span className="text-[11px] font-semibold bg-neutral-900 text-white px-2.5 py-1 rounded-full">
                      Ready to Render
                    </span>
                  </div>

                  {/* Mock Video Lab Timeline Bar */}
                  <div className="p-3 bg-neutral-900 rounded-xl text-white space-y-2">
                    <div className="flex items-center justify-between text-[11px] text-neutral-400">
                      <span>Preview Reel: Luxury 4BHK Penthouse</span>
                      <span className="text-emerald-400 font-mono">00:32 / 00:32 • 1080x1920</span>
                    </div>
                    <div className="h-6 bg-neutral-800 rounded-lg flex items-center p-1 gap-1">
                      <div className="h-full w-1/4 bg-amber-500/80 rounded text-[9px] flex items-center justify-center font-bold text-black">HOOK</div>
                      <div className="h-full w-1/3 bg-blue-500/80 rounded text-[9px] flex items-center justify-center font-bold">LIVING ROOM</div>
                      <div className="h-full w-1/4 bg-emerald-500/80 rounded text-[9px] flex items-center justify-center font-bold">TERRACE</div>
                      <div className="h-full flex-1 bg-purple-500/80 rounded text-[9px] flex items-center justify-center font-bold">CALL TO ACTION</div>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-neutral-300">
                      <span>✓ VidStab Active</span>
                      <span>✓ Color Balanced</span>
                      <span>✓ EBU -14 LUFS Loudness</span>
                    </div>
                  </div>
                </div>

                {/* Right: WhatsApp Lead Journey Preview */}
                <div className="lg:col-span-5 bg-white rounded-2xl p-5 border border-neutral-200 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
                        <MessageSquare className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-[14px] font-bold text-[#0A0A0A]">Instant WhatsApp Lead Journey</h4>
                        <p className="text-[11px] text-neutral-500">Auto-qualification &amp; site visit booking</p>
                      </div>
                    </div>
                  </div>

                  {/* Mock Chat Bubble Stream */}
                  <div className="space-y-2 text-[12px]">
                    <div className="p-2.5 rounded-xl bg-neutral-100 max-w-[85%] text-neutral-800">
                      👋 Hi Rajesh, thank you for your enquiry on <strong>The Grand Mirage Luxury Suites</strong>! Here is the official brochure &amp; floor plan.
                    </div>
                    <div className="p-2.5 rounded-xl bg-emerald-600 text-white max-w-[85%] ml-auto">
                      Can I visit this Saturday around 11:30 AM?
                    </div>
                    <div className="p-2.5 rounded-xl bg-neutral-100 max-w-[85%] text-neutral-800 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      Confirmed! Assigned to Senior Broker Vikram. Calendar invite sent.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

