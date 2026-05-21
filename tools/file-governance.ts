export const forbiddenPatterns = [
  "dump",
  "error.txt",
  "debug.txt",
  "tsc_errors",
  "mtaa_structure",
  "all_files"
];

export function isCleanFile(file: string) {
  return !forbiddenPatterns.some(p => file.includes(p));
}
