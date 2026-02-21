# FitCoach - Analýza aplikace a návrhy nových funkcí

## Shrnutí existujících funkcí

Aplikace FitCoach aktuálně obsahuje:

| Oblast | Co je implementováno |
|--------|---------------------|
| **Dashboard** | Dnešní tréninky, týdenní přehled, quick stats (tréninky/klienti/příjem), upozornění (poslední trénink v balíčku, InBody reminder) |
| **Klienti** | CRUD, vyhledávání, filtr podle stavu, profil s taby (přehled, balíčky, tréninky, InBody) |
| **Balíčky** | Vytvoření, evidence platby (toggle zaplaceno), progress bar, automatické dokončení |
| **Sessions** | Plánování, kalendář (týden/den), opakované tréninky, auto-complete po uplynutí, stavy (scheduled/completed/cancelled/no_show) |
| **Živý logging** | Přidávání cviků, předvyplnění z minula, supersety, šablony, sériové řádky (reps + kg) |
| **InBody** | Evidence měření, OCR z fotky (Gemini API), grafy (Recharts), foto galerie, segmentální analýza, body map |
| **ICS** | Kalendářní feed s alarmy (standardní, InBody, poslední trénink) |
| **PWA** | Offline stránka, manifest, service worker |

---

## Navrhované nové funkce

### 1. Statistiky a analytika pro klienta

**Problém:** Trenér vidí pouze historii tréninků a InBody grafy. Chybí přehled o progresu v jednotlivých cvicích.

**Řešení:**
- **Progres v cviku** - graf síly v čase pro konkrétní cvik u klienta (max váha, celkový objem = sety * reps * kg)
- **Osobní rekordy (PR)** - automatická detekce nového maxima v reps nebo váze, zobrazení odznaku/badge u cviku
- **Tréninková frekvence** - graf počtu tréninků za měsíc (heatmap ve stylu GitHub contributions)
- **Objem tréninku** - celkový objem (kg * reps) za trénink/týden/měsíc

**Databáze:** Stávající `session_exercises` a `sessions` tabulky stačí - jde pouze o analytické dotazy.

---

### 2. Časovač odpočinku (Rest Timer)

**Problém:** Během živého logování trenér nemá časovač pro pauzy mezi sériemi.

**Řešení:**
- Po zaznamenání série se automaticky spustí odpočinkový časovač (konfigurovatelný - 60s, 90s, 120s)
- Vibrace/zvuk po uplynutí
- Možnost předčasně ukončit nebo přidat čas
- Volitelné ukládání skutečné doby odpočinku do dat

**UI:** Floating timer bar nad spodní navigací na stránce `/sessions/[id]/live`.

---

### 3. Poznámky ke cvikům v knihovně

**Problém:** Cvik má pouze název. Trenér si nemůže uložit technické poznámky, video odkaz, nebo popis správného provedení.

**Řešení:**
- Přidat pole `description` a `video_url` do tabulky `exercises`
- V knihovně cviků zobrazit popis a video odkaz
- Během živého logování možnost zobrazit instrukce ke cviku (swipe nebo ikona info)
- Přidání pole `muscle_group` / `category` pro filtrování (push/pull/legs, horní/dolní tělo)

**Databáze:** ALTER TABLE exercises ADD COLUMN description text, video_url text, category text.

---

### 4. Drag & Drop řazení cviků v tréninku

**Problém:** Pořadí cviků v živém logování nelze přeuspořádat.

**Řešení:**
- Drag & drop (long press na mobilu) pro přeuspořádání cviků během tréninku
- Knihovna `@dnd-kit/core` (populární, lightweight, React-friendly, dobrá mobilní podpora)
- Automatická aktualizace `order_index` v databázi

---

### 5. Export dat klienta (PDF report)

**Problém:** Trenér nemůže sdílet souhrn pokroku s klientem.

**Řešení:**
- Tlačítko "Exportovat report" na profilu klienta
- PDF obsahuje: InBody progres, tréninková historie, osobní rekordy, grafy
- Generování na serveru pomocí knihovny jako `@react-pdf/renderer`
- Možnost sdílet přes WhatsApp/email přímo z aplikace (Web Share API)

---

### 6. Šablony s poznámkami k sériím

**Problém:** Šablony ukládají pouze cviky a výchozí počty sérií, ale ne cílové RPE, tempo, nebo poznámky ke každému cviku.

**Řešení:**
- Rozšířit JSONB `exercises` v `workout_templates` o pole `notes` a `rpe_target`
- Při načtení šablony do tréninku se poznámky zobrazí u příslušného cviku
- Přidat volitelné pole `tempo` (např. "3-1-2-0" = eccentric-pause-concentric-pause)

---

### 7. Duplikace tréninku

**Problém:** Pokud má klient pravidelně stejný trénink, trenér musí pokaždé přidávat cviky ručně nebo přes šablonu.

**Řešení:**
- Tlačítko "Duplikovat" na detailu dokončeného tréninku
- Vytvoří nový naplánovaný trénink se stejnými cviky (bez hodnot sérií, nebo s hodnotami z duplikovaného)
- Možnost "Uložit jako šablonu" z dokončeného tréninku

---

### 8. Kalendářní konflikty a validace

**Problém:** Trenér může naplánovat dva tréninky na stejný čas.

**Řešení:**
- Při vytváření/editaci tréninku kontrola překryvu s existujícími sessions
- Varování (ne blokování) - "V tento čas již máte trénink s {klient}"
- Vizuální indikace konfliktu v kalendáři (červený border)

---

### 9. Notifikace o expiraci balíčku

**Problém:** Dashboard alert ukazuje pouze "poslední trénink v balíčku". Chybí upozornění na nezaplacené balíčky a na klienty, kteří delší dobu netrénují.

**Řešení:**
- **Nezaplacený balíček** - alert pokud je balíček aktivní a `paid = false` déle než X dní
- **Neaktivní klient** - alert pokud aktivní klient neměl trénink více než 14 dní
- **Expirace blíží** - alert X dní před koncem balíčku (pokud by se přidalo `expires_at` datum)
- Konfigurovatelné prahy v nastavení

---

### 10. Rychlé opakování tréninku z dashboardu

**Problém:** Z dashboardu nelze rychle naplánovat další trénink pro klienta, se kterým trenér právě trénoval.

**Řešení:**
- Po dokončení tréninku nabídnout "Naplánovat další" s předvyplněným klientem
- Na dashboardu u klientů s dokončeným posledním tréninkem zobrazit rychlou akci "Naplánovat další"

---

### 11. Měření bez InBody (jednoduché měření)

**Problém:** InBody měření vyžaduje speciální přístroj. Pro běžné kontroly by bylo užitečné zaznamenat pouze váhu nebo jednoduché obvodové míry.

**Řešení:**
- Nový typ měření "Rychlé měření" - pouze váha (a volitelně obvody: pas, boky, paže, stehna)
- Zobrazení v grafech vedle InBody dat
- Rychlý vstup přímo z profilu klienta (jedno tlačítko)

**Databáze:** Rozšířit `inbody_records` o pole `measurement_type` ('inbody' | 'quick') a `circumferences` JSONB.

---

### 12. Sdílení tréninku s klientem (read-only odkaz)

**Problém:** Klient nemá přístup do aplikace a nemůže vidět svůj tréninkový plán ani výsledky.

**Řešení:**
- Generování unikátního tokenu pro sdílení (podobně jako ICS token)
- Veřejná read-only stránka `/shared/[token]` zobrazující:
  - Poslední trénink s cviky a vahami
  - InBody progress grafy
  - Nadcházející naplánované tréninky
- Token platný X dní nebo do odvolání
- Sdílení přes QR kód, odkaz nebo Web Share API

**Databáze:** Nová tabulka `shared_links` (token, client_id, expires_at, created_at).

---

### 13. Hromadné plánování tréninků

**Problém:** Opakované tréninky pokrývají jen jeden den v týdnu. Pokud klient trénuje 3x týdně, trenér musí vytvořit 3 opakování zvlášť.

**Řešení:**
- Rozšířit formulář opakovaných tréninků o možnost vybrat více dnů najednou
- Přiřadit různé šablony ke každému dni (Po: Push, St: Pull, Pá: Legs)
- Preview vytvořených tréninků před potvrzením

---

### 14. Příjmy a finanční přehled

**Problém:** Dashboard ukazuje pouze příjem aktuálního měsíce. Chybí dlouhodobý přehled.

**Řešení:**
- Nová stránka `/finance` nebo sekce v nastavení
- Graf příjmů po měsících (sloupcový graf)
- Přehled nezaplacených balíčků
- Celkový příjem za rok
- Filtrování podle klienta

---

### 15. Dark/Light mode přepínač

**Problém:** Aplikace má pouze dark mode. Při tréninku venku na slunci může být tmavé rozhraní hůře čitelné.

**Řešení:**
- Přepínač v nastavení (Dark / Light / Auto dle systému)
- Tailwind CSS `dark:` třídy již podporují duální režim
- Uložení preference v localStorage + Supabase (trainers tabulka)

---

## Prioritizace

| Priorita | Funkce | Dopad | Složitost |
|----------|--------|-------|-----------|
| **Vysoká** | Časovač odpočinku | Denní použití při tréninku | Nízká |
| **Vysoká** | Statistiky klienta (progres cviků) | Hodnota pro trenéra i klienta | Střední |
| **Vysoká** | Duplikace tréninku | Zrychlení workflow | Nízká |
| **Vysoká** | Kalendářní konflikty | Prevence chyb | Nízká |
| **Střední** | Poznámky ke cvikům + kategorie | Lepší organizace knihovny | Nízká |
| **Střední** | Neaktivní klient alert | Retence klientů | Nízká |
| **Střední** | Hromadné plánování (multi-day) | Zrychlení workflow | Střední |
| **Střední** | Sdílení tréninku s klientem | Klientská spokojenost | Střední |
| **Střední** | Rychlé měření (bez InBody) | Častější sledování | Nízká |
| **Nižší** | Export PDF | Nice-to-have | Střední |
| **Nižší** | Finanční přehled | Užitečné ale ne kritické | Střední |
| **Nižší** | Drag & Drop cviků | UX vylepšení | Střední |
| **Nižší** | Šablony s RPE/tempo | Pro pokročilé trenéry | Nízká |
| **Nižší** | Dark/Light mode | Okrajový případ | Střední |

---

## Doporučení pro další kroky

Navrhuju začít s funkcemi, které mají **vysokou prioritu a nízkou složitost** - přinesou okamžitou hodnotu při minimálním úsilí:

1. **Časovač odpočinku** - zásadní pro denní workflow trenéra
2. **Duplikace tréninku** - 1 tlačítko, výrazné zrychlení práce
3. **Kalendářní konflikty** - jednoduchá validace, prevence chyb
4. **Statistiky klienta** - analytické dotazy nad stávajícími daty, Recharts je již v projektu
