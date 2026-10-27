export function formatPrice(amount: number): string {
  return `${amount.toLocaleString('ar-IQ')} د.ع`;
}

export function formatPriceClean(amount: number): string {
  return `${amount.toLocaleString('en-US')} د.ع`;
}

export function cleanPhone(phone: string): string {
  return phone.replace(/[^0-9+]/g, '');
}

export function getWhatsAppLink(phone: string, itemTitle: string): string {
  let clean = cleanPhone(phone);
  if (clean.startsWith('0')) {
    clean = '964' + clean.slice(1);
  } else if (!clean.startsWith('964') && !clean.startsWith('+964')) {
    clean = '964' + clean;
  }
  clean = clean.replace('+', '');
  const message = encodeURIComponent(`سڵاو، دەربارەی ئەم کاڵایەت لە بازاڕی زانکۆ نامەت بۆ دەنێرم: "${itemTitle}". ئایا هێشتا بەردەستە؟`);
  return `https://wa.me/${clean}?text=${message}`;
}
