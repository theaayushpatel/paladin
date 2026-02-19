'use client';

/**
 * RiskTimeline Component
 * Displays chronological history of risk events
 */

import { AlertTriangle, Shield, AlertCircle, Eye } from 'lucide-react';
import { useMemo } from 'react';

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

export function RiskTimeline({ events }: RiskTimelineProps) {
  const sortedEvents = useMemo(() => {
    return [...events].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }, [events]);

  const getEventIcon = (riskLevel: string, actionType: string) => {
    if (actionType === 'WITHDRAWAL') {
      return <Shield className="w-5 h-5 text-paladin-gold" />;
    }
    
    switch (riskLevel) {
      case 'CRITICAL':
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case 'HIGH':
        return <AlertCircle className="w-5 h-5 text-orange-500" />;
      case 'MEDIUM':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      default:
        return <Eye className="w-5 h-5 text-blue-500" />;
    }
  };

  const getEventColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'CRITICAL':
        return 'border-red-500 bg-red-500/5';
      case 'HIGH':
        return 'border-orange-500 bg-orange-500/5';
      case 'MEDIUM':
        return 'border-yellow-500 bg-yellow-500/5';
      default:
        return 'border-blue-500 bg-blue-500/5';
    }
  };

  const getActionText = (actionType: string, amount?: string) => {
    switch (actionType) {
      case 'WITHDRAWAL':
        return amount ? `Emergency withdrawal: ${amount}` : 'Emergency withdrawal executed';
      case 'GOVERNANCE_PROPOSAL':
        return 'Governance proposal created';
      case 'ALERT':
        return 'Alert triggered';
      default:
        return 'Event recorded';
    }
  };

  return (
    <div className="border border-paladin-gold/20 rounded-lg p-6 bg-paladin-blue-light">
      <h2 className="text-2xl font-bold text-paladin-gold mb-6 flex items-center">
        📜 The Chronicle
      </h2>

      <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
        {sortedEvents.length === 0 ? (
          <div className="text-center py-8 text-paladin-silver">
            <Shield className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No threats detected. The realm is at peace.</p>
          </div>
        ) : (
          sortedEvents.map((event, index) => (
            <div
              key={event.id}
              className={`border-2 rounded-lg p-4 ${getEventColor(event.riskLevel)} transition-all hover:shadow-md`}
            >
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 mt-1">
                  {getEventIcon(event.riskLevel, event.actionType)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="text-paladin-gold font-bold">{event.protocol}</p>
                      <p className="text-xs text-paladin-silver">
                        {event.timestamp.toLocaleString()}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-1 rounded text-xs font-bold ${
                        event.riskLevel === 'CRITICAL'
                          ? 'bg-red-500 text-white'
                          : event.riskLevel === 'HIGH'
                          ? 'bg-orange-500 text-white'
                          : event.riskLevel === 'MEDIUM'
                          ? 'bg-yellow-500 text-black'
                          : 'bg-blue-500 text-white'
                      }`}
                    >
                      {event.riskLevel}
                    </span>
                  </div>
                  <p className="text-sm text-paladin-silver mb-2">
                    {event.exploitPattern}
                  </p>
                  <p className="text-xs text-paladin-gold">
                    ⚔️ {getActionText(event.actionType, event.amount)}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
