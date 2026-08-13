export async function withTimeout<T>(promise: PromiseLike<T> | Promise<T>, timeoutMs: number, label?: string): Promise<T> {
  return Promise.race([
    Promise.resolve(promise),
    new Promise<never>((_, reject) => setTimeout(() => reject(new Error(label ? `${label} timed out after ${timeoutMs}ms` : `Operation timed out after ${timeoutMs}ms`)), timeoutMs)),
  ]);
}
