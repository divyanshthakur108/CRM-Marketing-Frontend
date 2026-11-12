import { useState } from 'react';
import { Building, Users, CheckCircle2, ArrowRight, Sparkles } from 'lucide-react';

interface WaysToUseProps {
  onLearnMore?: (segment: string) => void;
}

export function WaysToUse({ onLearnMore }: WaysToUseProps) {
  const [activeTab, setActiveTab] = useState<'developer' | 'agency'>('developer');

  return (
    <section id="solutions" className="py-20 sm:py-28 bg-white border-b border-neutral-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center space-y-4 mb-14">
          <span className="text-[12px] font-bold text-neutral-500 uppercase tracking-widest">
            Tailored Real Estate Solutions
          </span>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-[#0A0A0A] tracking-tight">
            Built for how real estate actually sells.
          </h2>
          <p className="text-base sm:text-lg text-neutral-600 font-normal">
            Whether you are launching a ₹500 Cr township or scaling a 50-broker agency, RealCRM adapts to your workflow.
          </p>

          {/* Segment Selector Tabs */}
          <div className="inline-flex p-1.5 rounded-2xl bg-neutral-100 border border-neutral-200 mt-4">
            <button
              type="button"
              onClick={() => setActiveTab('developer')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                activeTab === 'developer'
                  ? 'bg-white text-[#0A0A0A] shadow-xs'
                  : 'text-neutral-600 hover:text-[#0A0A0A]'
              }`}
            >
              <Building className="w-4 h-4" />
              For Developers &amp; Builders
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('agency')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                activeTab === 'agency'
                  ? 'bg-white text-[#0A0A0A] shadow-xs'
                  : 'text-neutral-600 hover:text-[#0A0A0A]'
              }`}
            >
              <Users className="w-4 h-4" />
              For Brokerages &amp; Agencies
            </button>
          </div>
        </div>

        {/* 2 Ways Cards Display */}
        {activeTab === 'developer' ? (
          <div className="rounded-3xl border border-neutral-200/90 bg-neutral-50/60 p-6 sm:p-10 lg:p-12 shadow-sm grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Copy */}
            <div className="lg:col-span-6 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-900 text-white text-[11px] font-semibold tracking-wider uppercase">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Developer Suite
              </div>
              <h3 className="text-2xl sm:text-4xl font-extrabold text-[#0A0A0A] tracking-tight leading-tight">
                Launch multi-tower projects with zero marketing waste.
              </h3>
              <p className="text-neutral-600 text-base leading-relaxed">
                Coordinate high-volume digital campaigns across Meta and Google Ads, automatically route inbound leads by tower and configuration, and arm Channel Partners with verified marketing assets.
              </p>

              <div className="space-y-3 pt-2 text-sm text-neutral-700">
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>RERA Verified Creative Studio:</strong> Auto-overlay compliant project details, QR codes, and disclaimer banners on all social ads.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Channel Partner Portal:</strong> Give 500+ CP brokers individual tracking links and automated commission status.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Real-time ROAS Tracking:</strong> See exactly which ad campaign drove booked site visits and token advances.</span>
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="button"
                  onClick={() => onLearnMore && onLearnMore('developer')}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white bg-[#0A0A0A] hover:bg-neutral-800 transition-all shadow-xs"
                >
                  Learn more about Developer Suite
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Right Visual Card */}
            <div className="lg:col-span-6">
              <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-md space-y-4">
                <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                  <div className="flex items-center gap-2">
                    <Building className="w-5 h-5 text-neutral-800" />
                    <span className="font-bold text-sm text-[#0A0A0A]">The Grand Mirage • Phase II Launch</span>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    68% Sold Out
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-100">
                    <span className="text-xs text-neutral-500 block">Enquiries</span>
                    <span className="text-lg font-bold text-[#0A0A0A] tabular-nums">4,812</span>
                  </div>
                  <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-100">
                    <span className="text-xs text-neutral-500 block">Site Visits</span>
                    <span className="text-lg font-bold text-[#0A0A0A] tabular-nums">348</span>
                  </div>
                  <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-100">
                    <span className="text-xs text-neutral-500 block">Booked Units</span>
                    <span className="text-lg font-bold text-emerald-600 tabular-nums">42</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-neutral-900 text-white text-xs space-y-1.5">
                  <div className="flex justify-between text-neutral-300">
                    <span>Active Meta Campaign Budget:</span>
                    <span className="font-semibold text-white">₹8,50,000 / mo</span>
                  </div>
                  <div className="flex justify-between text-neutral-300">
                    <span>Cost per Qualified Site Visit:</span>
                    <span className="font-semibold text-emerald-400">₹2,440 (-38%)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-3xl border border-neutral-200/90 bg-neutral-50/60 p-6 sm:p-10 lg:p-12 shadow-sm grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Copy */}
            <div className="lg:col-span-6 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-900 text-white text-[11px] font-semibold tracking-wider uppercase">
                <Users className="w-3.5 h-3.5 text-blue-400" />
                Agency &amp; Brokerage Suite
              </div>
              <h3 className="text-2xl sm:text-4xl font-extrabold text-[#0A0A0A] tracking-tight leading-tight">
                Turn 10 to 100+ agents into high-velocity closers.
              </h3>
              <p className="text-neutral-600 text-base leading-relaxed">
                Eliminate internal lead squabbling with automated round-robin assignment, enforce sub-5-minute WhatsApp contact, and let your agents generate viral video walkthroughs directly on their phones.
              </p>

              <div className="space-y-3 pt-2 text-sm text-neutral-700">
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Instant Lead Handover:</strong> Distribute enquiries to active brokers via WhatsApp push notification with instant call buttons.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Video Lab Mobile Workflow:</strong> Agents upload raw walkthrough videos from site visits; RealCRM generates speech-captioned reels in 30s.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Leaderboard &amp; Follow-up Audits:</strong> Track each broker&apos;s site visit completion rate, token closures, and customer feedback.</span>
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="button"
                  onClick={() => onLearnMore && onLearnMore('agency')}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white bg-[#0A0A0A] hover:bg-neutral-800 transition-all shadow-xs"
                >
                  Learn more about Agency Suite
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Right Visual Card */}
            <div className="lg:col-span-6">
              <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-md space-y-4">
                <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-neutral-800" />
                    <span className="font-bold text-sm text-[#0A0A0A]">Top Performer Broker Leaderboard</span>
                  </div>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-neutral-100 text-neutral-700">
                    November 2026
                  </span>
                </div>

                <div className="space-y-2.5">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-neutral-50 border border-neutral-100 text-xs">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-neutral-900 text-white font-bold flex items-center justify-center text-[10px]">1</div>
                      <div>
                        <div className="font-bold text-[#0A0A0A]">Arjun Verma</div>
                        <div className="text-neutral-500">Avg response: 1m 40s</div>
                      </div>
                    </div>
                    <span className="font-bold text-emerald-600">₹8.4 Cr Closed</span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-neutral-50 border border-neutral-100 text-xs">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-neutral-200 text-neutral-800 font-bold flex items-center justify-center text-[10px]">2</div>
                      <div>
                        <div className="font-bold text-[#0A0A0A]">Neha Sharma</div>
                        <div className="text-neutral-500">Avg response: 2m 15s</div>
                      </div>
                    </div>
                    <span className="font-bold text-emerald-600">₹6.2 Cr Closed</span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-neutral-50 border border-neutral-100 text-xs">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-neutral-200 text-neutral-800 font-bold flex items-center justify-center text-[10px]">3</div>
                      <div>
                        <div className="font-bold text-[#0A0A0A]">Karan Kapoor</div>
                        <div className="text-neutral-500">Avg response: 2m 50s</div>
                      </div>
                    </div>
                    <span className="font-bold text-emerald-600">₹5.1 Cr Closed</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
