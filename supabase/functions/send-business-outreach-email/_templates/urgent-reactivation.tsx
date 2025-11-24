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

interface UrgentReactivationProps {
  businessName: string
  contactFirstName: string
  daysSinceActivity: number
  organizationName: string
  primaryContactName?: string
}

export const UrgentReactivationEmail = ({
  businessName,
  contactFirstName,
  daysSinceActivity,
  organizationName,
  primaryContactName,
}: UrgentReactivationProps) => (
  <Html>
    <Head />
    <Preview>Important: Status of partnership with {businessName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={urgentBanner}>
          <Text style={urgentText}>⚠️ Partnership Status: Needs Attention</Text>
        </Section>
        <Heading style={h1}>We Need Your Help</Heading>
        <Text style={text}>Dear {contactFirstName},</Text>
        <Text style={text}>
          I'm reaching out with some concern about the partnership between {businessName} and {organizationName}. It's been over {Math.floor(daysSinceActivity / 30)} months since we've had active engagement, and I want to make sure we haven't lost touch.
        </Text>
        <Text style={text}>
          <strong>This isn't just a routine follow-up.</strong> Your partnership has been valuable to our mission, and before we consider this relationship inactive, I wanted to reach out personally to understand what happened and see if there's any way we can rebuild this connection.
        </Text>
        <Section style={concernBox}>
          <Text style={concernTitle}>A Few Questions:</Text>
          <Text style={bulletPoint}>• Did something change in your organization's priorities?</Text>
          <Text style={bulletPoint}>• Did we fail to meet expectations in some way?</Text>
          <Text style={bulletPoint}>• Is there a better way we could have supported your team?</Text>
        </Section>
        <Text style={text}>
          Your honest feedback would be invaluable – even if the answer is that this partnership has run its course. But if there's any chance to rekindle this relationship, I'd like to explore that with you.
        </Text>
        <Text style={text}>
          <strong>Would you be willing to have a candid 20-minute conversation?</strong> I promise to listen more than I talk, and there's absolutely no pressure to continue the partnership if it's not the right fit anymore.
        </Text>
        <Link
          href="https://calendly.com/your-organization"
          target="_blank"
          style={button}
        >
          Schedule Emergency Call
        </Link>
        <Text style={text}>
          If I don't hear back within the next two weeks, I'll understand that {businessName} is moving in a different direction, and I'll close this partnership file accordingly.
        </Text>
        <Text style={signature}>
          Respectfully,<br />
          {primaryContactName || `The ${organizationName} Team`}
        </Text>
      </Container>
    </Body>
  </Html>
)

export default UrgentReactivationEmail

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

const urgentBanner = {
  backgroundColor: '#fff4e6',
  borderLeft: '4px solid #ff9900',
  borderRadius: '4px',
  padding: '16px 20px',
  margin: '0 0 24px',
}

const urgentText = {
  color: '#cc7700',
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

const concernBox = {
  backgroundColor: '#f8f9fa',
  borderRadius: '8px',
  padding: '20px 24px',
  margin: '24px 0',
}

const concernTitle = {
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
  backgroundColor: '#dc3545',
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
