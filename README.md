# booAIP - Crypto data API for AI agents

Mot web, nhieu endpoint, tra tien per-call qua x402 (USDC tren Base).
Them endpoint moi = them 1 route + 1 muc trong lib/catalog.ts. openapi/llms/trang chu tu cap nhat.

## 10 endpoint
HTTP thuan (khong can key):
- POST /api/price        Token price/liquidity (DexScreener)            $0.01
- POST /api/tvl          DeFi protocol TVL (DefiLlama)                  $0.01
- POST /api/feargreed    Fear & Greed Index (alternative.me)           $0.005
- POST /api/yields       Yield pools + risk flags (DefiLlama)          $0.01
- POST /api/stablecoins  Stablecoin supply/peg (DefiLlama)             $0.01
- POST /api/chains       Chain TVL/rank (DefiLlama)                    $0.01
Doc on-chain (nen co RPC free de on dinh):
- POST /api/gas          Gas price gwei (viem)                         $0.005
- POST /api/ens          ENS resolve (viem, mainnet)                   $0.005
- POST /api/supply       ERC-20 supply info (viem)                     $0.01
- POST /api/sanctions    OFAC SDN wallet screen (0xB10C mirror)        $0.01

## Luu y RPC
Cac endpoint gas/ens/supply doc on-chain. RPC public chay duoc nhung hay bi gioi han.
Nen them RPC free vao .env cho on dinh: ETH_RPC_URL, BASE_RPC_URL, BNB_RPC_URL
(lay free o Alchemy/Ankr/PublicNode).

## Chay
1. npm install
2. copy .env.example .env (dien PAY_TO, CDP keys, PREVIEW_KEY=test123)
3. npm run dev

## Test preview (chay that, bo qua tra tien)
$r = Invoke-RestMethod -Uri "http://localhost:3000/api/feargreed?preview=test123" -Method Post -ContentType "application/json" -Body '{}'
$r | ConvertTo-Json -Depth 6

## Them endpoint moi (vd /api/foo)
1. lib/endpoints/foo.ts  (logic, chi lo data)
2. app/api/foo/route.ts  (dung makePaidPost("foo", handler, {...}))
3. lib/x402config.ts: them DEFAULT_PRICES.foo
4. lib/catalog.ts: them 1 muc
=> openapi.json, llms.txt, trang chu tu cap nhat.
