const express = require('express');
const router = express.Router();

function milesToMeters(miles) {
    return miles * 1609.34;
}

// Exact distance calculation using Haversine formula
function getDistanceFromLatLonInM(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // Radius of the earth in m
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in m
}

async function queryOverpassWithRetry(query, maxRetries = 3) {
    let lastError = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            const endpoints = [
                'https://overpass-api.de/api/interpreter',
                'https://overpass.kumi.systems/api/interpreter',
            ];
            const endpoint = endpoints[attempt % endpoints.length];

            console.log(`Attempt ${attempt + 1}: Querying ${endpoint}`);

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: `data=${encodeURIComponent(query)}`,
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`Overpass API error: ${response.status}`);
            }

            const data = await response.json();
            console.log(`Successfully retrieved ${data.elements?.length || 0} elements`);
            return data.elements || [];
        } catch (error) {
            lastError = error instanceof Error ? error : new Error(String(error));
            console.log(`Attempt ${attempt + 1} failed: ${lastError.message}`);

            if (attempt < maxRetries - 1) {
                const delay = Math.pow(2, attempt) * 1000;
                console.log(`Waiting ${delay}ms before retry...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }

    throw lastError || new Error('All retry attempts failed');
}

router.post('/traffic-analysis', async (req, res) => {
    try {
        const { lat, lon, radiusMiles = 5 } = req.body;

        if (!lat || !lon) {
            return res.status(400).json({ success: false, error: 'Latitude and longitude are required' });
        }

        const effectiveRadius = Math.min(radiusMiles, 5);
        const radiusMeters = milesToMeters(effectiveRadius);
        const areaKm2 = Math.PI * (effectiveRadius * 1.60934) ** 2;

        console.log(`Analyzing traffic around (${lat}, ${lon}) with radius ${effectiveRadius} miles (${Math.round(radiusMeters)}m)`);

        // Using `out body geom` gets the exact point coordinates for each node in a way, 
        // plus the node IDs (needed for intersection calculation) and tags.
        const roadsQuery = `
      [out:json][timeout:45];
      way["highway"~"^(motorway|trunk|primary|secondary|tertiary|residential|service|unclassified|living_street)$"](around:${radiusMeters},${lat},${lon});
      out body geom;
    `;

        const infrastructureQuery = `
      [out:json][timeout:30];
      (
        node["highway"="traffic_signals"](around:${radiusMeters},${lat},${lon});
        node["highway"="bus_stop"](around:${radiusMeters},${lat},${lon});
        node["railway"="station"](around:${radiusMeters},${lat},${lon});
        way["amenity"="parking"](around:${radiusMeters},${lat},${lon});
        way["bridge"="yes"]["highway"](around:${radiusMeters},${lat},${lon});
        way["tunnel"="yes"]["highway"](around:${radiusMeters},${lat},${lon});
      );
      out center tags;
    `;

        console.log('Fetching road data...');
        const [roadElements, infraElements] = await Promise.all([
            queryOverpassWithRetry(roadsQuery),
            queryOverpassWithRetry(infrastructureQuery),
        ]);

        console.log(`Retrieved ${roadElements.length} roads, ${infraElements.length} infrastructure elements`);

        const analysis = {
            roads: {
                total: 0,
                byType: {},
                totalLength: 0,
            },
            intersections: 0,
            trafficSignals: 0,
            speedLimits: {},
            oneWayRoads: 0,
            parkingAreas: 0,
            busStops: 0,
            railwayStations: 0,
            bridgesAndTunnels: 0,
            roadDensity: 0,
            connectivityScore: 0,
        };

        const nodeConnections = new Map();
        const namedRoads = new Set();
        let unnamedRoadsCount = 0;

        // Process roads
        for (const element of roadElements) {
            if (element.type === 'way' && element.tags?.highway) {
                const roadType = element.tags.highway;

                if (element.tags.name) {
                    namedRoads.add(element.tags.name);
                } else {
                    unnamedRoadsCount++;
                }

                analysis.roads.byType[roadType] = (analysis.roads.byType[roadType] || 0) + 1;

                // Calculate actual length using geometry
                let wayLength = 0;
                if (element.geometry && element.geometry.length > 1) {
                    for (let i = 0; i < element.geometry.length - 1; i++) {
                        const p1 = element.geometry[i];
                        const p2 = element.geometry[i + 1];
                        if (p1 && p2 && p1.lat && p1.lon && p2.lat && p2.lon) {
                            wayLength += getDistanceFromLatLonInM(p1.lat, p1.lon, p2.lat, p2.lon);
                        }
                    }
                }
                analysis.roads.totalLength += wayLength;

                if (element.tags.oneway === 'yes') {
                    analysis.oneWayRoads++;
                }

                if (element.tags.maxspeed) {
                    const speedLimit = element.tags.maxspeed;
                    analysis.speedLimits[speedLimit] = (analysis.speedLimits[speedLimit] || 0) + 1;
                }

                // Count node connections for true intersections
                if (element.nodes) {
                    for (const nodeId of element.nodes) {
                        nodeConnections.set(nodeId, (nodeConnections.get(nodeId) || 0) + 1);
                    }
                }
            }
        }

        // "Total Roads" = only distinct named streets (what a person would actually call a "road").
        // Unnamed service roads, driveways, parking lot lanes, and alleys still contribute to
        // road length and the type breakdown, but don't inflate the headline count.
        analysis.roads.total = namedRoads.size;

        // Process infrastructure
        for (const element of infraElements) {
            if (element.type === 'node') {
                if (element.tags?.highway === 'traffic_signals') {
                    analysis.trafficSignals++;
                }
                if (element.tags?.highway === 'bus_stop') {
                    analysis.busStops++;
                }
                if (element.tags?.railway === 'station') {
                    analysis.railwayStations++;
                }
            }

            if (element.type === 'way') {
                if (element.tags?.amenity === 'parking') {
                    analysis.parkingAreas++;
                }
                if (element.tags?.bridge === 'yes' || element.tags?.tunnel === 'yes') {
                    analysis.bridgesAndTunnels++;
                }
            }
        }

        // Estimate intersections (nodes connected to 3+ roads)
        for (const connections of nodeConnections.values()) {
            if (connections >= 3) {
                analysis.intersections++;
            }
        }

        // Calculate road density (km of road per km²)
        const totalLengthKm = analysis.roads.totalLength / 1000;
        analysis.roadDensity = Math.round((totalLengthKm / areaKm2) * 100) / 100;
        analysis.roads.totalLength = Math.round(totalLengthKm * 100) / 100;

        // Calculate connectivity score (0-100)
        const baseScore = Math.min(analysis.intersections / 100, 1) * 30;
        const signalScore = Math.min(analysis.trafficSignals / 50, 1) * 20;
        const densityScore = Math.min(analysis.roadDensity / 15, 1) * 30;
        const transitScore = Math.min((analysis.busStops + analysis.railwayStations) / 20, 1) * 20;
        analysis.connectivityScore = Math.round(baseScore + signalScore + densityScore + transitScore);

        // Estimate congestion (0-100) based on infrastructure factors
        // Higher signal density per road = more congestion
        // Higher intersection density = more congestion
        // More one-way roads relative to total = more congestion (traffic management)
        const signalDensityPerKm2 = analysis.trafficSignals / areaKm2;
        const intersectionDensityPerKm2 = analysis.intersections / areaKm2;
        const oneWayRatio = analysis.roads.total > 0 ? analysis.oneWayRoads / roadElements.length : 0;

        const congestionFromSignals = Math.min(signalDensityPerKm2 / 15, 1) * 35;       // 15 signals/km² = full score
        const congestionFromIntersections = Math.min(intersectionDensityPerKm2 / 50, 1) * 35; // 50 intersections/km² = full
        const congestionFromOneWay = oneWayRatio * 15;                                    // one-way management = congestion indicator
        const congestionFromDensity = Math.min(analysis.roadDensity / 25, 1) * 15;       // very dense road network

        analysis.congestionScore = Math.round(
            congestionFromSignals + congestionFromIntersections + congestionFromOneWay + congestionFromDensity
        );
        analysis.congestionLevel =
            analysis.congestionScore >= 70 ? 'Heavy' :
                analysis.congestionScore >= 45 ? 'Moderate' :
                    analysis.congestionScore >= 20 ? 'Light' : 'Minimal';

        console.log('Analysis complete. Signals:', analysis.trafficSignals, 'Congestion:', analysis.congestionScore);

        return res.json({
            success: true,
            data: analysis,
            metadata: {
                center: { lat, lon },
                radiusMiles: effectiveRadius,
                radiusKm: Math.round(effectiveRadius * 1.60934 * 100) / 100,
                areaKm2: Math.round(areaKm2 * 100) / 100,
                elementsProcessed: roadElements.length + infraElements.length,
                timestamp: new Date().toISOString(),
            },
        });
    } catch (error) {
        console.error('Error analyzing traffic:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to analyze traffic';
        return res.status(500).json({ success: false, error: errorMessage });
    }
});

module.exports = router;
