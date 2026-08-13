export type WorkshopDetails = Record<string, string | number | boolean>;

export const WORKSHOP_STEPS = [
  "1 · WALLET CONNECTION REQUESTED",
  "2 · WALLET CONNECTED",
  "1 · UNPAID API REQUEST SENT",
  "2 · HTTP 402 · PAYMENT REQUIRED RECEIVED",
  "1 · X402 PAYMENT FLOW STARTED",
  "2 · WALLET AUTHORIZATION REQUESTED",
  "3 · WALLET AUTHORIZATION APPROVED",
  "4 · PAYMENT RESPONSE RECEIVED",
  "CLIENT FLOW ERROR",
] as const;

export type WorkshopStep = (typeof WORKSHOP_STEPS)[number];

export function shortRequestId() {
  return crypto.randomUUID().slice(0, 8);
}

export function formatWorkshopLog(requestId: string, step: WorkshopStep, details: WorkshopDetails = {}) {
  const suffix = Object.entries(details)
    .map(([key, value]) => `${key}=${value}`)
    .join(" | ");

  return `[x402 client][${requestId}] ${step}${suffix ? ` | ${suffix}` : ""}`;
}

export async function workshopLog(requestId: string, step: WorkshopStep, details: WorkshopDetails = {}) {
  console.info(formatWorkshopLog(requestId, step, details));
  try {
    await fetch("/api/workshop-log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestId, step, details }),
    });
  } catch {
    // Logging must never interrupt the payment demo.
  }
}
