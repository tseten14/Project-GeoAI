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
  congestionScore: number;
  congestionLevel: string;
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
  try {
    const response = await fetch('/api/traffic-analysis', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ lat, lon, radiusMiles }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error || `Server error: ${response.status}` };
    }

    if (data.success === false && data.error) {
      return { success: false, error: data.error };
    }

    return data;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error communicating with the server'
    };
  }
}

