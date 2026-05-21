/**
 * MTAA Runtime Enforcer
 */

import { enforceImport } from "./architecture-guard";

export function runtimeEnforce() {
  console.log("🛡 Runtime Enforcement Active");

  try {
    enforceImport(
      "/domains/civic/services/triage.ts",
      "/domains/civic/utils/priority.ts"
    );

    console.log("✅ Runtime Architecture Valid");
  } catch (err) {
    console.error("🚨 MTAA RUNTIME BLOCKED");
    console.error(err);

    throw err;
  }
}
