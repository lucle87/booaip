// Danh muc endpoint. openapi.json, llms.txt, trang chu tu sinh tu day.
// Moi muc viet theo huong AGENT-FIRST (loi khuyen Lucas/Merit): ten ro, mo ta
// "khi nao agent nen dung + hop workflow nao", input co vi du, output mo ta field chinh,
// va agentGuidance (whenToUse / input / output / payment) de agent quyet dinh nhanh.
import { priceUsdFor } from "@/lib/x402config";

export type AgentGuidance = {
  whenToUse: string;
  input: string;
  output: string;
  paymentFlow: string;
};

export type CatalogItem = {
  key: string;
  path: string;
  title: string;
  description: string;
  inputSchema: any;
  outputSchema: any;
  agentGuidance: AgentGuidance;
};

const PAYFLOW =
  "First call returns HTTP 402 with an x402 payment requirement (USDC on Base). Pay with an x402 client, then retry the same request to get 200.";

export const CATALOG: CatalogItem[] = [
  {
    key: "price",
    path: "/api/price",
    title: "Token Price & Liquidity",
    description:
      "Live price, USD liquidity, 24h volume, FDV and market cap for any token, sourced from the deepest DEX pair on DexScreener. Use this when an agent needs the current market value or tradability of a specific token contract before quoting, swapping, or reporting. Fits naturally before a swap, in a portfolio readout, or as the market leg of a token research workflow.",
    agentGuidance: {
      whenToUse:
        "Use when you have a token contract address and need its current price, liquidity, and volume. Prefer /api/snapshot if you also need supply and safety in the same call.",
      input: "POST JSON: { token (contract address), chain? (eth|bnb|base, auto-detected if omitted) }.",
      output: "priceUsd, priceChange 5m/1h/6h/24h, liquidityUsd, volume 1h/24h, txns24h (buys/sells), pairAgeHours, fdvUsd, marketCapUsd, the DEX and pair used. found=false if no liquid pair exists.",
      paymentFlow: PAYFLOW,
    },
    inputSchema: {
      type: "object",
      properties: {
        token: { type: "string", description: "Token contract address (0x...).", examples: ["0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82"] },
        chain: { type: "string", description: "Optional chain hint: eth, bnb, base. Auto-detected if omitted.", examples: ["bnb"] },
      },
      required: ["token"],
    },
    outputSchema: {
      type: "object",
      properties: {
        found: { type: "boolean", description: "Whether a liquid DEX pair was found." },
        symbol: { type: "string", description: "Token symbol." },
        priceUsd: { type: "number", description: "Current USD price." },
        liquidityUsd: { type: "number", description: "USD liquidity in the deepest pair." },
        volume24hUsd: { type: "number", description: "24h trading volume in USD." },
        priceChange1hPct: { type: "number", description: "1h price change, percent." },
        priceChange6hPct: { type: "number", description: "6h price change, percent." },
        txns24h: { type: "object", description: "24h buy/sell transaction counts." },
        pairAgeHours: { type: "number", description: "Age of the trading pair in hours (newness signal)." },
        fdvUsd: { type: "number", description: "Fully diluted valuation in USD." },
        marketCapUsd: { type: "number", description: "Market cap in USD." },
      },
    },
  },
  {
    key: "tvl",
    path: "/api/tvl",
    title: "DeFi Protocol TVL",
    description:
      "Total value locked for a DeFi protocol, the chains it spans, and 1-day / 7-day change, from DefiLlama. Use when an agent needs to size or compare a protocol's footprint, or detect TVL inflows/outflows, inside a DeFi research or risk workflow.",
    agentGuidance: {
      whenToUse:
        "Use when you have a protocol's DefiLlama slug and need its TVL and recent change. For chain-level TVL use /api/chains instead.",
      input: "POST JSON: { protocol } where protocol is the DefiLlama slug (e.g. 'aave', 'uniswap', 'lido').",
      output: "tvlUsd, list of chains, change1dPct, change7dPct. found=false for an unknown slug.",
      paymentFlow: PAYFLOW,
    },
    inputSchema: {
      type: "object",
      properties: {
        protocol: { type: "string", description: "DefiLlama protocol slug (lowercase).", examples: ["aave", "uniswap", "lido"] },
      },
      required: ["protocol"],
    },
    outputSchema: {
      type: "object",
      properties: {
        found: { type: "boolean", description: "Whether the protocol slug was found." },
        protocol: { type: "string", description: "Protocol name." },
        tvlUsd: { type: "number", description: "Total value locked in USD." },
        chains: { type: "array", items: { type: "string" }, description: "Chains the protocol is deployed on." },
        change1dPct: { type: "number", description: "1-day TVL change, percent." },
        change7dPct: { type: "number", description: "7-day TVL change, percent." },
      },
    },
  },
  {
    key: "feargreed",
    path: "/api/feargreed",
    title: "Crypto Fear & Greed Index",
    description:
      "The current crypto Fear & Greed Index (0 = extreme fear, 100 = extreme greed) with its 1-day change, from alternative.me. Use when an agent needs a quick market-wide sentiment read to frame a recommendation or condition a strategy. No parameters.",
    agentGuidance: {
      whenToUse:
        "Use for a fast market-wide sentiment gauge. Takes no input. Pair with /api/derivatives for per-coin positioning sentiment.",
      input: "POST JSON: {} (no parameters).",
      output: "value (0-100), classification (e.g. 'Extreme Fear'), previousValue, change1d.",
      paymentFlow: PAYFLOW,
    },
    inputSchema: { type: "object", properties: {}, required: [] },
    outputSchema: {
      type: "object",
      properties: {
        value: { type: "number", description: "Index value 0-100." },
        classification: { type: "string", description: "Text label, e.g. 'Extreme Fear', 'Greed'." },
        change1d: { type: "number", description: "Change vs. previous day." },
      },
    },
  },
  {
    key: "yields",
    path: "/api/yields",
    title: "DeFi Yield Finder",
    description:
      "Top APY yield pools filtered by token symbol and/or chain, from DefiLlama, optionally restricted to lower-risk pools. Use when an agent needs to find where an asset can earn yield, inside a treasury, allocation, or 'where to park stablecoins' workflow.",
    agentGuidance: {
      whenToUse:
        "Use to find yield opportunities for a token (e.g. best USDC APY) optionally on a specific chain. Set safeOnly=true to bias toward audited/stable pools.",
      input: "POST JSON: { symbol? (e.g. USDC), chain? (e.g. base), limit? (1-20, default 5), safeOnly? (boolean) }.",
      output: "pools[] with project, chain, symbol, apy, tvlUsd, sorted by APY.",
      paymentFlow: PAYFLOW,
    },
    inputSchema: {
      type: "object",
      properties: {
        symbol: { type: "string", description: "Token symbol to find yields for.", examples: ["USDC", "ETH"] },
        chain: { type: "string", description: "Optional chain filter.", examples: ["base", "arbitrum"] },
        limit: { type: "number", description: "Max pools to return, 1-20 (default 5)." },
        safeOnly: { type: "boolean", description: "If true, bias toward lower-risk pools." },
      },
      required: [],
    },
    outputSchema: {
      type: "object",
      properties: {
        count: { type: "number", description: "Number of pools returned." },
        pools: { type: "array", items: { type: "object" }, description: "Pools with project, chain, symbol, apy, tvlUsd." },
      },
    },
  },
  {
    key: "stablecoins",
    path: "/api/stablecoins",
    title: "Stablecoin Peg Monitor",
    description:
      "Circulating supply, current price and peg deviation for a stablecoin (or the top 10), from DefiLlama. Use when an agent needs to verify a stablecoin is holding its peg or size its market, inside a risk-check or treasury workflow before holding/accepting it.",
    agentGuidance: {
      whenToUse:
        "Use to check a stablecoin's peg health and supply before treating it as safe. Omit symbol to get the top 10 by market cap.",
      input: "POST JSON: { symbol? (e.g. USDT). Omit for top 10 }.",
      output: "circulatingUsd, price, pegDeviationPct (distance from $1).",
      paymentFlow: PAYFLOW,
    },
    inputSchema: {
      type: "object",
      properties: { symbol: { type: "string", description: "Stablecoin symbol. Omit for top 10.", examples: ["USDT", "DAI"] } },
      required: [],
    },
    outputSchema: {
      type: "object",
      properties: {
        found: { type: "boolean", description: "Whether the symbol was found." },
        symbol: { type: "string", description: "Stablecoin symbol." },
        circulatingUsd: { type: "number", description: "Circulating supply in USD." },
        pegDeviationPct: { type: "number", description: "Deviation from $1.00 peg, percent." },
      },
    },
  },
  {
    key: "chains",
    path: "/api/chains",
    title: "Chain TVL Overview",
    description:
      "Total value locked, rank and dominance for a blockchain (or the top 10), from DefiLlama. Use when an agent needs to compare chains by DeFi size or gauge where activity concentrates, inside a market-structure or chain-selection workflow.",
    agentGuidance: {
      whenToUse:
        "Use to compare blockchains by DeFi TVL and dominance. Omit chain for the top 10 ranking.",
      input: "POST JSON: { chain? (e.g. base). Omit for top 10 }.",
      output: "tvlUsd, rank, dominancePct.",
      paymentFlow: PAYFLOW,
    },
    inputSchema: {
      type: "object",
      properties: { chain: { type: "string", description: "Chain name. Omit for top 10.", examples: ["base", "ethereum"] } },
      required: [],
    },
    outputSchema: {
      type: "object",
      properties: {
        found: { type: "boolean", description: "Whether the chain was found." },
        chain: { type: "string", description: "Chain name." },
        tvlUsd: { type: "number", description: "Chain TVL in USD." },
        rank: { type: "number", description: "Rank by TVL." },
        dominancePct: { type: "number", description: "Share of total DeFi TVL, percent." },
      },
    },
  },
  {
    key: "gas",
    path: "/api/gas",
    title: "EVM Gas Oracle",
    description:
      "Current gas price in gwei for an EVM chain, read directly on-chain. Use when an agent needs to estimate transaction cost or decide timing before broadcasting a transaction, inside an execution workflow.",
    agentGuidance: {
      whenToUse:
        "Use to estimate transaction cost or pick a low-gas moment before sending a tx on eth, bnb, or base.",
      input: "POST JSON: { chain (eth|bnb|base, default base) }.",
      output: "gasPriceGwei, maxFeePerGasGwei.",
      paymentFlow: PAYFLOW,
    },
    inputSchema: {
      type: "object",
      properties: { chain: { type: "string", description: "eth, bnb, or base.", examples: ["base", "eth"] } },
      required: [],
    },
    outputSchema: {
      type: "object",
      properties: {
        chain: { type: "string", description: "Chain queried." },
        gasPriceGwei: { type: "number", description: "Current gas price in gwei." },
        maxFeePerGasGwei: { type: "number", description: "Suggested max fee per gas in gwei." },
      },
    },
  },
  {
    key: "ens",
    path: "/api/ens",
    title: "ENS Name Resolver",
    description:
      "Resolve an ENS name to its address, or reverse-resolve an address to its primary ENS name, on Ethereum mainnet. Use when an agent needs to turn a human-readable name into an address (or vice versa) before paying, labeling, or displaying a counterparty.",
    agentGuidance: {
      whenToUse:
        "Use to convert vitalik.eth <-> 0x address. Accepts either direction in one 'query' field.",
      input: "POST JSON: { query (ENS name like 'name.eth' OR an address 0x...) }.",
      output: "name, address, found.",
      paymentFlow: PAYFLOW,
    },
    inputSchema: {
      type: "object",
      properties: { query: { type: "string", description: "ENS name (xxx.eth) or address (0x...).", examples: ["vitalik.eth"] } },
      required: ["query"],
    },
    outputSchema: {
      type: "object",
      properties: {
        found: { type: "boolean", description: "Whether resolution succeeded." },
        name: { type: "string", description: "ENS name." },
        address: { type: "string", description: "Resolved address." },
      },
    },
  },
  {
    key: "supply",
    path: "/api/supply",
    title: "Token Supply Info",
    description:
      "Name, symbol, decimals and total supply for an ERC-20 token, read directly on-chain. Use when an agent needs authoritative token metadata and supply (not market-derived) before calculating amounts, market cap, or verifying a token.",
    agentGuidance: {
      whenToUse:
        "Use for on-chain token metadata and exact total supply. For price/liquidity use /api/price; for both plus safety use /api/snapshot.",
      input: "POST JSON: { token (contract), chain (eth|bnb|base) }.",
      output: "name, symbol, decimals, totalSupply (raw string).",
      paymentFlow: PAYFLOW,
    },
    inputSchema: {
      type: "object",
      properties: {
        token: { type: "string", description: "Token contract address (0x...).", examples: ["0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82"] },
        chain: { type: "string", description: "eth, bnb, base.", examples: ["bnb"] },
      },
      required: ["token", "chain"],
    },
    outputSchema: {
      type: "object",
      properties: {
        found: { type: "boolean", description: "Whether the token was read." },
        symbol: { type: "string", description: "Token symbol." },
        decimals: { type: "number", description: "Token decimals." },
        totalSupply: { type: "string", description: "Total supply (raw integer string)." },
      },
    },
  },
  {
    key: "sanctions",
    path: "/api/sanctions",
    title: "Wallet OFAC Sanctions Screen",
    description:
      "Screen an EVM wallet against the OFAC SDN crypto address list and return a clear PASS or BLOCK. Use when an agent must run a compliance check before sending funds to, or accepting funds from, a counterparty address. A pure compliance gate.",
    agentGuidance: {
      whenToUse:
        "Use as a compliance gate before transacting with an address. For a fuller risk read (activity, whale, contract) use /api/wallet.",
      input: "POST JSON: { address (0x...) }.",
      output: "verdict (PASS|BLOCK), sanctioned (boolean).",
      paymentFlow: PAYFLOW,
    },
    inputSchema: {
      type: "object",
      properties: { address: { type: "string", description: "EVM wallet address (0x...).", examples: ["0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"] } },
      required: ["address"],
    },
    outputSchema: {
      type: "object",
      properties: {
        address: { type: "string", description: "Address screened." },
        verdict: { type: "string", enum: ["PASS", "BLOCK"], description: "PASS = not sanctioned, BLOCK = on OFAC SDN list." },
        sanctioned: { type: "boolean", description: "True if on the OFAC list." },
      },
    },
  },
  {
    key: "snapshot",
    path: "/api/snapshot",
    title: "Token Snapshot (price + supply + safety)",
    description:
      "One call that combines market data (price, liquidity, volume), on-chain supply, and GoPlus safety flags into a single OK / CAUTION / DANGER read. Use when an agent needs a complete go/no-go picture of a token without chaining three separate calls. The fastest token due-diligence primitive; ideal as the first step of any 'should I touch this token' workflow.",
    agentGuidance: {
      whenToUse:
        "Use as the default first call when evaluating an unknown token. Replaces chaining /api/price + /api/supply + a safety check.",
      input: "POST JSON: { token (contract), chain (eth|bnb|base) }.",
      output: "safetyVerdict (OK|CAUTION|DANGER|UNKNOWN), riskFlags[], plus market{}, supply{}, safety{} objects.",
      paymentFlow: PAYFLOW,
    },
    inputSchema: {
      type: "object",
      properties: {
        token: { type: "string", description: "Token contract address (0x...).", examples: ["0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82"] },
        chain: { type: "string", description: "eth, bnb, base.", examples: ["bnb"] },
      },
      required: ["token", "chain"],
    },
    outputSchema: {
      type: "object",
      properties: {
        safetyVerdict: { type: "string", enum: ["OK", "CAUTION", "DANGER", "UNKNOWN"], description: "Quick go/no-go read." },
        riskFlags: { type: "array", items: { type: "string" }, description: "Human-readable risk reasons." },
        market: { type: "object", description: "Price, liquidity, volume." },
        supply: { type: "object", description: "On-chain supply and metadata." },
        safety: { type: "object", description: "GoPlus safety detail." },
      },
    },
  },
  {
    key: "wallet",
    path: "/api/wallet",
    title: "Wallet Risk Profile",
    description:
      "A snapshot risk profile of an EVM wallet from direct RPC reads plus OFAC screening: native balance, transaction count and activity level, contract-vs-EOA status, sanctions verdict, whale flag, and a heuristic 0-100 wallet score. Use when an agent needs to assess a counterparty wallet before transacting. Snapshot only: wallet age and DeFi/bridge/NFT history require an indexer and are not included.",
    agentGuidance: {
      whenToUse:
        "Use to assess a counterparty wallet (is it active, a whale, a contract, sanctioned). For a pure compliance pass/block use /api/sanctions.",
      input: "POST JSON: { wallet (0x...), chain (eth|bnb|base) }.",
      output: "walletScore (0-100), isWhale, sanctioned, txCount, activityLevel, flags[].",
      paymentFlow: PAYFLOW,
    },
    inputSchema: {
      type: "object",
      properties: {
        wallet: { type: "string", description: "EVM wallet address (0x...).", examples: ["0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"] },
        chain: { type: "string", description: "eth, bnb, base.", examples: ["eth"] },
      },
      required: ["wallet", "chain"],
    },
    outputSchema: {
      type: "object",
      properties: {
        walletScore: { type: "number", description: "Heuristic risk/quality score 0-100." },
        isWhale: { type: "boolean", description: "Large native balance." },
        sanctioned: { type: "boolean", description: "On OFAC list." },
        txCount: { type: "number", description: "Transaction count (nonce)." },
        activityLevel: { type: "string", description: "e.g. dormant, low, active, high." },
        flags: { type: "array", items: { type: "string" }, description: "Risk/quality flags." },
      },
    },
  },
  {
    key: "derivatives",
    path: "/api/derivatives",
    title: "Multi-Exchange Perp Funding & Open Interest",
    description:
      "Perpetual funding rate and open interest for a coin across Binance, Bybit, OKX and Hyperliquid in a single call, with funding normalized to annualized APR for fair cross-venue comparison, the funding spread between venues (a funding-arbitrage / divergence signal), total open interest in USD, and a funding-based sentiment read (crowded long / short). Use when an agent needs derivatives positioning to gauge market sentiment, detect crowding, or spot a cross-venue funding edge before taking or sizing a position. Public exchange data; signals are heuristic, not financial advice.",
    agentGuidance: {
      whenToUse:
        "Use to read perp positioning for a coin: is funding crowded long/short, and is there a fundable spread between exchanges. Pair with /api/feargreed for market-wide sentiment.",
      input: "POST JSON: { symbol (e.g. BTC, ETH, SOL) }.",
      output: "venues[] (per-exchange funding APR, OI, 24h volume, mark price, basis %, next funding time), aggregate (avg funding APR, total OI, total 24h volume, sentiment), retailPositioning (Binance long/short account ratio), fundingSpread (high vs low venue), signals[].",
      paymentFlow: PAYFLOW,
    },
    inputSchema: {
      type: "object",
      properties: {
        symbol: { type: "string", description: "Coin symbol (base asset, no USDT suffix).", examples: ["BTC", "ETH", "SOL"] },
      },
      required: ["symbol"],
    },
    outputSchema: {
      type: "object",
      properties: {
        venues: { type: "array", description: "Per-exchange funding APR, interval, and open interest in USD." },
        aggregate: { type: "object", description: "venuesReporting, avgFundingAprPct, totalOpenInterestUsd, sentiment." },
        retailPositioning: { type: "object", description: "Binance global long/short account ratio: longShortRatio, longAccountPct, shortAccountPct." },
        fundingSpread: { type: "object", description: "Highest vs lowest funding venue and the spread in APR percent." },
        signals: { type: "array", items: { type: "string" }, description: "Heuristic flags (funding crowding, large spread, retail long/short, funding-vs-retail divergence)." },
      },
    },
  },
  {
    key: "signal",
    path: "/api/signal",
    title: "Trade Signal & Analysis",
    description:
      "Decision-support trade signal for a coin: a transparent composite of technicals (RSI, SMA20/50, trend, volatility from 1h klines), derivatives positioning (funding, OI, long/short), and market sentiment (fear & greed). Returns a bias (bullish/bearish/neutral lean), a composite score, and a factor-by-factor breakdown with reasoning so an agent can verify the logic, plus risk flags. Heuristic and transparent, NOT financial advice and NOT a prediction. Body: { symbol } (e.g. BTC, ETH, SOL).",
    agentGuidance: {
      whenToUse:
        "Use when an agent wants a synthesized read on a coin to inform its OWN trade decision: combines momentum, positioning, and sentiment into one call. The agent decides and executes itself; this endpoint does not place orders. Pull /api/derivatives or /api/price directly if you only need raw data.",
      input: "POST JSON: { symbol } (e.g. BTC, ETH, SOL).",
      output:
        "signal { bias (bullish_lean|bearish_lean|neutral), score (-100..100), factors[] each with reading/contribution/why }, technicals, derivatives, marketSentiment, riskFlags[], dataUsed[].",
      paymentFlow:
        "First call returns HTTP 402 with an x402 payment requirement (USDC on Base). Pay with an x402 client, then retry the same request to get 200.",
    },
    inputSchema: {
      type: "object",
      properties: { symbol: { type: "string", description: "Coin symbol, e.g. BTC, ETH, SOL.", examples: ["BTC", "ETH", "SOL"] } },
      required: ["symbol"],
    },
    outputSchema: {
      type: "object",
      properties: {
        signal: { type: "object", description: "bias, score, and transparent factor breakdown." },
        technicals: { type: "object", description: "RSI, SMA20/50, trend, volatility, 24h/7d change." },
        derivatives: { type: "object", description: "Condensed funding/OI/long-short read." },
        marketSentiment: { type: "object", description: "Fear & greed." },
        riskFlags: { type: "array", items: { type: "string" }, description: "Risk warnings (volatility, extreme funding/RSI)." },
      },
    },
  },
];

export function priceOf(key: string): string {
  return priceUsdFor(key);
}