import type { MaskRule } from "../config/types.base.js";
import { readLoggingConfig } from "./config.js";

type CompiledMaskRule = {
  name: string;
  pattern: RegExp;
  replacement: string;
};

/**
 * Compile a MaskRule into a ready-to-use RegExp.
 * The `g` (global) flag is always added so every occurrence in a log line is replaced.
 * Invalid regex patterns are skipped with a console warning rather than throwing,
 * so a bad config entry never silences the logger entirely.
 */
function compileRule(rule: MaskRule): CompiledMaskRule | null {
  try {
    // Preserve any inline flags the caller included (e.g. (?i)) and add global.
    const pattern = new RegExp(rule.regex, "g");
    return { name: rule.name, pattern, replacement: rule.replacement };
  } catch {
    // Log to stderr directly — we cannot use the subsystem logger here (circular dep).
    process.stderr.write(
      `[openclaw/logging/mask] Invalid regex for mask rule "${rule.name}": ${rule.regex}\n`,
    );
    return null;
  }
}

/** Apply all compiled mask rules to a single string, replacing in order. */
export function applyMaskRules(text: string, rules: CompiledMaskRule[]): string {
  if (rules.length === 0) {
    return text;
  }
  let result = text;
  for (const rule of rules) {
    // Reset lastIndex before each call — reusing compiled RegExp objects with `g` flag
    // requires a reset between independent string replacements.
    rule.pattern.lastIndex = 0;
    result = result.replace(rule.pattern, rule.replacement);
  }
  return result;
}

// Module-level cache: recompile only when the raw config string changes.
let cachedRulesJson = "";
let cachedRules: CompiledMaskRule[] = [];

/**
 * Return the currently configured mask rules, compiled and cached.
 * Re-reads the config file on each call (cheap OS-level read) and recompiles
 * only when the mask config changes, matching the pattern used by getConsoleSettings().
 */
export function getMaskRules(): CompiledMaskRule[] {
  const config = readLoggingConfig();
  const rawJson = JSON.stringify(config?.mask ?? []);
  if (rawJson !== cachedRulesJson) {
    cachedRulesJson = rawJson;
    cachedRules = (config?.mask ?? [])
      .map(compileRule)
      .filter((r): r is CompiledMaskRule => r !== null);
  }
  return cachedRules;
}

/** Reset the mask rules cache — intended for use in tests only. */
export function resetMaskRulesCache(): void {
  cachedRulesJson = "";
  cachedRules = [];
}
