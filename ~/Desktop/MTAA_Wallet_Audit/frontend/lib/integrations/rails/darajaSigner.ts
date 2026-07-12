export function generateMpesaPassword() {
  const shortcode =
    process.env.MPESA_SHORTCODE || ''

  const passkey =
    process.env.MPESA_PASSKEY || ''

  const timestamp = generateTimestamp()

  const password = btoa(
    `${shortcode}${passkey}${timestamp}`
  )

  return {
    timestamp,
    password,
  }
}

function generateTimestamp() {
  const date = new Date()

  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')

  const hh = String(date.getHours()).padStart(2, '0')
  const mi = String(date.getMinutes()).padStart(2, '0')
  const ss = String(date.getSeconds()).padStart(2, '0')

  return `${yyyy}${mm}${dd}${hh}${mi}${ss}`
}
