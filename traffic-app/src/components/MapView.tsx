import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface MapViewProps {
  center: [number, number];
  radiusMiles: number;
  onMapClick?: (lat: number, lon: number) => void;
}

export function MapView({ center, radiusMiles, onMapClick }: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const circleRef = useRef<L.Circle | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Initialize map
    const map = L.map(mapRef.current, {
      center: center,
      zoom: 11,
      zoomControl: true,
    });

    // Light, clean tile layer
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 20,
    }).addTo(map);

    // Custom marker icon - Apple style
    const customIcon = L.divIcon({
      className: 'custom-marker',
      html: `
        <div style="
          width: 20px;
          height: 20px;
          background: linear-gradient(135deg, #007AFF 0%, #00C7BE 100%);
          border-radius: 50%;
          border: 2.5px solid #fff;
          box-shadow: 0 2px 8px rgba(0, 122, 255, 0.4);
        "></div>
      `,
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    });

    // Add marker
    const marker = L.marker(center, { icon: customIcon }).addTo(map);
    markerRef.current = marker;

    // Add radius circle
    const radiusMeters = radiusMiles * 1609.34;
    const circle = L.circle(center, {
      radius: radiusMeters,
      color: '#007AFF',
      fillColor: '#007AFF',
      fillOpacity: 0.08,
      weight: 1.5,
      dashArray: '6, 6',
    }).addTo(map);
    circleRef.current = circle;

    // Handle map clicks
    map.on('click', (e: L.LeafletMouseEvent) => {
      if (onMapClick) {
        onMapClick(e.latlng.lat, e.latlng.lng);
      }
    });

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update marker and circle when center or radius changes
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    const map = mapInstanceRef.current;
    const radiusMeters = radiusMiles * 1609.34;

    // Update marker position
    if (markerRef.current) {
      markerRef.current.setLatLng(center);
    }

    // Update circle
    if (circleRef.current) {
      circleRef.current.setLatLng(center);
      circleRef.current.setRadius(radiusMeters);
    }

    // Pan to new center
    map.setView(center, map.getZoom());
  }, [center, radiusMiles]);

  return (
    <div 
      ref={mapRef} 
      className="w-full h-full rounded-xl overflow-hidden"
      style={{ minHeight: '380px' }}
    />
  );
}
