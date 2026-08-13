import { describe, expect, it } from "vitest";
import { formatJsonResponse } from "./format-json";

describe("agent response formatter", () => {
  it("pretty prints JSON for a screen-shared terminal", () => {
    expect(formatJsonResponse('{"paid":true,"insight":"Hello"}')).toBe(`{
  "paid": true,
  "insight": "Hello"
}`);
  });

  it("keeps plain text and labels an empty body", () => {
    expect(formatJsonResponse("plain response")).toBe("plain response");
    expect(formatJsonResponse("  ")).toBe("(empty response body)");
  });
});
