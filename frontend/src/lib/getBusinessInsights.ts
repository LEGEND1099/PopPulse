import insights from "@/data/business-insights.json";
import type { BusinessInsight } from "@/lib/types";

export function getBusinessInsights(): BusinessInsight[] {
  return insights as BusinessInsight[];
}
