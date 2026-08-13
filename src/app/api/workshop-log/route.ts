import { NextResponse } from "next/server";
import {
  formatWorkshopLog,
  WORKSHOP_STEPS,
  type WorkshopDetails,
  type WorkshopStep,
} from "@/lib/workshop-logger";

const safeKeys = new Set(["api", "facilitator", "network", "price", "status", "wallet"]);

export async function POST(request: Request) {
  const body = await request.json() as {
    requestId?: unknown;
    step?: unknown;
    details?: unknown;
  };

  if (
    typeof body.requestId !== "string" ||
    !/^[a-zA-Z0-9-]{1,16}$/.test(body.requestId) ||
    typeof body.step !== "string" ||
    !WORKSHOP_STEPS.includes(body.step as WorkshopStep)
  ) {
    return NextResponse.json({ error: "Invalid workshop log event" }, { status: 400 });
  }

  const details: WorkshopDetails = {};
  if (body.details && typeof body.details === "object") {
    for (const [key, value] of Object.entries(body.details)) {
      if (safeKeys.has(key) && ["string", "number", "boolean"].includes(typeof value)) {
        details[key] = typeof value === "string" ? value.slice(0, 120) : value as number | boolean;
      }
    }
  }

  console.log(formatWorkshopLog(body.requestId, body.step as WorkshopStep, details));
  return new NextResponse(null, { status: 204 });
}
