import { forwardRef } from 'react';
import { motion } from 'framer-motion';
import {
  Timer,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Minus
} from 'lucide-react';
import { TrafficAnalysis, AnalysisMetadata } from '@/lib/api/traffic';

interface AnalysisDashboardProps {
  analysis: TrafficAnalysis;
  metadata: AnalysisMetadata;
}

export const AnalysisDashboard = forwardRef<HTMLDivElement, AnalysisDashboardProps>(
  ({ analysis, metadata }, ref) => {

    const getCongestionColor = (score: number) => {
      if (score >= 70) return 'text-destructive';
      if (score >= 45) return 'text-warning';
      if (score >= 20) return 'text-geo-orange';
      return 'text-success';
    };

    const getCongestionBgColor = (score: number) => {
      if (score >= 70) return 'bg-destructive/10';
      if (score >= 45) return 'bg-warning/10';
      if (score >= 20) return 'bg-geo-orange/10';
      return 'bg-success/10';
    };

    const getCongestionBarColor = (score: number) => {
      if (score >= 70) return 'bg-destructive';
      if (score >= 45) return 'bg-warning';
      if (score >= 20) return 'bg-geo-orange';
      return 'bg-success';
    };

    const getCongestionIcon = (score: number) => {
      if (score >= 45) return ArrowUpRight;
      if (score >= 20) return Minus;
      return ArrowDownRight;
    };

    const CongestionIcon = getCongestionIcon(analysis.congestionScore);

    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-5"
      >
        {/* Header */}
        <div className="card-elevated p-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h2 className="text-xl font-medium text-foreground">Traffic Analysis</h2>
              <p className="text-sm text-muted-foreground mt-1 font-light">
                {metadata.areaKm2} km² • {metadata.elementsProcessed.toLocaleString()} elements
              </p>
            </div>
          </div>
        </div>

        {/* Two Main Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Traffic Signals Card */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="card-elevated p-6"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-geo-orange/10">
                <Timer className="w-6 h-6 text-geo-orange" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-light">Traffic Signals</p>
                <p className="text-3xl font-semibold text-foreground">{analysis.trafficSignals.toLocaleString()}</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-4 font-light">
              Signalized intersections within {metadata.radiusMiles} mi radius
            </p>
          </motion.div>

          {/* Traffic Congestion Card */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card-elevated p-6"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-2xl ${getCongestionBgColor(analysis.congestionScore)}`}>
                  <AlertTriangle className={`w-6 h-6 ${getCongestionColor(analysis.congestionScore)}`} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-light">Traffic Congestion</p>
                  <p className="text-3xl font-semibold text-foreground">{analysis.congestionLevel}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1.5">
                  <span className={`text-2xl font-semibold ${getCongestionColor(analysis.congestionScore)}`}>
                    {analysis.congestionScore}
                  </span>
                  <span className="text-muted-foreground font-light text-sm">/100</span>
                </div>
                <CongestionIcon className={`w-4 h-4 ml-auto mt-1 ${getCongestionColor(analysis.congestionScore)}`} />
              </div>
            </div>
            {/* Congestion bar */}
            <div className="mt-4">
              <div className="h-2 bg-border rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${analysis.congestionScore}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                  className={`h-full rounded-full ${getCongestionBarColor(analysis.congestionScore)}`}
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground font-light mt-1.5">
                <span>Minimal</span>
                <span>Heavy</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Metadata Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-xs text-muted-foreground font-mono p-4 rounded-xl bg-secondary/30 border border-border/40"
        >
          <div className="flex flex-wrap gap-x-6 gap-y-1.5 font-light">
            <span>Center: {metadata.center.lat.toFixed(4)}, {metadata.center.lon.toFixed(4)}</span>
            <span>Radius: {metadata.radiusMiles} mi</span>
            <span>Area: {metadata.areaKm2} km²</span>
            <span>{new Date(metadata.timestamp).toLocaleString()}</span>
          </div>
        </motion.div>
      </motion.div>
    );
  }
);

AnalysisDashboard.displayName = 'AnalysisDashboard';
