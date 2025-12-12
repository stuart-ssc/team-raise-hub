import { LandingPageBlock } from "./types";

export interface LandingPageLayout {
  id: string;
  name: string;
  description: string;
  preview: string;
  templateType: 'school' | 'district' | 'nonprofit';
  blocks: LandingPageBlock[];
}

export const landingPageLayouts: LandingPageLayout[] = [
  {
    id: "school-modern",
    name: "Modern School",
    description: "Bold hero with stats and campaign showcase",
    preview: "bg-gradient-to-br from-blue-500 to-indigo-600",
    templateType: "school",
    blocks: [
      {
        id: "hero-1",
        type: "hero",
        content: "",
        styles: {
          heroTitle: "Welcome to {{school_name}}",
          heroSubtitle: "Proudly serving {{school_city}}, {{school_state}}",
          heroBackgroundColor: "#1e40af",
          heroHeight: "400px",
          heroOverlayOpacity: "0.5",
          textAlign: "center",
        },
      },
      {
        id: "spacer-1",
        type: "spacer",
        content: "",
        styles: { spacerHeight: "40px" },
      },
      {
        id: "stats-1",
        type: "stats-row",
        content: "",
        styles: {
          stats: [
            { label: "Total Raised", value: "{{total_raised_formatted}}", icon: "dollar" },
            { label: "Active Campaigns", value: "{{active_campaign_count}}", icon: "flag" },
            { label: "Supporters", value: "{{supporter_count}}", icon: "users" },
            { label: "Students", value: "{{school_students}}", icon: "graduation" },
          ],
          backgroundColor: "#f8fafc",
          padding: "40px",
        },
      },
      {
        id: "spacer-2",
        type: "spacer",
        content: "",
        styles: { spacerHeight: "40px" },
      },
      {
        id: "heading-1",
        type: "heading",
        content: "Support Our Programs",
        styles: {
          fontSize: "32px",
          fontWeight: "700",
          textAlign: "center",
          textColor: "#1e293b",
        },
      },
      {
        id: "paragraph-1",
        type: "paragraph",
        content: "Help us provide the best possible education and extracurricular activities for our students. Every contribution makes a difference!",
        styles: {
          fontSize: "18px",
          textAlign: "center",
          textColor: "#64748b",
          padding: "0 20%",
        },
      },
      {
        id: "spacer-3",
        type: "spacer",
        content: "",
        styles: { spacerHeight: "30px" },
      },
      {
        id: "campaigns-1",
        type: "campaign-list",
        content: "",
        styles: {
          campaignListTitle: "Active Campaigns",
          campaignListLimit: 6,
        },
      },
      {
        id: "spacer-4",
        type: "spacer",
        content: "",
        styles: { spacerHeight: "40px" },
      },
      {
        id: "cta-1",
        type: "cta-box",
        content: "",
        styles: {
          ctaTitle: "Ready to Make a Difference?",
          ctaDescription: "Join our community of supporters today and help us achieve our goals.",
          ctaButtonText: "Get Involved",
          ctaButtonUrl: "#campaigns",
          backgroundColor: "#1e40af",
          textColor: "#ffffff",
        },
      },
      {
        id: "spacer-5",
        type: "spacer",
        content: "",
        styles: { spacerHeight: "40px" },
      },
      {
        id: "contact-1",
        type: "contact-info",
        content: "",
        styles: {
          showAddress: true,
          showPhone: true,
          showEmail: true,
          showWebsite: true,
          textAlign: "center",
        },
      },
    ],
  },
  {
    id: "district-overview",
    name: "District Overview",
    description: "Professional layout for school districts",
    preview: "bg-gradient-to-br from-emerald-500 to-teal-600",
    templateType: "district",
    blocks: [
      {
        id: "hero-1",
        type: "hero",
        content: "",
        styles: {
          heroTitle: "{{district_name}}",
          heroSubtitle: "{{district_school_count}} Schools • {{district_total_students}} Students",
          heroBackgroundColor: "#059669",
          heroHeight: "350px",
          textAlign: "center",
        },
      },
      {
        id: "spacer-1",
        type: "spacer",
        content: "",
        styles: { spacerHeight: "40px" },
      },
      {
        id: "heading-1",
        type: "heading",
        content: "Supporting Excellence Across Our District",
        styles: {
          fontSize: "28px",
          fontWeight: "600",
          textAlign: "center",
          textColor: "#1e293b",
        },
      },
      {
        id: "paragraph-1",
        type: "paragraph",
        content: "Our district is committed to providing outstanding educational opportunities. Through community support and fundraising, we enhance programs across all our schools.",
        styles: {
          fontSize: "16px",
          textAlign: "center",
          textColor: "#64748b",
          padding: "0 15%",
        },
      },
      {
        id: "spacer-2",
        type: "spacer",
        content: "",
        styles: { spacerHeight: "40px" },
      },
      {
        id: "stats-1",
        type: "stats-row",
        content: "",
        styles: {
          stats: [
            { label: "Total Raised", value: "{{total_raised_formatted}}", icon: "dollar" },
            { label: "Schools", value: "{{district_school_count}}", icon: "building" },
            { label: "Campaigns", value: "{{campaign_count}}", icon: "flag" },
            { label: "Supporters", value: "{{supporter_count}}", icon: "users" },
          ],
          backgroundColor: "#f0fdf4",
          padding: "40px",
        },
      },
      {
        id: "spacer-3",
        type: "spacer",
        content: "",
        styles: { spacerHeight: "40px" },
      },
      {
        id: "campaigns-1",
        type: "campaign-list",
        content: "",
        styles: {
          campaignListTitle: "District Campaigns",
          campaignListLimit: 9,
        },
      },
    ],
  },
  {
    id: "nonprofit-impact",
    name: "Nonprofit Impact",
    description: "Mission-focused layout with testimonials",
    preview: "bg-gradient-to-br from-purple-500 to-pink-600",
    templateType: "nonprofit",
    blocks: [
      {
        id: "hero-1",
        type: "hero",
        content: "",
        styles: {
          heroTitle: "{{organization_name}}",
          heroSubtitle: "Making a difference in our community",
          heroBackgroundColor: "#7c3aed",
          heroHeight: "400px",
          textAlign: "center",
        },
      },
      {
        id: "spacer-1",
        type: "spacer",
        content: "",
        styles: { spacerHeight: "50px" },
      },
      {
        id: "stats-1",
        type: "stats-row",
        content: "",
        styles: {
          stats: [
            { label: "Funds Raised", value: "{{total_raised_formatted}}", icon: "dollar" },
            { label: "Programs", value: "{{group_count}}", icon: "heart" },
            { label: "Supporters", value: "{{supporter_count}}", icon: "users" },
            { label: "Campaigns", value: "{{campaign_count}}", icon: "flag" },
          ],
          backgroundColor: "#faf5ff",
          padding: "40px",
        },
      },
      {
        id: "spacer-2",
        type: "spacer",
        content: "",
        styles: { spacerHeight: "40px" },
      },
      {
        id: "heading-1",
        type: "heading",
        content: "Our Impact",
        styles: {
          fontSize: "32px",
          fontWeight: "700",
          textAlign: "center",
          textColor: "#1e293b",
        },
      },
      {
        id: "paragraph-1",
        type: "paragraph",
        content: "Every donation helps us continue our mission. Together, we're creating lasting change in our community.",
        styles: {
          fontSize: "18px",
          textAlign: "center",
          textColor: "#64748b",
        },
      },
      {
        id: "spacer-3",
        type: "spacer",
        content: "",
        styles: { spacerHeight: "30px" },
      },
      {
        id: "testimonial-1",
        type: "testimonial",
        content: "",
        styles: {
          testimonialQuote: "This organization has made such a difference in our community. Their dedication and transparency is unmatched.",
          testimonialAuthor: "Community Member",
          testimonialRole: "Supporter since {{current_year}}",
          backgroundColor: "#f8fafc",
        },
      },
      {
        id: "spacer-4",
        type: "spacer",
        content: "",
        styles: { spacerHeight: "40px" },
      },
      {
        id: "campaigns-1",
        type: "campaign-list",
        content: "",
        styles: {
          campaignListTitle: "Support Our Programs",
          campaignListLimit: 6,
        },
      },
      {
        id: "spacer-5",
        type: "spacer",
        content: "",
        styles: { spacerHeight: "40px" },
      },
      {
        id: "cta-1",
        type: "cta-box",
        content: "",
        styles: {
          ctaTitle: "Join Our Mission",
          ctaDescription: "Your support enables us to continue making a positive impact.",
          ctaButtonText: "Donate Today",
          ctaButtonUrl: "#campaigns",
          backgroundColor: "#7c3aed",
          textColor: "#ffffff",
        },
      },
    ],
  },
];
