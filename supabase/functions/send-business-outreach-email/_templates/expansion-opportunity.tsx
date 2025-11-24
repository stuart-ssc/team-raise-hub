import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'
import * as React from 'npm:react@18.3.1'

interface ExpansionOpportunityProps {
  businessName: string
  contactFirstName: string
  partnershipValue: string
  donorCount: number
  organizationName: string
  primaryContactName?: string
}

export const ExpansionOpportunityEmail = ({
  businessName,
  contactFirstName,
  partnershipValue,
  donorCount,
  organizationName,
  primaryContactName,
}: ExpansionOpportunityProps) => (
  <Html>
    <Head />
    <Preview>Exciting expansion opportunities for {businessName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={opportunityBanner}>
          <Text style={opportunityText}>🚀 Growth Opportunity</Text>
        </Section>
        <Heading style={h1}>Let's Grow Together</Heading>
        <Text style={text}>Hi {contactFirstName},</Text>
        <Text style={text}>
          I've been analyzing our partnership data, and I'm excited to share some insights with you. {businessName} has shown exceptional engagement with {organizationName}, and I see tremendous potential to expand our collaboration.
        </Text>
        <Section style={metricsBox}>
          <Text style={metricsTitle}>Current Partnership Strength</Text>
          <Text style={metric}>
            <strong>Partnership Value:</strong> {partnershipValue}
          </Text>
          <Text style={metric}>
            <strong>Employee Engagement:</strong> {donorCount} active donors
          </Text>
          <Text style={metric}>
            <strong>Growth Potential:</strong> High
          </Text>
        </Section>
        <Text style={text}>
          Based on your current engagement level and company size, I believe we could potentially:
        </Text>
        <Section style={opportunitiesBox}>
          <Text style={opportunityItem}>
            💼 <strong>Corporate Sponsorship:</strong> Exclusive branding opportunities at our signature events
          </Text>
          <Text style={opportunityItem}>
            🤝 <strong>Employee Engagement Programs:</strong> Structured volunteer days and team-building opportunities
          </Text>
          <Text style={opportunityItem}>
            📢 <strong>Co-Marketing Initiatives:</strong> Joint campaigns that benefit both organizations
          </Text>
          <Text style={opportunityItem}>
            🎯 <strong>Matching Gift Program:</strong> Amplify your team's impact with corporate matching
          </Text>
        </Section>
        <Text style={text}>
          These aren't just ideas – they're proven strategies that have helped similar partners increase their impact by 3-5x while building stronger employee engagement and brand recognition.
        </Text>
        <Text style={text}>
          <strong>Would you like to explore these opportunities?</strong> I'd love to put together a custom proposal that aligns with {businessName}'s goals and budget.
        </Text>
        <Link
          href="https://calendly.com/your-organization"
          target="_blank"
          style={button}
        >
          Schedule Strategy Session
        </Link>
        <Text style={text}>
          Looking forward to helping {businessName} maximize its community impact!
        </Text>
        <Text style={signature}>
          Excited to connect,<br />
          {primaryContactName || `The ${organizationName} Team`}
        </Text>
      </Container>
    </Body>
  </Html>
)

export default ExpansionOpportunityEmail

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
}

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '40px 20px',
  borderRadius: '8px',
  maxWidth: '600px',
}

const opportunityBanner = {
  backgroundColor: '#e6f7ff',
  borderLeft: '4px solid #0066cc',
  borderRadius: '4px',
  padding: '16px 20px',
  margin: '0 0 24px',
}

const opportunityText = {
  color: '#0066cc',
  fontSize: '14px',
  fontWeight: 'bold',
  margin: '0',
}

const h1 = {
  color: '#1a1a1a',
  fontSize: '28px',
  fontWeight: 'bold',
  margin: '0 0 30px',
}

const text = {
  color: '#404040',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '0 0 20px',
}

const metricsBox = {
  backgroundColor: '#f0f7ff',
  borderRadius: '8px',
  padding: '24px',
  margin: '24px 0',
}

const metricsTitle = {
  color: '#1a1a1a',
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '0 0 16px',
}

const metric = {
  color: '#404040',
  fontSize: '15px',
  lineHeight: '24px',
  margin: '0 0 8px',
}

const opportunitiesBox = {
  backgroundColor: '#ffffff',
  border: '1px solid #e0e0e0',
  borderRadius: '8px',
  padding: '24px',
  margin: '24px 0',
}

const opportunityItem = {
  color: '#404040',
  fontSize: '15px',
  lineHeight: '24px',
  margin: '0 0 16px',
}

const button = {
  backgroundColor: '#0066cc',
  borderRadius: '6px',
  color: '#fff',
  display: 'inline-block',
  fontSize: '16px',
  fontWeight: 'bold',
  padding: '14px 28px',
  textDecoration: 'none',
  textAlign: 'center' as const,
  margin: '20px 0',
}

const signature = {
  color: '#666',
  fontSize: '14px',
  lineHeight: '22px',
  marginTop: '32px',
}
