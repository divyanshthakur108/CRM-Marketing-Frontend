import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, ArrowRight } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';

interface NavbarProps {
  onContactClick?: () => void;
}

export function Navbar({ onContactClick }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 15);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Products', href: '#features' },
    { name: 'Solutions', href: '#solutions' },
    { name: 'Customers', href: '#customers' },
    { name: 'Resources', href: '#faq' },
  ];

  const handleNavClick = (href: string) => {
    setMobileMenuOpen(false);
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header
      className={`sticky top-0 z-40 transition-all duration-300 ${
        scrolled
          ? 'bg-white/90 backdrop-blur-xl border-b border-slate-200/80 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.06)]'
          : 'bg-white/75 backdrop-blur-md border-b border-slate-200/50'
      }`}
    >
      <nav aria-label="Main Navigation" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-3 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 rounded-xl"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-white flex items-center justify-center font-extrabold text-[15px] tracking-wider shadow-sm border border-slate-700/50 group-hover:border-amber-400/40 group-hover:shadow-md transition-all duration-200">
              RC
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-[20px] font-black tracking-tight text-slate-950">
                RealCRM
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200 uppercase tracking-widest">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                AI OS
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-1 lg:gap-1.5 p-1 bg-slate-100/60 rounded-2xl border border-slate-200/60 backdrop-blur-sm">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={(e) => {
                  e.preventDefault();
                  handleNavClick(link.href);
                }}
                className="px-4 py-1.5 rounded-xl text-[13.5px] font-semibold text-slate-600 hover:text-slate-950 hover:bg-white hover:shadow-2xs transition-all duration-150"
              >
                {link.name}
              </a>
            ))}
          </div>

          {/* Right Action Buttons */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13.5px] font-bold text-white bg-slate-950 hover:bg-slate-800 transition-all shadow-sm hover:shadow-md active:scale-[0.98] border border-slate-800"
              >
                <span>Go to Workspace</span>
                <ArrowRight className="w-4 h-4 text-slate-300" />
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 rounded-xl text-[14px] font-semibold text-slate-700 hover:text-slate-950 hover:bg-slate-100 transition-colors"
                >
                  Log in
                </Link>
                <button
                  type="button"
                  onClick={onContactClick}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13.5px] font-bold text-white bg-slate-950 hover:bg-slate-800 transition-all shadow-sm hover:shadow-md active:scale-[0.98] border border-slate-800"
                >
                  <span>Book Demo</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-300" />
                </button>
              </>
            )}
          </div>

          {/* Mobile Hamburger Menu Button */}
          <div className="flex md:hidden">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-expanded={mobileMenuOpen}
              aria-label="Toggle navigation menu"
              className="p-2.5 rounded-xl text-slate-700 hover:text-slate-950 hover:bg-slate-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-200 bg-white/95 backdrop-blur-xl px-4 pt-3 pb-6 space-y-4 shadow-xl animate-in slide-in-from-top-2 duration-150">
          <div className="flex flex-col space-y-1">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={(e) => {
                  e.preventDefault();
                  handleNavClick(link.href);
                }}
                className="px-3.5 py-2.5 rounded-xl text-[15px] font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-950 transition-colors"
              >
                {link.name}
              </a>
            ))}
          </div>

          <div className="pt-3 border-t border-slate-200 flex flex-col gap-2.5">
            {isAuthenticated ? (
              <Link
                to="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-3 rounded-xl text-[14px] font-bold text-white bg-slate-950 shadow-sm"
              >
                Go to Workspace
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2.5 rounded-xl text-[14px] font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 transition-colors"
                >
                  Log in
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    if (onContactClick) onContactClick();
                  }}
                  className="w-full text-center py-3 rounded-xl text-[14px] font-bold text-white bg-slate-950 shadow-sm"
                >
                  Book Demo
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
