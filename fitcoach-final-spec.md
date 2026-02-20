# FitCoach – Finální specifikace

## 1. Přehled

| | |
|---|---|
| **Typ** | PWA (Progressive Web App) – mobile-first |
| **Uživatel** | Jeden osobní trenér (bez klientského přístupu) |
| **Stack** | Next.js 14+ (App Router) + Supabase + Tailwind CSS |
| **Hosting** | Vercel |
| **Kalendář** | ICS feed (webcal:// subscribe do Apple Calendar) |
| **Notifikace** | Výhradně přes ICS alarmy v kalendáři |
| **Platby** | Jednoduchá evidence (zaplaceno ano/ne + částka) |

---

## 2. Architektura

```
┌──────────────────────────────────┐
│       Next.js PWA (Frontend)      │
│   Mobile-first, Tailwind CSS      │
│   Bottom nav: Domů │ Klienti │    │
│              Kalendář │ Nastavení │
├──────────────────────────────────┤
│       Next.js API Routes          │
│   /api/ics/[token]  (ICS feed)    │
├──────────────────────────────────┤
│           Supabase                │
│  PostgreSQL │ Auth │ Storage      │
│  (data)     │(login)│(InBody foto)│
└──────────────────────────────────┘
```

---

## 3. Databázové schéma

### trainers
```sql
CREATE TABLE trainers (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  name text NOT NULL,
  email text NOT NULL,
  ics_token text UNIQUE NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now()
);
```

### clients
```sql
CREATE TYPE client_status AS ENUM ('active', 'inactive', 'archived');

CREATE TABLE clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trainer_id uuid NOT NULL REFERENCES trainers(id),
  name text NOT NULL,
  email text,
  phone text,
  birth_date date,
  notes text,                    -- zdravotní omezení, cíle, poznámky
  status client_status DEFAULT 'active',
  created_at timestamptz DEFAULT now()
);
```

### packages
```sql
CREATE TYPE package_status AS ENUM ('active', 'completed', 'expired');

CREATE TABLE packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  name text NOT NULL,            -- např. "10 tréninků"
  total_sessions int NOT NULL,
  used_sessions int DEFAULT 0,
  price decimal(10,2),
  paid boolean DEFAULT false,
  paid_at timestamptz,
  status package_status DEFAULT 'active',
  created_at timestamptz DEFAULT now()
);
```

### sessions
```sql
CREATE TYPE session_status AS ENUM ('scheduled', 'completed', 'cancelled', 'no_show');

CREATE TABLE sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  package_id uuid REFERENCES packages(id),
  trainer_id uuid NOT NULL REFERENCES trainers(id),
  scheduled_at timestamptz NOT NULL,
  duration_minutes int DEFAULT 60,
  status session_status DEFAULT 'scheduled',
  location text,
  notes text,
  created_at timestamptz DEFAULT now()
);
```

### exercises (knihovna cviků)
```sql
CREATE TABLE exercises (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trainer_id uuid NOT NULL REFERENCES trainers(id),
  name text NOT NULL,
  created_at timestamptz DEFAULT now()
);
```

### session_exercises (cviky v tréninku)
```sql
CREATE TABLE session_exercises (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  exercise_id uuid NOT NULL REFERENCES exercises(id),
  order_index int NOT NULL,
  sets jsonb DEFAULT '[]',
  -- sets formát: [{"reps": 12, "weight": 80}, {"reps": 10, "weight": 85}]
  notes text,
  superset_group int             -- null = standalone, číslo = skupina supersetu
);
```

### workout_templates (šablony tréninků)
```sql
CREATE TABLE workout_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trainer_id uuid NOT NULL REFERENCES trainers(id),
  name text NOT NULL,            -- např. "Push Day A"
  exercises jsonb NOT NULL,
  -- formát: [{"exercise_id": "...", "sets_config": [{"reps": 12, "weight": 0}], "order_index": 1, "superset_group": null}]
  category text,
  created_at timestamptz DEFAULT now()
);
```

### inbody_records
```sql
CREATE TABLE inbody_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  measured_at date NOT NULL,
  weight decimal(5,2),           -- kg
  body_fat_pct decimal(4,1),     -- %
  muscle_mass decimal(5,2),      -- kg
  bmi decimal(4,1),
  visceral_fat decimal(4,1),
  body_water_pct decimal(4,1),   -- %
  custom_data jsonb,             -- další hodnoty
  photo_urls text[],             -- cesty v Supabase Storage
  notes text,
  created_at timestamptz DEFAULT now()
);
```

### RLS politiky
```sql
-- Vše filtrováno na jednoho trenéra
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_clients" ON clients FOR ALL USING (trainer_id = auth.uid());

ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_sessions" ON sessions FOR ALL USING (trainer_id = auth.uid());

ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_exercises" ON exercises FOR ALL USING (trainer_id = auth.uid());

ALTER TABLE workout_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_templates" ON workout_templates FOR ALL USING (trainer_id = auth.uid());

ALTER TABLE packages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_packages" ON packages FOR ALL
  USING (client_id IN (SELECT id FROM clients WHERE trainer_id = auth.uid()));

ALTER TABLE session_exercises ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_session_exercises" ON session_exercises FOR ALL
  USING (session_id IN (SELECT id FROM sessions WHERE trainer_id = auth.uid()));

ALTER TABLE inbody_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_inbody" ON inbody_records FOR ALL
  USING (client_id IN (SELECT id FROM clients WHERE trainer_id = auth.uid()));
```

---

## 4. ICS Kalendář – kompletní logika

### Typy událostí v kalendáři

| Událost | Alarm | Text alarmu |
|---------|-------|-------------|
| Každý naplánovaný trénink | 15 min před začátkem | "Trénink – {klient}" |
| **První trénink z balíčku** | **5 min před začátkem** | "📏 Čas na InBody měření – {klient}" |
| **Poslední trénink z balíčku** | **5 min před koncem** (55 min po začátku) | "⚠️ Poslední trénink z balíčku – {klient}" |

### Jak se určí první/poslední trénink z balíčku

```
První trénink = session s package_id kde:
  - je to chronologicky první session v balíčku
  - session.status = 'scheduled'

Poslední trénink = session s package_id kde:
  - package.used_sessions + 1 = package.total_sessions
  - NEBO je to chronologicky poslední naplánovaná session z balíčku
```

### ICS endpoint

```
URL: https://fitcoach.vercel.app/api/ics/{ics_token}
Protokol: webcal://fitcoach.vercel.app/api/ics/{ics_token}
```

Přidání do iPhone:
1. V appce → Nastavení → Zkopírovat kalendář URL
2. iPhone → Nastavení → Kalendáře → Přidat účet → Přihlásit se k odběru
3. Vložit URL → synchronizuje se automaticky (~15 min refresh)

### ICS generování (pseudokód)

```typescript
function generateICS(sessions: Session[]): string {
  const events = sessions.map(session => {
    const alarms = [];
    
    // Standardní alarm 15 min před
    alarms.push({
      trigger: '-PT15M',
      description: `Trénink – ${session.client.name}`
    });

    // První trénink z balíčku → InBody reminder
    if (isFirstSessionInPackage(session)) {
      alarms.push({
        trigger: '-PT5M',
        description: `📏 Čas na InBody měření – ${session.client.name}`
      });
    }

    // Poslední trénink z balíčku → reminder 5 min před koncem
    if (isLastSessionInPackage(session)) {
      // Alarm 55 min po začátku (= 5 min před koncem 60min tréninku)
      alarms.push({
        trigger: `PT${session.duration_minutes - 5}M`,
        description: `⚠️ Poslední trénink z balíčku – ${session.client.name}`
      });
    }

    return createVEvent({
      uid: session.id,
      summary: `💪 ${session.client.name}`,
      dtstart: session.scheduled_at,
      duration: session.duration_minutes,
      location: session.location,
      description: session.notes,
      alarms
    });
  });

  return wrapInVCalendar(events);
}
```

---

## 5. Funkce – detailní popis

### 5.1 Dashboard (hlavní obrazovka)
- **Dnešní tréninky** – timeline s klienty, časy, lokací
- **Upozornění karty:**
  - Klienti s posledním tréninkem v balíčku tento týden
  - Klienti kde je čas na InBody (první trénink nového balíčku blízko)
- **Quick stats:** tréninků tento týden, aktivní klienti, příjem tento měsíc
- **Rychlé akce:** + Naplánovat trénink, + Přidat klienta

### 5.2 Klienti
- Seznam s vyhledáváním a filtrem (aktivní/neaktivní/archivovaní)
- **Profil klienta obsahuje:**
  - Základní info (jméno, telefon, email, datum narození)
  - Poznámky (zdravotní omezení, cíle, preference)
  - **Aktivní balíček** – progress bar (použité/celkové), zaplaceno/nezaplaceno
  - **Historie balíčků**
  - **Historie tréninků** – seznam s možností rozkliknout detail
  - **InBody sekce** – grafy pokroku + galerie fotek

### 5.3 Balíčky
- Vytvoření: název, počet tréninků, cena
- Evidence platby: zaplaceno ano/ne + částka + datum
- Automatické odpočítávání po dokončení tréninku
- Stavy: active → completed (všechny sessions hotové)
- Progress bar u klienta

### 5.4 Plánování tréninků
- **Týdenní pohled** jako výchozí (pondělí–neděle)
- **Denní pohled** pro detail
- Vytvoření tréninku: klient, datum+čas, místo, poznámky
- Přiřazení k balíčku (automaticky aktivní balíček klienta)
- Délka tréninku: vždy 60 minut (fixed)
- Stavy: scheduled → completed / cancelled / no_show

### 5.5 Živý logging cviků (hlavní workflow během tréninku)

**Flow:**
1. Trenér otevře naplánovaný trénink → klikne "Začít trénink"
2. Přidává cviky z knihovny nebo ze šablony
3. U každého cviku přidává série:
   - **Opakování** (reps) – číslo
   - **Váha** (kg) – číslo
   - **Poznámky** – volitelný text
4. **Předvyplněné hodnoty:** pokud klient dělal stejný cvik v předchozím tréninku, hodnoty se předvyplní (reps + weight z minula), trenér jen upraví
5. Po dokončení → "Dokončit trénink" → session = completed, used_sessions += 1

**UI koncepty:**

```
┌──────────────────────────┐
│ ← Jan Novák     00:32:10 │
├──────────────────────────┤
│                          │
│ 1. Bench Press           │
│ ┌──────┬───────┬───────┐ │
│ │ Série│ Reps  │ Kg    │ │
│ ├──────┼───────┼───────┤ │
│ │ 1  ✓ │ 12    │ 80    │ │
│ │ 2  ✓ │ 10    │ 85    │ │
│ │ 3    │ [12]  │ [85]  │ │ ← předvyplněné z minula
│ └──────┴───────┴───────┘ │
│ [+ Série]  📝 Poznámka   │
│                          │
│ 2. Incline DB Press      │
│ ┌──────┬───────┬───────┐ │
│ │ 1    │ [12]  │ [26]  │ │ ← předvyplněné
│ └──────┴───────┴───────┘ │
│ [+ Série]  📝 Poznámka   │
│                          │
│ ──────────────────────── │
│ [+ Cvik]  [📋 Šablona]   │
│                          │
│   [✅ Dokončit trénink]   │
└──────────────────────────┘
```

### 5.6 Knihovna cviků
- Seznam cviků s vyhledáváním podle názvu
- Každý cvik: pouze název
- CRUD operace (přidat, editovat, smazat)
- Sdílená napříč všemi klienty

### 5.7 Šablony tréninků
- Uložení sestavy cviků jako šablona (název + cviky s výchozím počtem sérií)
- Rychlé načtení šablony do živého tréninku
- Úprava šablon

### 5.8 InBody
- **Evidence měření:** datum, váha, % tuku, svalová hmota, BMI, viscerální tuk, % vody + custom
- **Upload fotek:** přímo z fotoaparátu nebo galerie → Supabase Storage
- **Grafy pokroku:** váha a % tuku v čase (Recharts)
- **Připomínka:** automaticky přes ICS alarm 5 min před prvním tréninkem nového balíčku

---

## 6. Struktura stránek

```
/                              → Dashboard
/login                         → Přihlášení

/clients                       → Seznam klientů
/clients/new                   → Nový klient
/clients/[id]                  → Profil klienta (tabs: přehled, balíčky, tréninky, inbody)
/clients/[id]/packages/new     → Nový balíček
/clients/[id]/inbody/new       → Nové InBody měření

/calendar                      → Týdenní/denní kalendář
/sessions/new                  → Naplánovat trénink
/sessions/[id]                 → Detail tréninku
/sessions/[id]/live            → Živý logging cviků

/exercises                     → Knihovna cviků
/exercises/new                 → Nový cvik
/templates                     → Šablony tréninků
/templates/new                 → Nová šablona

/settings                      → Nastavení (profil, ICS URL)
/api/ics/[token]               → ICS feed endpoint (veřejný)
```

---

## 7. Tech Stack

| Technologie | Účel | Verze |
|-------------|------|-------|
| Next.js | App Router, API routes, PWA | 14+ |
| Supabase | PostgreSQL, Auth, Storage | latest |
| Tailwind CSS | Styling | 3.x |
| @ducanh2912/next-pwa | PWA support | latest |
| ical-generator | ICS feed generování | latest |
| Recharts | Grafy InBody | latest |
| date-fns | Práce s datumy | latest |
| Framer Motion | Animace | latest |
| Vercel | Hosting | - |

---

## 8. MVP Fáze

### Fáze 1 – Základ (2-3 týdny)
- [x] Supabase setup (DB schéma, auth, RLS)
- [ ] Auth (email/password login pro jednoho trenéra)
- [ ] Dashboard s dnešními tréninky
- [ ] CRUD klienti (seznam, profil, poznámky)
- [ ] CRUD balíčky (vytvoření, evidence platby, progress)
- [ ] Plánování sessions (vytvoření, kalendářní pohled)
- [ ] ICS feed endpoint se všemi alarmy
- [ ] PWA manifest + ikona na plochu

### Fáze 2 – Tréninky (2 týdny)
- [ ] Knihovna cviků + CRUD
- [ ] Šablony tréninků
- [ ] Živý logging cviků
- [ ] Předvyplňování hodnot z předchozího tréninku
- [ ] Automatické odpočítávání sessions z balíčku

### Fáze 3 – InBody (1 týden)
- [ ] InBody evidence + formulář
- [ ] Upload fotek (Supabase Storage)
- [ ] Grafy pokroku (Recharts)

### Fáze 4 – Polish (1 týden)
- [ ] Offline podpora (service worker cache)
- [ ] Animace a přechody
- [ ] Edge cases (zrušené tréninky, no-show, přesuny)
- [ ] Testování na reálném iPhonu

---

## 9. Důležité business rules

1. **Jeden klient = max 1 aktivní balíček.** Nový balíček lze vytvořit až po dokončení/expiraci předchozího.

2. **Dokončení tréninku** automaticky inkrementuje `used_sessions` v balíčku. Když `used_sessions == total_sessions`, balíček přejde do stavu `completed`.

3. **Zrušený trénink / no_show** se NEODEČÍTÁ z balíčku (konfigurovatelné).

4. **ICS feed** se generuje dynamicky při každém requestu – vždy aktuální data. Apple Calendar polluje ~každých 15 min.

5. **Předvyplňování cviků:** při přidání cviku do živého tréninku se vyhledá poslední session_exercise se stejným exercise_id pro daného klienta a předvyplní se reps + weight z posledních sérií.

6. **InBody reminder** je vázaný na první session v balíčku, ne na časový interval. Trenér tak dostane připomínku přesně když začíná nový tréninkový cyklus.

---

## 10. Design systém

### Trenér
- **Jméno:** Jan Richter

### Barevná paleta – Monochrome

```css
:root {
  --black:       #000000;    /* Primární text, hlavní CTA */
  --gray-900:    #111111;    /* Pozadí karet (dark mode feel) */
  --gray-800:    #1A1A1A;    /* Pozadí appky */
  --gray-700:    #2A2A2A;    /* Sekundární pozadí, input fields */
  --gray-600:    #3A3A3A;    /* Borders, dividers */
  --gray-500:    #6B6B6B;    /* Placeholder text */
  --gray-400:    #8A8A8A;    /* Sekundární text */
  --gray-300:    #B0B0B0;    /* Disabled stavy */
  --gray-200:    #D4D4D4;    /* Subtle borders */
  --gray-100:    #EBEBEB;    /* Hover stavy */
  --white:       #FFFFFF;    /* Primární text na tmavém pozadí */

  /* Funkční barvy (minimální použití) */
  --success:     #22C55E;    /* Dokončeno, zaplaceno */
  --warning:     #F59E0B;    /* Poslední trénink, varování */
  --danger:      #EF4444;    /* Zrušeno, no-show, smazat */
}
```

### Typografie
- **Headings:** `font-family: 'Satoshi', sans-serif` – moderní geometric sans
- **Body:** `font-family: 'Inter', sans-serif` – čitelnost na mobilu
- Alternativa: `'General Sans'` nebo `'Cabinet Grotesk'` pro headings

### Designové principy
- **Tmavý základ** – dark UI (gray-800 pozadí), bílý text
- **Karty** – gray-900 s jemným borderem (gray-600), zaoblené rohy (12px)
- **Tlačítka:** bílé na černém (primární), outline (sekundární)
- **Animace:** Framer Motion – fade-in při přechodu stránek, staggered lists, micro-interactions na tlačítkách (scale on tap), smooth sheet/modal transitions zdola
- **Bottom sheet** místo modálů (mobilní pattern)
- **Haptic feedback** na důležité akce (dokončit trénink, přidat sérii)
- **Progress bary** – bílé s černým pozadím, plynulá animace
- **Minimální ikonografie** – Lucide icons, thin stroke
- **Spacing:** generous, vzdušný layout

### Ukázka UI komponent

```
┌─────────────────────────────┐
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░ gray-800 │  ← pozadí
│                             │
│ ┌─────────────────────────┐ │
│ │ ████████████████ gray-900│ │  ← karta
│ │                         │ │
│ │  Jan Novák              │ │  ← bílý text
│ │  Balíček: 7/10          │ │  ← gray-400
│ │  ▓▓▓▓▓▓▓▓░░░  70%      │ │  ← progress bar (white)
│ │                         │ │
│ └─────────────────────────┘ │
│                             │
│  [ ● Naplánovat trénink ]   │  ← bílé CTA tlačítko
│                             │
└─────────────────────────────┘
```

---

## 11. Bezpečnost

- Supabase Auth (email + password)
- RLS na všech tabulkách
- ICS token je unikátní UUID – URL je "unlisted" (kdo má URL, vidí kalendář, ale token nelze uhodnout)
- InBody fotky v privátním Supabase Storage bucketu (signed URLs)
- HTTPS everywhere (Vercel default)
