const MPESA_ENV =
  process.env.MPESA_ENV || 'sandbox'

const BASE_URL =
  MPESA_ENV === 'production'
    ? 'https://api.safaricom.co.ke'
    : 'https://sandbox.safaricom.co.ke'

class DarajaAuth {
  async getAccessToken() {
    const consumerKey =
      process.env.MPESA_CONSUMER_KEY || ''

    const consumerSecret =
      process.env.MPESA_CONSUMER_SECRET || ''

    const auth = btoa(
      `${consumerKey}:${consumerSecret}`
    )

    const response = await fetch(
      `${BASE_URL}/oauth/v1/generate?grant_type=client_credentials`,
      {
        method: 'GET',
        headers: {
          Authorization: `Basic ${auth}`,
        },
      }
    )

    const data = await response.json()

    return data.access_token
  }
}

export const darajaAuth = new DarajaAuth()
