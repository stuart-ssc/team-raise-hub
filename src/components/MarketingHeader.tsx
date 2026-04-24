import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import SponsorlyLogo from '@/components/SponsorlyLogo';

const MarketingHeader = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigation = [
    { name: 'Schools', href: '/schools' },
    { name: 'Fundraisers', href: '/fundraisers' },
    { name: 'Features', href: '/features' },
    { name: 'Pricing', href: '/pricing' },
  ];

  const linkClass =
    'text-sm font-medium text-[#2B3345] hover:text-[#1F5FE0] transition-colors';
  const ctaClass =
    'inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold bg-[#1F5FE0] text-white shadow-[0_6px_18px_-6px_rgba(31,95,224,0.55)] hover:bg-[#0B3FB0] hover:-translate-y-px transition';

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#0A0F1E]/[0.06] bg-[#FAFAF7]/75 backdrop-blur-[14px] backdrop-saturate-150">
      <nav className="mx-auto max-w-[1440px] px-5 sm:px-8">
        <div className="flex h-20 md:h-24 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <SponsorlyLogo variant="full" theme="light" className="h-14 md:h-16" />
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex md:items-center md:gap-9">
            {navigation.map((item) => (
              <Link key={item.name} to={item.href} className={linkClass}>
                {item.name}
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className="hidden md:flex md:items-center md:gap-[18px]">
            <Link to="/login" className={linkClass}>
              Sign in
            </Link>
            <Link to="/signup" className={ctaClass}>
              Start free <span aria-hidden>→</span>
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            type="button"
            className="md:hidden inline-flex items-center justify-center rounded-md p-2 text-[#2B3345] hover:bg-black/5"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <span className="sr-only">Open main menu</span>
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-[#0A0F1E]/[0.06] py-4">
            <div className="flex flex-col gap-4">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className="text-base font-medium text-[#2B3345] hover:text-[#1F5FE0] transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}

              <Link
                to="/login"
                className="text-base font-medium text-[#2B3345] hover:text-[#1F5FE0] transition-colors border-t border-[#0A0F1E]/[0.06] pt-4"
                onClick={() => setMobileMenuOpen(false)}
              >
                Sign in
              </Link>

              <Link
                to="/signup"
                onClick={() => setMobileMenuOpen(false)}
                className={`${ctaClass} w-full justify-center`}
              >
                Start free <span aria-hidden>→</span>
              </Link>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
};

export default MarketingHeader;
