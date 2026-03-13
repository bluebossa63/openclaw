import { afterEach, describe, expect, it } from "vitest";
import { applyMaskRules, resetMaskRulesCache } from "./mask.js";

afterEach(() => {
  resetMaskRulesCache();
});

describe("applyMaskRules", () => {
  it("returns the original string unchanged when no rules are provided", () => {
    expect(applyMaskRules("hello world", [])).toBe("hello world");
  });

  it("masks a password pattern using capture groups", () => {
    const rules = [
      {
        name: "password",
        pattern: /(password\s*[:=]\s*)("[^"]+"|[\S]+)/gi,
        replacement: "$1<masked>",
      },
    ];
    expect(applyMaskRules('Auth with password: "s3cr3t"', rules)).toBe(
      'Auth with password: <masked>',
    );
  });

  it("replaces all occurrences in a single string (global flag)", () => {
    const rules = [
      { name: "token", pattern: /token=\S+/g, replacement: "token=<masked>" },
    ];
    expect(applyMaskRules("token=abc and token=xyz", rules)).toBe(
      "token=<masked> and token=<masked>",
    );
  });

  it("applies rules in order", () => {
    const rules = [
      { name: "first", pattern: /foo/g, replacement: "bar" },
      { name: "second", pattern: /bar/g, replacement: "baz" },
    ];
    expect(applyMaskRules("foo", rules)).toBe("baz");
  });

  it("masks Authorization Bearer tokens", () => {
    const rules = [
      {
        name: "token",
        pattern: /(Authorization:\s*Bearer\s+)(\S+)/gi,
        replacement: "$1<masked>",
      },
    ];
    expect(applyMaskRules("Authorization: Bearer eyJhbGciOiJIUzI1NiJ9.payload", rules)).toBe(
      "Authorization: Bearer <masked>",
    );
  });

  it("resets lastIndex between calls — no stale state on reused RegExp", () => {
    const rules = [
      { name: "secret", pattern: /secret=\S+/g, replacement: "secret=<masked>" },
    ];
    // Both calls must match — a stale lastIndex would skip the second.
    expect(applyMaskRules("secret=abc", rules)).toBe("secret=<masked>");
    expect(applyMaskRules("secret=def", rules)).toBe("secret=<masked>");
  });

  it("handles empty string without error", () => {
    const rules = [{ name: "x", pattern: /foo/g, replacement: "bar" }];
    expect(applyMaskRules("", rules)).toBe("");
  });

  it("leaves unmatched text untouched", () => {
    const rules = [
      { name: "password", pattern: /password=\S+/g, replacement: "password=<masked>" },
    ];
    expect(applyMaskRules("no sensitive data here", rules)).toBe("no sensitive data here");
  });
});
