import { test } from '@playwright/test';
import { SearchPage } from '../pages/SearchPage';
import { AdPage } from '../pages/AdPage';

test.describe('Scenario 2 - Adresar zahteva login', () => {
  test('dodavanje u adresar iz oglasa traži formu za login', async ({ page }) => {
    const search = new SearchPage(page);
    const ad = new AdPage(page);

    await test.step('Otvori listu oglasa (Bluze)', () => search.openGroupBluzeDirect());
    await test.step('Otvori prvi oglas', () => search.openFirstAd());
    await test.step('Klikni "Dodajte u adresar"', () => ad.clickAddToAddressBook());
    await test.step('Prikazana je forma za login', () => ad.expectLoginForm());
  });
});
