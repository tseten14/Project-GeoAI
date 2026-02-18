import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/components/ui/use-toast';
import { Header } from '@/components/Header';
import { CoordinateInput } from '@/components/CoordinateInput';
import { MapView } from '@/components/MapView';
import { PipelineStatus } from '@/components/PipelineStatus';
import { AnalysisDashboard } from '@/components/AnalysisDashboard';
import { analyzeTraffic, TrafficAnalysis, AnalysisMetadata } from '@/lib/api/traffic';
import { AlertCircle, Map } from 'lucide-react';

type PipelineStage = 'idle' | 'extract' | 'transform' | 'load' | 'complete';

export default function Index() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [pipelineStage, setPipelineStage] = useState<PipelineStage>('idle');
  const [center, setCenter] = useState<[number, number]>([40.7128, -74.006]);
  const [radius, setRadius] = useState(5);
  const [analysis, setAnalysis] = useState<TrafficAnalysis | null>(null);
  const [metadata, setMetadata] = useState<AnalysisMetadata | null>(null);

  const handleAnalyze = useCallback(async (lat: number, lon: number, radiusMiles: number) => {
    setIsLoading(true);
    setAnalysis(null);
    setMetadata(null);
    setCenter([lat, lon]);
    setRadius(radiusMiles);

    // Simulate ETL stages
    setPipelineStage('extract');
    await new Promise(resolve => setTimeout(resolve, 600));

    setPipelineStage('transform');
    
    try {
      const response = await analyzeTraffic(lat, lon, radiusMiles);

      if (!response) {
        throw new Error('No response from server');
      }
      if (response.success && response.data && response.metadata) {
        setPipelineStage('load');
        await new Promise(resolve => setTimeout(resolve, 400));
        
        setAnalysis(response.data);
        setMetadata(response.metadata);
        setPipelineStage('complete');

        toast({
          title: 'Analysis Complete',
          description: `${response.metadata.elementsProcessed.toLocaleString()} elements processed`,
        });
      } else {
        throw new Error(response.error || 'Failed to analyze traffic data');
      }
    } catch (error) {
      console.error('Analysis error:', error);
      setPipelineStage('idle');
      toast({
        title: 'Analysis Failed',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const handleMapClick = useCallback((lat: number, lon: number) => {
    setCenter([lat, lon]);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-6 relative">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left Sidebar - Input & Pipeline */}
          <div className="lg:col-span-4 space-y-5">
            <CoordinateInput
              onSubmit={handleAnalyze}
              isLoading={isLoading}
              initialLat={center[0]}
              initialLon={center[1]}
            />
            
            <AnimatePresence>
              {pipelineStage !== 'idle' && (
                <PipelineStatus stage={pipelineStage} />
              )}
            </AnimatePresence>
          </div>

          {/* Main Content - Map & Results */}
          <div className="lg:col-span-8 space-y-5">
            {/* Map Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="card-elevated overflow-hidden"
            >
              <div className="p-4 border-b border-border/50 flex items-center gap-3">
                <div className="p-2 rounded-xl bg-accent/10">
                  <Map className="w-4 h-4 text-accent" />
                </div>
                <div>
                  <h3 className="font-medium text-foreground text-sm">Analysis Area</h3>
                  <p className="text-xs text-muted-foreground font-light">
                    Click to select location
                  </p>
                </div>
              </div>
              <div className="h-[380px]">
                <MapView
                  center={center}
                  radiusMiles={radius}
                  onMapClick={handleMapClick}
                />
              </div>
            </motion.div>

            {/* Results Section */}
            <AnimatePresence mode="wait">
              {analysis && metadata ? (
                <AnalysisDashboard analysis={analysis} metadata={metadata} />
              ) : !isLoading && pipelineStage === 'idle' ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="card-elevated p-10 text-center"
                >
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-secondary mb-4">
                    <AlertCircle className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <h3 className="text-base font-medium text-foreground mb-2">
                    Ready to Analyze
                  </h3>
                  <p className="text-sm text-muted-foreground font-light max-w-sm mx-auto">
                    Enter coordinates or click on the map, then click "Analyze Traffic" to start.
                  </p>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        </div>
      </main>
    </div>
  );
}
