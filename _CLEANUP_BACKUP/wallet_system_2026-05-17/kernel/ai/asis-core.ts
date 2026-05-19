export class ASISCore {
  classify(prompt: string) {
    if (prompt.includes("finance")) {
      return "finance";
    }

    if (prompt.includes("transport")) {
      return "transport";
    }

    if (prompt.includes("market")) {
      return "market";
    }

    return "general";
  }

  capabilities(prompt: string) {
    const perms: string[] = [];

    if (prompt.includes("finance")) {
      perms.push("finance:write");
    }

    if (prompt.includes("location")) {
      perms.push("location:read");
    }

    return perms;
  }

  private capitalize(s: string) {
    return s.charAt(0).toUpperCase() + s.slice(1);
  }
}
