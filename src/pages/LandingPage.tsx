import { useEffect, useState } from 'react';
import axios from 'axios';
import { api } from '../lib/api';
import { AnnouncementBar } from '../components/landing/AnnouncementBar';
import { Navbar } from '../components/landing/Navbar';
import { Hero } from '../components/landing/Hero';
import { LogoMarquee } from '../components/landing/LogoMarquee';
import { Intro } from '../components/landing/Intro';
import { BentoGrid } from '../components/landing/BentoGrid';
import { Stats } from '../components/landing/Stats';
import { TextMarquee } from '../components/landing/TextMarquee';
import { WaysToUse } from '../components/landing/WaysToUse';
import { CustomerStories } from '../components/landing/CustomerStories';
import { CTA } from '../components/landing/CTA';
import { FAQ } from '../components/landing/FAQ';
import { Footer } from '../components/landing/Footer';
import { X, CheckCircle2, Building2, Phone, Mail, User, Sparkles } from 'lucide-react';

export function LandingPage() {
  const [demoModalOpen, setDemoModalOpen] = useState(false);
  const [demoSubmitted, setDemoSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [demoForm, setDemoForm] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    teamSize: '1-5 brokers',
    hp_field: '',
  });

  useEffect(() => {
    document.title = 'RealCRM — The AI Operating System for Modern Real Estate Teams';
  }, []);

  const handleOpenDemo = () => {
    setDemoModalOpen(true);
    setDemoSubmitted(false);
    setSubmitError(null);
  };

  const handleSubmitDemo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await api.post('/public/demo-request', demoForm);
      setDemoSubmitted(true);
    } catch (err: unknown) {
      let errorMsg = 'Failed to submit demo request. Please check your information and try again.';
      if (axios.isAxiosError(err)) {
        if (err.response?.data?.error?.message) {
          errorMsg = err.response.data.error.message;
        } else if (err.response?.data?.message) {
          errorMsg = err.response.data.message;
        }
      } else if (err instanceof Error) {
        errorMsg = err.message;
      }
      setSubmitError(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-[#0A0A0A] selection:bg-[#0A0A0A] selection:text-white">
      {/* 1. AnnouncementBar */}
      <AnnouncementBar onLearnMore={() => {
        const el = document.querySelector('#features');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }} />

      {/* 2. Navbar */}
      <Navbar onContactClick={handleOpenDemo} />

      <main>
        {/* 3. Hero */}
        <Hero onGetDemo={handleOpenDemo} />

        {/* 4. LogoMarquee */}
        <LogoMarquee />

        {/* 5. Intro */}
        <Intro />

        {/* 6. BentoGrid */}
        <BentoGrid />

        {/* 7. Stats */}
        <Stats />

        {/* 8. TextMarquee */}
        <TextMarquee />

        {/* 9. WaysToUse */}
        <WaysToUse onLearnMore={() => handleOpenDemo()} />

        {/* 10. CustomerStories */}
        <CustomerStories />

        {/* 11. CTA */}
        <CTA onGetDemo={handleOpenDemo} />

        {/* 12. FAQ */}
        <FAQ />
      </main>

      {/* 13. Footer */}
      <Footer />

      {/* Demo Modal Dialog */}
      {demoModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="demo-dialog-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
        >
          <div className="relative w-full max-w-lg rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-neutral-200 text-left">
            <button
              type="button"
              onClick={() => setDemoModalOpen(false)}
              aria-label="Close demo modal"
              className="absolute top-5 right-5 p-2 rounded-full text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {!demoSubmitted ? (
              <form onSubmit={handleSubmitDemo} className="space-y-4">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-neutral-100 text-neutral-800 text-xs font-semibold">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    Book Personalized VIP Tour
                  </div>
                  <h3 id="demo-dialog-title" className="text-xl sm:text-2xl font-extrabold text-[#0A0A0A]">
                    See RealCRM with your properties
                  </h3>
                  <p className="text-xs sm:text-sm text-neutral-500">
                    Our real estate product specialist will walk you through Video Lab and automated WhatsApp pipelines.
                  </p>
                </div>

                <div className="space-y-3 pt-2">
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 mb-1">Full Name</label>
                    <div className="relative">
                      <User className="w-4 h-4 text-neutral-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        required
                        placeholder="e.g. Vikram Singhania"
                        value={demoForm.name}
                        onChange={(e) => setDemoForm({ ...demoForm, name: e.target.value })}
                        className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#0A0A0A]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-neutral-700 mb-1">Work Email</label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-neutral-400 absolute left-3 top-3" />
                        <input
                          type="email"
                          required
                          placeholder="vikram@realty.com"
                          value={demoForm.email}
                          onChange={(e) => setDemoForm({ ...demoForm, email: e.target.value })}
                          className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#0A0A0A]"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-neutral-700 mb-1">Phone (WhatsApp)</label>
                      <div className="relative">
                        <Phone className="w-4 h-4 text-neutral-400 absolute left-3 top-3" />
                        <input
                          type="tel"
                          required
                          placeholder="+91 98765 43210"
                          value={demoForm.phone}
                          onChange={(e) => setDemoForm({ ...demoForm, phone: e.target.value })}
                          className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#0A0A0A]"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-neutral-700 mb-1">Company / Brokerage</label>
                      <div className="relative">
                        <Building2 className="w-4 h-4 text-neutral-400 absolute left-3 top-3" />
                        <input
                          type="text"
                          required
                          placeholder="Skyline Realty"
                          value={demoForm.company}
                          onChange={(e) => setDemoForm({ ...demoForm, company: e.target.value })}
                          className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#0A0A0A]"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-neutral-700 mb-1">Broker Team Size</label>
                      <select
                        value={demoForm.teamSize}
                        onChange={(e) => setDemoForm({ ...demoForm, teamSize: e.target.value })}
                        className="w-full px-3 py-2.5 rounded-xl border border-neutral-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#0A0A0A]"
                      >
                        <option>1-5 brokers</option>
                        <option>6-20 brokers</option>
                        <option>21-50 brokers</option>
                        <option>50+ brokers</option>
                        <option>Real Estate Developer / Builder</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Honeypot field (hidden from human visitors) */}
                <input
                  type="text"
                  name="hp_field"
                  value={demoForm.hp_field}
                  onChange={(e) => setDemoForm({ ...demoForm, hp_field: e.target.value })}
                  style={{ display: 'none' }}
                  tabIndex={-1}
                  autoComplete="off"
                  aria-hidden="true"
                />

                {submitError && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs leading-relaxed">
                    {submitError}
                  </div>
                )}

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3.5 rounded-xl text-sm font-bold text-white bg-[#0A0A0A] hover:bg-neutral-800 disabled:opacity-70 disabled:cursor-not-allowed transition-all shadow-md flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Confirming Your Demo...</span>
                      </>
                    ) : (
                      'Confirm My Demo Booking'
                    )}
                  </button>
                  <p className="text-[11px] text-neutral-400 text-center mt-2">
                    We respect your privacy. No spam, ever.
                  </p>
                </div>
              </form>
            ) : (
              <div className="text-center py-6 space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-extrabold text-[#0A0A0A]">Demo Request Received!</h3>
                <p className="text-sm text-neutral-600 max-w-sm mx-auto">
                  Thank you, <strong>{demoForm.name}</strong>. Our real estate solutions consultant will contact you at <strong>{demoForm.phone}</strong> and <strong>{demoForm.email}</strong> regarding your personalized VIP demo.
                </p>
                <button
                  type="button"
                  onClick={() => setDemoModalOpen(false)}
                  className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-[#0A0A0A]"
                >
                  Back to RealCRM
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

