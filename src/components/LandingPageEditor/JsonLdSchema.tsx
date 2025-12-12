import React from 'react';
import { Helmet } from 'react-helmet-async';

interface JsonLdSchemaProps {
  entityType: 'school' | 'district';
  entity: {
    name: string;
    city?: string;
    state?: string;
    address?: string;
    phone?: string;
    email?: string;
    website?: string;
    logo?: string;
  };
  stats?: {
    total_raised?: number;
    campaign_count?: number;
    supporter_count?: number;
    group_count?: number;
  };
  pageUrl: string;
  pageTitle?: string;
  pageDescription?: string;
}

export function JsonLdSchema({
  entityType,
  entity,
  stats,
  pageUrl,
  pageTitle,
  pageDescription,
}: JsonLdSchemaProps) {
  // Build EducationalOrganization schema
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': entityType === 'school' ? 'EducationalOrganization' : 'Organization',
    '@id': pageUrl,
    name: entity.name,
    url: pageUrl,
    ...(entity.logo && { logo: entity.logo }),
    ...(entity.website && { sameAs: [entity.website] }),
    ...(entity.address || entity.city || entity.state) && {
      address: {
        '@type': 'PostalAddress',
        ...(entity.address && { streetAddress: entity.address }),
        ...(entity.city && { addressLocality: entity.city }),
        ...(entity.state && { addressRegion: entity.state }),
        addressCountry: 'US',
      },
    },
    ...(entity.phone && { telephone: entity.phone }),
    ...(entity.email && { email: entity.email }),
  };

  // Build WebPage schema
  const webPageSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': `${pageUrl}#webpage`,
    url: pageUrl,
    name: pageTitle || `${entity.name} - Sponsorly`,
    description: pageDescription || `Support ${entity.name} through community fundraising on Sponsorly.`,
    isPartOf: {
      '@type': 'WebSite',
      '@id': 'https://sponsorly.io/#website',
      name: 'Sponsorly',
      url: 'https://sponsorly.io',
    },
    about: {
      '@id': pageUrl,
    },
    inLanguage: 'en-US',
  };

  // Build BreadcrumbList schema
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: 'https://sponsorly.io',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: entityType === 'school' ? 'Schools' : 'Districts',
        item: `https://sponsorly.io/${entityType === 'school' ? 'schools' : 'districts'}`,
      },
      ...(entity.state ? [{
        '@type': 'ListItem',
        position: 3,
        name: entity.state,
        item: `https://sponsorly.io/${entityType === 'school' ? 'schools' : 'districts'}/${entity.state.toLowerCase()}`,
      }] : []),
      {
        '@type': 'ListItem',
        position: entity.state ? 4 : 3,
        name: entity.name,
        item: pageUrl,
      },
    ],
  };

  // Build aggregate stats if available (as NonprofitType extension)
  const aggregateSchema = stats && (stats.total_raised || stats.campaign_count || stats.supporter_count) ? {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${pageUrl}#stats`,
    name: entity.name,
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '5',
      reviewCount: String(stats.supporter_count || 0),
    },
  } : null;

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(organizationSchema)}
      </script>
      <script type="application/ld+json">
        {JSON.stringify(webPageSchema)}
      </script>
      <script type="application/ld+json">
        {JSON.stringify(breadcrumbSchema)}
      </script>
      {aggregateSchema && (
        <script type="application/ld+json">
          {JSON.stringify(aggregateSchema)}
        </script>
      )}
    </Helmet>
  );
}
