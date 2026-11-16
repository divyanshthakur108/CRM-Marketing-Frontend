import { Link } from 'react-router-dom';
import { Plus, Sparkles, ArrowUpRight, Building2 } from 'lucide-react';
import { AuthUser } from '../../store/useAuthStore';

export interface WelcomeBannerProps {
  user: AuthUser | null;
}

export function WelcomeBanner({ user }: WelcomeBannerProps) {
  // Use actual authenticated user's name; never fall back to generic role titles
  const rawName = user?.name?.trim();
  const firstName = rawName
    ? rawName.split(' ')[0]
    : user?.email
    ? user.email.split('@')[0]
    : '';

  const orgName = user?.organizationName?.trim() || 'RealCRM Workspace';

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#064E3B] via-[#065F46] to-[#047857] text-white shadow-[0_12px_24px_-4px_rgba(6,78,59,0.18)] border border-emerald-800/40">
      {/* Decorative ambient background glows */}
      <div
        className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-emerald-400/10 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-16 left-1/3 h-56 w-56 rounded-full bg-teal-300/10 blur-2xl"
        aria-hidden="true"
      />

      <div className="relative z-10 flex flex-col md:flex-row items-center justify-between p-6 sm:p-8 lg:p-10 gap-6">
        {/* Left Column: Greeting, Description & Quick Actions */}
        <div className="max-w-xl space-y-4 text-center md:text-left">
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-900/50 px-3 py-1 text-xs font-medium text-emerald-200 border border-emerald-700/50 backdrop-blur-xs">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>{orgName}</span>
          </div>

          <div className="space-y-1.5">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Welcome back{firstName ? `, ${firstName}` : ''}! 👋
            </h1>
            <p className="text-sm sm:text-base text-emerald-100/90 leading-relaxed max-w-lg">
              Monitor active ad campaigns, track site visits, and nurture high-intent property buyer leads across all channels.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-2">
            <Link
              to="/campaigns"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-[#065F46] font-semibold text-sm shadow-sm hover:bg-emerald-50 active:scale-[0.98] transition-all"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>New Campaign</span>
            </Link>

            <Link
              to="/projects/new"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-950/40 text-white font-medium text-sm border border-emerald-400/30 hover:bg-emerald-900/50 hover:border-emerald-400/50 active:scale-[0.98] transition-all backdrop-blur-xs"
              title="Add property information, photos, pricing and units"
            >
              <Building2 className="w-4 h-4 text-emerald-300" />
              <span>+ Add Property</span>
            </Link>

            <Link
              to="/studio"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-950/40 text-white font-medium text-sm border border-emerald-400/30 hover:bg-emerald-900/50 hover:border-emerald-400/50 active:scale-[0.98] transition-all backdrop-blur-xs"
            >
              <Sparkles className="w-4 h-4 text-emerald-300" />
              <span>Creation Studio</span>
              <ArrowUpRight className="w-3.5 h-3.5 opacity-60" />
            </Link>
          </div>
        </div>

        {/* Right Column: Original Architectural Vector Graphic */}
        <div className="hidden sm:flex shrink-0 items-center justify-center pr-2" aria-hidden="true">
          <svg
            className="w-48 h-36 md:w-60 md:h-44 drop-shadow-lg"
            viewBox="0 0 240 180"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Ground plane grid */}
            <path
              d="M20 150 L120 110 L220 150 L120 178 Z"
              fill="rgba(16, 185, 129, 0.12)"
              stroke="rgba(110, 231, 183, 0.25)"
              strokeWidth="1"
            />
            {/* Modern Main Tower Building */}
            <path
              d="M80 50 L120 30 L160 50 L160 140 L120 160 L80 140 Z"
              fill="rgba(255, 255, 255, 0.12)"
              stroke="rgba(255, 255, 255, 0.4)"
              strokeWidth="1.5"
            />
            {/* Building Left Face */}
            <path
              d="M80 50 L120 30 L120 160 L80 140 Z"
              fill="rgba(255, 255, 255, 0.08)"
            />
            {/* Building Right Face */}
            <path
              d="M120 30 L160 50 L160 140 L120 160 Z"
              fill="rgba(255, 255, 255, 0.18)"
            />
            {/* Glass Facade Windows (Isometric Lines) */}
            <line x1="90" y1="65" x2="115" y2="52" stroke="rgba(167, 243, 208, 0.6)" strokeWidth="1.5" />
            <line x1="90" y1="85" x2="115" y2="72" stroke="rgba(167, 243, 208, 0.6)" strokeWidth="1.5" />
            <line x1="90" y1="105" x2="115" y2="92" stroke="rgba(167, 243, 208, 0.6)" strokeWidth="1.5" />
            <line x1="90" y1="125" x2="115" y2="112" stroke="rgba(167, 243, 208, 0.6)" strokeWidth="1.5" />

            <line x1="125" y1="52" x2="150" y2="65" stroke="rgba(255, 255, 255, 0.5)" strokeWidth="1.5" />
            <line x1="125" y1="72" x2="150" y2="85" stroke="rgba(255, 255, 255, 0.5)" strokeWidth="1.5" />
            <line x1="125" y1="92" x2="150" y2="105" stroke="rgba(255, 255, 255, 0.5)" strokeWidth="1.5" />
            <line x1="125" y1="112" x2="150" y2="125" stroke="rgba(255, 255, 255, 0.5)" strokeWidth="1.5" />

            {/* Adjacent Villa / Residential Block */}
            <path
              d="M40 95 L75 80 L100 95 L100 145 L75 155 L40 140 Z"
              fill="rgba(5, 150, 105, 0.3)"
              stroke="rgba(110, 231, 183, 0.5)"
              strokeWidth="1.5"
            />
            <path
              d="M40 95 L75 80 L75 155 L40 140 Z"
              fill="rgba(255, 255, 255, 0.06)"
            />

            {/* Growth Trend Sparkle Line */}
            <path
              d="M30 130 Q90 100 130 65 T210 25"
              fill="none"
              stroke="#34D399"
              strokeWidth="2.5"
              strokeDasharray="4 2"
            />
            <circle cx="210" cy="25" r="5" fill="#34D399" />
            <circle cx="210" cy="25" r="10" stroke="#34D399" strokeWidth="1" opacity="0.4" />

            {/* Ambient Floating Metric Card */}
            <rect
              x="145"
              y="75"
              width="68"
              height="36"
              rx="8"
              fill="rgba(6, 78, 59, 0.85)"
              stroke="rgba(110, 231, 183, 0.4)"
              strokeWidth="1"
            />
            <circle cx="160" cy="93" r="6" fill="#10B981" />
            <path d="M158 93 L162 90 L162 96" stroke="white" strokeWidth="1" strokeLinecap="round" />
            <text x="172" y="90" fill="#E2E8F0" fontSize="8" fontWeight="bold">98.4%</text>
            <text x="172" y="100" fill="#94A3B8" fontSize="7">Lead Rate</text>
          </svg>
        </div>
      </div>
    </div>
  );
}

