import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
  Section,
  Hr,
} from "npm:@react-email/components@0.0.22";
import * as React from "npm:react@18.3.1";

interface AnnualSummaryVariantEmailProps {
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
  variant_style?: "enthusiastic" | "formal" | "grateful" | "default";
}

export const AnnualSummaryVariantEmail = ({
  donor_name,
  year,
  total_amount,
  donation_count,
  organization_count,
  organizations,
  variant_style = "default",
}: AnnualSummaryVariantEmailProps) => {
  const styles = getVariantStyles(variant_style);

  return (
    <Html>
      <Head />
      <Preview>{styles.preview}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>{styles.greeting}</Heading>
          
          <Text style={text}>Dear {donor_name},</Text>
          
          <Text style={text}>{styles.opening}</Text>

          <Section style={highlightBox}>
            <Heading style={h2}>{styles.summaryTitle}</Heading>
            <Text style={statText}>
              <strong>Total Donated:</strong> ${total_amount.toFixed(2)}
            </Text>
            <Text style={statText}>
              <strong>Number of Donations:</strong> {donation_count}
            </Text>
            <Text style={statText}>
              <strong>Organizations Supported:</strong> {organization_count}
            </Text>
          </Section>

          <Heading style={h2}>Organizations You Supported</Heading>
          
          {organizations.map((org, index) => (
            <Section key={index} style={orgBox}>
              <Text style={orgName}>{org.name}</Text>
              <Text style={orgStats}>
                ${org.amount.toFixed(2)} across {org.count} donation{org.count !== 1 ? 's' : ''}
              </Text>
            </Section>
          ))}

          <Hr style={hr} />

          <Text style={text}>{styles.closing}</Text>

          <Text style={signature}>
            {styles.signoff}<br />
            <strong>The Sponsorly Team</strong>
          </Text>

          <Text style={footer}>
            This email contains your annual tax summary. The attached PDF includes complete details 
            for your tax filing. Questions? Contact us at support@sponsorly.io
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

function getVariantStyles(variant: string) {
  switch (variant) {
    case "enthusiastic":
      return {
        preview: "🎉 Your amazing impact in " + new Date().getFullYear() + "!",
        greeting: "🌟 Your Incredible Year of Giving! 🌟",
        opening: "We're absolutely thrilled to share your extraordinary generosity throughout this year. Your contributions have sparked real change and touched countless lives!",
        summaryTitle: "Your Amazing Impact",
        closing: "Thank you for being such an incredible force for good. Your generosity continues to create ripples of positive change!",
        signoff: "With heartfelt appreciation and excitement,",
      };
    case "formal":
      return {
        preview: "Annual Charitable Contributions Summary - " + new Date().getFullYear(),
        greeting: "Annual Charitable Contributions Summary",
        opening: "We are pleased to provide your annual charitable contributions summary for tax year " + new Date().getFullYear() + ". Your continued support has been instrumental in advancing important causes.",
        summaryTitle: "Contribution Summary",
        closing: "We appreciate your continued partnership in supporting our mission. Your contributions have been properly documented for tax purposes.",
        signoff: "Respectfully,",
      };
    case "grateful":
      return {
        preview: "Thank you for your heartfelt generosity this year",
        greeting: "Thank You for Your Generous Heart ❤️",
        opening: "As we reflect on this year, we are deeply grateful for your compassionate support. Your kindness has made a meaningful difference in the lives of many.",
        summaryTitle: "Your Generous Contributions",
        closing: "From the bottom of our hearts, thank you for your continued generosity and belief in our shared mission. Your support means everything.",
        signoff: "With deepest gratitude,",
      };
    default:
      return {
        preview: "Your " + new Date().getFullYear() + " giving summary is here",
        greeting: "Thank You for Your Generosity!",
        opening: "As we begin a new year, we want to express our heartfelt gratitude for your generous support throughout " + new Date().getFullYear() + ". Your contributions have made a real difference in the lives of many.",
        summaryTitle: "Your Impact Summary",
        closing: "Thank you again for your incredible generosity. Your support continues to make a lasting impact.",
        signoff: "With gratitude,",
      };
  }
}

export default AnnualSummaryVariantEmail;

const main = {
  backgroundColor: "#f6f9fc",
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "20px 0 48px",
  marginBottom: "64px",
};

const h1 = {
  color: "#333",
  fontSize: "28px",
  fontWeight: "bold",
  margin: "40px 0 20px",
  padding: "0 40px",
  textAlign: "center" as const,
};

const h2 = {
  color: "#333",
  fontSize: "20px",
  fontWeight: "bold",
  margin: "30px 40px 15px",
};

const text = {
  color: "#333",
  fontSize: "16px",
  lineHeight: "26px",
  margin: "16px 40px",
};

const highlightBox = {
  backgroundColor: "#e3f2fd",
  border: "2px solid #2196f3",
  borderRadius: "8px",
  padding: "20px",
  margin: "24px 40px",
};

const statText = {
  color: "#1976d2",
  fontSize: "16px",
  lineHeight: "24px",
  margin: "8px 0",
};

const orgBox = {
  backgroundColor: "#f5f5f5",
  borderLeft: "4px solid #4caf50",
  padding: "16px",
  margin: "12px 40px",
  borderRadius: "4px",
};

const orgName = {
  fontWeight: "600",
  fontSize: "16px",
  margin: "0 0 8px",
  color: "#333",
};

const orgStats = {
  fontSize: "14px",
  color: "#666",
  margin: "0",
};

const hr = {
  borderColor: "#e6ebf1",
  margin: "30px 40px",
};

const signature = {
  margin: "20px 40px",
  fontSize: "16px",
  lineHeight: "24px",
  color: "#333",
};

const footer = {
  color: "#8898aa",
  fontSize: "12px",
  lineHeight: "18px",
  margin: "32px 40px",
};
