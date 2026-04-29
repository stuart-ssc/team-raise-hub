import { Helmet } from "react-helmet-async";

const SITE = "https://sponsorly.io";
const DEFAULT_OG_IMAGE = `${SITE}/lovable-uploads/og-default-1200x630.jpg`;

interface SeoHeadProps {
  /** Page title — keep under 60 chars including any " | Sponsorly" suffix. */
  title: string;
  /** Meta description — aim for 140–160 chars. */
  description: string;
  /** Path-only canonical (e.g. "/pricing"). Will be prefixed with the site origin. */
  path: string;
  /** Optional absolute OG image URL (defaults to Sponsorly 1200x630 brand card). */
  image?: string;
  /** Optional alt text for the OG/Twitter image. Defaults to the title. */
  imageAlt?: string;
  /** og:type — defaults to "website". */
  type?: "website" | "article";
  /** When true, emits robots=noindex,nofollow (use on dashboards/auth pages). */
  noIndex?: boolean;
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
  imageAlt,
  type = "website",
  noIndex = false,
}: SeoHeadProps) => {
  const url = `${SITE}${path}`;
  const altText = imageAlt || title;
  // Ensure absolute URL — required by Facebook/LinkedIn crawlers.
  const absoluteImage = image.startsWith("http") ? image : `${SITE}${image.startsWith("/") ? "" : "/"}${image}`;
  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      <meta name="robots" content={noIndex ? "noindex, nofollow" : "index, follow"} />

      {/* Open Graph */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content={type} />
      <meta property="og:image" content={absoluteImage} />
      <meta property="og:image:secure_url" content={absoluteImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={altText} />
      <meta property="og:site_name" content="Sponsorly" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@sponsorly_io" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={absoluteImage} />
      <meta name="twitter:image:alt" content={altText} />
    </Helmet>
  );
};

export default SeoHead;