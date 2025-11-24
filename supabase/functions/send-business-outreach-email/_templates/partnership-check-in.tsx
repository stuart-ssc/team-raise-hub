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

interface PartnershipCheckInProps {
  businessName: string
  contactFirstName: string
  lastActivityDate: string
  organizationName: string
  primaryContactName?: string
}

export const PartnershipCheckInEmail = ({
  businessName,
  contactFirstName,
  lastActivityDate,
  organizationName,
  primaryContactName,
}: PartnershipCheckInProps) => (
  <Html>
    <Head />
    <Preview>Checking in on our partnership with {businessName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Partnership Check-In</Heading>
        <Text style={text}>Hi {contactFirstName},</Text>
        <Text style={text}>
          I hope this message finds you well! It's been a little while since we last connected (last activity: {lastActivityDate}), and I wanted to reach out to see how things are going at {businessName}.
        </Text>
        <Text style={text}>
          Our partnership means a lot to us, and we want to make sure we're providing value and staying aligned with your company's goals and interests.
        </Text>
        <Section style={questionBox}>
          <Text style={questionTitle}>We'd love your feedback on:</Text>
          <Text style={bulletPoint}>• How is the current partnership working for your team?</Text>
          <Text style={bulletPoint}>• Are there new initiatives or programs you'd like to explore?</Text>
          <Text style={bulletPoint}>• Is there anything we can do to better support your goals?</Text>
        </Section>
        <Text style={text}>
          Would you have 15-20 minutes in the coming weeks for a quick call? I'd love to hear your thoughts and share some exciting updates from our side as well.
        </Text>
        <Link
          href="https://calendly.com/your-organization"
          target="_blank"
          style={button}
        >
          Schedule a Call
        </Link>
        <Text style={text}>
          Or if you prefer, feel free to reply to this email with any thoughts or questions. We're here to support you!
        </Text>
        <Text style={signature}>
          Looking forward to connecting,<br />
          {primaryContactName || `The ${organizationName} Team`}
        </Text>
      </Container>
    </Body>
  </Html>
)

export default PartnershipCheckInEmail

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

const questionBox = {
  backgroundColor: '#f8f9fa',
  borderLeft: '4px solid #0066cc',
  borderRadius: '4px',
  padding: '20px 24px',
  margin: '24px 0',
}

const questionTitle = {
  color: '#1a1a1a',
  fontSize: '16px',
  fontWeight: 'bold',
  margin: '0 0 12px',
}

const bulletPoint = {
  color: '#404040',
  fontSize: '15px',
  lineHeight: '24px',
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
