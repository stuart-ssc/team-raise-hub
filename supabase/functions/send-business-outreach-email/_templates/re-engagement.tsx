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

interface ReEngagementProps {
  businessName: string
  contactFirstName: string
  daysSinceActivity: number
  partnershipValue: string
  organizationName: string
  primaryContactName?: string
}

export const ReEngagementEmail = ({
  businessName,
  contactFirstName,
  daysSinceActivity,
  partnershipValue,
  organizationName,
  primaryContactName,
}: ReEngagementProps) => (
  <Html>
    <Head />
    <Preview>We'd love to reconnect with {businessName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Let's Reconnect</Heading>
        <Text style={text}>Dear {contactFirstName},</Text>
        <Text style={text}>
          I noticed it's been {daysSinceActivity} days since we've had engagement from {businessName}, and I wanted to reach out personally. Your partnership has meant so much to us, and we've missed having you actively involved.
        </Text>
        <Section style={historyBox}>
          <Text style={historyTitle}>Our Partnership Journey</Text>
          <Text style={historyText}>
            Together, we've achieved {partnershipValue} in partnership value, and your support has made a real difference in our community. That kind of impact doesn't go unnoticed.
          </Text>
        </Section>
        <Text style={text}>
          I understand that priorities shift and circumstances change. Whether it's exploring new ways to collaborate, adjusting our approach to better fit your current needs, or simply catching up on what's new at {businessName}, I'd welcome the opportunity to connect.
        </Text>
        <Text style={text}>
          <strong>Would you be open to a brief conversation?</strong> There's no pressure – just a chance to reconnect and see if there are ways we can continue supporting each other's missions.
        </Text>
        <Link
          href="https://calendly.com/your-organization"
          target="_blank"
          style={button}
        >
          Schedule a Reconnection Call
        </Link>
        <Text style={text}>
          If now isn't the right time, that's completely understandable. Either way, I'd love to hear from you.
        </Text>
        <Text style={signature}>
          Warmly,<br />
          {primaryContactName || `The ${organizationName} Team`}
        </Text>
      </Container>
    </Body>
  </Html>
)

export default ReEngagementEmail

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

const historyBox = {
  backgroundColor: '#fff8f0',
  borderRadius: '8px',
  padding: '24px',
  margin: '24px 0',
  border: '1px solid #ffd699',
}

const historyTitle = {
  color: '#1a1a1a',
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '0 0 12px',
}

const historyText = {
  color: '#404040',
  fontSize: '15px',
  lineHeight: '24px',
  margin: '0',
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
