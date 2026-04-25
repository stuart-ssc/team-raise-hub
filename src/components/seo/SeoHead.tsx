import { Helmet } from "react-helmet-async";

const SITE = "https://sponsorly.io";
const DEFAULT_OG_IMAGE = `${SITE}/lovable-uploads/Sponsorly-Logo.png`;

interface SeoHeadProps {
  /** Page title — keep under 60 chars including any " | Sponsorly" suffix. */
  title: string;
  /** Meta description — aim for 140–160 chars. */
  description: string;
  /** Path-only canonical (e.g. "/pricing"). Will be prefixed with the site origin. */
  path: string;
  /** Optional absolute OG image URL (defaults to Sponsorly logo). */
  image?: string;
  /** og:type — defaults to "website". */
  type?: "website" | "article";
}

/**
 * Single source of truth for marketing-page SEO metadata.
 * Renders title, description, canonical, OG, and Twitter tags via Helmet.
 */
export const SeoHead = ({
  title,
  description,
  path,
  image = DEFAULT_OG_IMAGE,
  type = "website",
}: SeoHeadProps) => {
  const url = `${SITE}${path}`;
  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      <meta name="robots" content="index, follow" />

      {/* Open Graph */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content={type} />
      <meta property="og:image" content={image} />
      <meta property="og:site_name" content="Sponsorly" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@sponsorly_io" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
    </Helmet>
  );
};

export default SeoHead;