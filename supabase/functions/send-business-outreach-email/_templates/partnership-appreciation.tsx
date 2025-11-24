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

interface PartnershipAppreciationProps {
  businessName: string
  contactFirstName: string
  partnershipValue: string
  donorCount: number
  organizationName: string
  primaryContactName?: string
}

export const PartnershipAppreciationEmail = ({
  businessName,
  contactFirstName,
  partnershipValue,
  donorCount,
  organizationName,
  primaryContactName,
}: PartnershipAppreciationProps) => (
  <Html>
    <Head />
    <Preview>Thank you for your outstanding partnership with {organizationName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Partnership Excellence</Heading>
        <Text style={text}>Dear {contactFirstName},</Text>
        <Text style={text}>
          We wanted to take a moment to recognize and celebrate the exceptional partnership between {businessName} and {organizationName}.
        </Text>
        <Section style={statsBox}>
          <Text style={statsTitle}>Your Impact</Text>
          <Text style={statsText}>
            <strong>Total Partnership Value:</strong> {partnershipValue}
          </Text>
          <Text style={statsText}>
            <strong>Employee Donors:</strong> {donorCount} team members
          </Text>
        </Section>
        <Text style={text}>
          Your organization's commitment to our mission has made a tremendous difference. The engagement from your team demonstrates a shared vision that extends beyond business – it's about building community.
        </Text>
        <Text style={text}>
          We're excited about the potential to deepen our partnership and explore new opportunities for collaboration. Would you be open to scheduling a strategic planning call to discuss how we can continue growing this relationship?
        </Text>
        <Link
          href="https://calendly.com/your-organization"
          target="_blank"
          style={button}
        >
          Schedule Strategic Call
        </Link>
        <Text style={text}>
          Thank you for being a champion partner. Together, we're creating lasting impact.
        </Text>
        <Text style={signature}>
          With gratitude,<br />
          {primaryContactName || `The ${organizationName} Team`}
        </Text>
      </Container>
    </Body>
  </Html>
)

export default PartnershipAppreciationEmail

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

const statsBox = {
  backgroundColor: '#f0f7ff',
  borderRadius: '8px',
  padding: '24px',
  margin: '24px 0',
}

const statsTitle = {
  color: '#1a1a1a',
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '0 0 16px',
}

const statsText = {
  color: '#404040',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '0 0 8px',
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
