'use client';

/**
 * ProtocolCard Component
 * Displays protocol health and risk status
 */

import { Shield, AlertTriangle, TrendingUp } from 'lucide-react';
import { useMemo } from 'react';

interface ProtocolCardProps {
  name: string;
  address: string;
  tvl: string;
  riskScore: number;
  lastCheck: Date;
  status: 'safe' | 'warning' | 'critical';
}

export function ProtocolCard({
  name,
  address,
  tvl,
  riskScore,
  lastCheck,
  status,
}: ProtocolCardProps) {
  const statusConfig = useMemo(() => {
    switch (status) {
      case 'critical':
        return {
          color: 'border-red-500 bg-red-500/10',
          icon: <AlertTriangle className="w-6 h-6 text-red-500" />,
          text: 'CRITICAL',
          textColor: 'text-red-500',
        };
      case 'warning':
        return {
          color: 'border-yellow-500 bg-yellow-500/10',
          icon: <AlertTriangle className="w-6 h-6 text-yellow-500" />,
          text: 'WARNING',
          textColor: 'text-yellow-500',
        };
      default:
        return {
          color: 'border-paladin-gold bg-paladin-gold/10',
          icon: <Shield className="w-6 h-6 text-paladin-gold" />,
          text: 'PROTECTED',
          textColor: 'text-paladin-gold',
        };
    }
  }, [status]);

  const shortAddress = `${address.slice(0, 6)}...${address.slice(-4)}`;

  return (
    <div
      className={`border-2 rounded-lg p-6 transition-all hover:shadow-lg ${statusConfig.color}`}
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-bold text-paladin-gold mb-1">{name}</h3>
          <p className="text-sm text-paladin-silver font-mono">{shortAddress}</p>
        </div>
        {statusConfig.icon}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-xs text-paladin-silver mb-1">TVL</p>
          <p className="text-lg font-bold text-paladin-silver flex items-center">
            <TrendingUp className="w-4 h-4 mr-1" />
            ${tvl}
          </p>
        </div>
        <div>
          <p className="text-xs text-paladin-silver mb-1">Risk Score</p>
          <p className="text-lg font-bold text-paladin-silver">
            {riskScore}/10
          </p>
        </div>
      </div>

      {/* Status and Last Check */}
      <div className="flex justify-between items-center pt-4 border-t border-paladin-silver/20">
        <span className={`text-sm font-bold ${statusConfig.textColor}`}>
          {statusConfig.text}
        </span>
        <span className="text-xs text-paladin-silver">
          Last check: {lastCheck.toLocaleTimeString()}
        </span>
      </div>
    </div>
  );
}
