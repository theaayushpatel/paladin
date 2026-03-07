'use client';

import { Header } from '@/components/Header';
import { ProtocolCard } from '@/components/ProtocolCard';
import { RiskTimeline } from '@/components/RiskTimeline';
import { AlertCenter } from '@/components/AlertCenter';
import { ManualScan } from '@/components/ManualScan';
import { Activity, Shield, Plus, X, Search, RefreshCw } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useReadContract } from 'wagmi';
import { contracts } from '@/lib/contracts';

const RISK_LEVEL_LABELS = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const;
const ACTION_TYPE_LABELS = ['ALERT', 'WITHDRAWAL', 'GOVERNANCE_PROPOSAL'] as const;

interface Protocol {
  name: string;
  address: string;
  tvl: string;
  riskScore: number;
  lastCheck: Date;
  status: 'safe' | 'warning' | 'critical';
}

const DEFAULT_PROTOCOLS: Protocol[] = [
  {
    name: 'Vulnerable Protocol',
    address: '0x67cd4c8051f7d38b1acf7ad09318dc8909c2644a',
    tvl: '1,000,000',
    riskScore: 8,
    lastCheck: new Date(0),  // stable on server; updated after mount
    status: 'warning',
  },
];

export default function Home() {
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [protocols, setProtocols] = useState<Protocol[]>(DEFAULT_PROTOCOLS);
  const [showAddPanel, setShowAddPanel] = useState(false);
  const [newAddr, setNewAddr]   = useState('');
  const [newName, setNewName]   = useState('');
  const [newTvl, setNewTvl]     = useState('');
  const [addError, setAddError] = useState('');
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  useEffect(() => {
    setCurrentTime(new Date());
    setLastRefresh(new Date());
    // stamp all initial protocols with the real current time
    setProtocols((prev) => prev.map((p) => ({ ...p, lastCheck: new Date() })));
    const t = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // ── Live chain reads ──────────────────────────────────────────────────────
  const { data: eventCount, refetch: refetchCount } = useReadContract({
    ...contracts.riskRegistry,
    functionName: 'eventCount',
    query: { refetchInterval: 30000 },
  });

  const { data: recentEventsRaw, refetch: refetchEvents } = useReadContract({
    ...contracts.riskRegistry,
    functionName: 'getRecentEvents',
    args: [BigInt(0), BigInt(20)],
    query: { refetchInterval: 30000 },
  });

  function handleRefresh() {
    refetchCount();
    refetchEvents();
    setLastRefresh(new Date());
    setProtocols((prev) => prev.map((p) => ({ ...p, lastCheck: new Date() })));
  }

  // ── Map raw on-chain events ───────────────────────────────────────────────
  const timelineEvents = recentEventsRaw
    ? (recentEventsRaw as any[]).map((e: any, i: number) => ({
        id: Number(e.eventId ?? i),
        protocol: e.protocol as string,
        riskLevel: RISK_LEVEL_LABELS[Number(e.riskLevel)] ?? 'LOW',
        actionType: ACTION_TYPE_LABELS[Number(e.actionType)] ?? 'ALERT',
        timestamp: new Date(Number(e.timestamp) * 1000),
        exploitPattern: e.exploitPattern as string,
      }))
    : [];

  const recentAlerts = timelineEvents
    .filter((e) => e.riskLevel === 'HIGH' || e.riskLevel === 'CRITICAL')
    .filter((e) => Date.now() - e.timestamp.getTime() < 604800000) // 7 days
    .map((e, i) => ({
      id: i,
      protocol: e.protocol,
      severity: (e.riskLevel === 'CRITICAL' ? 'critical' : 'high') as 'critical' | 'high' | 'medium' | 'low',
      message: e.exploitPattern || `${e.riskLevel} risk detected`,
      timestamp: e.timestamp,
      active: true,
    }));

  // ── Add protocol ─────────────────────────────────────────────────────────
  function handleAddProtocol() {
    setAddError('');
    if (!newAddr.match(/^0x[0-9a-fA-F]{40}$/)) {
      setAddError('Invalid Ethereum address');
      return;
    }
    if (protocols.find((p) => p.address.toLowerCase() === newAddr.toLowerCase())) {
      setAddError('Protocol already in watchlist');
      return;
    }
    setProtocols((prev) => [
      ...prev,
      {
        name: newName.trim() || `Protocol ${newAddr.slice(0, 6)}`,
        address: newAddr,
        tvl: newTvl.trim() || '0',
        riskScore: 1,
        lastCheck: new Date(),
        status: 'safe',
      },
    ]);
    setNewAddr(''); setNewName(''); setNewTvl('');
    setShowAddPanel(false);
  }

  function removeProtocol(address: string) {
    setProtocols((prev) => prev.filter((p) => p.address !== address));
  }

  function addToWatchlist(address: string, _hint: string) {
    if (protocols.find((p) => p.address.toLowerCase() === address.toLowerCase())) return;
    setProtocols((prev) => [
      ...prev,
      {
        name: `Protocol ${address.slice(0, 6)}`,
        address,
        tvl: '0',
        riskScore: 5,
        lastCheck: new Date(),
        status: 'warning',
      },
    ]);
  }

  const totalEvents = Number(eventCount ?? 0);

  return (
    <div className="min-h-screen bg-paladin-blue">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Hero */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-paladin-gold mb-1">⚔️ The Vigil</h1>
            <p className="text-paladin-silver">Autonomous defense system — Arbitrum Sepolia</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-paladin-silver">System Time</p>
            <p className="text-xl font-mono text-paladin-gold">{currentTime?.toLocaleTimeString() ?? '—'}</p>
          </div>
        </div>

        {/* Status Bar */}
        <div className="mb-6 border border-paladin-gold/30 rounded-xl p-4 bg-paladin-gold/5 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <Activity className="w-6 h-6 text-paladin-gold animate-pulse" />
            <div>
              <p className="font-bold text-paladin-gold text-sm">OPERATIONAL</p>
              <p className="text-xs text-paladin-silver">
                {protocols.length} protocols monitored &mdash; {totalEvents} chronicle events &mdash; last refresh {lastRefresh?.toLocaleTimeString() ?? '—'}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {/* Contract links */}
            <a href={`https://sepolia.arbiscan.io/address/${contracts.guardian.address}`} target="_blank" rel="noopener noreferrer"
              className="text-xs border border-paladin-gold/30 text-paladin-silver hover:text-paladin-gold hover:border-paladin-gold transition-all rounded-lg px-3 py-1.5">
              Guardian ↗
            </a>
            <a href={`https://sepolia.arbiscan.io/address/${contracts.riskRegistry.address}`} target="_blank" rel="noopener noreferrer"
              className="text-xs border border-paladin-gold/30 text-paladin-silver hover:text-paladin-gold hover:border-paladin-gold transition-all rounded-lg px-3 py-1.5">
              Registry ↗
            </a>
            <button onClick={handleRefresh}
              className="text-xs border border-paladin-gold/30 text-paladin-gold hover:bg-paladin-gold/10 transition-all rounded-lg px-3 py-1.5 flex items-center gap-1">
              <RefreshCw className="w-3 h-3" /> Refresh
            </button>
          </div>
        </div>

        {/* Alerts */}
        <div className="mb-6" id="crusade">
          <AlertCenter alerts={recentAlerts} />
        </div>

        {/* Protocols */}
        <div className="mb-6" id="vigil">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-paladin-gold flex items-center gap-2">
              <Shield className="w-5 h-5" /> Protected Protocols
              <span className="text-sm font-normal text-paladin-silver">({protocols.length})</span>
            </h2>
            <button onClick={() => { setShowAddPanel(!showAddPanel); setAddError(''); }}
              className="flex items-center gap-1.5 text-sm px-4 py-2 rounded-lg border border-paladin-gold/40 text-paladin-gold hover:bg-paladin-gold/10 hover:border-paladin-gold transition-all">
              {showAddPanel ? <><X className="w-4 h-4" /> Cancel</> : <><Plus className="w-4 h-4" /> Add Protocol</>}
            </button>
          </div>

          {/* Add Protocol Panel */}
          {showAddPanel && (
            <div className="mb-4 border border-paladin-gold/30 rounded-xl p-5 bg-paladin-gold/5 space-y-3">
              <p className="text-sm font-semibold text-paladin-gold">Add Protocol to Watchlist</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  value={newAddr}
                  onChange={(e) => setNewAddr(e.target.value)}
                  placeholder="Contract address (0x...)"
                  className="col-span-1 sm:col-span-2 bg-black/30 border border-paladin-silver/30 rounded-lg px-3 py-2 text-sm text-paladin-silver placeholder-paladin-silver/40 focus:outline-none focus:border-paladin-gold transition-colors"
                />
                <input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Name (optional)"
                  className="bg-black/30 border border-paladin-silver/30 rounded-lg px-3 py-2 text-sm text-paladin-silver placeholder-paladin-silver/40 focus:outline-none focus:border-paladin-gold transition-colors"
                />
                <input
                  value={newTvl}
                  onChange={(e) => setNewTvl(e.target.value)}
                  placeholder="TVL e.g. 500,000 (optional)"
                  className="col-span-1 sm:col-span-2 bg-black/30 border border-paladin-silver/30 rounded-lg px-3 py-2 text-sm text-paladin-silver placeholder-paladin-silver/40 focus:outline-none focus:border-paladin-gold transition-colors"
                />
                <button onClick={handleAddProtocol}
                  className="bg-paladin-gold hover:bg-paladin-gold/80 text-black font-bold rounded-lg px-4 py-2 text-sm flex items-center justify-center gap-1 transition-all">
                  <Search className="w-4 h-4" /> Add & Monitor
                </button>
              </div>
              {addError && <p className="text-xs text-red-400">❌ {addError}</p>}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {protocols.map((protocol) => (
              <div key={protocol.address} className="relative group">
                <button
                  onClick={() => removeProtocol(protocol.address)}
                  className="absolute -top-2 -right-2 z-10 w-6 h-6 rounded-full bg-red-600 text-white text-xs font-bold opacity-0 group-hover:opacity-100 transition-all hover:bg-red-700 flex items-center justify-center"
                  title="Remove from watchlist"
                >×</button>
                <ProtocolCard {...protocol} />
              </div>
            ))}
          </div>
        </div>

        {/* Chronicle */}
        <div id="chronicle" className="mb-6">
          <RiskTimeline events={timelineEvents} />
        </div>

        {/* Manual Scan */}
        <div id="scan" className="mb-6">
          <ManualScan
            totalChronicleEvents={totalEvents || 50}
            onAddToWatchlist={addToWatchlist}
          />
        </div>

        <div className="mt-10 text-center text-xs text-paladin-silver/50 space-y-1">
          <p>🛡️ Paladin Protocol — The shield that never sleeps</p>
          <p>
            Guardian: <a href={`https://sepolia.arbiscan.io/address/${contracts.guardian.address}`} target="_blank" rel="noopener noreferrer" className="text-paladin-gold/60 hover:text-paladin-gold font-mono">{contracts.guardian.address.slice(0, 10)}...</a>
            &nbsp;|&nbsp;
            Registry: <a href={`https://sepolia.arbiscan.io/address/${contracts.riskRegistry.address}`} target="_blank" rel="noopener noreferrer" className="text-paladin-gold/60 hover:text-paladin-gold font-mono">{contracts.riskRegistry.address.slice(0, 10)}...</a>
          </p>
        </div>
      </main>
    </div>
  );
}
