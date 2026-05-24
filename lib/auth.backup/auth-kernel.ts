/**
 * MTAA_OS_V10 — Auth Kernel (Lock State Manager)
 * Controls ONLY OS lock state, NOT Supabase auth
 */

let _locked = false;
const _listeners = new Set<(locked: boolean) => void>();

function emit() {
  _listeners.forEach((fn) => fn(_locked));
}

export const authKernel = {
  lock() {
    _locked = true;
    emit();
  },

  unlock() {
    _locked = false;
    emit();
  },

  isLocked() {
    return _locked;
  },

  subscribe(fn: (locked: boolean) => void) {
    _listeners.add(fn);
    fn(_locked);
    return () => _listeners.delete(fn);
  },
};
