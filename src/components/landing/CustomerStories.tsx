import { ArrowRight, Building2, Quote, Sparkles } from 'lucide-react';
import { landingCustomerStoriesConfig } from './landingConfig';

export function CustomerStories() {
  return (
    <section id="customers" className="py-20 sm:py-28 bg-neutral-50/40 border-b border-neutral-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center space-y-4 mb-16">
          <span className="text-[12px] font-bold text-neutral-500 uppercase tracking-widest">
            User Workflows &amp; Experiences
          </span>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-[#0A0A0A] tracking-tight">
            How real estate professionals work with RealCRM.
          </h2>
          <p className="text-base sm:text-lg text-neutral-600 font-normal">
            Illustrated customer scenarios showing everyday lead management and video production workflows.
          </p>
        </div>

        {/* 2 Big Testimonial Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {landingCustomerStoriesConfig.map((story, idx) => (
            <div
              key={idx}
              className="rounded-3xl border border-neutral-200/90 bg-white p-8 sm:p-10 shadow-xs hover:shadow-lg transition-all duration-200 flex flex-col justify-between space-y-6"
            >
              {/* Card Top: Company Tag & Sample Label */}
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-neutral-900 text-white flex items-center justify-center">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-[#0A0A0A]">{story.companyType}</h4>
                      <p className="text-[11px] text-neutral-500 font-medium">{story.category}</p>
                    </div>
                  </div>
                  {story.isSample && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600 border border-neutral-200">
                      <Sparkles className="w-3 h-3 text-neutral-500" />
                      Sample workflow
                    </span>
                  )}
                </div>

                <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-100">
                  <div className="text-xl sm:text-2xl font-bold text-[#0A0A0A] tracking-tight">
                    {story.headlineMetric}
                  </div>
                  <div className="text-xs text-neutral-600 mt-1 font-medium">
                    {story.metricLabel}
                  </div>
                </div>

                {/* Quote */}
                <div className="relative">
                  <Quote className="w-8 h-8 text-neutral-200 absolute -top-3 -left-2 -z-10" />
                  <p className="text-neutral-700 text-sm sm:text-base leading-relaxed italic">
                    &ldquo;{story.quote}&rdquo;
                  </p>
                </div>
              </div>

              {/* Author Footer & Case Study Link */}
              <div className="pt-6 border-t border-neutral-100 flex items-center justify-between">
                <div>
                  <h5 className="font-bold text-sm text-[#0A0A0A]">{story.authorRole}</h5>
                  <p className="text-xs text-neutral-500">Real estate workflow scenario</p>
                </div>
                <a
                  href="#contact"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0A0A0A] hover:text-neutral-600 transition-colors group"
                >
                  Explore workflow
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
