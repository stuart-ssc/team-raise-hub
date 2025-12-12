import React from 'react';
import { Helmet } from 'react-helmet-async';
import { LandingPageBlock as LandingPageBlockType, TemplateVariables } from './types';
import { resolveTemplateVariables, resolveVariableString, formatCurrency } from './resolveTemplateVariables';

interface LandingPageRendererProps {
  blocks: LandingPageBlockType[];
  variables: Partial<TemplateVariables>;
  seoTitle?: string;
  seoDescription?: string;
  ogImageUrl?: string;
  canonicalUrl?: string;
  entityName?: string;
}

export function LandingPageRenderer({
  blocks,
  variables,
  seoTitle,
  seoDescription,
  ogImageUrl,
  canonicalUrl,
  entityName,
}: LandingPageRendererProps) {
  const resolvedBlocks = React.useMemo(
    () => resolveTemplateVariables(blocks, variables),
    [blocks, variables]
  );

  // Resolve SEO fields with variables
  const resolvedTitle = seoTitle ? resolveVariableString(seoTitle, variables) : undefined;
  const resolvedDescription = seoDescription ? resolveVariableString(seoDescription, variables) : undefined;

  return (
    <>
      <Helmet>
        {/* Primary Meta Tags */}
        {resolvedTitle && <title>{resolvedTitle}</title>}
        {resolvedDescription && <meta name="description" content={resolvedDescription} />}
        {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}
        <meta name="robots" content="index, follow" />
        {entityName && <meta name="author" content={entityName} />}
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        {resolvedTitle && <meta property="og:title" content={resolvedTitle} />}
        {resolvedDescription && <meta property="og:description" content={resolvedDescription} />}
        {ogImageUrl && <meta property="og:image" content={ogImageUrl} />}
        {canonicalUrl && <meta property="og:url" content={canonicalUrl} />}
        <meta property="og:site_name" content="Sponsorly" />
        <meta property="og:locale" content="en_US" />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        {resolvedTitle && <meta name="twitter:title" content={resolvedTitle} />}
        {resolvedDescription && <meta name="twitter:description" content={resolvedDescription} />}
        {ogImageUrl && <meta name="twitter:image" content={ogImageUrl} />}
        <meta name="twitter:site" content="@sponsorlyio" />
      </Helmet>
      
      <div className="min-h-screen bg-background">
        {resolvedBlocks.map((block) => (
          <RenderedBlock key={block.id} block={block} variables={variables} />
        ))}
      </div>
    </>
  );
}

function RenderedBlock({ 
  block, 
  variables 
}: { 
  block: LandingPageBlockType; 
  variables: Partial<TemplateVariables>;
}) {
  const styles = (block.styles || {}) as Record<string, any>;

  switch (block.type) {
    case 'hero':
      return (
        <section
          className="relative py-24 md:py-32 px-6 md:px-12 text-center"
          style={{
            backgroundColor: styles.heroBackgroundColor || styles.backgroundColor || 'hsl(var(--primary))',
            backgroundImage: styles.heroBackgroundImage ? `url(${styles.heroBackgroundImage})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          {styles.heroOverlay && (
            <div className="absolute inset-0 bg-black/50" />
          )}
          <div className="relative z-10 max-w-4xl mx-auto">
            <h1
              className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6"
              style={{ color: styles.textColor || 'white' }}
            >
              {block.content || styles.heroTitle || 'Welcome'}
            </h1>
            {styles.heroSubtitle && (
              <p
                className="text-xl md:text-2xl mb-8 max-w-2xl mx-auto"
                style={{ color: styles.textColor || 'white', opacity: 0.9 }}
              >
                {styles.heroSubtitle}
              </p>
            )}
            {styles.buttonText && (
              <a
                href={styles.buttonUrl || '#'}
                className="inline-block px-8 py-4 rounded-lg font-semibold text-lg transition-transform hover:scale-105"
                style={{
                  backgroundColor: styles.buttonColor || 'white',
                  color: styles.buttonTextColor || 'hsl(var(--primary))',
                }}
              >
                {styles.buttonText}
              </a>
            )}
          </div>
        </section>
      );

    case 'heading':
      const headingLevel = styles.headingLevel || 'h2';
      const HeadingTag = headingLevel as keyof JSX.IntrinsicElements;
      const headingSizes: Record<string, string> = {
        h1: 'text-4xl md:text-5xl',
        h2: 'text-3xl md:text-4xl',
        h3: 'text-2xl md:text-3xl',
        h4: 'text-xl md:text-2xl',
      };
      return (
        <HeadingTag
          className={`${headingSizes[headingLevel] || 'text-2xl'} font-bold px-6 md:px-12 py-6 max-w-6xl mx-auto`}
          style={{
            textAlign: styles.textAlign || 'left',
            color: styles.textColor,
          }}
        >
          {block.content || 'Heading'}
        </HeadingTag>
      );

    case 'paragraph':
      return (
        <p
          className="px-6 md:px-12 py-3 leading-relaxed max-w-4xl mx-auto text-lg"
          style={{
            textAlign: styles.textAlign || 'left',
            fontSize: styles.fontSize,
            color: styles.textColor,
          }}
        >
          {block.content || ''}
        </p>
      );

    case 'image':
      return (
        <div 
          className="px-6 md:px-12 py-6 max-w-6xl mx-auto" 
          style={{ textAlign: styles.textAlign || 'center' }}
        >
          {block.content ? (
            <img
              src={block.content}
              alt={styles.imageAlt || ''}
              className="max-w-full h-auto rounded-xl shadow-lg"
              style={{
                width: styles.imageWidth || 'auto',
                height: styles.imageHeight || 'auto',
              }}
            />
          ) : (
            <div className="bg-muted h-64 rounded-xl flex items-center justify-center">
              <span className="text-muted-foreground">Image</span>
            </div>
          )}
        </div>
      );

    case 'button':
      return (
        <div 
          className="px-6 md:px-12 py-6 max-w-6xl mx-auto" 
          style={{ textAlign: styles.textAlign || 'center' }}
        >
          <a
            href={styles.buttonUrl || '#'}
            className="inline-block px-8 py-4 rounded-lg font-semibold text-lg transition-all hover:scale-105 hover:shadow-lg"
            style={{
              backgroundColor: styles.buttonColor || styles.backgroundColor || 'hsl(var(--primary))',
              color: styles.textColor || 'white',
            }}
          >
            {block.content || 'Button'}
          </a>
        </div>
      );

    case 'divider':
      return (
        <div className="px-6 md:px-12 py-6 max-w-6xl mx-auto">
          <hr
            className="border-t"
            style={{
              borderColor: styles.dividerColor || 'hsl(var(--border))',
            }}
          />
        </div>
      );

    case 'spacer':
      return <div style={{ height: styles.spacerHeight || '60px' }} />;

    case 'two-column':
      return (
        <section
          className="px-6 md:px-12 py-12 max-w-6xl mx-auto"
          style={{ backgroundColor: styles.backgroundColor }}
        >
          <div className="grid md:grid-cols-2 gap-8">
            <div className="p-6 bg-muted/30 rounded-xl">
              <p className="text-lg">{styles.leftColumnContent || ''}</p>
            </div>
            <div className="p-6 bg-muted/30 rounded-xl">
              <p className="text-lg">{styles.rightColumnContent || ''}</p>
            </div>
          </div>
        </section>
      );

    default:
      // Handle unknown block types gracefully
      return null;
  }
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-background p-6 rounded-xl text-center shadow-sm">
      <div className="text-3xl md:text-4xl font-bold text-primary mb-2">{value}</div>
      <div className="text-sm text-muted-foreground">{label}</div>
    </div>
  );
}
