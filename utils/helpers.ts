import { Locator, Page } from '@playwright/test';

/** Zatvara cookie/consent baner ako postoji (ne pada ako ga nema). */
export async function dismissConsent(page: Page): Promise<void> {
  const btn = page
    .getByRole('button', { name: /prihvat|slažem|saglas|accept/i })
    .first();
  try {
    await btn.click({ timeout: 2500 });
  } catch {
    /* baner se nije pojavio - nastavi */
  }
}

/** Blokira reklame i trackere koji usporavaju učitavanje (nisu deo testa). */
export async function blockTrackers(page: Page): Promise<void> {
  await page.route(
    /googletagmanager|google-analytics|doubleclick|googlesyndication|facebook\.net|facebook\.com\/tr|hotjar|clarity\.ms|adservice|criteo|taboola|outbrain/i,
    (route) => route.abort()
  );
}

/** "2.302 oglasa" -> 2302 */
export function parseCount(text: string): number | null {
  const m = text.match(/(\d{1,3}(?:\.\d{3})*|\d+)\s+oglas/i);
  return m ? parseInt(m[1].replace(/\./g, ''), 10) : null;
}

/**
 * Najmanji kontejner koji sadrži tekst naslova (npr. "Cena", "Stanje", "Ostalo").
 * Klikovi ostaju unutar bočnog filtera.
 */
export function filterBlock(page: Page, heading: string): Locator {
  return page
    .locator('div, section, fieldset')
    .filter({ has: page.getByText(heading, { exact: true }) })
    .last();
}

/**
 * Običan klik; ako ga lepljivi header ili skriveni input blokira,
 * šalje klik direktno elementu (isti efekat kao klik korisnika).
 */
export async function safeClick(target: Locator): Promise<void> {
  try {
    await target.click({ timeout: 4000 });
  } catch {
    await target.evaluate((el) => (el as HTMLElement).click());
  }
}
