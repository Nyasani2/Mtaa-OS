import { router } from 'expo-router'

export async function launchApp(
  appId: string,
  route: string
) {
  try {
    console.log('[MTAA OS] Launching:', appId)

    router.push(route as any)
  } catch (error) {
    console.log('[MTAA OS] Launch failed:', error)
  }
}
