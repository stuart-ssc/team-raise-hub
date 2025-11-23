import { EmailBlock } from "./types";

export interface EmailLayout {
  id: string;
  name: string;
  description: string;
  preview: string;
  blocks: EmailBlock[];
}

export const emailLayouts: EmailLayout[] = [
  {
    id: "modern",
    name: "Modern",
    description: "Bold colors, centered design with clear call-to-action",
    preview: "bg-gradient-to-br from-blue-500 to-purple-600",
    blocks: [
      {
        id: "modern-1",
        type: "spacer",
        content: "",
        styles: { spacerHeight: "30px" },
      },
      {
        id: "modern-2",
        type: "heading",
        content: "Welcome to Our Community!",
        styles: {
          fontSize: "32px",
          color: "#1a1a1a",
          textAlign: "center",
          fontWeight: "700",
        },
      },
      {
        id: "modern-3",
        type: "paragraph",
        content: "We're thrilled to have you here. Your support makes a real difference in our mission.",
        styles: {
          fontSize: "18px",
          color: "#4a4a4a",
          textAlign: "center",
        },
      },
      {
        id: "modern-4",
        type: "spacer",
        content: "",
        styles: { spacerHeight: "20px" },
      },
      {
        id: "modern-5",
        type: "button",
        content: "",
        styles: {
          buttonText: "Get Started",
          buttonUrl: "#",
          buttonColor: "#6366f1",
          textAlign: "center",
        },
      },
      {
        id: "modern-6",
        type: "spacer",
        content: "",
        styles: { spacerHeight: "30px" },
      },
      {
        id: "modern-7",
        type: "divider",
        content: "",
        styles: {},
      },
      {
        id: "modern-8",
        type: "paragraph",
        content: "Have questions? We're here to help. Reply to this email anytime.",
        styles: {
          fontSize: "14px",
          color: "#6b7280",
          textAlign: "center",
        },
      },
    ],
  },
  {
    id: "classic",
    name: "Classic",
    description: "Traditional newsletter format with header and sections",
    preview: "bg-gradient-to-br from-amber-100 to-orange-200",
    blocks: [
      {
        id: "classic-1",
        type: "heading",
        content: "Monthly Newsletter",
        styles: {
          fontSize: "28px",
          color: "#1f2937",
          textAlign: "left",
          fontWeight: "600",
        },
      },
      {
        id: "classic-2",
        type: "paragraph",
        content: "Dear Friend,",
        styles: {
          fontSize: "16px",
          color: "#374151",
          textAlign: "left",
        },
      },
      {
        id: "classic-3",
        type: "paragraph",
        content: "Thank you for being part of our community. Here's what's been happening this month and how your support is making an impact.",
        styles: {
          fontSize: "16px",
          color: "#374151",
          textAlign: "left",
        },
      },
      {
        id: "classic-4",
        type: "spacer",
        content: "",
        styles: { spacerHeight: "25px" },
      },
      {
        id: "classic-5",
        type: "heading",
        content: "Recent Highlights",
        styles: {
          fontSize: "22px",
          color: "#1f2937",
          textAlign: "left",
          fontWeight: "600",
        },
      },
      {
        id: "classic-6",
        type: "paragraph",
        content: "• Milestone 1: Brief description of achievement\n• Milestone 2: Another important update\n• Milestone 3: Recent success story",
        styles: {
          fontSize: "16px",
          color: "#374151",
          textAlign: "left",
        },
      },
      {
        id: "classic-7",
        type: "spacer",
        content: "",
        styles: { spacerHeight: "20px" },
      },
      {
        id: "classic-8",
        type: "button",
        content: "",
        styles: {
          buttonText: "Read More",
          buttonUrl: "#",
          buttonColor: "#d97706",
          textAlign: "left",
        },
      },
      {
        id: "classic-9",
        type: "spacer",
        content: "",
        styles: { spacerHeight: "25px" },
      },
      {
        id: "classic-10",
        type: "paragraph",
        content: "With gratitude,\nYour Team",
        styles: {
          fontSize: "16px",
          color: "#374151",
          textAlign: "left",
        },
      },
    ],
  },
  {
    id: "minimalist",
    name: "Minimalist",
    description: "Clean and simple with plenty of white space",
    preview: "bg-gradient-to-br from-slate-50 to-slate-200",
    blocks: [
      {
        id: "minimalist-1",
        type: "spacer",
        content: "",
        styles: { spacerHeight: "50px" },
      },
      {
        id: "minimalist-2",
        type: "heading",
        content: "Thank You",
        styles: {
          fontSize: "36px",
          color: "#0f172a",
          textAlign: "center",
          fontWeight: "300",
        },
      },
      {
        id: "minimalist-3",
        type: "spacer",
        content: "",
        styles: { spacerHeight: "30px" },
      },
      {
        id: "minimalist-4",
        type: "paragraph",
        content: "Your support means everything to us.",
        styles: {
          fontSize: "18px",
          color: "#475569",
          textAlign: "center",
        },
      },
      {
        id: "minimalist-5",
        type: "spacer",
        content: "",
        styles: { spacerHeight: "40px" },
      },
      {
        id: "minimalist-6",
        type: "button",
        content: "",
        styles: {
          buttonText: "Continue",
          buttonUrl: "#",
          buttonColor: "#0f172a",
          textAlign: "center",
        },
      },
      {
        id: "minimalist-7",
        type: "spacer",
        content: "",
        styles: { spacerHeight: "50px" },
      },
      {
        id: "minimalist-8",
        type: "divider",
        content: "",
        styles: {},
      },
      {
        id: "minimalist-9",
        type: "spacer",
        content: "",
        styles: { spacerHeight: "20px" },
      },
      {
        id: "minimalist-10",
        type: "paragraph",
        content: "Questions? Contact us anytime.",
        styles: {
          fontSize: "14px",
          color: "#94a3b8",
          textAlign: "center",
        },
      },
      {
        id: "minimalist-11",
        type: "spacer",
        content: "",
        styles: { spacerHeight: "30px" },
      },
    ],
  },
];
