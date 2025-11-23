import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
  Hr,
  Section,
} from 'npm:@react-email/components@0.0.22';
import * as React from 'npm:react@18.3.1';

interface AnnualSummaryEmailProps {
  donor_name: string;
  year: number;
  total_amount: number;
  donation_count: number;
  organization_count: number;
  organizations: Array<{
    name: string;
    amount: number;
    count: number;
  }>;
}

export const AnnualSummaryEmail = ({
  donor_name,
  year,
  total_amount,
  donation_count,
  organization_count,
  organizations,
}: AnnualSummaryEmailProps) => (
  <Html>
    <Head />
    <Preview>Your {year} Annual Charitable Giving Summary</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Thank You for Your Generosity!</Heading>
        
        <Text style={text}>Dear {donor_name},</Text>
        
        <Text style={text}>
          As we begin a new year, we want to express our heartfelt gratitude for your generous support 
          throughout {year}. Your contributions have made a real difference in the lives of many.
        </Text>

        <Section style={summaryBox}>
          <Heading style={h2}>Your {year} Impact Summary</Heading>
          <Text style={statText}>
            <strong style={statLabel}>Total Donated:</strong> ${total_amount.toFixed(2)}
          </Text>
          <Text style={statText}>
            <strong style={statLabel}>Number of Donations:</strong> {donation_count}
          </Text>
          <Text style={statText}>
            <strong style={statLabel}>Organizations Supported:</strong> {organization_count}
          </Text>
        </Section>

        {organizations.length > 0 && (
          <>
            <Heading style={h2}>Organizations You Supported</Heading>
            {organizations.map((org, index) => (
              <Section key={index} style={orgSection}>
                <Text style={orgName}>{org.name}</Text>
                <Text style={orgDetails}>
                  ${org.amount.toFixed(2)} across {org.count} donation{org.count !== 1 ? 's' : ''}
                </Text>
              </Section>
            ))}
          </>
        )}

        <Hr style={divider} />

        <Heading style={h2}>Your Tax Summary Document</Heading>
        
        <Text style={text}>
          Attached to this email is your comprehensive annual tax summary for {year}. This document includes:
        </Text>

        <ul style={list}>
          <li style={listItem}>Detailed breakdown of all charitable contributions</li>
          <li style={listItem}>Organization information including EINs</li>
          <li style={listItem}>IRS-compliant documentation for tax filing</li>
          <li style={listItem}>Individual donation details by date and campaign</li>
        </ul>

        <Text style={text}>
          Please retain this document along with your individual donation receipts for your tax records. 
          We recommend consulting with your tax advisor for specific guidance regarding the deductibility 
          of charitable contributions.
        </Text>

        <Hr style={divider} />

        <Text style={text}>
          Need access to individual receipts or have questions? Visit our{' '}
          <Link href="https://sponsorly.io/donor-receipts" style={link}>
            donor receipt portal
          </Link>{' '}
          anytime to download receipts or view your giving history.
        </Text>

        <Text style={text}>
          Thank you again for your incredible generosity. Your support continues to make a lasting impact.
        </Text>

        <Text style={text}>
          With gratitude,<br />
          <strong>The Sponsorly Team</strong>
        </Text>

        <Hr style={divider} />

        <Text style={footer}>
          This is an automated annual summary for tax year {year}. For questions or support, 
          please visit{' '}
          <Link href="https://sponsorly.io" style={footerLink}>
            sponsorly.io
          </Link>
        </Text>
      </Container>
    </Body>
  </Html>
);

export default AnnualSummaryEmail;

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  maxWidth: '600px',
};

const h1 = {
  color: '#333',
  fontSize: '28px',
  fontWeight: 'bold',
  margin: '40px 20px 24px',
  padding: '0',
  textAlign: 'center' as const,
};

const h2 = {
  color: '#333',
  fontSize: '20px',
  fontWeight: 'bold',
  margin: '30px 20px 16px',
  padding: '0',
};

const text = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '16px 20px',
};

const summaryBox = {
  backgroundColor: '#f0f7ff',
  border: '2px solid #3b82f6',
  borderRadius: '8px',
  padding: '24px',
  margin: '24px 20px',
};

const statText = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '8px 0',
};

const statLabel = {
  color: '#3b82f6',
  fontWeight: '600' as const,
};

const orgSection = {
  backgroundColor: '#f9fafb',
  borderLeft: '4px solid #10b981',
  padding: '12px 16px',
  margin: '12px 20px',
  borderRadius: '4px',
};

const orgName = {
  color: '#111827',
  fontSize: '16px',
  fontWeight: '600' as const,
  margin: '0 0 4px 0',
};

const orgDetails = {
  color: '#6b7280',
  fontSize: '14px',
  margin: '0',
};

const list = {
  margin: '16px 20px',
  paddingLeft: '20px',
};

const listItem = {
  color: '#333',
  fontSize: '15px',
  lineHeight: '24px',
  marginBottom: '8px',
};

const divider = {
  borderColor: '#e5e7eb',
  margin: '32px 20px',
};

const link = {
  color: '#3b82f6',
  textDecoration: 'underline',
  fontWeight: '500' as const,
};

const footer = {
  color: '#6b7280',
  fontSize: '12px',
  lineHeight: '20px',
  margin: '16px 20px',
};

const footerLink = {
  color: '#3b82f6',
  textDecoration: 'underline',
};
