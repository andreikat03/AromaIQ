# AromaIQ Retail

Aplicație web statică pentru recomandări de parfumuri, stoc, vânzări, comparații, scanare cod de bare, import de catalog și funcții de manager.

## Structura proiectului

```text
AromaIQ_GitHub/
├─ index.html
├─ .nojekyll
├─ .gitignore
├─ README.md
├─ assets/
│  ├─ css/
│  │  └─ styles.css
│  ├─ js/
│  │  └─ app.js
│  └─ img/
│     └─ favicon.svg
├─ examples/
│  └─ catalog-exemplu.csv
└─ supabase/
   └─ setup.sql
```

## Publicare pe GitHub Pages

1. Creează un repository nou pe GitHub, de exemplu `aromaiq`.
2. Încarcă **conținutul** acestui folder în rădăcina repository-ului.
3. Intră în repository la **Settings → Pages**.
4. La **Build and deployment**, alege:
   - Source: `Deploy from a branch`
   - Branch: `main`
   - Folder: `/ (root)`
5. Salvează.
6. După publicare, aplicația va fi disponibilă la o adresă de forma:
   `https://USERNAME.github.io/aromaiq/`

Nu modifica căile către CSS și JS; sunt relative și funcționează pe GitHub Pages.

## Date locale

Fără Supabase, AromaIQ salvează datele în `localStorage` din browser. Asta înseamnă că:
- datele rămân pe dispozitivul/browserul respectiv;
- alt calculator nu vede automat aceleași date;
- ștergerea datelor browserului poate elimina baza locală.

Folosește funcția **Backup** din aplicație pentru export.

## Import catalog

Poți importa:
- `.xlsx`
- `.xls`
- `.csv`
- `.json`

Un exemplu este în `examples/catalog-exemplu.csv`.

Coloane recunoscute automat includ:
- Nume
- Brand
- SKU
- Cod de bare / EAN
- Preț
- Stoc
- Gen
- Familie
- Note
- Persistență
- Categorii
- Imagine
- Locație

## Supabase

Aplicația poate sincroniza starea prin Supabase.

1. Creează un proiect Supabase.
2. În **SQL Editor**, rulează `supabase/setup.sql`.
3. În AromaIQ, intră ca Manager → **Cloud & conturi**.
4. Introdu:
   - Project URL
   - anon/public key
5. Apasă **Salvează conexiunea**.
6. Folosește **Trimite în cloud** / **Descarcă din cloud**.

### Siguranță

Fișierul `supabase/setup.sql` conține politici simple pentru pilot. Pentru un produs public/comercial:
- nu folosi niciodată Service Role Key în browser;
- folosește Supabase Auth;
- aplică Row Level Security pe organizație/locație;
- separă datele clienților pe tenant.

## Scanare cod de bare

Scanarea cu camera depinde de suportul browserului pentru `BarcodeDetector`.
GitHub Pages rulează pe HTTPS, deci accesul la cameră este permis atunci când browserul îl suportă.

Pe desktop poți folosi și:
- introducere manuală;
- scanner USB care se comportă ca o tastatură.

## Biblioteci externe

Aplicația folosește prin CDN:
- SheetJS (`xlsx`) pentru import Excel;
- Supabase JS pentru sincronizare cloud.

Din acest motiv, pentru aceste funcții este necesară conexiune la internet.

## Recomandare înainte de lansare comercială

Versiunea aceasta este bună pentru demo/pilot. Înainte de utilizare comercială cu mai mulți clienți, recomand:
- autentificare reală;
- bază de date multi-tenant;
- jurnal de audit;
- backup automat;
- politici RLS stricte;
- separarea stocului/catalogului/vânzărilor în tabele dedicate.
