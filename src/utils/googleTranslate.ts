/**
 * Uses the same public Google Translate endpoint as the web widget.
 * No extra npm library required.
 */
export async function googleTranslate(
  text: string,
  targetLang: string,
  sourceLang = 'en',
): Promise<string> {
  const trimmed = text.trim();
  if (!trimmed || targetLang === sourceLang) {
    return text;
  }

  const url =
    `https://translate.googleapis.com/translate_a/single` +
    `?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t` +
    `&q=${encodeURIComponent(trimmed)}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Google Translate failed (${response.status})`);
  }

  const data = (await response.json()) as unknown;
  if (!Array.isArray(data) || !Array.isArray(data[0])) {
    return text;
  }

  const translated = (data[0] as [string][]).map(part => part[0]).join('');
  return translated || text;
}
