'use client';

import * as React from 'react';
import {
    RainbowKitProvider,
    getDefaultWallets,
    getDefaultConfig,
} from '@rainbow-me/rainbowkit';
import {
    trustWallet,
    ledgerWallet,
} from '@rainbow-me/rainbowkit/wallets';
import {
    mainnet,
    polygon,
    optimism,
    arbitrum,
    base,
    sepolia,
    hardhat,
} from 'wagmi/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';

const { wallets } = getDefaultWallets();

const config = getDefaultConfig({
    appName: 'NFT Launchpad', // Changed appName
    projectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || '3a8170812b534d0ff9d794f19a901d64', // Updated projectId
    wallets: [
        ...wallets,
        {
            groupName: 'Other',
            wallets: [trustWallet, ledgerWallet],
        },
    ],
    chains: [
        mainnet, // Added mainnet
        polygon, // Added polygon
        optimism, // Added optimism
        arbitrum, // Added arbitrum
        base, // Added base
        // Removed hardhat and first sepolia
        ...(process.env.NEXT_PUBLIC_ENABLE_TESTNETS === 'true' ? [sepolia] : []),
    ],
    ssr: true,
});

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <WagmiProvider config={config}>
            <QueryClientProvider client={queryClient}>
                <RainbowKitProvider>
                    {children}
                </RainbowKitProvider>
            </QueryClientProvider>
        </WagmiProvider>
    );
}
