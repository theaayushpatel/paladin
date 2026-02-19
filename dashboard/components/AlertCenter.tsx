'use client';

/**
 * AlertCenter Component
 * Displays active alerts and threats
 */

import { AlertTriangle, Eye, Activity } from 'lucide-react';

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

export function AlertCenter({ alerts }: AlertCenterProps) {
  const activeAlerts = alerts.filter((a) => a.active);
  const criticalCount = activeAlerts.filter((a) => a.severity === 'critical').length;
  const highCount = activeAlerts.filter((a) => a.severity === 'high').length;

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-500 border-red-500 text-white';
      case 'high':
        return 'bg-orange-500 border-orange-500 text-white';
      case 'medium':
        return 'bg-yellow-500 border-yellow-500 text-black';
      default:
        return 'bg-blue-500 border-blue-500 text-white';
    }
  };

  const getSeverityIcon = (severity: string) => {
    if (severity === 'critical' || severity === 'high') {
      return <AlertTriangle className="w-5 h-5" />;
    }
    return <Eye className="w-5 h-5" />;
  };

  return (
    <div className="border border-paladin-gold/20 rounded-lg p-6 bg-paladin-blue-light">
      <h2 className="text-2xl font-bold text-paladin-gold mb-6 flex items-center">
        <Activity className="w-6 h-6 mr-2" />
        Alert Center
      </h2>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="border border-paladin-silver/20 rounded-lg p-4 text-center">
          <p className="text-3xl font-bold text-paladin-gold">
            {activeAlerts.length}
          </p>
          <p className="text-xs text-paladin-silver mt-1">Active Alerts</p>
        </div>
        <div className="border border-red-500/20 rounded-lg p-4 text-center bg-red-500/5">
          <p className="text-3xl font-bold text-red-500">{criticalCount}</p>
          <p className="text-xs text-paladin-silver mt-1">Critical</p>
        </div>
        <div className="border border-orange-500/20 rounded-lg p-4 text-center bg-orange-500/5">
          <p className="text-3xl font-bold text-orange-500">{highCount}</p>
          <p className="text-xs text-paladin-silver mt-1">High</p>
        </div>
      </div>

      {/* Active Alerts List */}
      <div className="space-y-3 max-h-64 overflow-y-auto">
        {activeAlerts.length === 0 ? (
          <div className="text-center py-8 text-paladin-silver">
            <Eye className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No active alerts. The Vigil continues.</p>
          </div>
        ) : (
          activeAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`border-2 rounded-lg p-4 ${getSeverityColor(
                alert.severity
              )} flex items-start space-x-3`}
            >
              <div className="flex-shrink-0 mt-0.5">
                {getSeverityIcon(alert.severity)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-1">
                  <p className="font-bold">{alert.protocol}</p>
                  <span className="text-xs opacity-75">
                    {alert.timestamp.toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-sm">{alert.message}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
