# Optimum-Labs
This is the public github repo for Optimum Labs Pty Ltd. We aim to demonstrate Optimum's integration of XRPL testnet including XRP transactions and NFT mintage for facilitating tourism spending on XRPL.

[Optimum Website](https://optimum-pay.com/)

[Demo Video](https://youtube.com/shorts/YzD3Q789dB4?feature=share)

[Pitch Deck](https://github.com/localhostinglabs/Optimum-Labs-/blob/main/Optimum%20Pitch%20deck.pdf)

# Overview
Optimum is an international payments project that aims to integrate blockchain finance into retail tourism spending. With Optimum, customers can eliminate the need for converting to multiple currencies for each travel, cut costs and top up cryptocurrency instantly. Merchants can access their funds immediately without having to rely on settlement clearing times, and this unlocks dormant capital that can be used productively. The logic is simple ; customers spend XRP or a fiat-pegged stablecoin, and the merchant receives the funds in their preferred cryptocurrency supported on XRPL. The merchant is free to off-ramp into local fiat currency using a local exchange or custodian as needed. 

NFTs are digital rewards; this may come in the form of stamps,tickets, landmarks, proof of visit or usable coupons. There is so much potential for creative usage of NFTs in a market that is as character-friendly as Japan. 

Our vision can be summed up as; to modernise the way we spend money on a retail level, and reward users in the form of digital ownership(NFTs). 

# XPRL
We chose XRPL due to its native advantages over other similar blockchains. Fast settlement time, low fees, regulatory alignment, native tokens such as RLUSD and XRP are viewed as strategic advantages for utilising them in cross-border payments.

**1. XRP:** XRP's Deep liquidity allows for pathfinding and autobridging to efficiently settle transactions between tokens. It can also work as the single medium of exchange that can be held or off-ramped easily.

**2. RLUSD:** USD-pegged stablecoin to provide reliable value for merchants to hold as a balance alternative to XRP. 

**3. NFTs:**  Digital rewards that engage users with our ecosystem while having capabilities to be used as a promotional and marketing tool for businesses.

# OptimumApp - XRPL Testnet Integration

React Native app with real XRP Ledger testnet integration for XRP transactions and NFTs.

## XRPL Integration Files

These files add real XRPL testnet functionality to the OptimumApp.

### New Files to Add

Place these files in your project:

```
OptimumApp/
├── polyfills.js                          ← NEW (project root)
├── index.js                              ← UPDATED (add polyfills import)
├── src/
│   ├── services/
│   │   ├── xrplClient.ts                ← NEW - Testnet WebSocket connection
│   │   ├── walletService.ts             ← NEW - Create/fund/restore wallets
│   │   ├── paymentService.ts            ← NEW - Send XRP transactions
│   │   ├── nftService.ts               ← NEW - Mint/burn/trade NFTs
│   │   └── index.ts                    ← NEW - Barrel export
│   ├── types/
│   │   ├── xrpl.ts                     ← NEW - TypeScript interfaces
│   │   └── index.ts                    ← NEW - Barrel export
│   └── utils/
│       └── walletStorage.ts            ← NEW - Encrypted seed storage
```

### Packages Required

```bash
yarn add xrpl fast-text-encoding react-native-get-random-values react-native-encrypted-storage
```

Then for iOS:
```bash
cd ios && pod install && cd ..
```

### How It Works

1. **Connect** - `xrplClient.ts` connects to `wss://s.altnet.rippletest.net:51233`
2. **Create Wallet** - `walletService.ts` uses `client.fundWallet()` → 100 XRP on testnet
3. **Send XRP** - `paymentService.ts` uses `client.autofill()` → `wallet.sign()` → `client.submitAndWait()`
4. **Mint NFTs** - `nftService.ts` uses `NFTokenMint` transaction type with JSON metadata in URI
5. **Secure Storage** - `walletStorage.ts` uses `react-native-encrypted-storage` for seed

### Screens Updated

The following screens were updated to use real XRPL calls instead of mock data:

- **BalanceScreen** - Real balance from `client.getBalances()`, wallet creation via faucet
- **SendScreen** - Real XRP transfers via `submitAndWait()`
- **NFTsScreen** - Real NFT minting with emoji picker, name, description stored as JSON metadata
- **HistoryScreen** - Real transaction history from `account_tx`

### NFT Metadata Format

NFTs store metadata as JSON in the URI field:
```json
{
  "name": "My NFT",
  "description": "Short description",
  "detailDescription": "Longer description",
  "image": "🎨"
}
```

The `parseNFTMetadata()` function in NFTsScreen decodes this back for display.

### Testnet Info

- **Network:** XRP Ledger Testnet
- **WebSocket:** `wss://s.altnet.rippletest.net:51233`
- **Explorer:** https://testnet.xrpl.org
- **Faucet:** Built into `client.fundWallet()` (~100 XRP per call)
- XRP on testnet has **no real value**

### Transaction Flow (matches XRPL docs)

```
1. Get Credentials  → client.fundWallet() or Wallet.fromSeed()
2. Connect          → new Client("wss://s.altnet.rippletest.net:51233")
3. Prepare          → client.autofill({ TransactionType: "Payment", ... })
4. Sign             → wallet.sign(prepared)
5. Submit           → client.submitAndWait(signed.tx_blob)
6. Check            → meta.TransactionResult === "tesSUCCESS"
```

# Entity

Optimum Labs Pty Ltd, Australia

[Jiwoong Kang](https://www.linkedin.com/in/jiwoongk07/)

