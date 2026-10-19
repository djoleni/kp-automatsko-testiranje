# KupujemProdajem – automatski testovi (Playwright + TypeScript)

Zadatak 2 – Automatski test. Testovi se pokreću bez ikakvog dodatnog podešavanja
na Windows, Linux i macOS.

## Preduslov
Samo **Node.js 18 ili noviji** (https://nodejs.org) i internet konekcija.

## Pokretanje
U folderu projekta:

```bash
npm install
npx playwright test
```

- `npm install` instalira pakete i **automatski preuzima browsere** (Chromium i Firefox).
  Prvi put može potrajati zbog veličine browsera.
- `npx playwright test` pokreće oba scenarija u oba browsera.
- Izveštaj sa slikama (screenshot svakog testa): `npx playwright show-report`

Korisno: `npx playwright test --headed` (vidi se browser), `npx playwright test --project=chromium`
(samo jedan browser), `npx playwright test --ui` (grafički mod).

Na Linuxu, ako fale sistemske biblioteke: `npx playwright install --with-deps`.

## Scenariji

### 1. Pretraga ženskih bluza – `tests/search-results.spec.ts`
Koraci: kategorija „Odeća | Ženska" → grupa „Bluze" → cena od 100 din → „Samo sa cenom"
→ stanje „Novo" i „Nekorišćeno (polovno)" → „Filtrirajte rezultate".
Test čita broj rezultata i proverava da je **veći od 1000**.

> **Napomena o rezultatu:** u trenutku pisanja ova pretraga vraća **875** oglasa (isti broj
> je proveren i ručno na sajtu), pa ovaj test **pada sa porukom
> „Pronađeno 875 rezultata, traži se više od 1000"**. To je ispravan nalaz testa, a ne greška
> u kodu: tvrdnja iz zadatka na današnjim podacima nije tačna. Broj oglasa na sajtu se menja,
> pa rezultat može biti drugačiji u drugom trenutku. Opcija iz zadatka „Kao novo (ne korišćeno)"
> na sajtu se danas zove „Nekorišćeno (polovno)".
>
> Samo za proveru da ceo pipeline radi, prag se može privremeno promeniti:
> `MIN_RESULTS=800 npx playwright test` (Windows PowerShell: `$env:MIN_RESULTS=800; npx playwright test`).

### 2. Adresar traži login – `tests/adresar-login.spec.ts`
Koraci: lista oglasa „Bluze" → otvaranje prvog oglasa → klik na „Dodajte u adresar".
Test proverava da se prikazuje prozor **„Prijavite se"** (forma za login sa poljem
„E-mail adresa"). Ovaj test prolazi.

## Struktura projekta
```
tests/                  scenariji (spec fajlovi)
pages/                  Page Object klase (SearchPage, AdPage)
utils/helpers.ts        pomoćne funkcije (cookie baner, blokiranje trackera, parsiranje broja)
playwright.config.ts    konfiguracija (browseri, screenshot, timeout-i)
```

## Napomene
- Testovi blokiraju reklame i trackere (Google Tag Manager i sl.) radi bržeg i stabilnijeg učitavanja;
  to nije deo testiranog ponašanja.
- Ako sajt promeni izgled i neki locator prestane da radi, `npm run codegen` otvara sajt
  i snima nove locatore.
