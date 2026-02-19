'use client';

import { Shield, AlertTriangle, TrendingUp, ExternalLink, Zap, Clock } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useWriteContract, useWaitForTransactionReceipt, useAccount } from 'wagmi';
import { contracts } from '@/lib/contracts';

interface ProtocolCardProps {
  name: string;
  address: string;
  tvl: string;
  riskScore: number;
  lastCheck: Date;
  status: 'safe' | 'warning' | 'critical';
}

const ETH_ADDRESS = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';

export function ProtocolCard({ name, address, tvl, riskScore, lastCheck, status }: ProtocolCardProps) {
  const { isConnected } = useAccount();
  const [selectedRisk, setSelectedRisk] = useState<'HIGH' | 'CRITICAL'>('CRITICAL');
  const [showWithdrawPanel, setShowWithdrawPanel] = useState(false);

  const { writeContract, data: txHash, isPending, isError, error, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash: txHash });

  const statusConfig = useMemo(() => {
    switch (status) {
      case 'critical':
        return { border: 'border-red-500', bg: 'bg-red-500/10', icon: <AlertTriangle className="w-6 h-6 text-red-500" />, label: 'CRITICAL', labelColor: 'text-red-500', badgeBg: 'bg-red-500 text-white' };
      case 'warning':
        return { border: 'border-yellow-500', bg: 'bg-yellow-500/10', icon: <AlertTriangle className="w-6 h-6 text-yellow-500" />, label: 'WARNING', labelColor: 'text-yellow-500', badgeBg: 'bg-yellow-500 text-black' };
      default:
        return { border: 'border-paladin-gold/40', bg: 'bg-paladin-gold/5', icon: <Shield className="w-6 h-6 text-paladin-gold" />, label: 'PROTECTED', labelColor: 'text-paladin-gold', badgeBg: 'bg-paladin-gold text-black' };
    }
  }, [status]);

  const shortAddress = `${address.slice(0, 6)}...${address.slice(-4)}`;
  const arbiscanUrl = `https://sepolia.arbiscan.io/address/${address}`;

  function handleEmergencyWithdraw() {
    const riskLevelNum = selectedRisk === 'CRITICAL' ? 3 : 2;
    writeContract({
      ...contracts.guardian,
      functionName: 'emergencyWithdraw',
      args: [address as `0x${string}`, ETH_ADDRESS as `0x${string}`, BigInt(0), riskLevelNum as unknown as never],
    });
  }

  return (
    <div className={`border-2 rounded-xl p-5 transition-all hover:shadow-xl ${statusConfig.border} ${statusConfig.bg}`}>
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h3 className="text-base font-bold text-paladin-gold truncate">{name}</h3>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full shrink-0 ${statusConfig.badgeBg}`}>{statusConfig.label}</span>
          </div>
          <div className="flex items-center gap-1">
            <code className="text-xs text-paladin-silver">{shortAddress}</code>
            <a href={arbiscanUrl} target="_blank" rel="noopener noreferrer" className="text-paladin-silver hover:text-paladin-gold transition-colors" title="View on Arbiscan">
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
        {statusConfig.icon}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="bg-black/20 rounded-lg p-3">
          <p className="text-xs text-paladin-silver mb-1 flex items-center gap-1"><TrendingUp className="w-3 h-3" /> TVL</p>
          <p className="text-base font-bold text-white">${tvl}</p>
        </div>
        <div className="bg-black/20 rounded-lg p-3">
          <p className="text-xs text-paladin-silver mb-1">Risk Score</p>
          <p className={`text-base font-bold ${riskScore >= 7 ? 'text-red-400' : riskScore >= 5 ? 'text-yellow-400' : 'text-green-400'}`}>{riskScore}/10</p>
        </div>
      </div>

      <div className="flex items-center gap-1 text-xs text-paladin-silver mb-4">
        <Clock className="w-3 h-3" />
        Last check: {lastCheck.toLocaleTimeString()}
      </div>

      {/* Actions */}
      <div className="border-t border-white/10 pt-3 space-y-2">
        {!isConnected ? (
          <p className="text-xs text-center text-paladin-silver/60 py-1">Connect wallet to enable actions</p>
        ) : (
          <>
            <button
              onClick={() => { setShowWithdrawPanel(!showWithdrawPanel); reset(); }}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-red-500/50 text-red-400 hover:bg-red-500/15 hover:border-red-500 transition-all text-sm font-semibold"
            >
              <Zap className="w-4 h-4" />
              {showWithdrawPanel ? 'Cancel' : 'Emergency Withdraw'}
            </button>

            {showWithdrawPanel && (
              <div className="bg-red-950/40 border border-red-500/30 rounded-lg p-3 space-y-2">
                <p className="text-xs text-red-400 font-semibold uppercase tracking-wide">Risk Level</p>
                <div className="flex gap-2">
                  {(['HIGH', 'CRITICAL'] as const).map((level) => (
                    <button key={level} onClick={() => setSelectedRisk(level)}
                      className={`flex-1 py-1.5 text-xs rounded-lg font-bold transition-all ${selectedRisk === level ? 'bg-red-500 text-white' : 'border border-red-500/40 text-red-400 hover:bg-red-500/20'}`}>
                      {level}
                    </button>
                  ))}
                </div>
                <button onClick={handleEmergencyWithdraw} disabled={isPending || isConfirming}
                  className="w-full py-2 bg-red-600 hover:bg-red-700 active:bg-red-800 disabled:opacity-60 disabled:cursor-not-allowed text-white text-xs font-bold rounded-lg transition-all">
                  {isPending ? '⏳ Awaiting signature...' : isConfirming ? '⛓️ Confirming on-chain...' : `⚔️ Execute ${selectedRisk} Withdrawal`}
                </button>
                {isSuccess && txHash && (
                  <div className="text-xs text-center space-y-1">
                    <p className="text-green-400">✅ Withdrawal executed!</p>
                    <a href={`https://sepolia.arbiscan.io/tx/${txHash}`} target="_blank" rel="noopener noreferrer" className="text-paladin-gold hover:underline">View tx →</a>
                  </div>
                )}
                {isError && <p className="text-xs text-red-400">❌ {(error as any)?.shortMessage || error?.message?.slice(0, 100)}</p>}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
