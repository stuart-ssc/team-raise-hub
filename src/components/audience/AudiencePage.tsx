import { Link } from "react-router-dom";
import MarketingHeader from "@/components/MarketingHeader";
import MarketingFooter from "@/components/MarketingFooter";
import { SeoHead } from "@/components/seo/SeoHead";
import { AUDIENCE_SCOPED_CSS } from "./audienceStyles";

/**
 * Reusable audience landing page template used by Sports Teams,
 * Booster Clubs, Marching Bands, PTOs & PTAs, and Nonprofits.
 * Mirrors the approved 2026 mockups; visual styling lives in
 * audienceStyles.ts (scoped under .sp-aud).
 */

export type AudienceTheme = "blue" | "green" | "accent" | "violet" | "teal" | "pink";

type EyebrowColor = "blue" | "green" | "accent" | "violet" | "teal" | "pink";

interface Pillar {
  iconBg: string;
  iconColor: string;
  icon: string; // svg path d
  title: string;
  body: string;
  bullets: string[];
}

interface FundCard {
  iconBg: string;
  iconColor: string;
  icon: string;
  tag: string;
  title: string;
  body: string;
  stat1Value: string;
  stat1Label: string;
  stat2Value: string;
  stat2Label: string;
}

interface CrmRow {
  initials: string;
  avBg: string;
  name: string;
  role: string;
  pillLabel: string;
  pillVariant: "blue" | "green" | "orange" | "violet";
  amount: string;
  trailing: string;
  trailingPill?: { label: string; variant: "blue" | "green" | "orange" | "violet" };
}

interface CampRow {
  title: string;
  body: string;
  amount: string;
  amountLabel?: string;
}

interface SisterLink {
  to: string;
  label: string;
  iconBg: string;
  iconColor: string;
  icon: string;
}

export interface SisterCard {
  to: string;
  title: string;
  body: string;
  image: string;
  arrowColor: string;
}

export interface AudiencePageProps {
  theme: AudienceTheme;
  seo: { title: string; description: string; path: string };
  // Hero
  chipLabel: string;
  chipColor?: "theme" | "green" | "accent" | "violet";
  heroHeadlinePre: string;
  heroHeadlineEm: string;
  heroSub: string;
  primaryCta: string;
  secondaryCta: string;
  microPoints: string[];
  heroImage: string;
  heroBgPosition?: string;
  heroBadgeAmount: string;
  heroBadgeLabel: string;
  heroOrgName: string;
  heroOrgMeta1: string;
  heroOrgMeta2: string;
  heroBarPct: number;
  // Pillars
  pillarsEyebrow: string;
  pillarsEyebrowColor: EyebrowColor;
  pillarsHeadline: string;
  pillarsHeadlineEm?: string;
  pillarsSub: string;
  pillars: Pillar[];
  // Fundraisers
  fundEyebrow: string;
  fundEyebrowColor: EyebrowColor;
  fundHeadline: string;
  fundHeadlineEm?: string;
  fundSub: string;
  fundCards: FundCard[];
  // CRM section
  crmEyebrow: string;
  crmEyebrowColor: EyebrowColor;
  crmHeadline: string;
  crmHeadlineEm?: string;
  crmSub: string;
  crmChecks: { title: string; rest: string }[];
  crmMockTitle: string;
  crmMockFilter: string;
  crmCols: [string, string, string, string];
  crmRows: CrmRow[];
  // Real campaigns
  campEyebrow: string;
  campEyebrowColor: EyebrowColor;
  campHeadline: string;
  campRows: CampRow[];
  campPhoto: string;
  campQuote: string;
  campQuoteAuthor: string;
  campQuoteOrg: string;
  // Stats strip
  statsBg: string; // e.g. linear-gradient or solid color
  statsHeadline: string;
  statsSub: string;
  stats: { value: string; label: string }[];
  // Sister pages
  sisterHeadline: string;
  sisterSub: string;
  sisterLinks?: SisterLink[];
  sisterCards?: SisterCard[];
  // Final CTA
  ctaHeadlinePre: string;
  ctaHeadlineEm: string;
  ctaSub: string;
  ctaPrimary: string;
  ctaSecondary: string;
}

const Icon = ({ d, size = 22, color }: { d: string; size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color || "currentColor"} aria-hidden="true">
    <path d={d} />
  </svg>
);

const TickIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z" />
  </svg>
);

export const AudiencePage = (p: AudiencePageProps) => {
  return (
    <div className={`sp-aud theme-${p.theme}`}>
      <SeoHead title={p.seo.title} description={p.seo.description} path={p.seo.path} />
      <style dangerouslySetInnerHTML={{ __html: AUDIENCE_SCOPED_CSS }} />
      <MarketingHeader />

      {/* HERO */}
      <section className="sp-hero">
        <div className="sp-wrap-wide sp-hero-grid">
          <div>
            <span className={`sp-chip${p.chipColor === "green" ? " green" : ""}`}>
              <span className="sp-chip-dot" /> {p.chipLabel}
            </span>
            <h1>
              {p.heroHeadlinePre} <em>{p.heroHeadlineEm}</em>
            </h1>
            <p className="sp-sub">{p.heroSub}</p>
            <div className="sp-ctas">
              <Link to="/signup" className="sp-btn sp-btn-primary sp-btn-lg">
                {p.primaryCta}
              </Link>
              <Link to="/contact" className="sp-btn sp-btn-ghost sp-btn-lg">
                {p.secondaryCta} →
              </Link>
            </div>
            <div className="sp-micro">
              {p.microPoints.map((m) => (
                <span key={m}>✓ {m}</span>
              ))}
            </div>
          </div>
          <div
            className="sp-hero-card"
            style={{
              backgroundImage: `url('${p.heroImage}')`,
              backgroundPosition: p.heroBgPosition || "center",
            }}
          >
            <div className="sp-overlay" />
            <div className="sp-badge">
              {p.heroBadgeAmount} <span>{p.heroBadgeLabel}</span>
            </div>
            <div className="sp-cap">
              <h4>{p.heroOrgName}</h4>
              <div className="sp-cap-row">
                <span>{p.heroOrgMeta1}</span>
                <span>{p.heroOrgMeta2}</span>
              </div>
              <div className="sp-bar">
                <div style={{ width: `${p.heroBarPct}%` }} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PILLARS */}
      <section className="alt">
        <div className="sp-wrap">
          <div className="sp-sec-head">
            <span className={`sp-eyebrow ${p.pillarsEyebrowColor}`}>{p.pillarsEyebrow}</span>
            <h2>
              {p.pillarsHeadline}
              {p.pillarsHeadlineEm && <> <em>{p.pillarsHeadlineEm}</em></>}
            </h2>
            <p>{p.pillarsSub}</p>
          </div>
          <div className="sp-pillars">
            {p.pillars.map((pillar) => (
              <div className="sp-pillar" key={pillar.title}>
                <div className="sp-ico" style={{ background: pillar.iconBg, color: pillar.iconColor }}>
                  <Icon d={pillar.icon} size={26} />
                </div>
                <h4>{pillar.title}</h4>
                <p>{pillar.body}</p>
                <ul>
                  {pillar.bullets.map((b) => (
                    <li key={b}>{b}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FUNDRAISERS */}
      <section className="cream">
        <div className="sp-wrap-wide">
          <div className="sp-sec-head">
            <span className={`sp-eyebrow ${p.fundEyebrowColor}`}>{p.fundEyebrow}</span>
            <h2>
              {p.fundHeadline}
              {p.fundHeadlineEm && <> <em>{p.fundHeadlineEm}</em></>}
            </h2>
            <p>{p.fundSub}</p>
          </div>
          <div className="sp-fund">
            {p.fundCards.map((c) => (
              <div className="sp-fund-card" key={c.title}>
                <div className="sp-row">
                  <div className="sp-ico" style={{ background: c.iconBg, color: c.iconColor }}>
                    <Icon d={c.icon} size={20} />
                  </div>
                  <span className="sp-tag">{c.tag}</span>
                </div>
                <h5>{c.title}</h5>
                <p>{c.body}</p>
                <div className="sp-stat-row">
                  <div>
                    <b>{c.stat1Value}</b>
                    <span>{c.stat1Label}</span>
                  </div>
                  <div>
                    <b>{c.stat2Value}</b>
                    <span>{c.stat2Label}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DONOR CRM */}
      <section className="alt">
        <div className="sp-wrap-wide sp-crm-grid">
          <div>
            <span className={`sp-eyebrow ${p.crmEyebrowColor}`}>{p.crmEyebrow}</span>
            <h2>
              {p.crmHeadline}
              {p.crmHeadlineEm && <> <em>{p.crmHeadlineEm}</em></>}
            </h2>
            <p style={{ color: "var(--sp-muted)", fontSize: 17, lineHeight: 1.6, margin: 0 }}>{p.crmSub}</p>
            <ul className="sp-check-list">
              {p.crmChecks.map((c) => (
                <li key={c.title}>
                  <div className="sp-tick"><TickIcon /></div>
                  <div>
                    <b>{c.title}</b> {c.rest}
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <div className="sp-crm-mock">
            <div className="sp-mock-head">
              <div className="sp-mock-title">{p.crmMockTitle}</div>
              <div className="sp-mock-search">{p.crmMockFilter}</div>
            </div>
            <table>
              <thead>
                <tr>
                  {p.crmCols.map((col) => (
                    <th key={col}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {p.crmRows.map((r) => (
                  <tr key={r.name}>
                    <td>
                      <div className="sp-donor">
                        <div className="sp-av" style={{ background: r.avBg }}>{r.initials}</div>
                        <div>
                          <div className="sp-nm">{r.name}</div>
                          <div className="sp-role">{r.role}</div>
                        </div>
                      </div>
                    </td>
                    <td><span className={`sp-pill ${r.pillVariant}`}>{r.pillLabel}</span></td>
                    <td className="sp-amt">{r.amount}</td>
                    <td>
                      {r.trailingPill ? (
                        <span className={`sp-pill ${r.trailingPill.variant}`}>{r.trailingPill.label}</span>
                      ) : (
                        r.trailing
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* CAMPAIGN EXAMPLES */}
      <section className="cream">
        <div className="sp-wrap-wide">
          <div className="sp-sec-head">
            <span className={`sp-eyebrow ${p.campEyebrowColor}`}>{p.campEyebrow}</span>
            <h2>{p.campHeadline}</h2>
          </div>
          <div className="sp-camp-grid">
            <div className="sp-camp-list">
              {p.campRows.map((row, idx) => (
                <div className="sp-camp-row" key={row.title}>
                  <div className="sp-num">{idx + 1}</div>
                  <div>
                    <h5>{row.title}</h5>
                    <p>{row.body}</p>
                  </div>
                  <div className="sp-res">
                    <b>{row.amount}</b>
                    <span>{row.amountLabel || "Raised"}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="sp-camp-photo" style={{ backgroundImage: `url('${p.campPhoto}')` }}>
              <div className="sp-quote">
                <p>"{p.campQuote}"</p>
                <div className="sp-cite">
                  <b>{p.campQuoteAuthor}</b>
                  {p.campQuoteOrg}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STATS STRIP */}
      <section className="sp-stats-strip" style={{ background: p.statsBg }}>
        <div className="sp-wrap">
          <h3>{p.statsHeadline}</h3>
          <p className="sp-sub">{p.statsSub}</p>
          <div className="sp-stats-3">
            {p.stats.map((s) => (
              <div key={s.label}>
                <div className="sp-big">{s.value}</div>
                <div className="sp-lbl">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SISTER PAGES */}
      <section>
        <div className="sp-wrap">
          <div className="sp-sister-head">
            <h3>{p.sisterHeadline}</h3>
            <p>{p.sisterSub}</p>
          </div>
          {p.sisterCards && p.sisterCards.length > 0 ? (
            <div className="sp-sister-cards">
              {p.sisterCards.map((card) => (
                <Link to={card.to} className="sp-sister-card" key={card.to}>
                  <div
                    className="sp-sc-img"
                    style={{ backgroundImage: `url('${card.image}')` }}
                    role="img"
                    aria-label={card.title}
                  />
                  <div className="sp-sc-body">
                    <div className="sp-sc-text">
                      <h4>{card.title}</h4>
                      <p>{card.body}</p>
                    </div>
                    <div className="sp-sc-arr" style={{ color: card.arrowColor }} aria-hidden="true">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="5" y1="12" x2="19" y2="12" />
                        <polyline points="13 6 19 12 13 18" />
                      </svg>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="sp-sister-grid">
              {(p.sisterLinks || []).map((link) => (
                <Link to={link.to} className="sp-sister-link" key={link.to}>
                  <div className="sp-ico" style={{ background: link.iconBg, color: link.iconColor }}>
                    <Icon d={link.icon} size={18} />
                  </div>
                  <div className="sp-nm">{link.label}</div>
                  <div className="sp-arr">→</div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="sp-final-cta">
        <div className="sp-wrap">
          <span className="sp-chip green">
            <span className="sp-chip-dot" /> Free forever. No card required.
          </span>
          <h2>
            {p.ctaHeadlinePre}
            <br />
            <em>{p.ctaHeadlineEm}</em>
          </h2>
          <p className="sp-sub">{p.ctaSub}</p>
          <div className="sp-ctas">
            <Link to="/signup" className="sp-btn sp-btn-primary sp-btn-lg">{p.ctaPrimary}</Link>
            <Link to="/contact" className="sp-btn sp-btn-on-dark sp-btn-lg">{p.ctaSecondary} →</Link>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
};

export default AudiencePage;
