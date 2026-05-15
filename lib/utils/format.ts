export function formatCurrency(amount: number, currency: string = 'KES') {
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(date: string | Date) {
  return new Date(date).toLocaleDateString('en-KE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatPhone(phone: string) {
  // Format Kenyan phone numbers
  if (phone.startsWith('254')) {
    return '+254 ' + phone.slice(3, 6) + ' ' + phone.slice(6, 9) + ' ' + phone.slice(9);
  }
  if (phone.startsWith('0')) {
    return '+254 ' + phone.slice(1, 4) + ' ' + phone.slice(4, 7) + ' ' + phone.slice(7);
  }
  return phone;
}
