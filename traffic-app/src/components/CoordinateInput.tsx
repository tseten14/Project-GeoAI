import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Search, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';

interface CoordinateInputProps {
  onSubmit: (lat: number, lon: number, radius: number) => void;
  isLoading: boolean;
  initialLat?: number;
  initialLon?: number;
}

export function CoordinateInput({ 
  onSubmit, 
  isLoading, 
  initialLat = 40.7128, 
  initialLon = -74.006 
}: CoordinateInputProps) {
  const [lat, setLat] = useState(initialLat.toString());
  const [lon, setLon] = useState(initialLon.toString());
  const [radius, setRadius] = useState(5);

  // Sync with parent when center changes (e.g. from map click)
  useEffect(() => {
    setLat(initialLat.toString());
    setLon(initialLon.toString());
  }, [initialLat, initialLon]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const latNum = parseFloat(lat);
    const lonNum = parseFloat(lon);
    
    if (isNaN(latNum) || isNaN(lonNum)) {
      return;
    }
    
    onSubmit(latNum, lonNum, radius);
  };

  const handleGetCurrentLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLat(position.coords.latitude.toFixed(6));
          setLon(position.coords.longitude.toFixed(6));
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }
  };

  const presetLocations = [
    { name: 'NYC', lat: 40.7128, lon: -74.006 },
    { name: 'LA', lat: 34.0522, lon: -118.2437 },
    { name: 'Chicago', lat: 41.8781, lon: -87.6298 },
    { name: 'London', lat: 51.5074, lon: -0.1278 },
    { name: 'Tokyo', lat: 35.6762, lon: 139.6503 },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card-elevated p-6 space-y-6"
    >
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-primary/10">
          <MapPin className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="font-medium text-foreground">Location</h3>
          <p className="text-sm text-muted-foreground font-light">Enter coordinates or select a city</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="latitude" className="text-sm font-medium">
              Latitude
            </Label>
            <Input
              id="latitude"
              type="number"
              step="any"
              value={lat}
              onChange={(e) => setLat(e.target.value)}
              placeholder="40.7128"
              className="font-mono text-sm bg-secondary/50 border-border/60 h-11"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="longitude" className="text-sm font-medium">
              Longitude
            </Label>
            <Input
              id="longitude"
              type="number"
              step="any"
              value={lon}
              onChange={(e) => setLon(e.target.value)}
              placeholder="-74.006"
              className="font-mono text-sm bg-secondary/50 border-border/60 h-11"
            />
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Radius</Label>
            <span className="text-sm font-mono text-primary font-medium">{radius} mi</span>
          </div>
          <Slider
            value={[radius]}
            onValueChange={(value) => setRadius(value[0])}
            min={1}
            max={15}
            step={1}
            className="py-2"
          />
          <div className="flex justify-between text-xs text-muted-foreground font-light">
            <span>1 mi</span>
            <span>15 mi</span>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleGetCurrentLocation}
          className="w-full h-10 font-medium"
        >
          <Navigation className="w-4 h-4 mr-2" />
          Use My Location
        </Button>

        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground font-light">Quick Select</Label>
          <div className="flex flex-wrap gap-2">
            {presetLocations.map((loc) => (
              <Button
                key={loc.name}
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => {
                  setLat(loc.lat.toString());
                  setLon(loc.lon.toString());
                }}
                className="text-xs h-8 font-medium"
              >
                {loc.name}
              </Button>
            ))}
          </div>
        </div>

        <Button 
          type="submit" 
          disabled={isLoading}
          className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-medium btn-apple"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 mr-2 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Search className="w-4 h-4 mr-2" />
              Analyze Traffic
            </>
          )}
        </Button>
      </form>
    </motion.div>
  );
}
