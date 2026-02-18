import { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { 
  Route, 
  TrafficCone, 
  Timer, 
  ParkingCircle, 
  Bus, 
  Train, 
  GitBranch,
  Gauge,
  ArrowUpRight,
  ArrowDownRight,
  Minus
} from 'lucide-react';
import { TrafficAnalysis, AnalysisMetadata } from '@/lib/api/traffic';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis } from 'recharts';

interface AnalysisDashboardProps {
  analysis: TrafficAnalysis;
  metadata: AnalysisMetadata;
}

const ROAD_COLORS = {
  motorway: '#ef4444',
  trunk: '#f97316',
  primary: '#eab308',
  secondary: '#84cc16',
  tertiary: '#22c55e',
  residential: '#0ea5e9',
  service: '#8b5cf6',
  other: '#64748b',
};

export const AnalysisDashboard = forwardRef<HTMLDivElement, AnalysisDashboardProps>(
  ({ analysis, metadata }, ref) => {
    const roadTypeData = Object.entries(analysis.roads.byType)
      .map(([type, count]) => ({
        name: type.charAt(0).toUpperCase() + type.slice(1).replace(/_/g, ' '),
        value: count,
        color: ROAD_COLORS[type as keyof typeof ROAD_COLORS] || ROAD_COLORS.other,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);

    const speedLimitData = Object.entries(analysis.speedLimits)
      .map(([limit, count]) => ({
        name: limit,
        count,
      }))
      .sort((a, b) => {
        const aNum = parseInt(a.name) || 0;
        const bNum = parseInt(b.name) || 0;
        return aNum - bNum;
      })
      .slice(0, 6);

    const getScoreColor = (score: number) => {
      if (score >= 70) return 'text-success';
      if (score >= 40) return 'text-warning';
      return 'text-destructive';
    };

    const getScoreLabel = (score: number) => {
      if (score >= 70) return { text: 'Excellent', icon: ArrowUpRight };
      if (score >= 40) return { text: 'Moderate', icon: Minus };
      return { text: 'Low', icon: ArrowDownRight };
    };

    const scoreInfo = getScoreLabel(analysis.connectivityScore);

    const statCards = [
      { 
        label: 'Total Roads', 
        value: analysis.roads.total.toLocaleString(), 
        icon: Route,
        color: 'text-geo-cyan',
        bgColor: 'bg-geo-cyan/10'
      },
      { 
        label: 'Road Length', 
        value: `${analysis.roads.totalLength} km`, 
        icon: GitBranch,
        color: 'text-geo-blue',
        bgColor: 'bg-geo-blue/10'
      },
      { 
        label: 'Intersections', 
        value: analysis.intersections.toLocaleString(), 
        icon: TrafficCone,
        color: 'text-geo-purple',
        bgColor: 'bg-geo-purple/10'
      },
      { 
        label: 'Traffic Signals', 
        value: analysis.trafficSignals.toLocaleString(), 
        icon: Timer,
        color: 'text-geo-orange',
        bgColor: 'bg-geo-orange/10'
      },
      { 
        label: 'One-Way Roads', 
        value: analysis.oneWayRoads.toLocaleString(), 
        icon: ArrowUpRight,
        color: 'text-geo-pink',
        bgColor: 'bg-geo-pink/10'
      },
      { 
        label: 'Parking Areas', 
        value: analysis.parkingAreas.toLocaleString(), 
        icon: ParkingCircle,
        color: 'text-geo-green',
        bgColor: 'bg-geo-green/10'
      },
      { 
        label: 'Bus Stops', 
        value: analysis.busStops.toLocaleString(), 
        icon: Bus,
        color: 'text-geo-cyan',
        bgColor: 'bg-geo-cyan/10'
      },
      { 
        label: 'Railway Stations', 
        value: analysis.railwayStations.toLocaleString(), 
        icon: Train,
        color: 'text-geo-blue',
        bgColor: 'bg-geo-blue/10'
      },
    ];

    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-5"
      >
        {/* Header with Connectivity Score */}
        <div className="card-elevated p-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h2 className="text-xl font-medium text-foreground">Traffic Analysis</h2>
              <p className="text-sm text-muted-foreground mt-1 font-light">
                {metadata.areaKm2} km² • {metadata.elementsProcessed.toLocaleString()} elements
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Connectivity</p>
                <div className="flex items-center gap-2">
                  <span className={`text-3xl font-semibold ${getScoreColor(analysis.connectivityScore)}`}>
                    {analysis.connectivityScore}
                  </span>
                  <span className="text-muted-foreground font-light">/100</span>
                </div>
              </div>
              <div className={`p-3 rounded-2xl ${getScoreColor(analysis.connectivityScore)} bg-current/10`}>
                <scoreInfo.icon className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Road Density Meter */}
          <div className="mt-6 p-4 rounded-xl bg-secondary/40">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Gauge className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">Road Density</span>
              </div>
              <span className="text-sm font-mono text-primary font-medium">
                {analysis.roadDensity} km/km²
              </span>
            </div>
            <div className="h-1.5 bg-border rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(analysis.roadDensity * 2, 100)}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className="h-full rounded-full bg-primary"
              />
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="data-grid">
          {statCards.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
              className="stat-card"
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl ${stat.bgColor}`}>
                  <stat.icon className={`w-4 h-4 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-light">{stat.label}</p>
                  <p className="text-lg font-medium text-foreground">{stat.value}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Road Types Pie Chart */}
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="card-elevated p-6"
          >
            <h3 className="font-medium text-foreground mb-4">Road Types</h3>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={roadTypeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {roadTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(0, 0%, 100%)',
                      border: '1px solid hsl(220, 13%, 90%)',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: '400',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-2 mt-4">
              {roadTypeData.slice(0, 5).map((item) => (
                <div key={item.name} className="flex items-center gap-1.5 text-xs">
                  <div 
                    className="w-2.5 h-2.5 rounded-full" 
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-muted-foreground font-light">{item.name}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Speed Limits Bar Chart */}
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="card-elevated p-6"
          >
            <h3 className="font-medium text-foreground mb-4">Speed Limits</h3>
            <div className="h-56">
              {speedLimitData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={speedLimitData} layout="vertical">
                    <XAxis type="number" stroke="hsl(220, 10%, 70%)" fontSize={10} fontWeight={400} />
                    <YAxis 
                      dataKey="name" 
                      type="category" 
                      stroke="hsl(220, 10%, 70%)" 
                      fontSize={10}
                      fontWeight={400}
                      width={55}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(0, 0%, 100%)',
                        border: '1px solid hsl(220, 13%, 90%)',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '400',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                      }}
                    />
                    <Bar 
                      dataKey="count" 
                      fill="hsl(211, 100%, 50%)"
                      radius={[0, 6, 6, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground text-sm font-light">
                  No speed limit data available
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Metadata Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
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
