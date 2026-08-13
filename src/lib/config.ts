export const SUPPORTED_NETWORKS = ["stellar:testnet", "stellar:pubnet"] as const;
export type StellarNetwork = (typeof SUPPORTED_NETWORKS)[number];

export function clientConfig(env: Record<string, string | undefined> = process.env) {
  const network = (env.NEXT_PUBLIC_STELLAR_NETWORK ?? "stellar:testnet") as StellarNetwork;
  if (!SUPPORTED_NETWORKS.includes(network)) {
    throw new Error("NEXT_PUBLIC_STELLAR_NETWORK must be stellar:testnet or stellar:pubnet");
  }
  return {
    apiUrl: (env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000").replace(/\/$/, ""),
    network,
  };
}
