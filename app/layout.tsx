export const metadata = {
  title: "booAIP - Crypto data API for AI agents",
  description: "Pay-per-call crypto/web3 data for AI agents. USDC via x402 on Base.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "ui-monospace, monospace", margin: 0, background: "#0b0d10", color: "#e6e6e6" }}>
        {children}
      </body>
    </html>
  );
}
