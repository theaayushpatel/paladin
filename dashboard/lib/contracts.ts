/**
 * Contract Configuration
 * ABIs and addresses for Paladin Protocol contracts
 */

export const contracts = {
  guardian: {
    address: process.env.NEXT_PUBLIC_GUARDIAN_ADDRESS as `0x${string}`,
    abi: [
      // To be populated after contract implementation
    ],
  },
  riskRegistry: {
    address: process.env.NEXT_PUBLIC_RISK_REGISTRY_ADDRESS as `0x${string}`,
    abi: [
      // To be populated after contract implementation
    ],
  },
} as const;
