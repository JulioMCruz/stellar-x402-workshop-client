const agentMode = process.argv.includes("--agent");
const network = process.env.NEXT_PUBLIC_STELLAR_NETWORK?.trim();
const apiUrl = process.env.NEXT_PUBLIC_API_URL?.trim();

if (network !== "stellar:testnet") {
  throw new Error("Workshop preflight requires NEXT_PUBLIC_STELLAR_NETWORK=stellar:testnet");
}
if (!apiUrl || !/^https?:\/\//.test(apiUrl)) {
  throw new Error("NEXT_PUBLIC_API_URL must be an HTTP(S) URL");
}

if (agentMode) {
  const secret = process.env.STELLAR_PRIVATE_KEY?.trim();
  if (!secret || /replace|your_/i.test(secret) || !/^S[A-Z2-7]{55}$/.test(secret)) {
    throw new Error("STELLAR_PRIVATE_KEY must be a valid disposable Testnet S-secret");
  }
}

console.log(`[preflight] Client configuration is ready for ${agentMode ? "agent" : "browser"} testing.`);
console.log(`[preflight] API target: ${apiUrl}`);
console.log("[preflight] No private key was printed.");
