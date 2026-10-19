import { Locator, Page, expect } from '@playwright/test';
import { blockTrackers, dismissConsent, filterBlock, parseCount, safeClick } from '../utils/helpers';

// Stvarni URL-ovi sa sajta (provereno):
export const CATEGORY_URL = '/odeca-zenska/kategorija/743';            // Odeća | Ženska
export const GROUP_BLUZE_URL = '/odeca-zenska/bluze/grupa/743/1992/1'; // grupa Bluze

export class SearchPage {
  constructor(private readonly page: Page) {}

  async openCategory(): Promise<void> {
    await blockTrackers(this.page);
    await this.page.goto(CATEGORY_URL, { waitUntil: 'domcontentloaded' });
    await dismissConsent(this.page);
  }

  async openGroupBluzeDirect(): Promise<void> {
    await blockTrackers(this.page);
    await this.page.goto(GROUP_BLUZE_URL, { waitUntil: 'domcontentloaded' });
    await dismissConsent(this.page);
  }

  /** Sa stranice kategorije "Odeća | Ženska" klikne na grupu "Bluze". */
  async chooseGroupBluze(): Promise<void> {
    await this.page.locator('a[href*="/bluze/grupa/743/1992"]').first().click();
    await this.page.waitForURL(/\/bluze\/grupa\/743\/1992/, { waitUntil: 'domcontentloaded' });
    await expect(this.page.getByText('Osnovni filteri')).toBeVisible();
  }

  async setPriceFromDin(value: number): Promise<void> {
    const block = filterBlock(this.page, 'Cena');

    // Valuta: radio dugme name="currency", value="rsd" (= din)
    const rsd = block.locator('input[name="currency"][value="rsd"]');
    if (await rsd.count()) {
      await rsd.evaluate((el) => (el as HTMLInputElement).click());
      await expect(rsd).toBeChecked();
    }

    // Polje "od" = prvi input koji NIJE radio/checkbox
    const from = block
      .locator('input:not([type="radio"]):not([type="checkbox"])')
      .first();
    await from.fill(String(value));
    await from.press('Enter');
    await expect(from).toHaveValue(String(value));
  }

  /**
   * Čekira opciju filtera (checkbox) po tekstu. Opcije imaju nevidljiv input preko labele,
   * pa se klikće sam input. Stranica zna da ponovo iscrta filtere i poništi klik, zato se
   * klik PONAVLJA dok opcija zaista nije štikirana.
   */
  private async checkOption(block: Locator, label: string | RegExp): Promise<void> {
    const text = block.getByText(label, typeof label === 'string' ? { exact: true } : {}).first();
    const input = text
      .locator('xpath=ancestor::*[.//input[@type="checkbox" or @type="radio"]][1]')
      .locator('input[type="checkbox"], input[type="radio"]')
      .first();
    await expect(async () => {
      if (!(await input.isChecked())) {
        await input.evaluate((el) => (el as HTMLInputElement).click());
      }
      expect(await input.isChecked(), `Opcija "${label}" nije štikirana`).toBe(true);
    }).toPass({ timeout: 15_000, intervals: [500, 1000, 2000] });
  }

  /** Stanje: "Novo" i "Nekorišćeno (polovno)" (= "kao novo / ne korišćeno"). */
  async selectCondition(): Promise<void> {
    const block = filterBlock(this.page, 'Stanje');
    await this.checkOption(block, 'Novo');
    await this.checkOption(block, /^Nekorišćeno/);
  }

  async onlyWithPrice(): Promise<void> {
    const block = filterBlock(this.page, 'Ostalo');
    await this.checkOption(block, 'Samo sa cenom');
  }

  /** Pred primenu: ponovo proveri (i po potrebi ponovo štikiraj) sve tri opcije. */
  async verifyOptions(): Promise<void> {
    await this.page.waitForTimeout(1500);
    await this.checkOption(filterBlock(this.page, 'Ostalo'), 'Samo sa cenom');
    await this.checkOption(filterBlock(this.page, 'Stanje'), 'Novo');
    await this.checkOption(filterBlock(this.page, 'Stanje'), /^Nekorišćeno/);
  }

  /**
   * Filteri (osim cene) se primenjuju tek klikom na "Filtrirajte rezultate (N oglasa)".
   * Dugme prikazuje broj tek kad stranica registruje promene. Ako broja nema, filteri
   * NISU registrovani i test pada (umesto da lažno prođe). Vraća N sa dugmeta.
   */
  async applyFilters(): Promise<number> {
    const label = this.page.getByText(/Filtrirajte rezultate/).first();
    await expect(label).toBeVisible();

    const withCount = label.locator(
      'xpath=ancestor-or-self::*[contains(normalize-space(.), "oglas")][1]'
    );
    const readButton = async (): Promise<number | null> => {
      const txt = ((await withCount.textContent().catch(() => '')) ?? '').replace(/\s+/g, ' ');
      const m = txt.match(/Filtrirajte rezultate\s*\(\s*(\d[\d.]*)\s+oglas/i);
      return m ? parseInt(m[1].replace(/\./g, ''), 10) : null;
    };

    // Čekamo do ~15 s da broj na dugmetu stigne i ustabili se.
    let last: number | null = null;
    let same = 0;
    for (let i = 0; i < 15 && same < 2; i++) {
      await this.page.waitForTimeout(1000);
      const c = await readButton();
      same = c !== null && c === last ? same + 1 : 0;
      if (c !== null) last = c;
    }
    console.log(`Dugme "Filtrirajte rezultate" najavljuje: ${last}`);
    if (last === null) {
      throw new Error(
        'Dugme "Filtrirajte rezultate" ne prikazuje broj oglasa - filteri nisu registrovani na stranici.'
      );
    }

    await safeClick(label);
    return last;
  }

  /** Jedno očitavanje broja rezultata iz naslova stranice ("... > 875 oglasa"). */
  async readCount(): Promise<number | null> {
    const el = this.page.getByText(/\d[\d.]*\s+oglas/i).first();
    if (!(await el.count())) return null;
    return parseCount((await el.textContent()) ?? '');
  }

  /** Čeka da se broj rezultata ustabili (dva ista očitavanja zaredom) i vraća ga. */
  async getStableCount(): Promise<number> {
    let last = -1;
    await expect
      .poll(
        async () => {
          const c = await this.readCount();
          const stable = c !== null && c === last;
          last = c ?? -1;
          return stable;
        },
        { timeout: 30_000, intervals: [1500] }
      )
      .toBe(true);
    return last;
  }

  async openFirstAd(): Promise<void> {
    const first = this.page.locator('a[href*="/oglas/"]').first();
    await expect(first).toBeVisible();
    await first.click();
    await this.page.waitForURL(/\/oglas\/\d+/, { waitUntil: 'domcontentloaded' });
  }
}
