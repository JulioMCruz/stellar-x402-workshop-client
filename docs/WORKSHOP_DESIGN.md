# Workshop design

The client has two learning modes. The browser path uses Freighter so beginners
can see connection, 402 discovery, authorization, and successful delivery. The
headless script uses the same x402 client stack with a local Ed25519 signer to
show how an AI agent pays without user interface code.

Both modes use x402 v2 and the `exact` Stellar scheme. Testnet is the default;
Mainnet requires an explicit network switch. Browser code never receives a
secret seed, while the agent seed is read only by the local Node.js process.
