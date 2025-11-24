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

interface StakeholderCultivationProps {
  businessName: string
  contactFirstName: string
  contactRole?: string
  organizationName: string
  primaryContactName?: string
}

export const StakeholderCultivationEmail = ({
  businessName,
  contactFirstName,
  contactRole,
  organizationName,
  primaryContactName,
}: StakeholderCultivationProps) => (
  <Html>
    <Head />
    <Preview>Building a stronger connection with {businessName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Let's Connect</Heading>
        <Text style={text}>Hi {contactFirstName},</Text>
        <Text style={text}>
          I wanted to reach out and introduce myself personally. {businessName} has been a wonderful partner to {organizationName}, and I know you're an important part of that team{contactRole ? ` as ${contactRole}` : ''}.
        </Text>
        <Text style={text}>
          While we've been working closely with your colleagues, I believe there's value in building relationships across the organization. Your perspective and insights would be incredibly valuable as we continue growing this partnership.
        </Text>
        <Section style={valueBox}>
          <Text style={valueTitle}>Why Connect?</Text>
          <Text style={bulletPoint}>
            🎯 <strong>Share your vision:</strong> Help shape how this partnership evolves
          </Text>
          <Text style={bulletPoint}>
            💡 <strong>Explore opportunities:</strong> Discover ways to get involved that align with your interests
          </Text>
          <Text style={bulletPoint}>
            🤝 <strong>Build relationships:</strong> Connect on a personal level beyond the business relationship
          </Text>
        </Section>
        <Text style={text}>
          I'm not asking for anything formal – just a casual conversation over coffee or a quick virtual chat. I'd love to hear about your work at {businessName} and share more about what we're doing at {organizationName}.
        </Text>
        <Text style={text}>
          <strong>Would you be open to a 20-minute coffee chat in the next few weeks?</strong>
        </Text>
        <Link
          href="https://calendly.com/your-organization"
          target="_blank"
          style={button}
        >
          Schedule a Coffee Chat
        </Link>
        <Text style={text}>
          If you'd prefer to just stay connected digitally, feel free to connect with me on LinkedIn or reply to this email anytime.
        </Text>
        <Text style={signature}>
          Looking forward to meeting you,<br />
          {primaryContactName || `The ${organizationName} Team`}
        </Text>
      </Container>
    </Body>
  </Html>
)

export default StakeholderCultivationEmail

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

const valueBox = {
  backgroundColor: '#f8f9fa',
  borderRadius: '8px',
  padding: '24px',
  margin: '24px 0',
}

const valueTitle = {
  color: '#1a1a1a',
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '0 0 16px',
}

const bulletPoint = {
  color: '#404040',
  fontSize: '15px',
  lineHeight: '26px',
  margin: '0 0 12px',
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
