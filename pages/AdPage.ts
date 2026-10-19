import { Page, expect } from '@playwright/test';

export class AdPage {
  constructor(private readonly page: Page) {}

  /** Na oglasu, kod podataka o prodavcu, stoji "Dodajte u adresar". */
  async clickAddToAddressBook(): Promise<void> {
    const btn = this.page.getByText(/^\s*dodajte u adresar\s*$/i).first();
    await expect(btn).toBeVisible();
    await btn.click();
  }

  /**
   * Forma za login je prozor "Prijavite se" sa poljem "E-mail adresa"
   * (lozinka se traži tek u sledećem koraku) (Google/Facebook/Apple dugmad su u iframe-u, pa se ne proveravaju).
   */
  async expectLoginForm(): Promise<void> {
    // :visible jer u DOM-u postoji i skrivena login forma iz gornjeg menija
    await expect(this.page.locator('text=Nemate nalog na >> visible=true').first()).toBeVisible();
    await expect(this.page.locator('label[for="email"]:visible').first()).toBeVisible();
    await expect(this.page.locator('input#email:visible').first()).toBeVisible();
  }
}
