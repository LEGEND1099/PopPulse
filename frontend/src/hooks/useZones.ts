import { getBusinessInsights } from "@/lib/getBusinessInsights";
import { getZones } from "@/lib/getZones";

export function useZones() {
  return {
    zones: getZones(),
    businessInsights: getBusinessInsights(),
    isLoading: false,
  };
}
