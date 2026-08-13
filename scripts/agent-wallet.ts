import { config as loadEnv } from "dotenv";
import { createEd25519Signer } from "@x402/stellar";
import { clientConfig } from "../src/lib/config";

loadEnv({ path: ".env.local", quiet: true });

const NETWORKS = {
  "stellar:testnet": {
    horizon: "https://horizon-testnet.stellar.org",
    usdcIssuer: "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5",
  },
  "stellar:pubnet": {
    horizon: "https://horizon.stellar.org",
    usdcIssuer: "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN",
  },
} as const;

async function main() {
  const { network } = clientConfig();
  const secret = process.env.STELLAR_PRIVATE_KEY;
  if (!secret) throw new Error("STELLAR_PRIVATE_KEY is required in .env.local");

  const signer = createEd25519Signer(secret, network);
  const networkConfig = NETWORKS[network];
  const response = await fetch(`${networkConfig.horizon}/accounts/${signer.address}`);
  if (!response.ok) {
    throw new Error(`Agent account was not found on ${network}. Fund the public address before continuing.`);
  }

  const account = await response.json() as {
    balances: Array<{
      asset_type: string;
      asset_code?: string;
      asset_issuer?: string;
      balance: string;
      is_authorized?: boolean;
    }>;
  };
  const usdc = account.balances.find(
    (balance) => balance.asset_code === "USDC" && balance.asset_issuer === networkConfig.usdcIssuer,
  );
  const feeBalance = account.balances.find((balance) => balance.asset_type === "native");

  console.log(`
╔══════════════════════════════════════════════════════════════╗
║             STELLAR x402 WORKSHOP · AGENT WALLET            ║
╚══════════════════════════════════════════════════════════════╝
Public address  ${signer.address}
Network         ${network}
USDC trustline  ${usdc?.is_authorized ? "READY" : usdc ? "NOT AUTHORIZED" : "MISSING"}
USDC balance    ${usdc?.balance ?? "0.0000000"}
Fee balance     ${feeBalance?.balance ?? "0.0000000"}

The private key was loaded locally and was not printed.
`);

  if (!usdc?.is_authorized) {
    console.log("NEXT ACTION: Create and authorize the official USDC trustline before running agent:pay.");
  } else if (Number(usdc.balance) < 0.001) {
    console.log("NEXT ACTION: Fund this public address with Testnet USDC before running agent:pay.");
  } else {
    console.log("STATUS: Agent wallet is ready for an autonomous x402 payment.");
  }
}

main().catch((error) => {
  console.error(`[x402 agent wallet] ERROR | ${error instanceof Error ? error.message : error}`);
  process.exit(1);
});
