import { Link } from 'react-router-dom';
import SponsorlyLogo from '@/components/SponsorlyLogo';

const MarketingFooter = () => {
  const year = new Date().getFullYear();

  const social = [
    {
      name: 'Instagram',
      href: '#',
      svg: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M24 4.56v14.88A4.56 4.56 0 0119.44 24H4.56A4.56 4.56 0 010 19.44V4.56A4.56 4.56 0 014.56 0h14.88A4.56 4.56 0 0124 4.56zM12 7a5 5 0 100 10 5 5 0 000-10zm0 2a3 3 0 110 6 3 3 0 010-6zm5.75-2.75a1.25 1.25 0 100-2.5 1.25 1.25 0 000 2.5z" />
        </svg>
      ),
    },
    {
      name: 'X',
      href: '#',
      svg: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      ),
    },
    {
      name: 'YouTube',
      href: '#',
      svg: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" />
        </svg>
      ),
    },
  ];

  const colHeading = 'text-[12px] font-semibold tracking-[0.16em] uppercase text-white/50 mb-[18px]';
  const colLink = 'block py-[6px] text-sm text-white/80 hover:text-white transition-colors';

  return (
    <footer className="bg-[#0A0F1E] text-[rgba(245,246,250,0.75)] pt-20 pb-10">
      <div className="mx-auto max-w-[1280px] px-5 sm:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:[grid-template-columns:1.4fr_1fr_1fr_1.2fr] gap-12 pb-12 border-b border-white/[0.08]">
          {/* Brand */}
          <div>
            <SponsorlyLogo variant="full" theme="dark" className="h-14" />
            <p className="mt-[14px] max-w-[300px] text-[13px] leading-[1.6] text-white/60">
              The fundraising platform for schools, teams, clubs, and PTOs. Zero platform fees, forever.
            </p>
            <div className="flex gap-2 mt-5">
              {social.map((s) => (
                <a
                  key={s.name}
                  href={s.href}
                  aria-label={s.name}
                  className="w-9 h-9 rounded-full bg-white/[0.08] hover:bg-white/[0.15] grid place-items-center text-white transition-colors"
                >
                  {s.svg}
                </a>
              ))}
            </div>
          </div>

          {/* Product */}
          <div>
            <h5 className={colHeading}>Product</h5>
            <Link to="/features" className={colLink}>Features</Link>
            <Link to="/pricing" className={colLink}>Pricing</Link>
            <Link to="/campaigns-overview" className={colLink}>Fundraisers</Link>
            <Link to="/donor-receipts" className={colLink}>Tax receipts</Link>
          </div>

          {/* Who it's for */}
          <div>
            <h5 className={colHeading}>Who it's for</h5>
            <Link to="/campaigns/roster" className={colLink}>Sports teams</Link>
            <Link to="/schools" className={colLink}>Booster clubs</Link>
            <Link to="/schools" className={colLink}>PTOs &amp; PTAs</Link>
            <Link to="/schools" className={colLink}>Marching Bands</Link>
            <Link to="/nonprofits" className={colLink}>Nonprofits</Link>
          </div>

          {/* Get started */}
          <div>
            <h5 className={colHeading}>Get started</h5>
            <p className="text-[13px] text-white/60 mb-[14px]">
              Ready to transform your fundraising?
            </p>
            <Link
              to="/signup"
              className="inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold bg-[#1F5FE0] text-white shadow-[0_6px_18px_-6px_rgba(31,95,224,0.55)] hover:bg-[#0B3FB0] hover:-translate-y-px transition"
            >
              Sign up free <span aria-hidden>→</span>
            </Link>
          </div>
        </div>

        <div className="pt-8 flex flex-col sm:flex-row justify-between items-center gap-3 text-[13px] text-white/50">
          <span>© {year} Sponsorly™. All rights reserved.</span>
          <div className="flex items-center gap-6">
            <Link to="/terms" className="hover:text-white transition-colors">Terms</Link>
            <Link to="/privacy" className="hover:text-white transition-colors">Privacy</Link>
            <Link to="/dpa" className="hover:text-white transition-colors">Data Processing</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default MarketingFooter;
