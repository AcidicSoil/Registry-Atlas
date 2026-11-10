import { describe, expect, it } from "vitest";
// @ts-ignore Standalone Node ESM script.
import { validateLocalSystemOneEndpoint } from "../../scripts/lib/systemone/endpoint.mjs";

describe("shared System One endpoint validation", () => {
  it("accepts either loopback hostname without changing the port", () => {
    expect(validateLocalSystemOneEndpoint("http://127.0.0.1:8080/v1/systemone")).toBe(
      "http://127.0.0.1:8080/v1/systemone",
    );
    expect(validateLocalSystemOneEndpoint("http://localhost:18080/v1/systemone")).toBe(
      "http://localhost:18080/v1/systemone",
    );
  });

  it("rejects invalid URLs with the existing error", () => {
    expect(() => validateLocalSystemOneEndpoint("not-a-url")).toThrow(
      "Invalid System One endpoint",
    );
  });

  it.each([
    "https://127.0.0.1:18080/v1/systemone",
    "http://other.example:18080/v1/systemone",
    "http://127.0.0.1:18080/other",
    "http://user:pass@127.0.0.1:18080/v1/systemone",
    "http://127.0.0.1:18080/v1/systemone#fragment",
  ])("rejects non-local or incompatible endpoints (%s)", (value) => {
    expect(() => validateLocalSystemOneEndpoint(value)).toThrow(
      "System One endpoint must be a local /v1/systemone URL",
    );
  });
});
