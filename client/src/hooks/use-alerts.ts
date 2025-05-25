import { useQuery } from "@tanstack/react-query";

export interface AlertRow {
  athleteId: number;
  name: string;
  type: "injury" | "sick" | "acwr";
  note: string;
}

export const useAlerts = () =>
  useQuery<AlertRow[]>({
    queryKey: ["/api/alerts/today"],
    queryFn: async () => {
      const response = await fetch("/api/alerts/today");
      if (!response.ok) {
        throw new Error("Failed to fetch alerts");
      }
      return response.json();
    },
  });