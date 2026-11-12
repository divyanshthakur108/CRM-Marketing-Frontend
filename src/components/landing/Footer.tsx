import { Link } from 'react-router-dom';

export function Footer() {
  const currentYear = 2026;

  const productLinks = [
    { name: 'Video Lab (Reel Engine)', href: '#features' },
    { name: 'AI Creative Studio', href: '#features' },
    { name: 'WhatsApp Cloud CRM', href: '#features' },
    { name: 'Omnichannel Lead Capture', href: '#features' },
    { name: 'Site Visit Scheduling', href: '#features' },
    { name: 'Ad Campaign ROAS Tracker', href: '#features' },
  ];

  const solutionLinks = [
    { name: 'For Property Developers', href: '#solutions' },
    { name: 'For Real Estate Brokerages', href: '#solutions' },
    { name: 'Channel Partner Networks', href: '#solutions' },
    { name: 'Luxury Penthouse Marketing', href: '#solutions' },
    { name: 'NRI Buyer Automated Journeys', href: '#solutions' },
  ];

  const companyLinks = [
    { name: 'About RealCRM', href: '#intro' },
    { name: 'Customer Stories', href: '#customers' },
    { name: 'Platform Security & SOC2', href: '#faq' },
    { name: 'Partner Program', href: '#contact' },
    { name: 'Careers (We are hiring!)', href: '#contact' },
  ];

  const resourceLinks = [
    { name: 'Help Center & FAQ', href: '#faq' },
    { name: 'RERA Compliance Guide', href: '#faq' },
    { name: 'Developer REST APIs', href: '#faq' },
    { name: 'System Status', href: '#faq' },
    { name: 'Release Notes (Nov 2026)', href: '#faq' },
  ];

  return (
    <footer aria-label="Site Footer" className="bg-white border-t border-neutral-200/90 text-neutral-600 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 lg:gap-12 pb-16 border-b border-neutral-200/80">
          {/* Brand Info Column */}
          <div className="col-span-2 space-y-4">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-[#0A0A0A] text-white flex items-center justify-center font-bold text-sm tracking-wider">
                RC
              </div>
              <span className="text-xl font-extrabold text-[#0A0A0A] tracking-tight">RealCRM</span>
            </Link>
            <p className="text-sm text-neutral-500 max-w-sm leading-relaxed">
              The autonomous AI sales engine built for high-growth real estate developers, agencies, and top-producing brokers.
            </p>
            <div className="pt-2 flex items-center gap-3 text-neutral-400">
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                ● Systems Operational
              </span>
              <span className="text-xs text-neutral-400">Meta Cloud Verified</span>
            </div>
          </div>

          {/* 4 Navigation Link Columns */}
          <div>
            <h4 className="font-bold text-xs uppercase tracking-wider text-[#0A0A0A] mb-4">Product</h4>
            <ul className="space-y-2.5 text-xs sm:text-sm">
              {productLinks.map((item) => (
                <li key={item.name}>
                  <a href={item.href} className="text-neutral-600 hover:text-[#0A0A0A] transition-colors">
                    {item.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-xs uppercase tracking-wider text-[#0A0A0A] mb-4">Solutions</h4>
            <ul className="space-y-2.5 text-xs sm:text-sm">
              {solutionLinks.map((item) => (
                <li key={item.name}>
                  <a href={item.href} className="text-neutral-600 hover:text-[#0A0A0A] transition-colors">
                    {item.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-xs uppercase tracking-wider text-[#0A0A0A] mb-4">Company</h4>
            <ul className="space-y-2.5 text-xs sm:text-sm">
              {companyLinks.map((item) => (
                <li key={item.name}>
                  <a href={item.href} className="text-neutral-600 hover:text-[#0A0A0A] transition-colors">
                    {item.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="col-span-2 md:col-span-1">
            <h4 className="font-bold text-xs uppercase tracking-wider text-[#0A0A0A] mb-4">Resources</h4>
            <ul className="space-y-2.5 text-xs sm:text-sm">
              {resourceLinks.map((item) => (
                <li key={item.name}>
                  <a href={item.href} className="text-neutral-600 hover:text-[#0A0A0A] transition-colors">
                    {item.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Strip: Social Icons, Legal & Copyright */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-500">
          <div>
            © {currentYear} RealCRM Technologies Inc. All rights reserved.
          </div>

          <div className="flex flex-wrap items-center gap-6">
            <a href="#privacy" className="hover:text-[#0A0A0A] transition-colors">
              Privacy Policy
            </a>
            <a href="#terms" className="hover:text-[#0A0A0A] transition-colors">
              Terms of Service
            </a>
            <a href="#security" className="hover:text-[#0A0A0A] transition-colors">
              Security
            </a>
            <a href="#rera" className="hover:text-[#0A0A0A] transition-colors">
              RERA Compliance
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
