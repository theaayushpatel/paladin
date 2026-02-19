'use client';

import { AlertTriangle, Shield, AlertCircle, Eye, ExternalLink, Filter } from 'lucide-react';
import { useMemo, useState } from 'react';

interface RiskEvent {
  id: number;
  protocol: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  actionType: 'ALERT' | 'WITHDRAWAL' | 'GOVERNANCE_PROPOSAL';
  timestamp: Date;
  exploitPattern: string;
  amount?: string;
}

interface RiskTimelineProps {
  events: RiskEvent[];
}

const RISK_STYLES: Record<string, { border: string; bg: string; badge: string }> = {
  CRITICAL: { border: 'border-red-500', bg: 'bg-red-500/5', badge: 'bg-red-500 text-white' },
  HIGH:     { border: 'border-orange-500', bg: 'bg-orange-500/5', badge: 'bg-orange-500 text-white' },
  MEDIUM:   { border: 'border-yellow-500', bg: 'bg-yellow-500/5', badge: 'bg-yellow-500 text-black' },
  LOW:      { border: 'border-blue-500', bg: 'bg-blue-500/5', badge: 'bg-blue-500 text-white' },
};

const ACTION_LABELS: Record<string, string> = {
  WITHDRAWAL: '⚔️ Emergency Withdrawal',
  GOVERNANCE_PROPOSAL: '🏛️ Governance Proposal',
  ALERT: '👁️ Alert Triggered',
};

export function RiskTimeline({ events }: RiskTimelineProps) {
  const [riskFilter, setRiskFilter] = useState<string>('ALL');
  const [actionFilter, setActionFilter] = useState<string>('ALL');
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  const filteredEvents = useMemo(() => {
    return [...events]
      .filter((e) => riskFilter === 'ALL' || e.riskLevel === riskFilter)
      .filter((e) => actionFilter === 'ALL' || e.actionType === actionFilter)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }, [events, riskFilter, actionFilter]);

  function toggleExpand(id: number) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function getIcon(riskLevel: string, actionType: string) {
    if (actionType === 'WITHDRAWAL') return <Shield className="w-4 h-4 text-paladin-gold" />;
    if (riskLevel === 'CRITICAL') return <AlertTriangle className="w-4 h-4 text-red-500" />;
    if (riskLevel === 'HIGH') return <AlertCircle className="w-4 h-4 text-orange-500" />;
    if (riskLevel === 'MEDIUM') return <AlertCircle className="w-4 h-4 text-yellow-500" />;
    return <Eye className="w-4 h-4 text-blue-500" />;
  }

  return (
    <div className="border border-paladin-gold/20 rounded-xl p-6 bg-paladin-blue-light">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-bold text-paladin-gold flex items-center gap-2">
          📜 The Chronicle
        </h2>
        <span className="text-xs text-paladin-silver border border-paladin-silver/30 rounded-full px-3 py-1">
          {filteredEvents.length} / {events.length} events
        </span>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        <div className="flex items-center gap-1 text-xs text-paladin-silver">
          <Filter className="w-3 h-3" /> Risk:
        </div>
        {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((level) => (
          <button key={level} onClick={() => setRiskFilter(level)}
            className={`text-xs px-2 py-1 rounded-full font-semibold transition-all ${riskFilter === level
              ? level === 'ALL' ? 'bg-paladin-gold text-black' : (RISK_STYLES[level]?.badge ?? 'bg-gray-500 text-white')
              : 'border border-white/20 text-paladin-silver hover:border-paladin-gold/40'}`}>
            {level}
          </button>
        ))}
        <div className="flex items-center gap-1 text-xs text-paladin-silver ml-2">Action:</div>
        {['ALL', 'WITHDRAWAL', 'ALERT', 'GOVERNANCE_PROPOSAL'].map((type) => (
          <button key={type} onClick={() => setActionFilter(type)}
            className={`text-xs px-2 py-1 rounded-full font-semibold transition-all ${actionFilter === type
              ? 'bg-paladin-gold text-black'
              : 'border border-white/20 text-paladin-silver hover:border-paladin-gold/40'}`}>
            {type === 'GOVERNANCE_PROPOSAL' ? 'GOV' : type}
          </button>
        ))}
      </div>

      {/* Events List */}
      <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
        {filteredEvents.length === 0 ? (
          <div className="text-center py-12 text-paladin-silver">
            <Shield className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No threats recorded. The realm is at peace.</p>
          </div>
        ) : (
          filteredEvents.map((event) => {
            const s = RISK_STYLES[event.riskLevel] ?? RISK_STYLES.LOW;
            const isExpanded = expanded.has(event.id);
            const shortAddr = event.protocol.startsWith('0x')
              ? `${event.protocol.slice(0, 6)}...${event.protocol.slice(-4)}`
              : event.protocol;

            return (
              <div key={event.id} className={`border rounded-xl transition-all hover:shadow-md cursor-pointer ${s.border} ${s.bg}`}
                onClick={() => toggleExpand(event.id)}>
                <div className="flex items-start gap-3 p-3">
                  <div className="shrink-0 mt-0.5">{getIcon(event.riskLevel, event.actionType)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${s.badge}`}>{event.riskLevel}</span>
                        <div className="flex items-center gap-1">
                          <code className="text-xs text-paladin-silver">{shortAddr}</code>
                          {event.protocol.startsWith('0x') && (
                            <a href={`https://sepolia.arbiscan.io/address/${event.protocol}`} target="_blank" rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()} className="text-paladin-silver hover:text-paladin-gold">
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      </div>
                      <span className="text-xs text-paladin-silver shrink-0">{event.timestamp.toLocaleTimeString()}</span>
                    </div>
                    <p className="text-xs text-paladin-gold font-semibold mb-1">{ACTION_LABELS[event.actionType] ?? event.actionType}</p>
                    {isExpanded && (
                      <div className="mt-2 space-y-1 border-t border-white/10 pt-2">
                        <p className="text-xs text-paladin-silver">{event.exploitPattern}</p>
                        {event.amount && <p className="text-xs text-paladin-gold">Amount: {event.amount}</p>}
                        <p className="text-xs text-paladin-silver/60">{event.timestamp.toLocaleString()}</p>
                      </div>
                    )}
                    {!isExpanded && event.exploitPattern && (
                      <p className="text-xs text-paladin-silver/70 truncate">{event.exploitPattern}</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
