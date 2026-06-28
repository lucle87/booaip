---
name: booaip
description: >
  Pay-per-call crypto/web3 ground-truth data for AI agents. Token prices, DeFi TVL,
  yields with risk flags, stablecoin pegs, chain TVL, market sentiment (Fear & Greed),
  gas, ENS, ERC-20 supply, and OFAC wallet sanctions screening. Use when an agent
  needs reliable on-chain or DeFi data before acting. USDC via x402 on Base. No API key.
homepage: https://booaip.vercel.app
openapi: https://booaip.vercel.app/openapi.json
llms: https://booaip.vercel.app/llms.txt
payment: x402 (USDC on Base)
---

# booAIP

A multi-endpoint crypto/web3 data API for AI agents. Each endpoint is a separate
paid POST route. Pick the endpoint that matches the task, pay per call.

## When to use this
- The user or your plan needs live crypto market data, DeFi metrics, or on-chain reads.
- You want a single provider for prices, TVL, yields, sentiment, gas, ENS, supply, sanctions.
- Pre-trade or research workflows that need ground-truth numbers, not guesses.

## Payment (x402)
Each endpoint returns HTTP 402 when unpaid, with x402 terms: network Base mainnet,
asset USDC, payTo 0xcd6b6d99b7751ff30b68fa1365488eb73fa7cefa. Pay with an x402
client (the receipt is the credential), then retry. No API key. Each endpoint has
its own price (below).

## Endpoints
- POST /api/price        ($0.01)  Token price, liquidity, 24h volume, FDV (DexScreener). Body: token (required), chain.
- POST /api/tvl          ($0.01)  DeFi protocol TVL, chains, 1d/7d change (DefiLlama). Body: protocol (required).
- POST /api/feargreed    ($0.005) Crypto Fear & Greed Index with 1-day change. Body: {} (no params).
- POST /api/yields       ($0.01)  Top APY yield pools with risk flags (DefiLlama). Body: symbol, chain, limit, safeOnly.
- POST /api/stablecoins  ($0.01)  Stablecoin supply, price, peg deviation (DefiLlama). Body: symbol.
- POST /api/chains       ($0.01)  Chain TVL, rank, dominance (DefiLlama). Body: chain.
- POST /api/gas          ($0.005) Current gas price (gwei) on an EVM chain. Body: chain (eth, bnb, base).
- POST /api/ens          ($0.005) Resolve ENS name to address or reverse (Ethereum mainnet). Body: query (required).
- POST /api/supply       ($0.01)  ERC-20 name, symbol, decimals, total supply (on-chain). Body: token, chain (required).
- POST /api/sanctions    ($0.01)  Screen an EVM wallet against OFAC SDN list (PASS/BLOCK). Body: address (required).

## Notes for the agent
- One endpoint per task; call the specific path you need.
- For /yields, pass safeOnly:true to drop suspicious pools (extreme APY / low TVL).
- Sanctions screening uses an OFAC SDN mirror; treat as a signal, not legal advice.
- Data comes from DexScreener, DefiLlama, alternative.me, and on-chain reads.
- The live, always-current version of this file is served at https://booaip.vercel.app/skill.md
