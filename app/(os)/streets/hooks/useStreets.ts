// Re-export from lib/hooks - this file exists to prevent breaking existing imports
// Expo Router will treat this as a route, so we provide a default export
export { useStreets } from '@/lib/hooks/useStreets';

export default function UseStreetsHook() {
  return null;
}
