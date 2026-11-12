import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface FAQItem {
  q: string;
  a: string;
}

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0); // First item open by default

  const faqs: FAQItem[] = [
    {
      q: 'What makes RealCRM different from generic CRMs like HubSpot or Salesforce?',
      a: 'Generic CRMs are built for standard B2B software sales and lack real estate essentials. RealCRM is purpose-built for property transactions with an automated Video Lab for reel generation, WhatsApp Cloud journeys with floor plan attachments, GPS-verified site visit tracking, and RERA compliance overlays.',
    },
    {
      q: 'How does the Video Lab generate reels automatically from site visit walkthroughs?',
      a: 'Brokers simply record phone walkthroughs and upload the raw clips. RealCRM transcribes presenter speech with Gemini, generates animated Devanagari/English captions, applies presenter punch-in zooms to hide jump cuts, inserts relevant B-roll overlays from your project library, and normalizes audio to broadcast -14 LUFS in under 30 seconds.',
    },
    {
      q: 'Is the WhatsApp integration official and protected from number bans?',
      a: 'Yes. RealCRM integrates directly through Meta’s Official WhatsApp Business Cloud API. You receive a verified green tick (subject to Meta guidelines), official template message delivery, and automated opt-in compliance so your business number remains 100% protected.',
    },
    {
      q: 'Can RealCRM sync leads automatically from 99acres, MagicBricks, Meta Ads, and Google Ads?',
      a: 'Yes. Inbound enquiries from Meta Lead Gen forms, Google Search Ads, 99acres, MagicBricks, Housing.com, and website webhooks are captured in real-time with zero lead leakage and enriched with UTM attribution and device details.',
    },
    {
      q: 'How does automated broker lead distribution (round-robin) work?',
      a: 'You can define custom allocation rules: round-robin based on agent online status, project specialization (luxury vs affordable), or language preference. If an assigned broker fails to make contact within 5 minutes, RealCRM can automatically escalate or reassign the enquiry.',
    },
    {
      q: 'Can we customize the AI video captions, fonts, and RERA disclaimer banners?',
      a: 'Absolutely. In the Video Lab and Creative Studio settings, you can configure your brand colors, primary typography (including Devanagari and Gurmukhi script support), approved RERA registration numbers, and custom QR codes.',
    },
    {
      q: 'How long does it take to migrate our existing property catalog and contact list?',
      a: 'Most teams migrate in under 15 minutes. You can import CSV or Excel lists of contacts and properties with auto-field mapping, or connect your existing database through our REST API.',
    },
    {
      q: 'Does RealCRM support multi-tier permissions for Platform Admins, Sales Managers, and Field Brokers?',
      a: 'Yes. RealCRM provides strict role-based access control. Field brokers only see their assigned leads and calendar appointments, while Sales Managers and Platform Admins have full access to organization performance, ad spend, and audit logs.',
    },
    {
      q: 'Is our customer and booking data secure and RERA compliant?',
      a: 'Security is paramount. All data is encrypted in transit (TLS 1.3) and at rest (AES-256). We maintain complete audit logs of every customer interaction and status change to support RERA documentation requirements.',
    },
    {
      q: 'Can we try RealCRM before committing to an annual plan?',
      a: 'Yes. We offer a full-featured 14-day free trial with zero setup fees and no credit card required. Our onboarding specialists will help you connect your first WhatsApp number and generate your first property reel during the trial.',
    },
  ];

  const toggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="py-20 sm:py-28 bg-white border-b border-neutral-200/80">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center space-y-4 mb-16">
          <span className="text-[12px] font-bold text-neutral-500 uppercase tracking-widest">
            Frequently Asked Questions
          </span>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-[#0A0A0A] tracking-tight">
            Everything you need to know.
          </h2>
          <p className="text-base sm:text-lg text-neutral-600 font-normal">
            Have a question that isn&apos;t answered here? Reach out to our 24/7 real estate support team.
          </p>
        </div>

        {/* 10-Item Accordion List */}
        <div className="space-y-3">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            const buttonId = `faq-btn-${index}`;
            const panelId = `faq-panel-${index}`;

            return (
              <div
                key={faq.q}
                className="rounded-2xl border border-neutral-200/90 bg-neutral-50/50 overflow-hidden transition-colors hover:border-neutral-300"
              >
                <button
                  type="button"
                  id={buttonId}
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  onClick={() => toggle(index)}
                  className="w-full px-6 py-5 text-left flex items-center justify-between gap-4 font-bold text-base sm:text-lg text-[#0A0A0A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A0A0A] select-none"
                >
                  <span>{faq.q}</span>
                  <div
                    className={`w-8 h-8 rounded-full bg-white border border-neutral-200 flex items-center justify-center shrink-0 text-neutral-600 transition-transform duration-200 ${
                      isOpen ? 'rotate-180 bg-neutral-900 text-white' : ''
                    }`}
                  >
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </button>

                <div
                  id={panelId}
                  role="region"
                  aria-labelledby={buttonId}
                  className={`grid transition-all duration-200 ease-in-out ${
                    isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                  }`}
                >
                  <div className="overflow-hidden">
                    <p className="px-6 pb-6 pt-1 text-sm sm:text-base text-neutral-600 leading-relaxed">
                      {faq.a}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

