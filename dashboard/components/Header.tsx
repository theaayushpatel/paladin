'use client';

/**
 * Header Component
 * Navigation and wallet connection for Paladin dashboard
 */

import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Shield } from 'lucide-react';

export function Header() {
  return (
    <header className="border-b border-paladin-gold/20 bg-paladin-blue">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Title */}
          <div className="flex items-center space-x-3">
            <Shield className="w-8 h-8 text-paladin-gold" />
            <div>
              <h1 className="text-xl font-bold text-paladin-gold">
                ⚔️ Paladin Protocol
              </h1>
              <p className="text-xs text-paladin-silver">
                The shield that never sleeps
              </p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex space-x-8">
            <a
              href="#vigil"
              className="text-paladin-silver hover:text-paladin-gold transition-colors"
            >
              The Vigil
            </a>
            <a
              href="#chronicle"
              className="text-paladin-silver hover:text-paladin-gold transition-colors"
            >
              The Chronicle
            </a>
            <a
              href="#crusade"
              className="text-paladin-silver hover:text-paladin-gold transition-colors"
            >
              The Crusade
            </a>
          </nav>

          {/* Wallet Connection */}
          <div>
            <ConnectButton
              chainStatus="icon"
              showBalance={false}
              accountStatus="address"
            />
          </div>
        </div>
      </div>
    </header>
  );
}
