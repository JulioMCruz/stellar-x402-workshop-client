import { config as loadEnv } from "dotenv";
import { createEd25519Signer } from "@x402/stellar";
import { ExactStellarScheme } from "@x402/stellar/exact/client";
import { x402Client, wrapFetchWithPayment } from "@x402/fetch";
import { clientConfig } from "../src/lib/config";
import { formatJsonResponse } from "../src/lib/format-json";

loadEnv({ path: ".env.local", quiet: true });

async function main() {
  const { apiUrl, network } = clientConfig();
  const secret = process.env.STELLAR_PRIVATE_KEY;
  if (!secret) throw new Error("STELLAR_PRIVATE_KEY is required in .env.local or .env");

  const signer = createEd25519Signer(secret, network);
  const client = new x402Client().register(network, new ExactStellarScheme(signer));
  const paidFetch = wrapFetchWithPayment(fetch, client);

  console.log(`[x402 agent] 1 · AGENT WALLET LOADED | payer=${signer.address.slice(0, 6)}…${signer.address.slice(-4)} | network=${network}`);
  console.log(`[x402 agent] 2 · UNPAID REQUEST SENT | api=${apiUrl}`);
  const challenge = await fetch(`${apiUrl}/api/premium-insight`);
  if (challenge.status !== 402 || !challenge.headers.has("PAYMENT-REQUIRED")) {
    throw new Error(`Expected an x402 challenge but received HTTP ${challenge.status}`);
  }
  console.log("[x402 agent] 3 · HTTP 402 · PAYMENT REQUIRED RECEIVED | price=$0.001 USDC");
  console.log("[x402 agent] 4 · AUTONOMOUS PAYMENT AUTHORIZATION STARTED | signer=local agent wallet");
  const response = await paidFetch(`${apiUrl}/api/premium-insight`);
  const body = await response.text();
  const encodedSettlement = response.headers.get("PAYMENT-RESPONSE");
  const settlement = encodedSettlement
    ? JSON.parse(Buffer.from(encodedSettlement, "base64").toString("utf8")) as {
        success?: boolean;
        transaction?: string;
        network?: string;
      }
    : null;
  console.log(`[x402 agent] 5 · PAYMENT RESPONSE RECEIVED | status=${response.status} | settlement=${Boolean(settlement)}`);
  if (settlement) {
    console.log(`[x402 agent] 6 · PAYMENT SETTLED | success=${settlement.success === true} | network=${settlement.network ?? "not provided"}`);
    console.log(`[x402 agent] 7 · STELLAR TRANSACTION CONFIRMED | hash=${settlement.transaction ?? "not provided"}`);
  }
  console.log("[x402 agent] 8 · PROTECTED RESOURCE DELIVERED");
  console.log("\n---------------- PROTECTED RESOURCE JSON ----------------");
  console.log(formatJsonResponse(body));
  console.log("---------------- END PROTECTED RESOURCE ----------------\n");
  if (!response.ok) process.exitCode = 1;
}

main().catch((error) => {
  console.error(`[x402 agent] PAYMENT FLOW ERROR | error=${error instanceof Error ? error.message : error}`);
  process.exit(1);
});
