// Tiny inline formatting for short texts edited in the CMS:
// *woorden* → italic accent, **woorden** → bold. Everything else is escaped.
export function inline(text = ''): string {
  return text
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>');
}

export const telHref = (phone: string) => 'tel:+32' + phone.replace(/\s/g, '').replace(/^0/, '');
