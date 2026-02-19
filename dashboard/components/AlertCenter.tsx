'use client';

import { AlertTriangle, Eye, Activity, CheckCircle, ExternalLink } from 'lucide-react';
import { useState } from 'react';

interface Alert {
  id: number;
  protocol: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  message: string;
  timestamp: Date;
  active: boolean;
}

interface AlertCenterProps {
  alerts: Alert[];
}

const SEVERITY_STYLES: Record<string, { border: string; bg: string; text: string; badge: string }> = {
  critical: { border: 'border-red-500', bg: 'bg-red-500/10', text: 'text-red-400', badge: 'bg-red-500 text-white' },
  high:     { border: 'border-orange-500', bg: 'bg-orange-500/10', text: 'text-orange-400', badge: 'bg-orange-500 text-white' },
  medium:   { border: 'border-yellow-500', bg: 'bg-yellow-500/10', text: 'text-yellow-400', badge: 'bg-yellow-500 text-black' },
  low:      { border: 'border-blue-500', bg: 'bg-blue-500/10', text: 'text-blue-400', badge: 'bg-blue-500 text-white' },
};

export function AlertCenter({ alerts }: AlertCenterProps) {
  const [dismissed, setDismissed] = useState<Set<number>>(new Set());
  const [filter, setFilter] = useState<'all' | 'critical' | 'high' | 'medium' | 'low'>('all');

  const activeAlerts = alerts.filter((a) => a.active && !dismissed.has(a.id));
  const filteredAlerts = filter === 'all' ? activeAlerts : activeAlerts.filter((a) => a.severity === filter);

  const counts = {
    critical: activeAlerts.filter((a) => a.severity === 'critical').length,
    high: activeAlerts.filter((a) => a.severity === 'high').length,
    medium: activeAlerts.filter((a) => a.severity === 'medium').length,
    low: activeAlerts.filter((a) => a.severity === 'low').length,
  };

  function dismissAll() {
    setDismissed(new Set(activeAlerts.map((a) => a.id)));
  }

  return (
    <div className="border border-paladin-gold/20 rounded-xl p-6 bg-paladin-blue-light">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-bold text-paladin-gold flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Alert Center
        </h2>
        {activeAlerts.length > 0 && (
          <button onClick={dismissAll} className="text-xs text-paladin-silver hover:text-paladin-gold transition-colors flex items-center gap-1 border border-paladin-silver/30 rounded-lg px-3 py-1.5 hover:border-paladin-gold/50">
            <CheckCircle className="w-3 h-3" /> Dismiss all
          </button>
        )}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-2 mb-5">
        {(['critical', 'high', 'medium', 'low'] as const).map((sev) => (
          <button key={sev} onClick={() => setFilter(filter === sev ? 'all' : sev)}
            className={`rounded-lg p-3 text-center border transition-all ${filter === sev ? SEVERITY_STYLES[sev].border + ' ' + SEVERITY_STYLES[sev].bg : 'border-white/10 bg-black/20 hover:border-white/20'}`}>
            <p className={`text-2xl font-bold ${SEVERITY_STYLES[sev].text}`}>{counts[sev]}</p>
            <p className="text-xs text-paladin-silver mt-0.5 capitalize">{sev}</p>
          </button>
        ))}
      </div>

      {/* Filter indicator */}
      {filter !== 'all' && (
        <div className="flex items-center gap-2 mb-3 text-xs text-paladin-silver">
          <span>Filtering:</span>
          <span className={`px-2 py-0.5 rounded-full font-bold ${SEVERITY_STYLES[filter].badge}`}>{filter.toUpperCase()}</span>
          <button onClick={() => setFilter('all')} className="text-paladin-gold hover:underline">Clear</button>
        </div>
      )}

      {/* Alerts List */}
      <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
        {filteredAlerts.length === 0 ? (
          <div className="text-center py-10 text-paladin-silver">
            <Eye className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p className="text-sm">{filter !== 'all' ? `No ${filter} alerts` : 'No active alerts. The Vigil continues.'}</p>
          </div>
        ) : (
          filteredAlerts.map((alert) => {
            const s = SEVERITY_STYLES[alert.severity];
            const shortAddr = alert.protocol.startsWith('0x') ? `${alert.protocol.slice(0, 6)}...${alert.protocol.slice(-4)}` : alert.protocol;
            return (
              <div key={alert.id} className={`border rounded-xl p-3 ${s.border} ${s.bg}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2 flex-1 min-w-0">
                    <AlertTriangle className={`w-4 h-4 shrink-0 mt-0.5 ${s.text}`} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap mb-1">
                        <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${s.badge}`}>{alert.severity.toUpperCase()}</span>
                        <div className="flex items-center gap-1">
                          <code className="text-xs text-paladin-silver">{shortAddr}</code>
                          {alert.protocol.startsWith('0x') && (
                            <a href={`https://sepolia.arbiscan.io/address/${alert.protocol}`} target="_blank" rel="noopener noreferrer" className="text-paladin-silver hover:text-paladin-gold">
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      </div>
                      <p className={`text-xs ${s.text}`}>{alert.message}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className="text-xs text-paladin-silver">{alert.timestamp.toLocaleTimeString()}</span>
                    <button onClick={() => setDismissed((prev) => new Set([...prev, alert.id]))}
                      className="text-xs text-paladin-silver/60 hover:text-paladin-silver transition-colors">
                      dismiss
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {dismissed.size > 0 && (
        <button onClick={() => setDismissed(new Set())} className="mt-3 text-xs text-paladin-silver/60 hover:text-paladin-silver transition-colors w-full text-center">
          Restore {dismissed.size} dismissed alert{dismissed.size > 1 ? 's' : ''}
        </button>
      )}
    </div>
  );
}
