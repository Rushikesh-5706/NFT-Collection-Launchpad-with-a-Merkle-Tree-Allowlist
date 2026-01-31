'use client';

import { useState, useEffect } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther } from 'viem';
import { MerkleTree } from 'merkletreejs';
import keccak256 from 'keccak256';
import allowlist from '../allowlist.json';
import MyNFTABI from '../contracts/MyNFT.json';
import Image from 'next/image';

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}` || '0x5FbDB2315678afecb367f032d93F642f64180aa3';

export default function Home() {
  const { address, isConnected } = useAccount();
  const [quantity, setQuantity] = useState(1);
  const [mounted, setMounted] = useState(false);
  const [merkleProof, setMerkleProof] = useState<string[]>([]);

  const { data: hash, writeContract, isPending, error: mintError } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });

  const { data: totalSupply } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: MyNFTABI.abi,
    functionName: 'totalSupply',
    query: { refetchInterval: 2000 }
  });

  const { data: saleState } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: MyNFTABI.abi,
    functionName: 'saleState',
    query: { refetchInterval: 2000 }
  });

  // Check if user is on allowlist
  const isAllowlisted = address && allowlist.some(a => a.toLowerCase() === address.toLowerCase());

  // Calculate Merkle Proof
  useEffect(() => {
    if (address && saleState === 1 && isAllowlisted) { // 1 = Allowlist
      try {
        const leaves = allowlist.map((addr) => keccak256(Buffer.from(addr.replace("0x", ""), "hex")));
        const tree = new MerkleTree(leaves, keccak256, { sortPairs: true });
        const leaf = keccak256(Buffer.from(address.replace("0x", ""), "hex"));
        const proof = tree.getHexProof(leaf);
        setMerkleProof(proof);
      } catch (e) {
        console.error("Error generating proof", e);
      }
    }
  }, [address, saleState, isAllowlisted]);

  useEffect(() => setMounted(true), []);

  const handleMint = async () => {
    if (!address) return;

    try {
      if (Number(saleState) === 1) { // Allowlist
        writeContract({
          address: CONTRACT_ADDRESS,
          abi: MyNFTABI.abi,
          functionName: 'allowlistMint',
          args: [merkleProof, BigInt(quantity)],
          value: parseEther((0.01 * quantity).toString()),
        });
      } else if (Number(saleState) === 2) { // Public
        writeContract({
          address: CONTRACT_ADDRESS,
          abi: MyNFTABI.abi,
          functionName: 'publicMint',
          args: [BigInt(quantity)],
          value: parseEther((0.01 * quantity).toString()),
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const salesStatusLabel = ['Paused', 'Allowlist Only', 'Public Sale'][Number(saleState || 0)];

  const isSoldOut = Number(totalSupply ?? 0) >= 10000;

  // Custom helper to determine button state text
  const getButtonText = () => {
    if (isSoldOut) return 'Sold Out';
    if (isPending || isConfirming) return 'Minting...';
    if (!address) return 'Connect Wallet';
    if (Number(saleState) === 0) return 'Sale Paused';
    if (Number(saleState) === 1 && !isAllowlisted) return 'Not Allowlisted';
    return 'Mint Now';
  };

  const isMintDisabled = !address ||
    !saleState ||
    isPending ||
    isConfirming ||
    isSoldOut ||
    (Number(saleState) === 0) ||
    (Number(saleState) === 1 && !isAllowlisted);

  if (!mounted) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-black text-white flex flex-col items-center justify-center p-8">
        <div className="w-full max-w-5xl animate-pulse space-y-12">
          <div className="h-20 bg-white/10 rounded-2xl w-full"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="aspect-square bg-white/10 rounded-2xl"></div>
            <div className="space-y-6">
              <div className="h-12 bg-white/10 rounded-xl w-3/4"></div>
              <div className="h-4 bg-white/10 rounded-xl w-1/2"></div>
              <div className="h-64 bg-white/10 rounded-2xl"></div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-black text-white flex flex-col items-center justify-center p-8">
      {/* Navigation */}
      <nav className="w-full max-w-5xl flex justify-between items-center mb-16 backdrop-blur-md bg-white/5 p-4 rounded-2xl border border-white/10">
        <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-violet-500">
          Genesis Collection
        </h1>
        <ConnectButton.Custom>
          {({
            account,
            chain,
            openAccountModal,
            openChainModal,
            openConnectModal,
            mounted,
          }) => {
            const ready = mounted;
            const connected = ready && account && chain;

            return (
              <div
                {...(!ready && {
                  'aria-hidden': true,
                  'style': {
                    opacity: 0,
                    pointerEvents: 'none',
                    userSelect: 'none',
                  },
                })}
              >
                {(() => {
                  if (!connected) {
                    return (
                      <button
                        data-testid="connect-wallet-button"
                        onClick={openConnectModal}
                        type="button"
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-xl transition-all"
                      >
                        Connect Wallet
                      </button>
                    );
                  }

                  if (chain.unsupported) {
                    return (
                      <button onClick={openChainModal} type="button" className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-xl">
                        Wrong network
                      </button>
                    );
                  }

                  return (
                    <div className="flex gap-3">
                      <button
                        onClick={openChainModal}
                        style={{ display: 'flex', alignItems: 'center' }}
                        type="button"
                        className="bg-white/10 hover:bg-white/20 text-white font-bold py-2 px-4 rounded-xl"
                      >
                        {chain.hasIcon && (
                          <div
                            style={{
                              background: chain.iconBackground,
                              width: 12,
                              height: 12,
                              borderRadius: 999,
                              overflow: 'hidden',
                              marginRight: 4,
                            }}
                          >
                            {chain.iconUrl && (
                              <Image
                                alt={chain.name ?? 'Chain icon'}
                                src={chain.iconUrl}
                                width={12}
                                height={12}
                              />
                            )}
                          </div>
                        )}
                        {chain.name}
                      </button>

                      <button
                        onClick={openAccountModal}
                        type="button"
                        className="bg-white/10 hover:bg-white/20 text-white font-bold py-2 px-4 rounded-xl font-mono flex gap-2"
                      >
                        <span data-testid="connected-address">
                          {account.displayName}
                        </span>
                        {account.displayBalance
                          ? ` (${account.displayBalance})`
                          : ''}
                      </button>
                    </div>
                  );
                })()}
              </div>
            );
          }}
        </ConnectButton.Custom>
      </nav>

      {/* Hero Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-5xl w-full items-center">
        {/* Preview Card */}
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-pink-600 to-purple-600 rounded-2xl blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-tilt"></div>
          <div className="relative bg-gray-900 rounded-2xl p-4 border border-white/10 aspect-square flex items-center justify-center">
            {/* Placeholder Image */}
            <div className="w-full h-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-xl flex items-center justify-center animate-pulse">
              <span className="text-4xl font-bold text-white/20">?</span>
            </div>
          </div>
        </div>

        {/* Minting Interface */}
        <div className="flex flex-col gap-6">
          <div className="space-y-2">
            <h2 className="text-5xl font-extrabold tracking-tight">
              Mint Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">Legend</span>
            </h2>
            <p className="text-gray-400 text-lg">
              Unlock exclusive benefits and join the future of digital ownership.
            </p>
          </div>

          <div className="bg-white/5 p-6 rounded-2xl border border-white/10 backdrop-blur-sm space-y-4">
            <div className="flex justify-between items-center text-sm font-medium text-gray-300">
              <span data-testid="sale-status" className="uppercase tracking-widest text-xs bg-indigo-500/20 text-indigo-300 px-3 py-1 rounded-full border border-indigo-500/50">
                {salesStatusLabel}
              </span>
              <div className="flex items-center gap-2">
                <span data-testid="mint-count" className="text-white">{Number(totalSupply || 0)}</span>
                <span className="text-gray-500">/</span>
                <span data-testid="total-supply">10000</span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center bg-black/30 p-4 rounded-xl">
                <span className="text-gray-400">Price</span>
                <span className="text-xl font-bold">0.01 ETH</span>
              </div>

              <div className="flex items-center justify-between gap-4">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-12 h-12 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-2xl font-bold transition-all"
                >-</button>
                <input
                  data-testid="quantity-input"
                  type="number"
                  min="1"
                  max="5"
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="flex-1 h-12 bg-transparent text-center text-2xl font-bold focus:outline-none"
                />
                <button
                  onClick={() => setQuantity(Math.min(5, quantity + 1))}
                  className="w-12 h-12 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-2xl font-bold transition-all"
                >+</button>
              </div>

              <button
                data-testid="mint-button"
                onClick={handleMint}
                disabled={isMintDisabled}
                className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl font-bold text-lg hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-indigo-500/25 disabled:hover:shadow-none"
              >
                {isPending || isConfirming ? (
                  <div className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Processing...</span>
                  </div>
                ) : (
                  getButtonText()
                )}
              </button>

              {hash && <div data-testid="mint-pending" className="text-xs text-center text-yellow-400 mt-2 truncate">Tx Pending: {hash}</div>}
              {isConfirmed && <div data-testid="mint-success" className="text-sm text-center text-green-400 font-bold">Mint Successful!</div>}
              {mintError && (
                <div data-testid="mint-error" className="bg-red-500/10 border border-red-500/20 p-2 rounded-lg mt-2">
                  <p className="text-xs text-center text-red-400 font-mono">
                    {mintError.message.split('\n')[0].slice(0, 50)}...
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
