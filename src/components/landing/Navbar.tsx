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
      setScrolled(window.scrollY > 20);
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
      className={`sticky top-0 z-40 transition-all duration-200 ${
        scrolled
          ? 'bg-white/95 backdrop-blur-md border-b border-neutral-200 shadow-xs'
          : 'bg-white/80 backdrop-blur-sm border-b border-neutral-200/60'
      }`}
    >
      <nav aria-label="Main Navigation" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-3 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A0A0A] rounded-lg"
          >
            <div className="w-9 h-9 rounded-xl bg-[#0A0A0A] text-white flex items-center justify-center font-bold text-sm tracking-wider shadow-sm group-hover:bg-neutral-800 transition-colors">
              RC
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-[19px] font-extrabold tracking-tight text-[#0A0A0A]">
                RealCRM
              </span>
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-neutral-100 text-neutral-600 border border-neutral-200 uppercase tracking-wider">
                AI Suite
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-1 lg:gap-2">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={(e) => {
                  e.preventDefault();
                  handleNavClick(link.href);
                }}
                className="px-3.5 py-2 rounded-lg text-[14px] font-medium text-neutral-600 hover:text-[#0A0A0A] hover:bg-neutral-100/80 transition-colors"
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
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[14px] font-semibold text-white bg-[#0A0A0A] hover:bg-neutral-800 transition-all shadow-xs"
              >
                Go to Workspace
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 rounded-xl text-[14px] font-medium text-neutral-700 hover:text-[#0A0A0A] hover:bg-neutral-100 transition-colors"
                >
                  Log in
                </Link>
                <button
                  type="button"
                  onClick={onContactClick}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-[14px] font-semibold text-white bg-[#0A0A0A] hover:bg-neutral-800 transition-all shadow-xs active:scale-[0.98]"
                >
                  Contact Sales
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
              className="p-2 rounded-xl text-neutral-700 hover:text-[#0A0A0A] hover:bg-neutral-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A0A0A]"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-neutral-200 bg-white px-4 pt-3 pb-6 space-y-4 shadow-lg animate-in slide-in-from-top-2 duration-150">
          <div className="flex flex-col space-y-1">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={(e) => {
                  e.preventDefault();
                  handleNavClick(link.href);
                }}
                className="px-3 py-2.5 rounded-lg text-[15px] font-medium text-neutral-700 hover:bg-neutral-100 hover:text-[#0A0A0A] transition-colors"
              >
                {link.name}
              </a>
            ))}
          </div>

          <div className="pt-3 border-t border-neutral-200 flex flex-col gap-2.5">
            {isAuthenticated ? (
              <Link
                to="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2.5 rounded-xl text-[14px] font-semibold text-white bg-[#0A0A0A]"
              >
                Go to Workspace
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2.5 rounded-xl text-[14px] font-medium text-neutral-800 bg-neutral-100 hover:bg-neutral-200 transition-colors"
                >
                  Log in
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    if (onContactClick) onContactClick();
                  }}
                  className="w-full text-center py-2.5 rounded-xl text-[14px] font-semibold text-white bg-[#0A0A0A]"
                >
                  Contact Sales
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
