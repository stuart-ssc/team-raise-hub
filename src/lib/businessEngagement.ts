import { Award, Handshake, DollarSign, TrendingUp, AlertCircle, AlertTriangle, MinusCircle, Sparkles, LucideIcon } from "lucide-react";

export interface BusinessSegmentInfo {
  color: string;
  bgColor: string;
  icon: LucideIcon;
  label: string;
  description: string;
}

export const BUSINESS_SEGMENT_INFO: Record<string, BusinessSegmentInfo> = {
  champion_partners: {
    color: "text-yellow-700 dark:text-yellow-400",
    bgColor: "bg-yellow-500/10",
    icon: Award,
    label: "Champion Partners",
    description: "Top partnerships: broad reach, high value, active"
  },
  engaged_partners: {
    color: "text-blue-700 dark:text-blue-400",
    bgColor: "bg-blue-500/10",
    icon: Handshake,
    label: "Engaged Partners",
    description: "Solid, consistent partnerships"
  },
  high_value_focused: {
    color: "text-purple-700 dark:text-purple-400",
    bgColor: "bg-purple-500/10",
    icon: DollarSign,
    label: "High Value Focused",
    description: "High value but narrow reach"
  },
  emerging_partners: {
    color: "text-green-700 dark:text-green-400",
    bgColor: "bg-green-500/10",
    icon: TrendingUp,
    label: "Emerging Partners",
    description: "New partnerships with potential"
  },
  needs_cultivation: {
    color: "text-orange-700 dark:text-orange-400",
    bgColor: "bg-orange-500/10",
    icon: AlertCircle,
    label: "Needs Cultivation",
    description: "Moderate engagement, needs nurturing"
  },
  at_risk: {
    color: "text-red-700 dark:text-red-400",
    bgColor: "bg-red-500/10",
    icon: AlertTriangle,
    label: "At Risk",
    description: "Declining activity, re-engagement needed"
  },
  dormant: {
    color: "text-gray-700 dark:text-gray-400",
    bgColor: "bg-gray-500/10",
    icon: MinusCircle,
    label: "Dormant",
    description: "No recent activity"
  },
  new: {
    color: "text-teal-700 dark:text-teal-400",
    bgColor: "bg-teal-500/10",
    icon: Sparkles,
    label: "New",
    description: "Newly added, no data yet"
  }
};

export const getSegmentInfo = (segment: string): BusinessSegmentInfo => {
  return BUSINESS_SEGMENT_INFO[segment] || BUSINESS_SEGMENT_INFO.new;
};
