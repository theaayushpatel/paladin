'use client';

/**
 * Home Page
 * Paladin Protocol Dashboard - reads live data from deployed contracts
 */

import { Header } from '@/components/Header';
import { ProtocolCard } from '@/components/ProtocolCard';
import { RiskTimeline } from '@/components/RiskTimeline';
import { AlertCenter } from '@/components/AlertCenter';
import { Activity, Shield } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useReadContract, useReadContracts } from 'wagmi';
import { contracts } from '@/lib/contracts';

const RISK_LEVEL_LABELS = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const;
const ACTION_TYPE_LABELS = ['ALERT', 'WITHDRAWAL', 'GOVERNANCE_PROPOSAL'] as const;

// Fallback mock data shown before contracts are queried or if no events exist yet
const mockProtocols = [
  {
    name: 'Vulnerable Protocol',
    address: '0x67cd4c8051f7d38b1acf7ad09318dc8909c2644a',
    tvl: '1,000,000',
    riskScore: 2,
    lastCheck: new Date(),
    status: 'safe' as const,
  },
];

export default function Home() {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Read total event count from RiskRegistry
  const { data: eventCount } = useReadContract({
    ...contracts.riskRegistry,
    functionName: 'eventCount',
    query: { refetchInterval: 30000 },
  });

  // Read the 10 most recent events
  const { data: recentEvents } = useReadContract({
    ...contracts.riskRegistry,
    functionName: 'getRecentEvents',
    args: [BigInt(0), BigInt(10)],
    query: { refetchInterval: 30000 },
  });

  // Map on-chain events to component format
  const timelineEvents = recentEvents
    ? (recentEvents as any[]).map((e: any, i: number) => ({
        id: Number(e.eventId ?? i),
        protocol: e.protocol as string,
        riskLevel: RISK_LEVEL_LABELS[Number(e.riskLevel)] ?? 'LOW',
        actionType: ACTION_TYPE_LABELS[Number(e.actionType)] ?? 'ALERT',
        timestamp: new Date(Number(e.timestamp) * 1000),
        exploitPattern: e.exploitPattern as string,
      }))
    : [];

  // Derive alerts from HIGH/CRITICAL events in the last hour
  const recentAlerts = timelineEvents
    .filter((e) => e.riskLevel === 'HIGH' || e.riskLevel === 'CRITICAL')
    .filter((e) => Date.now() - e.timestamp.getTime() < 3600000)
    .map((e, i) => ({
      id: i,
      protocol: e.protocol,
      severity: (e.riskLevel === 'CRITICAL' ? 'critical' : 'high') as 'critical' | 'high' | 'medium' | 'low',
      message: e.exploitPattern || `${e.riskLevel} risk detected`,
      timestamp: e.timestamp,
      active: true,
    }));

  return (
    <div className="min-h-screen bg-paladin-blue">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-paladin-gold mb-2">
                ⚔️ The Vigil
              </h1>
              <p className="text-xl text-paladin-silver">
                Autonomous defense system active
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-paladin-silver">System Time</p>
              <p className="text-2xl font-mono text-paladin-gold">
                {currentTime.toLocaleTimeString()}
              </p>
            </div>
          </div>
        </div>

        {/* Status Banner */}
        <div className="mb-8 border-2 border-paladin-gold rounded-lg p-6 bg-paladin-gold/5">
          <div className="flex items-center space-x-4">
            <Activity className="w-8 h-8 text-paladin-gold animate-pulse" />
            <div>
              <h3 className="text-lg font-bold text-paladin-gold">
                System Status: OPERATIONAL
              </h3>
              <p className="text-sm text-paladin-silver">
                Monitoring {mockProtocols.length} protocols &mdash; {Number(eventCount ?? 0)} chronicle events recorded
              </p>
            </div>
          </div>
        </div>

        {/* Alerts Section */}
        <div className="mb-8" id="crusade">
          <AlertCenter alerts={recentAlerts} />
        </div>

        {/* Protocols Grid */}
        <div className="mb-8" id="vigil">
          <h2 className="text-2xl font-bold text-paladin-gold mb-6 flex items-center">
            <Shield className="w-6 h-6 mr-2" />
            Protected Protocols
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mockProtocols.map((protocol) => (
              <ProtocolCard key={protocol.address} {...protocol} />
            ))}
          </div>
        </div>

        {/* Risk Timeline - live from RiskRegistry */}
        <div id="chronicle">
          <RiskTimeline events={timelineEvents.length > 0 ? timelineEvents : []} />
        </div>

        {/* Footer Info */}
        <div className="mt-12 text-center text-paladin-silver text-sm">
          <p className="mb-2">
            🛡️ Paladin Protocol — The shield that never sleeps
          </p>
          <p className="text-xs opacity-75">
            Connected to Arbitrum Sepolia Testnet
          </p>
        </div>
      </main>
    </div>
  );
}
