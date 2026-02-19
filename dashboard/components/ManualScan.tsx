'use client';

import { useState, useMemo } from 'react';
import { useReadContract, useWriteContract, useWaitForTransactionReceipt, useAccount } from 'wagmi';
import { Search, Shield, AlertTriangle, ExternalLink, Plus, ChevronDown, ChevronUp, Zap, Activity } from 'lucide-react';
import { contracts } from '@/lib/contracts';

const RISK_LEVEL_LABELS = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const;
const ACTION_TYPE_LABELS = ['ALERT', 'WITHDRAWAL', 'GOVERNANCE_PROPOSAL'] as const;

const RISK_STYLES: Record<string, { badge: string; text: string; border: string; bg: string }> = {
  CRITICAL: { badge: 'bg-red-500 text-white',     text: 'text-red-400',    border: 'border-red-500',    bg: 'bg-red-500/10' },
  HIGH:     { badge: 'bg-orange-500 text-white',   text: 'text-orange-400', border: 'border-orange-500', bg: 'bg-orange-500/10' },
  MEDIUM:   { badge: 'bg-yellow-500 text-black',   text: 'text-yellow-400', border: 'border-yellow-500', bg: 'bg-yellow-500/10' },
  LOW:      { badge: 'bg-blue-500 text-white',     text: 'text-blue-400',   border: 'border-blue-500',   bg: 'bg-blue-500/10' },
};

const ETH_ADDRESS = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';

interface ManualScanProps {
  totalChronicleEvents?: number;
  onAddToWatchlist?: (address: string, name: string) => void;
}

export function ManualScan({ totalChronicleEvents = 50, onAddToWatchlist }: ManualScanProps) {
  const { isConnected } = useAccount();

  // ── Scan state ────────────────────────────────────────────────────────────
  const [inputAddr, setInputAddr]       = useState('');
  const [scanAddr, setScanAddr]         = useState('');
  const [inputError, setInputError]     = useState('');
  const [expandedIds, setExpandedIds]   = useState<Set<number>>(new Set());

  // ── Record Threat form ────────────────────────────────────────────────────
  const [showRecordForm, setShowRecordForm] = useState(false);
  const [riskLevelSel, setRiskLevelSel]     = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'>('HIGH');
  const [actionTypeSel, setActionTypeSel]   = useState<'ALERT' | 'WITHDRAWAL' | 'GOVERNANCE_PROPOSAL'>('ALERT');
  const [exploitPattern, setExploitPattern] = useState('');

  const { writeContract, data: txHash, isPending, isError, error, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash: txHash });

  // ── Fetch all registry events (lazy — only when an address is scanned) ───
  const fetchLimit = Math.max(totalChronicleEvents, 50);
  const { data: allEventsRaw, isFetching, refetch: refetchScan } = useReadContract({
    ...contracts.riskRegistry,
    functionName: 'getRecentEvents',
    args: [BigInt(0), BigInt(fetchLimit)],
    query: { enabled: !!scanAddr },
  });

  // ── Filter by scanned address ─────────────────────────────────────────────
  const protocolEvents = useMemo(() => {
    if (!allEventsRaw || !scanAddr) return [];
    return (allEventsRaw as any[])
      .filter((e: any) => e.protocol?.toLowerCase() === scanAddr.toLowerCase())
      .map((e: any, i: number) => ({
        id: Number(e.eventId ?? i),
        riskLevel: RISK_LEVEL_LABELS[Number(e.riskLevel)] ?? 'LOW',
        actionType: ACTION_TYPE_LABELS[Number(e.actionType)] ?? 'ALERT',
        timestamp: new Date(Number(e.timestamp) * 1000),
        exploitPattern: e.exploitPattern as string,
        amount: e.amount ? e.amount.toString() : '0',
      }))
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }, [allEventsRaw, scanAddr]);

  const riskCounts = useMemo(() => ({
    CRITICAL: protocolEvents.filter((e) => e.riskLevel === 'CRITICAL').length,
    HIGH:     protocolEvents.filter((e) => e.riskLevel === 'HIGH').length,
    MEDIUM:   protocolEvents.filter((e) => e.riskLevel === 'MEDIUM').length,
    LOW:      protocolEvents.filter((e) => e.riskLevel === 'LOW').length,
  }), [protocolEvents]);

  const highestRisk = protocolEvents.length === 0
    ? null
    : riskCounts.CRITICAL > 0 ? 'CRITICAL' : riskCounts.HIGH > 0 ? 'HIGH' : riskCounts.MEDIUM > 0 ? 'MEDIUM' : 'LOW';

  // ── Handlers ──────────────────────────────────────────────────────────────
  function handleScan() {
    setInputError('');
    const trimmed = inputAddr.trim();
    if (!trimmed.match(/^0x[0-9a-fA-F]{40}$/)) {
      setInputError('Invalid Ethereum address (expected 0x…40 hex chars)');
      return;
    }
    setScanAddr(trimmed);
    // Force refetch if same address
    if (trimmed.toLowerCase() === scanAddr.toLowerCase()) {
      refetchScan();
    }
  }

  function toggleExpand(id: number) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function handleRecordThreat() {
    if (!scanAddr || !exploitPattern.trim()) return;
    const riskLevelNum  = RISK_LEVEL_LABELS.indexOf(riskLevelSel);
    const actionTypeNum = ACTION_TYPE_LABELS.indexOf(actionTypeSel);
    writeContract({
      ...contracts.riskRegistry,
      functionName: 'recordThreat',
      args: [
        scanAddr as `0x${string}`,
        ETH_ADDRESS as `0x${string}`,
        BigInt(0),
        riskLevelNum as unknown as never,
        actionTypeNum as unknown as never,
        exploitPattern.trim(),
      ],
    });
  }

  const shortAddr   = scanAddr ? `${scanAddr.slice(0, 8)}…${scanAddr.slice(-6)}` : '';
  const arbiscanUrl = scanAddr ? `https://sepolia.arbiscan.io/address/${scanAddr}` : '#';
  const hasScanned  = !!scanAddr && !isFetching;

  return (
    <div className="border border-paladin-gold/20 rounded-xl p-6 bg-paladin-blue-light">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-bold text-paladin-gold flex items-center gap-2">
          <Search className="w-5 h-5" />
          Manual Scan
        </h2>
        <span className="text-xs text-paladin-silver border border-paladin-silver/30 rounded-full px-3 py-1">
          On-chain risk lookup
        </span>
      </div>

      {/* Address Input */}
      <div className="flex gap-2 mb-2">
        <input
          value={inputAddr}
          onChange={(e) => { setInputAddr(e.target.value); setInputError(''); }}
          onKeyDown={(e) => e.key === 'Enter' && handleScan()}
          placeholder="Protocol address (0x…)"
          className="flex-1 bg-black/30 border border-paladin-silver/30 rounded-lg px-3 py-2 text-sm text-paladin-silver placeholder-paladin-silver/40 focus:outline-none focus:border-paladin-gold transition-colors font-mono"
        />
        <button
          onClick={handleScan}
          disabled={isFetching}
          className="px-4 py-2 bg-paladin-gold hover:bg-paladin-gold/80 active:bg-paladin-gold/60 disabled:opacity-60 disabled:cursor-not-allowed text-black font-bold text-sm rounded-lg transition-all flex items-center gap-1.5"
        >
          {isFetching ? (
            <Activity className="w-4 h-4 animate-spin" />
          ) : (
            <Search className="w-4 h-4" />
          )}
          {isFetching ? 'Scanning…' : 'Scan'}
        </button>
      </div>
      {inputError && <p className="text-xs text-red-400 mb-3">❌ {inputError}</p>}

      {/* ── Results ─────────────────────────────────────────────────────── */}
      {scanAddr && (
        <div className="mt-4 space-y-4">
          {/* Scanned address bar */}
          <div className="flex items-center justify-between bg-black/20 rounded-lg px-3 py-2 border border-paladin-silver/20">
            <div className="flex items-center gap-2">
              {highestRisk
                ? <AlertTriangle className={`w-4 h-4 ${RISK_STYLES[highestRisk].text}`} />
                : <Shield className="w-4 h-4 text-paladin-gold" />
              }
              <code className="text-sm text-paladin-silver">{shortAddr}</code>
              <a href={arbiscanUrl} target="_blank" rel="noopener noreferrer" className="text-paladin-silver hover:text-paladin-gold transition-colors">
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <div className="flex items-center gap-2">
              {isFetching && <Activity className="w-4 h-4 animate-spin text-paladin-silver/60" />}
              {highestRisk && (
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${RISK_STYLES[highestRisk].badge}`}>
                  {highestRisk}
                </span>
              )}
              {onAddToWatchlist && (
                <button
                  onClick={() => onAddToWatchlist(scanAddr, inputAddr)}
                  className="text-xs border border-paladin-gold/40 text-paladin-gold hover:bg-paladin-gold/10 rounded-lg px-2 py-1 transition-all flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> Watchlist
                </button>
              )}
            </div>
          </div>

          {hasScanned && (
            <>
              {/* Risk Summary */}
              {protocolEvents.length > 0 ? (
                <>
                  <div className="grid grid-cols-4 gap-2">
                    {(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as const).map((lvl) => (
                      <div key={lvl} className={`rounded-lg p-3 text-center border ${RISK_STYLES[lvl].border} ${RISK_STYLES[lvl].bg}`}>
                        <p className={`text-2xl font-bold ${RISK_STYLES[lvl].text}`}>{riskCounts[lvl]}</p>
                        <p className="text-xs text-paladin-silver mt-0.5">{lvl}</p>
                      </div>
                    ))}
                  </div>

                  {/* Events list */}
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {protocolEvents.map((event) => {
                      const s = RISK_STYLES[event.riskLevel];
                      const isExpanded = expandedIds.has(event.id);
                      return (
                        <div
                          key={event.id}
                          className={`border rounded-xl transition-all cursor-pointer hover:shadow-md ${s.border} ${s.bg}`}
                          onClick={() => toggleExpand(event.id)}
                        >
                          <div className="flex items-center justify-between gap-2 p-3">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className={`text-xs font-bold px-1.5 py-0.5 rounded shrink-0 ${s.badge}`}>{event.riskLevel}</span>
                              <span className="text-xs text-paladin-silver shrink-0">
                                {event.actionType === 'GOVERNANCE_PROPOSAL' ? 'GOV' : event.actionType}
                              </span>
                              <p className="text-xs text-paladin-silver/70 truncate">{event.exploitPattern}</p>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className="text-xs text-paladin-silver">{event.timestamp.toLocaleTimeString()}</span>
                              {isExpanded ? <ChevronUp className="w-3 h-3 text-paladin-silver/60" /> : <ChevronDown className="w-3 h-3 text-paladin-silver/60" />}
                            </div>
                          </div>
                          {isExpanded && (
                            <div className="px-3 pb-3 border-t border-white/10 pt-2 space-y-1">
                              <p className={`text-xs ${s.text}`}>{event.exploitPattern}</p>
                              <p className="text-xs text-paladin-silver/60">{event.timestamp.toLocaleString()}</p>
                              <p className="text-xs text-paladin-silver/60">Event #{event.id}</p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-paladin-silver border border-paladin-silver/20 rounded-xl">
                  <Shield className="w-10 h-10 mx-auto mb-2 opacity-40" />
                  <p className="text-sm font-semibold">No recorded threats</p>
                  <p className="text-xs opacity-60 mt-1">This protocol has no entries in The Chronicle</p>
                </div>
              )}

              {/* Record Threat panel (wallet required) */}
              {isConnected && (
                <div>
                  <button
                    onClick={() => { setShowRecordForm(!showRecordForm); reset(); }}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-paladin-gold/30 text-paladin-gold hover:bg-paladin-gold/10 transition-all text-sm"
                  >
                    <Zap className="w-4 h-4" />
                    {showRecordForm ? 'Cancel' : 'Record Threat Manually'}
                  </button>

                  {showRecordForm && (
                    <div className="mt-2 border border-paladin-gold/30 rounded-xl p-4 bg-paladin-gold/5 space-y-3">
                      <p className="text-xs font-semibold text-paladin-gold uppercase tracking-wide">Record on-chain threat</p>

                      {/* Risk level */}
                      <div>
                        <p className="text-xs text-paladin-silver mb-1.5">Risk Level</p>
                        <div className="flex gap-2 flex-wrap">
                          {(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const).map((lvl) => (
                            <button key={lvl} onClick={() => setRiskLevelSel(lvl)}
                              className={`px-3 py-1 text-xs rounded-lg font-bold transition-all ${riskLevelSel === lvl ? RISK_STYLES[lvl].badge : `border ${RISK_STYLES[lvl].border} ${RISK_STYLES[lvl].text} hover:${RISK_STYLES[lvl].bg}`}`}>
                              {lvl}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Action type */}
                      <div>
                        <p className="text-xs text-paladin-silver mb-1.5">Action Type</p>
                        <div className="flex gap-2 flex-wrap">
                          {(['ALERT', 'WITHDRAWAL', 'GOVERNANCE_PROPOSAL'] as const).map((act) => (
                            <button key={act} onClick={() => setActionTypeSel(act)}
                              className={`px-3 py-1 text-xs rounded-lg font-semibold transition-all ${actionTypeSel === act ? 'bg-paladin-gold text-black' : 'border border-paladin-silver/30 text-paladin-silver hover:border-paladin-gold/40'}`}>
                              {act === 'GOVERNANCE_PROPOSAL' ? 'GOV' : act}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Exploit pattern */}
                      <div>
                        <p className="text-xs text-paladin-silver mb-1.5">Exploit Pattern / Notes</p>
                        <textarea
                          value={exploitPattern}
                          onChange={(e) => setExploitPattern(e.target.value)}
                          placeholder="Describe the exploit pattern or threat…"
                          rows={2}
                          className="w-full bg-black/30 border border-paladin-silver/30 rounded-lg px-3 py-2 text-sm text-paladin-silver placeholder-paladin-silver/40 focus:outline-none focus:border-paladin-gold transition-colors resize-none"
                        />
                      </div>

                      <button
                        onClick={handleRecordThreat}
                        disabled={isPending || isConfirming || !exploitPattern.trim()}
                        className="w-full py-2 bg-paladin-gold hover:bg-paladin-gold/80 active:bg-paladin-gold/60 disabled:opacity-60 disabled:cursor-not-allowed text-black font-bold text-sm rounded-lg transition-all flex items-center justify-center gap-2"
                      >
                        {isPending    ? '⏳ Awaiting signature…' :
                         isConfirming  ? '⛓️ Confirming on-chain…' :
                         `⚔️ Record ${riskLevelSel} Threat`}
                      </button>

                      {isSuccess && txHash && (
                        <div className="text-xs text-center space-y-1">
                          <p className="text-green-400">✅ Threat recorded on-chain!</p>
                          <a href={`https://sepolia.arbiscan.io/tx/${txHash}`} target="_blank" rel="noopener noreferrer"
                            className="text-paladin-gold hover:underline">View tx →</a>
                          <button onClick={() => { refetchScan(); reset(); setExploitPattern(''); }}
                            className="block mx-auto text-paladin-silver hover:text-paladin-gold transition-colors mt-1">
                            Refresh results ↺
                          </button>
                        </div>
                      )}
                      {isError && (
                        <p className="text-xs text-red-400">❌ {(error as any)?.shortMessage || error?.message?.slice(0, 120)}</p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {!isConnected && (
                <p className="text-xs text-center text-paladin-silver/60 py-2 border border-paladin-silver/20 rounded-lg">
                  Connect wallet to record threats manually
                </p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
