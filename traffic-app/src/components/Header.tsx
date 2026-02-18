import { motion } from 'framer-motion';
import { MapPin, Database, Zap, Users } from 'lucide-react';

export function Header() {
  return (
    <header className="border-b border-border/50 bg-card/80 backdrop-blur-md sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3"
          >
            <div className="relative">
              <div className="p-2.5 rounded-2xl bg-primary">
                <MapPin className="w-5 h-5 text-primary-foreground" />
              </div>
            </div>
            <div>
              <h1 className="text-lg font-semibold text-foreground tracking-tight">GeoTraffic</h1>
              <p className="text-xs text-muted-foreground font-light">ETL Pipeline</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="hidden md:flex items-center gap-5"
          >
            <a
              href="/contacts"
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground font-light transition-colors"
            >
              <Users className="w-3.5 h-3.5 text-primary" />
              Contacts
            </a>
            <div className="flex items-center gap-2 text-xs text-muted-foreground font-light">
              <Database className="w-3.5 h-3.5 text-primary" />
              <span>OpenStreetMap</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground font-light">
              <Zap className="w-3.5 h-3.5 text-geo-orange" />
              <span>Real-time</span>
            </div>
          </motion.div>
        </div>
      </div>
    </header>
  );
}
