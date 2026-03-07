'use client';

/**
 * Providers Component
 * Sets up wagmi, RainbowKit, and React Query for the Paladin dashboard
 */

import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit';
import { config } from '@/lib/wagmi';
import '@rainbow-me/rainbowkit/styles.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 0,
      gcTime: 0,
      refetchOnMount: true,
      refetchOnWindowFocus: true,
    },
  },
});

// Custom Paladin theme for RainbowKit
const paladinTheme = darkTheme({
  accentColor: '#d4af37', // Paladin Gold
  accentColorForeground: '#1a2742', // Paladin Blue
  borderRadius: 'medium',
  fontStack: 'system',
  overlayBlur: 'small',
});

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={paladinTheme}>
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
