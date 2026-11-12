import {
  Video,
  MessageCircle,
  Users,
  Sparkles,
  Calendar,
  Zap,
  FolderGit2,
  BarChart3,
  ArrowUpRight,
} from 'lucide-react';

interface FeatureCard {
  title: string;
  description: string;
  tag: string;
  icon: React.ElementType;
  span?: string;
  gradient?: string;
}

export function BentoGrid() {
  const features: FeatureCard[] = [
    {
      title: 'Video Lab & Reel Engine',
      description: 'Turn property walk-throughs into viral vertical reels with speech captions, animated text hooks & punch-in zooms.',
      tag: 'Viral Video',
      icon: Video,
      span: 'md:col-span-2 lg:col-span-2',
      gradient: 'from-neutral-900 to-neutral-800 text-white',
    },
    {
      title: 'WhatsApp Cloud CRM',
      description: 'Trigger verified WhatsApp journeys with interactive brochures, site visit booking, and follow-up sequences in seconds.',
      tag: 'Meta Verified',
      icon: MessageCircle,
      span: 'md:col-span-1 lg:col-span-1',
    },
    {
      title: 'Omnichannel Lead Capture',
      description: 'Consolidate enquiries instantly from Meta Ads, 99acres, MagicBricks, and Google Ads with zero lead leakage.',
      tag: 'Zero Leakage',
      icon: Users,
      span: 'md:col-span-1 lg:col-span-1',
    },
    {
      title: 'AI Creative Studio',
      description: 'Day-to-dusk virtual transformation, luxury interior enhancement, and bespoke marketing poster generation.',
      tag: 'Generative AI',
      icon: Sparkles,
      span: 'md:col-span-2 lg:col-span-2',
    },
    {
      title: 'Broker Calendar & Visits',
      description: 'Automate site visit bookings with round-robin broker assignment and verified GPS visit check-ins.',
      tag: 'Smart Scheduling',
      icon: Calendar,
      span: 'md:col-span-1 lg:col-span-1',
    },
    {
      title: 'Campaign ROAS Tracker',
      description: 'Launch targeted Meta property ads with automatic creative testing and real-time cost-per-site-visit tracking.',
      tag: 'Budget Intelligence',
      icon: Zap,
      span: 'md:col-span-1 lg:col-span-1',
    },
    {
      title: 'Project Asset Library',
      description: 'Store and search high-resolution project B-roll, floor plans, RERA certificates, and master shot memories.',
      tag: 'Cloud Asset Hub',
      icon: FolderGit2,
      span: 'md:col-span-1 lg:col-span-1',
    },
    {
      title: 'Deal Velocity Analytics',
      description: 'Track broker response times, conversion funnels, luxury token payments, and revenue projections at a glance.',
      tag: 'Sales Intelligence',
      icon: BarChart3,
      span: 'md:col-span-3 lg:col-span-3',
    },
  ];

  return (
    <section id="features" className="py-20 sm:py-28 bg-neutral-50/50 border-b border-neutral-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center space-y-4 mb-16">
          <span className="text-[12px] font-bold text-neutral-500 uppercase tracking-widest">
            Architecture of a Modern Real Estate CRM
          </span>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-[#0A0A0A] tracking-tight">
            Engineered for high-converting property sales.
          </h2>
          <p className="text-base sm:text-lg text-neutral-600 font-normal leading-relaxed">
            Every feature is purpose-built for property developers, agency founders, and elite broker teams who want to operate 10x faster.
          </p>
        </div>

        {/* Responsive Bento Grid (8 Cards) */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-5">
          {features.map((feature) => {
            const Icon = feature.icon;
            const isDark = Boolean(feature.gradient);

            return (
              <div
                key={feature.title}
                className={`group relative rounded-3xl p-6 sm:p-7 border transition-all duration-200 flex flex-col justify-between hover:-translate-y-1.5 hover:shadow-xl cursor-default ${
                  feature.span || ''
                } ${
                  isDark
                    ? 'bg-neutral-900 text-white border-neutral-800 shadow-lg'
                    : 'bg-white text-neutral-900 border-neutral-200/90 shadow-2xs hover:border-neutral-300'
                }`}
              >
                {/* Top Card Bar */}
                <div className="flex items-start justify-between gap-4 mb-8">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-transform duration-200 group-hover:scale-105 ${
                        isDark
                          ? 'bg-neutral-800 text-white border border-neutral-700'
                          : 'bg-neutral-100 text-[#0A0A0A] border border-neutral-200'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <span
                      className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${
                        isDark
                          ? 'bg-neutral-800 text-neutral-300 border-neutral-700'
                          : 'bg-neutral-100 text-neutral-600 border-neutral-200'
                      }`}
                    >
                      {feature.tag}
                    </span>
                  </div>

                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 ${
                      isDark
                        ? 'text-neutral-400 group-hover:text-white group-hover:bg-neutral-800'
                        : 'text-neutral-400 group-hover:text-[#0A0A0A] group-hover:bg-neutral-100'
                    }`}
                  >
                    <ArrowUpRight className="w-4 h-4" />
                  </div>
                </div>

                {/* Bottom Content */}
                <div className="space-y-2">
                  <h3
                    className={`text-lg sm:text-xl font-bold tracking-tight ${
                      isDark ? 'text-white' : 'text-[#0A0A0A]'
                    }`}
                  >
                    {feature.title}
                  </h3>
                  <p
                    className={`text-sm leading-relaxed ${
                      isDark ? 'text-neutral-300' : 'text-neutral-600'
                    }`}
                  >
                    {feature.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

