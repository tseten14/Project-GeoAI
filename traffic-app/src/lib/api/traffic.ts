import { supabase } from '@/integrations/supabase/client';

export interface TrafficAnalysis {
  roads: {
    total: number;
    byType: Record<string, number>;
    totalLength: number;
  };
  intersections: number;
  trafficSignals: number;
  speedLimits: Record<string, number>;
  oneWayRoads: number;
  parkingAreas: number;
  busStops: number;
  railwayStations: number;
  bridgesAndTunnels: number;
  roadDensity: number;
  connectivityScore: number;
}

export interface AnalysisMetadata {
  center: { lat: number; lon: number };
  radiusMiles: number;
  radiusKm: number;
  areaKm2: number;
  elementsProcessed: number;
  timestamp: string;
}

export interface TrafficResponse {
  success: boolean;
  error?: string;
  data?: TrafficAnalysis;
  metadata?: AnalysisMetadata;
}

export async function analyzeTraffic(
  lat: number,
  lon: number,
  radiusMiles: number = 5
): Promise<TrafficResponse> {
  const { data, error } = await supabase.functions.invoke('osm-traffic-analysis', {
    body: { lat, lon, radiusMiles },
  });

  if (error) {
    return { success: false, error: error.message };
  }

  // Handle null/undefined response (e.g. function not deployed, empty response)
  if (!data) {
    return {
      success: false,
      error: 'No response from server. Make sure the osm-traffic-analysis function is deployed.',
    };
  }

  // Function may return { success: false, error } in body even on 200
  if (data.success === false && data.error) {
    return { success: false, error: data.error };
  }

  return data;
}
