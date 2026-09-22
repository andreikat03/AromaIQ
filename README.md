# AromaIQ Retail v9

Versiune GitHub Pages, self-contained.

## Important
Designul și logica aplicației sunt incluse direct în `index.html`.
Asta evită problemele în care GitHub Pages afișează HTML-ul fără CSS.

## Publicare pe GitHub Pages
1. Creează un repository GitHub, de exemplu `aromaiq`.
2. Încarcă fișierele din acest folder direct în rădăcina repository-ului.
3. Settings → Pages.
4. Source: `Deploy from a branch`.
5. Branch: `main`, folder `/ (root)`.
6. Save.

Aplicația va fi la:
`https://USERNAME.github.io/aromaiq/`

## Ce conține
- Recomandări
- Stoc
- Comparare parfumuri
- Scanare cod de bare
- Produse / editare
- Import Excel / CSV / JSON
- Manager
- Statistici
- Locații multiple
- Utilizatori
- Supabase
- Backup

## Statistici
Managerul are pagina `Statistici`, cu:
- 7 zile / 30 zile / 6 luni / 1 an / total
- încasări
- număr vânzări
- bon mediu
- conversie recomandare → vânzare
- produse testate
- testat → vândut
- cereri pierdute
- produse cu stoc mic / zero
- top produse
- grafic simplu al vânzărilor

## Date locale
Fără Supabase, datele sunt salvate în localStorage în browser.

## Supabase
Rulează `supabase/setup.sql` în SQL Editor, apoi configurează Project URL și anon key în Manager → Cloud & conturi.

Nu folosi Service Role Key în browser.
