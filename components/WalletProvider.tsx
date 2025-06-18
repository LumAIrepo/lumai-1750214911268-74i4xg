```tsx
'use client'

import React, { FC, ReactNode, useMemo } from 'react'
import { ConnectionProvider, WalletProvider as SolanaWalletProvider } from '@solana/wallet-adapter-react'
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
  TorusWalletAdapter,
  LedgerWalletAdapter,
  SolletWalletAdapter,
  MathWalletAdapter,
  Coin98WalletAdapter,
  CloverWalletAdapter,
  SafePalWalletAdapter,
  SlopeWalletAdapter,
  TokenPocketWalletAdapter,
  TrustWalletAdapter,
  BackpackWalletAdapter,
  GlowWalletAdapter,
  ExodusWalletAdapter,
  BraveWalletAdapter,
} from '@solana/wallet-adapter-wallets'
import { clusterApiUrl } from '@solana/web3.js'
import { toast } from 'sonner'

require('@solana/wallet-adapter-react-ui/styles.css')

interface WalletProviderProps {
  children: ReactNode
}

const WalletProvider: FC<WalletProviderProps> = ({ children }) => {
  const network = WalletAdapterNetwork.Mainnet
  const endpoint = useMemo(() => {
    if (network === WalletAdapterNetwork.Mainnet) {
      return process.env.NEXT_PUBLIC_RPC_URL || clusterApiUrl(network)
    }
    return clusterApiUrl(network)
  }, [network])

  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
      new BackpackWalletAdapter(),
      new GlowWalletAdapter(),
      new ExodusWalletAdapter(),
      new BraveWalletAdapter(),
      new TorusWalletAdapter(),
      new LedgerWalletAdapter(),
      new SolletWalletAdapter(),
      new MathWalletAdapter(),
      new Coin98WalletAdapter(),
      new CloverWalletAdapter(),
      new SafePalWalletAdapter(),
      new SlopeWalletAdapter(),
      new TokenPocketWalletAdapter(),
      new TrustWalletAdapter(),
    ],
    []
  )

  const onError = (error: any) => {
    console.error('Wallet error:', error)
    
    if (error?.message) {
      if (error.message.includes('User rejected')) {
        toast.error('Connection cancelled by user')
      } else if (error.message.includes('not found')) {
        toast.error('Wallet not found. Please install a Solana wallet.')
      } else if (error.message.includes('insufficient funds')) {
        toast.error('Insufficient SOL balance for transaction fees')
      } else if (error.message.includes('Transaction was not confirmed')) {
        toast.error('Transaction failed to confirm. Please try again.')
      } else if (error.message.includes('blockhash not found')) {
        toast.error('Network congestion. Please try again.')
      } else {
        toast.error(`Wallet error: ${error.message}`)
      }
    } else {
      toast.error('An unexpected wallet error occurred')
    }
  }

  return (
    <ConnectionProvider 
      endpoint={endpoint}
      config={{
        commitment: 'confirmed',
        wsEndpoint: endpoint.replace('https://', 'wss://').replace('http://', 'ws://'),
      }}
    >
      <SolanaWalletProvider 
        wallets={wallets} 
        onError={onError}
        autoConnect={true}
        localStorageKey="streamflow-wallet"
      >
        <WalletModalProvider
          className="wallet-modal-provider"
          featuredWallets={4}
        >
          <div className="wallet-provider-wrapper">
            {children}
          </div>
        </WalletModalProvider>
      </SolanaWalletProvider>
    </ConnectionProvider>
  )
}

export default WalletProvider
```