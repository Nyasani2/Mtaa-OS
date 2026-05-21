export function sanitizeInput(input: any) {

  if (!input) return null;

  return JSON.parse(
    JSON.stringify(input)
      .replace(/<script>/g, "")
      .replace(/SELECT \*/g, "")
  );
}
