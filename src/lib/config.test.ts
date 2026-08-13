import { describe, expect, it } from "vitest";
import { clientConfig } from "./config";

describe("client configuration", () => {
  it("defaults to the safe workshop network", () => {
    expect(clientConfig({})).toEqual({ apiUrl: "http://localhost:3000", network: "stellar:testnet" });
  });

  it("supports mainnet explicitly", () => {
    expect(clientConfig({ NEXT_PUBLIC_STELLAR_NETWORK: "stellar:pubnet", NEXT_PUBLIC_API_URL: "https://api.example/" }))
      .toEqual({ apiUrl: "https://api.example", network: "stellar:pubnet" });
  });

  it("rejects accidental network names", () => {
    expect(() => clientConfig({ NEXT_PUBLIC_STELLAR_NETWORK: "mainnet" })).toThrow();
  });
});
