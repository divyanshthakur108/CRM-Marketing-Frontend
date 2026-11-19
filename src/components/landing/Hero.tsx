import { useState } from 'react';
import {
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Play,
  Users,
  MessageSquare,
  Video,
  TrendingUp,
  ShieldCheck,
  Building2,
  Flame,
  Volume2,
  Check,
} from 'lucide-react';

interface HeroProps {
  onGetDemo?: () => void;
}

export function Hero({ onGetDemo }: HeroProps) {
  const [activeProfile, setActiveProfile] = useState<'LUXURY' | 'MINIMAL' | 'COMMERCIAL'>('LUXURY');

  return (
    <section className="relative pt-10 pb-20 md:pt-16 md:pb-32 overflow-hidden bg-gradient-to-b from-slate-50/80 via-white to-slate-50/50">
      {/* Background Architectural Grid Pattern */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-40 pointer-events-none -z-10"
      />

      {/* Ambient Lighting Orbs */}
      <div
        aria-hidden="true"
        className="absolute top-12 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-tr from-emerald-200/40 via-amber-100/30 to-blue-100/20 blur-3xl -z-10 rounded-full pointer-events-none"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* ================= HERO INTRO & TYPOGRAPHY ================= */}
        <div className="text-center max-w-4xl mx-auto space-y-6">
          {/* Eyebrow Pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/90 border border-slate-200/80 text-slate-800 text-[12px] font-bold tracking-wide uppercase shadow-xs backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-slate-900">AI Real Estate Operating System</span>
            <span className="text-slate-300">•</span>
            <span className="text-amber-600 flex items-center gap-1 font-semibold normal-case">
              <Sparkles className="w-3.5 h-3.5" />
              Video Lab 2.0 Live
            </span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-slate-950 leading-[1.07]">
            The all-in-one AI CRM built for{' '}
            <span className="block mt-1 sm:mt-2 bg-gradient-to-r from-slate-950 via-slate-800 to-emerald-950 bg-clip-text text-transparent">
              high-growth property teams.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto font-normal leading-relaxed">
            Capture enquiries from Meta and property portals, trigger instant verified WhatsApp follow-ups, synthesize studio-grade marketing reels with Video Lab, and close deals faster.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2">
            <button
              type="button"
              onClick={onGetDemo}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl text-[15px] font-bold text-white bg-slate-950 hover:bg-slate-800 transition-all shadow-[0_4px_14px_0_rgba(15,23,42,0.2)] hover:shadow-[0_6px_20px_rgba(15,23,42,0.3)] active:scale-[0.98] border border-slate-800 group"
            >
              <span>Get a demo</span>
              <ArrowRight className="w-4 h-4 text-slate-300 group-hover:translate-x-0.5 transition-transform" />
            </button>
            <a
              href="#features"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-4 rounded-2xl text-[15px] font-semibold text-slate-800 bg-white hover:bg-slate-50 border border-slate-200/90 transition-all shadow-xs hover:border-slate-300"
            >
              <Play className="w-4 h-4 fill-slate-800 text-slate-800" />
              <span>Watch 2-min tour</span>
            </a>
          </div>

          {/* Trust Checkmarks */}
          <div className="flex flex-wrap items-center justify-center gap-y-2 gap-x-6 text-[13px] text-slate-600 pt-1 font-medium">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              14-day free trial
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Zero setup fees
            </span>
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Meta &amp; WhatsApp Cloud verified
            </span>
            <span className="flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-emerald-600" />
              100% RERA compliant
            </span>
          </div>
        </div>

        {/* ================= INTERACTIVE PRODUCT SHOWCASE MOCKUP ================= */}
        <div className="mt-14 sm:mt-18 relative max-w-6xl mx-auto">
          {/* Layered Outer Glow */}
          <div className="absolute -inset-2 sm:-inset-4 bg-gradient-to-r from-emerald-500/10 via-amber-500/10 to-blue-500/10 rounded-3xl sm:rounded-[36px] blur-2xl -z-10" />

          {/* Main App Container */}
          <div className="rounded-2xl sm:rounded-3xl border border-slate-200/90 bg-white shadow-[0_20px_50px_rgba(15,23,42,0.1)] overflow-hidden">
            {/* Window Top Navigation Bar */}
            <div className="h-11 bg-slate-100/80 border-b border-slate-200 px-4 sm:px-5 flex items-center justify-between backdrop-blur-md">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-rose-400" />
                  <div className="w-3 h-3 rounded-full bg-amber-400" />
                  <div className="w-3 h-3 rounded-full bg-emerald-400" />
                </div>
                <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-slate-200 text-[11px] font-mono text-slate-500">
                  <span>app.realcrm.io</span>
                  <span className="text-slate-300">/</span>
                  <span className="text-slate-800 font-semibold">studio • rs-heritage</span>
                </div>
              </div>

              {/* Live Status Pill */}
              <div className="flex items-center gap-2 text-[11.5px] font-semibold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200/80 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <span>Live Sync Active • Meta &amp; WhatsApp Connected</span>
              </div>
            </div>

            {/* Dashboard Mockup Content */}
            <div className="p-4 sm:p-6 lg:p-7 bg-slate-50/50 space-y-5">
              {/* Top Stats Strip */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-2xs">
                  <div className="flex items-center justify-between text-slate-500 text-[12px] font-medium">
                    <span>Active Enquiries</span>
                    <Users className="w-4 h-4 text-slate-400" />
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-slate-950 mt-1 tabular-nums">2,480</div>
                  <div className="flex items-center gap-1 text-[11px] text-emerald-600 font-semibold mt-0.5">
                    <TrendingUp className="w-3 h-3" />
                    <span>+18.4% this month</span>
                  </div>
                </div>

                <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-2xs">
                  <div className="flex items-center justify-between text-slate-500 text-[12px] font-medium">
                    <span>Site Visits Booked</span>
                    <Flame className="w-4 h-4 text-amber-500" />
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-slate-950 mt-1 tabular-nums">142</div>
                  <div className="text-[11px] text-emerald-600 font-semibold mt-0.5">
                    94.2% response rate in &lt;90s
                  </div>
                </div>

                <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-2xs">
                  <div className="flex items-center justify-between text-slate-500 text-[12px] font-medium">
                    <span>Video Lab Reels</span>
                    <Video className="w-4 h-4 text-indigo-500" />
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-slate-950 mt-1 tabular-nums">38</div>
                  <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                    1080×1920 • 3 Design Profiles
                  </div>
                </div>

                <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-2xs">
                  <div className="flex items-center justify-between text-slate-500 text-[12px] font-medium">
                    <span>Pipeline Value</span>
                    <Sparkles className="w-4 h-4 text-amber-500" />
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-slate-950 mt-1 tabular-nums">₹48.6 Cr</div>
                  <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                    RS Heritage &amp; Skyline Hub
                  </div>
                </div>
              </div>

              {/* Core Feature Deep Dive Preview (Split Columns) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                {/* Left: Video Lab Reel Studio (7 cols) */}
                <div className="lg:col-span-7 bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-slate-950 text-white flex items-center justify-center shadow-xs">
                        <Video className="w-4.5 h-4.5 text-amber-400" />
                      </div>
                      <div>
                        <h4 className="text-[14.5px] font-bold text-slate-950 flex items-center gap-2">
                          <span>Video Lab 2.0: Luxury Reel Director</span>
                          <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                            Grade A+ (96/100)
                          </span>
                        </h4>
                        <p className="text-[11.5px] text-slate-500">
                          Decoupled 1080×1920 typography, safe-zone locked overlays &amp; ambient soundbed
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Profile Mode Selector Buttons */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveProfile('LUXURY')}
                      className={`px-3 py-1.5 rounded-xl text-[11.5px] font-bold transition-all ${
                        activeProfile === 'LUXURY'
                          ? 'bg-slate-950 text-amber-300 shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      👑 Luxury Editorial (18s)
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveProfile('MINIMAL')}
                      className={`px-3 py-1.5 rounded-xl text-[11.5px] font-bold transition-all ${
                        activeProfile === 'MINIMAL'
                          ? 'bg-slate-950 text-emerald-300 shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      🌿 Modern Minimal (15s)
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveProfile('COMMERCIAL')}
                      className={`px-3 py-1.5 rounded-xl text-[11.5px] font-bold transition-all ${
                        activeProfile === 'COMMERCIAL'
                          ? 'bg-slate-950 text-blue-300 shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      ⚡ Bold Commercial (12s)
                    </button>
                  </div>

                  {/* Video Lab Timeline Preview Player Box */}
                  <div className="p-4 bg-slate-950 rounded-2xl text-white space-y-3 shadow-inner">
                    <div className="flex items-center justify-between text-[11.5px]">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-400" />
                        <span className="font-semibold text-slate-200">
                          {activeProfile === 'LUXURY'
                            ? 'RS Heritage • Grand Penthouse Edition'
                            : activeProfile === 'MINIMAL'
                            ? 'The Grove Eco-Villas • Nature Architecture'
                            : 'Skyline HighStreet • Prime Commercial Boulevard'}
                        </span>
                      </div>
                      <span className="text-amber-300 font-mono text-[11px] bg-white/10 px-2 py-0.5 rounded-md">
                        1080×1920 (9:16) • -14 LUFS Audio Bed
                      </span>
                    </div>

                    {/* Timeline Multi-Shot Track */}
                    <div className="h-8 bg-slate-900 rounded-xl flex items-center p-1 gap-1 border border-slate-800">
                      <div className="h-full w-1/5 bg-amber-500/80 rounded-lg text-[9.5px] flex items-center justify-center font-extrabold text-black">
                        1. HOOK (3.2s)
                      </div>
                      <div className="h-full w-1/4 bg-blue-500/80 rounded-lg text-[9.5px] flex items-center justify-center font-bold">
                        2. LIVING LOUNGE
                      </div>
                      <div className="h-full w-1/4 bg-emerald-500/80 rounded-lg text-[9.5px] flex items-center justify-center font-bold">
                        3. MODULAR KITCHEN
                      </div>
                      <div className="h-full flex-1 bg-purple-500/80 rounded-lg text-[9.5px] flex items-center justify-center font-bold">
                        4. END CARD &amp; RERA
                      </div>
                    </div>

                    {/* Quality Badges */}
                    <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/80">
                      <span className="flex items-center gap-1 text-slate-300 font-medium">
                        <Check className="w-3.5 h-3.5 text-emerald-400" /> Top Safe $\ge$ 195px
                      </span>
                      <span className="flex items-center gap-1 text-slate-300 font-medium">
                        <Check className="w-3.5 h-3.5 text-emerald-400" /> Bottom Safe $\le$ 1540px
                      </span>
                      <span className="flex items-center gap-1 text-slate-300 font-medium">
                        <Check className="w-3.5 h-3.5 text-emerald-400" /> PBRERA-SAS80-PR0485 Verified
                      </span>
                      <span className="flex items-center gap-1 text-slate-300 font-medium">
                        <Volume2 className="w-3.5 h-3.5 text-amber-400" /> Warm Ambient Synth
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: WhatsApp Lead Concierge (5 cols) */}
                <div className="lg:col-span-5 bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs space-y-3.5">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                        <MessageSquare className="w-4.5 h-4.5" />
                      </div>
                      <div>
                        <h4 className="text-[14.5px] font-bold text-slate-950 flex items-center gap-1.5">
                          <span>Instant WhatsApp Concierge</span>
                          <span className="w-4 h-4 rounded-full bg-emerald-500 text-white inline-flex items-center justify-center text-[10px]">
                            ✓
                          </span>
                        </h4>
                        <p className="text-[11.5px] text-slate-500">
                          Automated qualification &amp; site visit booking
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* WhatsApp Chat Simulation */}
                  <div className="p-3 bg-emerald-50/40 rounded-2xl border border-emerald-100/70 space-y-2.5 text-[12px]">
                    <div className="p-3 rounded-2xl bg-white border border-slate-100 text-slate-800 shadow-2xs max-w-[90%] space-y-1">
                      <p className="font-medium">
                        👋 Namaste <strong>Rajesh ji</strong>! Thank you for inquiring about <strong>RS Heritage Residences</strong>.
                      </p>
                      <p className="text-slate-500 text-[11px]">
                        Here is the official RERA-approved brochure, floor plans &amp; pricing breakdown.
                      </p>
                    </div>

                    <div className="p-2.5 rounded-2xl bg-emerald-600 text-white max-w-[85%] ml-auto shadow-2xs">
                      Can I schedule a VIP site walkthrough this Saturday around 11:30 AM?
                    </div>

                    <div className="p-3 rounded-2xl bg-white border border-slate-100 text-slate-800 shadow-2xs max-w-[90%] space-y-1">
                      <div className="flex items-center gap-1.5 text-emerald-700 font-bold text-[11.5px]">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Site Visit Confirmed!</span>
                      </div>
                      <p className="text-slate-600 text-[11px]">
                        Assigned to Senior Broker <strong>Vikram Malhotra</strong>. Google Calendar invite and gate pass sent to your WhatsApp.
                      </p>
                    </div>
                  </div>

                  {/* AI Qualification Lead Card */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between text-[11.5px]">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                      <span className="font-bold text-slate-900">Lead Score: 96/100</span>
                    </div>
                    <span className="font-semibold text-slate-600">Budget: ₹3.8 Cr • High Intent</span>
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
