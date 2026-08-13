# Stellar x402 Workshop Client

Next.js App Router client for the separate
`stellar-x402-workshop-server`. It demonstrates the same paid API in two ways:

- Browser + Freighter for a visual workshop flow.
- A headless Node.js script representing an autonomous agent.

## Solution architecture

This repository is the **buyer application**. Both client modes use the same
x402 v2 negotiation and call the separately deployed workshop resource server.
They differ only in who controls the signer.

```mermaid
flowchart LR
    subgraph Client["This repository · Next.js buyer"]
        UI["Workshop web interface"]
        Fetch["@x402/fetch"]
        Freighter["Freighter signer"]
        Script["Node.js agent client"]
        LocalSigner["Local Ed25519 signer"]
    end

    subgraph Server["Separate workshop server"]
        API["Paid App Router endpoint"]
        X402["x402 resource server"]
    end

    subgraph Payment["Payment infrastructure"]
        OZ["OpenZeppelin x402 facilitator"]
        Stellar["Stellar network"]
        Provider["Service provider · USDC"]
    end

    UI --> Fetch
    UI --> Freighter
    Freighter -->|"Sign auth entry"| Fetch
    Script --> Fetch
    Script --> LocalSigner
    LocalSigner -->|"Sign auth entry"| Fetch
    Fetch <-->|"HTTP 402 negotiation"| API
    API --> X402
    X402 -->|"verify / settle"| OZ
    OZ --> Stellar
    Stellar -->|"Transfer USDC"| Provider
    API -->|"Protected JSON"| Fetch
```

Browser code never receives a secret seed. The autonomous script reads its
Testnet seed from a local, gitignored environment file and signs inside the
Node.js process.

## Browser client process

```mermaid
sequenceDiagram
    autonumber
    actor User as Workshop participant
    participant UI as Next.js browser UI
    participant Wallet as Freighter
    participant API as Paid API server
    participant OZ as OpenZeppelin facilitator
    participant Stellar as Stellar network

    User->>UI: Connect wallet
    UI->>Wallet: requestAccess()
    Wallet-->>UI: Public Stellar address
    User->>UI: Request premium resource
    UI->>API: GET /api/premium-insight
    API-->>UI: 402 + PAYMENT-REQUIRED
    UI->>Wallet: Sign scoped USDC authorization
    Wallet-->>UI: Signed auth entry
    UI->>API: Retry + PAYMENT-SIGNATURE
    API->>OZ: Verify and settle
    OZ->>Stellar: Submit settlement
    Stellar-->>OZ: Transaction confirmed
    OZ-->>API: Settlement success
    API-->>UI: 200 + JSON + PAYMENT-RESPONSE
    UI-->>User: Display purchased resource
```

## Autonomous agent process

```mermaid
flowchart TD
    Start["Agent needs a paid capability"] --> Request["Request protected API resource"]
    Request --> Response{"HTTP response"}
    Response -->|"200"| Consume["Consume resource"]
    Response -->|"402"| Decode["Decode PAYMENT-REQUIRED"]
    Decode --> Policy{"Price, network and recipient allowed?"}
    Policy -->|"No"| Stop["Stop without signing or paying"]
    Policy -->|"Yes"| Sign["Sign scoped authorization locally"]
    Sign --> Retry["Retry with PAYMENT-SIGNATURE"]
    Retry --> Settlement{"Settlement result"}
    Settlement -->|"Failed"| Handle["Apply retry or failure policy"]
    Settlement -->|"Confirmed"| Receipt["Read PAYMENT-RESPONSE and transaction hash"]
    Receipt --> Consume
```

The workshop script performs the signing and retry automatically. A production
agent should add explicit spending limits, recipient allowlists, idempotency and
retry policies before authorizing payments.

## Requirements

- Node.js 22+
- The workshop server running locally or deployed
- Freighter browser extension for the visual flow
- Testnet USDC for real workshop payments

## Browser flow

```bash
cp .env.example .env.local
npm ci
npm run dev
```

Open http://localhost:3001. Configure Freighter for Testnet, connect, inspect
the 402 response, then authorize the `$0.001 USDC` payment.

## Autonomous agent flow

Add a dedicated Testnet account secret to `.env.local`:

```dotenv
STELLAR_PRIVATE_KEY=S_YOUR_TESTNET_SECRET
```

Then run:

```bash
npm run agent
```

Use a disposable workshop account with a minimal balance. Never commit its
secret and never put it in a `NEXT_PUBLIC_` variable.

## Mainnet

The client supports `stellar:pubnet`, but workshop tests use Testnet. For a real
deployment, the client and server must use the same network:

```dotenv
NEXT_PUBLIC_STELLAR_NETWORK=stellar:pubnet
NEXT_PUBLIC_API_URL=https://your-mainnet-server.example
```

Mainnet payments move real USDC. Review prices, recipients, and environment
variables before enabling them.

## Vercel

Import this repository separately, set `NEXT_PUBLIC_API_URL` to the deployed
server URL, and set `NEXT_PUBLIC_STELLAR_NETWORK`. The local agent script is not
part of the Vercel deployment.

## Validation

```bash
npm run check
```

## Official references

- https://developers.stellar.org/docs/build/agentic-payments/x402
- https://developers.stellar.org/docs/build/agentic-payments/x402/built-on-stellar
- https://docs.x402.org/core-concepts/http-402
