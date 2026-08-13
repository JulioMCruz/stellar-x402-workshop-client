import "dotenv/config";
import { createEd25519Signer } from "@x402/stellar";
import { ExactStellarScheme } from "@x402/stellar/exact/client";
import { x402Client, wrapFetchWithPayment } from "@x402/fetch";
import { clientConfig } from "../src/lib/config";

async function main() {
  const { apiUrl, network } = clientConfig();
  const secret = process.env.STELLAR_PRIVATE_KEY;
  if (!secret) throw new Error("STELLAR_PRIVATE_KEY is required in .env.local or .env");

  const signer = createEd25519Signer(secret, network);
  const client = new x402Client().register(network, new ExactStellarScheme(signer));
  const paidFetch = wrapFetchWithPayment(fetch, client);

  console.log(`[agent] payer=${signer.address} network=${network}`);
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
  console.log(`[agent] status=${response.status}`);
  console.log(`[agent] payment-response=${Boolean(settlement)}`);
  if (settlement) {
    console.log(`[agent] settlement-success=${settlement.success === true}`);
    console.log(`[agent] transaction=${settlement.transaction ?? "not provided"}`);
    console.log(`[agent] settlement-network=${settlement.network ?? "not provided"}`);
  }
  console.log(body);
  if (!response.ok) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
