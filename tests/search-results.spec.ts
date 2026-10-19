import { test, expect } from '@playwright/test';
import { SearchPage } from '../pages/SearchPage';

// Prag iz zadatka je 1000. Može se menjati samo svesno: MIN_RESULTS=800 npx playwright test
const MIN_RESULTS = Number(process.env.MIN_RESULTS ?? 1000);

test.describe('Scenario 1 - Pretraga ženskih bluza', () => {
  test('ima više od 1000 rezultata za zadate filtere', async ({ page }, testInfo) => {
    const search = new SearchPage(page);
    const log: string[] = [];
    const record = async (label: string) => {
      await page.waitForTimeout(2500); // da lista stigne da se osveži
      const c = await search.getStableCount();
      log.push(`${label}: ${c}`);
      console.log(`${label}: ${c}`);
      return c;
    };

    await test.step('Kategorija "Odeća | Ženska"', () => search.openCategory());
    await test.step('Grupa "Bluze"', () => search.chooseGroupBluze());
    await record('Bez filtera');

    await test.step('Cena od 100 din', () => search.setPriceFromDin(100));
    // Cena se primenjuje odmah i stranica se ponovo iscrta - sačekaj da se smiri
    // pre štikiranja ostalih filtera (inače se klikovi poništavaju).
    await record('+ cena od 100 din');

    await test.step('Samo sa cenom', () => search.onlyWithPrice());
    await test.step('Stanje: Novo + Nekorišćeno', () => search.selectCondition());
    await test.step('Provera da su sve opcije štikirane', () => search.verifyOptions());

    const expected = await test.step('Klik na "Filtrirajte rezultate"', () => search.applyFilters());
    log.push(`Dugme je najavilo: ${expected}`);

    // Posle primene, broj na stranici MORA da dođe na najavljeni broj (dokaz da su filteri primenjeni).
    await expect
      .poll(() => search.readCount(), {
        message: `Posle primene filtera stranica treba da prikaže ${expected} oglasa`,
        timeout: 20_000,
        intervals: [1000],
      })
      .toBe(expected);
    const count = await record('SA SVIM FILTERIMA');

    await testInfo.attach('broj-rezultata', { body: log.join('\n'), contentType: 'text/plain' });

    expect(count, `Pronađeno ${count} rezultata, traži se više od ${MIN_RESULTS}`).toBeGreaterThan(MIN_RESULTS);
  });
});
