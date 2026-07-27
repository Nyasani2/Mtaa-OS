export function safeExecute(fn: (...args: any[]) => any) {

  try {
    return fn();
  } catch (err) {

    console.error("HOOKUP_ERROR:", err);

    return {
      success: false,
      error: "SYSTEM_STABLE_RECOVERY",
    };
  }
}
