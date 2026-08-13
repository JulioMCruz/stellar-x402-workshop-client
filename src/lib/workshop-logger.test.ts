import { describe, expect, it } from "vitest";
import { formatWorkshopLog } from "./workshop-logger";

describe("workshop logger", () => {
  it("formats a safe, readable client event", () => {
    const output = formatWorkshopLog("abc12345", "2 · HTTP 402 · PAYMENT REQUIRED RECEIVED", {
      status: 402,
      price: "$0.001 USDC",
    });

    expect(output).toBe(
      "[x402 client][abc12345] 2 · HTTP 402 · PAYMENT REQUIRED RECEIVED | status=402 | price=$0.001 USDC",
    );
    expect(output).not.toMatch(/signature|secret|api.?key/i);
  });
});
