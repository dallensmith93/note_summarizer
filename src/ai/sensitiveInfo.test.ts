import { describe, expect, it } from "vitest";
import { redactSensitiveInfo } from "./sensitiveInfo";

describe("redactSensitiveInfo", () => {
  it("detects and redacts common secrets", () => {
    const result = redactSensitiveInfo(
      "password=supersecret api_key=abc123456789 Bearer tokenvalue123456789"
    );

    expect(result.detected).toBe(true);
    expect(result.sanitizedText).not.toContain("supersecret");
    expect(result.sanitizedText).not.toContain("abc123456789");
    expect(result.sanitizedText).not.toContain("tokenvalue123456789");
    expect(result.warning).toContain("Sensitive information");
  });

  it("does not flag ordinary support notes", () => {
    const result = redactSensitiveInfo("Customer reported timeout after VPN reconnect.");

    expect(result.detected).toBe(false);
    expect(result.sanitizedText).toContain("VPN reconnect");
  });
});
