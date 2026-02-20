# FitCoach – Detailní analýza a návrhy vylepšení

> Datum analýzy: 2026-02-20
> Rozsah: ~165 souborů, 9 databázových tabulek, 11 server actions, 2 API routes

---

## Obsah

1. [Shrnutí](#1-shrnutí)
2. [Architektura a struktura](#2-architektura-a-struktura)
3. [Bezpečnost](#3-bezpečnost)
4. [Výkon](#4-výkon)
5. [Kvalita kódu](#5-kvalita-kódu)
6. [UI/UX a přístupnost](#6-uiux-a-přístupnost)
7. [Konfigurace a build](#7-konfigurace-a-build)
8. [Databáze](#8-databáze)
9. [Prioritizovaný seznam vylepšení](#9-prioritizovaný-seznam-vylepšení)

---

## 1. Shrnutí

Aplikace FitCoach je dobře strukturovaná PWA s moderním tech stackem (Next.js 16, React 19, Supabase, Tailwind v4). Kódová základna vykazuje konzistentní vzory, silnou typovou bezpečnost a promyšlený design systém. Identifikováno bylo **47 konkrétních oblastí pro vylepšení** v kategoriích bezpečnost, výkon, kvalita kódu a UX.

### Celkové hodnocení

| Oblast | Hodnocení | Poznámka |
|--------|-----------|----------|
| Architektura | 8/10 | Čistá separace, správné SSR/CSR dělení |
| Bezpečnost | 7/10 | Silné RLS, ale chybí validace vstupů na některých místech |
| Výkon | 7/10 | Dobrá memoizace, ale N+1 dotazy a chybějící lazy loading |
| Kvalita kódu | 7/10 | Konzistentní vzory, duplikace na několika místech |
| UI/UX | 8/10 | Promyšlený dark theme, ale mezery v přístupnosti |
| Konfigurace | 6/10 | Chybí testy, pre-commit hooks, offline stránka |

---

## 2. Architektura a struktura

### Silné stránky

- **Správné dělení server/client komponent** — stránky jako Dashboard používají async server komponenty pro data fetching, interaktivní části jsou `'use client'`
- **Server Actions** — 11 souborů s konzistentním vzorem: auth check → Zod validace → Supabase operace → revalidace
- **Middleware** — správně chrání všechny routy kromě `/login` a `/api/ics`
- **Typový systém** — plné TypeScript pokrytí se `strict: true`

### Problémy

#### P1: Nekonzistentní data fetching pattern
**Soubor:** `src/app/clients/page.tsx`

Stránka klientů používá `Suspense` wrapper, ale uvnitř fetchuje data client-side přes `useEffect` + `useState`. Tím se ztrácí výhoda Suspense a server-side renderingu.

**Řešení:** Převést na server komponentu s async data fetchingem nebo použít React `use()` hook.

#### P2: Chybějící offline stránka
**Soubor:** `next.config.ts` (řádek 7)

PWA konfigurace odkazuje na `/offline` fallback, ale route `src/app/offline/page.tsx` neexistuje. Uživatel při výpadku připojení uvidí výchozí browser chybu.

**Řešení:** Vytvořit `/src/app/offline/page.tsx` se smysluplným offline UI.

---

## 3. Bezpečnost

### Silné stránky

- **RLS (Row Level Security)** — správně implementované na všech 9 tabulkách
- **Auth middleware** — chrání všechny routy, odděluje veřejný ICS endpoint
- **`trainer_id` z auth kontextu** — nikdy z formuláře, vždy z `auth.uid()`
- **ICS rate limiting** — 30 req/60s chrání veřejný endpoint
- **Kaskádové mazání** — ON DELETE CASCADE na závislých tabulkách
- **RPC funkce** — atomické operace pro inkrementaci/dekrementaci session counts

### Kritické problémy

#### B1: Chybějící validace velikosti nahrávaných fotek
**Soubor:** `src/lib/actions/inbody.ts` (řádky 34, 72)

Fotky se nahrávají do Supabase Storage bez kontroly velikosti souboru. Útočník (nebo chyba) může nahrát extrémně velké soubory.

```typescript
// Současný stav - žádná kontrola velikosti
const { error: uploadError } = await supabase.storage
  .from('inbody-photos')
  .upload(path, photo)
```

**Řešení:** Přidat validaci na max. 10 MB per soubor a celkový limit.

#### B2: JSONB pole bez schema validace
**Soubory:** `session-exercises.ts`, `templates.ts`, `inbody.ts`

Pole `sets`, `exercises` (templates) a `custom_data` se ukládají jako JSONB bez Zod validace struktury. Může dojít k uložení poškozených dat.

```typescript
// session-exercises.ts - sets se ukládají bez validace
await supabase.from('session_exercises').update({ sets })
```

**Řešení:** Přidat Zod schéma pro každý JSONB typ:
```typescript
const SetSchema = z.array(z.object({
  reps: z.number().int().positive(),
  weight: z.number().nonnegative(),
}))
```

#### B3: Chybějící validace v recurring.ts
**Soubor:** `src/lib/actions/recurring.ts`

Parametry `dayOfWeek`, `time` a `startDate` nemají žádnou validaci formátu. Nevalidovaný vstup může způsobit neočekávané chování.

**Řešení:** Přidat Zod schéma s validací formátů.

#### B4: Chybějící validace v settings.ts
**Soubor:** `src/lib/actions/settings.ts` (řádek 26)

`updateTrainerProfile()` přijímá name a email bez jakékoliv validace.

**Řešení:** Přidat `z.string().email()` a `z.string().min(1).max(100)`.

### Střední problémy

#### B5: ICS rate limiter nefunkční na multi-instance deploymentu
**Soubor:** `src/app/api/ics/[token]/route.ts`

In-memory rate limiter nefunguje na Vercel (každá serverless funkce má vlastní paměť). Každá instance má separátní mapu.

**Řešení:** Použít Redis/Upstash pro perzistentní rate limiting, nebo Vercel Edge Config.

#### B6: Slabé generování náhodných cest pro fotky
**Soubor:** `src/lib/actions/inbody.ts`

```typescript
const path = `inbody/${clientId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
```

`Math.random()` není kryptograficky bezpečný.

**Řešení:** Použít `crypto.randomUUID()`.

#### B7: Chybějící validace UUID formátu tokenu
**Soubor:** `src/app/api/ics/[token]/route.ts`

Token parametr se nevaliduje proti UUID formátu před databázovým dotazem.

---

## 4. Výkon

### Silné stránky

- **`React.memo`** — správně použit na `ExerciseBlock` a `SetRow` (nejčastěji renderované komponenty)
- **Debounced search** — 300ms timeout na vyhledávání
- **Batch insert** — recurring sessions se vkládají jedním dotazem
- **Komprese obrázků** — InBody fotky se komprimují před uploadem (maxWidth=1200, quality=0.8)
- **`useReducedMotion`** — respektuje uživatelské nastavení pro snížení animací

### Problémy

#### V1: N+1 dotazy na dashboardu
**Soubor:** `src/lib/actions/dashboard.ts`

Dashboard provádí 6 separátních Supabase dotazů — dnešní sessions, počet za týden, aktivní klienti, balíčky, weekly breakdown, alerty. Některé lze sloučit.

**Řešení:** Konsolidovat do 2-3 dotazů nebo použít Supabase RPC funkci.

#### V2: Sekvenční generování signed URLs
**Soubor:** `src/lib/actions/inbody.ts` (řádky 142-147)

```typescript
for (const path of record.photo_urls) {
  const { data } = await supabase.storage.from('inbody-photos').createSignedUrl(path, 3600)
  // ...
}
```

Signed URLs se generují sekvenčně místo paralelně.

**Řešení:** `Promise.all(paths.map(p => supabase.storage.from('inbody-photos').createSignedUrl(p, 3600)))`

#### V3: Neefektivní fallback v getLastExerciseSets()
**Soubor:** `src/lib/actions/sessions.ts` (řádky 88-110)

Při selhání hlavního dotazu se provede až 10 separátních dotazů jako fallback.

**Řešení:** Opravit hlavní dotaz nebo použít efektivnější fallback s jedním dotazem.

#### V4: Loop-based delete místo batch delete
**Soubor:** `src/lib/actions/sessions.ts` — `deleteFutureRecurringSessions()`

```typescript
// Současný stav - N separátních DELETE dotazů
for (const session of sessions) {
  await supabase.from('sessions').delete().eq('id', session.id)
}
```

**Řešení:**
```typescript
await supabase.from('sessions').delete()
  .eq('recurrence_group_id', groupId)
  .gt('scheduled_at', afterDate)
```

#### V5: Chybějící lazy loading na obrázcích
**Soubor:** `src/components/clients/inbody-photos.tsx`

```html
<img src={url} alt="" className="h-full w-full object-cover" />
<!-- Chybí loading="lazy" -->
```

#### V6: Chybějící databázové indexy
Chybí indexy na často filtrované sloupce:
- `idx_sessions_trainer_client` na `(trainer_id, client_id)`
- `idx_packages_client_status` na `(client_id, status)`
- `idx_inbody_client_measured` na `(client_id, measured_at)`

---

## 5. Kvalita kódu

### Silné stránky

- **Konzistentní formulářový pattern** — všechny formuláře používají stejný vzor: `useState` pro loading/error, `submittingRef` proti double submit, haptic feedback
- **Čistá adresářová struktura** — komponenty organizovány podle domény (clients, sessions, exercises, templates, settings)
- **Znovupoužitelné UI komponenty** — 20 base komponent v `ui/` adresáři
- **Správné Framer Motion vzory** — staggered lists, page transitions, scale on tap

### Duplikace kódu

#### K1: Superset group labeling logika (2× duplikována)
**Soubory:** `src/components/sessions/exercise-editor.tsx` (řádky 188-211), `src/app/sessions/[id]/page.tsx` (řádky 115-129)

Identická logika pro mapování superset skupin na písmena (A, B, C...) existuje na dvou místech.

**Řešení:** Extrahovat do `src/lib/utils.ts` jako `getSupersetLabels()`.

#### K2: Session status variant mapping (3× duplikována)
**Soubory:** `today-sessions.tsx`, `session-detail-actions.tsx`, session card

```typescript
const statusVariant: Record<SessionStatus, 'default' | 'success' | 'warning' | 'danger'> = {
  scheduled: 'default',
  completed: 'success',
  cancelled: 'danger',
  no_show: 'warning',
}
```

**Řešení:** Přesunout do `src/lib/constants.ts`.

#### K3: IconCard pattern (5×+ duplikován)
Opakující se pattern pro ikonu v kruhovém kontejneru:
```typescript
<div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-elevated">
  <SomeIcon className="h-5 w-5 text-text-secondary" strokeWidth={1.5} />
</div>
```

**Řešení:** Vytvořit `<IconCard icon={...} />` komponentu.

### Další problémy

#### K4: Tichá selhání (silent failures)
**Soubory:** `exercise-editor.tsx`, `app-shell.tsx`, `inbody.ts`

```typescript
// exercise-editor.tsx
catch (err) {
  console.error('Failed to get last exercise sets:', err) // Uživatel nevidí chybu
}

// app-shell.tsx
fetch('/api/sessions/auto-complete', { method: 'POST' }).catch(() => {}) // Úplně ignorováno
```

**Řešení:** Přidat uživatelsky viditelné error handling nebo retry logiku.

#### K5: Inline type assertions
**Soubor:** `src/app/sessions/[id]/page.tsx` (řádek 90)

```typescript
exercises={(exercises || []) as ExerciseWithRelation[]}
```

**Řešení:** Opravit typování v server action vrácením správného typu.

#### K6: `renderGroups` bez memoizace
**Soubor:** `src/components/sessions/exercise-editor.tsx`

Výpočet render groups se provádí při každém renderování bez `useMemo`.

---

## 6. UI/UX a přístupnost

### Silné stránky

- **Dark monochromatic theme** — konzistentní sémantické barvy
- **Bottom sheet pattern** — správná implementace s `role="dialog"`, `aria-modal`, focus trap, Escape key
- **`aria-labels` na icon buttons** — většina tlačítek má popis
- **Sémantické HTML** — formuláře s `<label>`, `htmlFor`, `aria-describedby`
- **`font-display: swap`** — fonty neblokují rendering
- **Haptic feedback** — na klíčových akcích

### Problémy přístupnosti

#### A1: Chybějící alt text na obrázcích
**Soubor:** `src/components/clients/inbody-photos.tsx`

```html
<img src={url} alt="" className="..." />
```

Prázdný `alt=""` je správný pro dekorativní obrázky, ale InBody fotky jsou obsahové — potřebují popisný alt text.

**Řešení:** `alt={`InBody foto ${index + 1} - ${clientName}`}`

#### A2: Chybějící ARIA live regions
Toast notifikace a undo akce nemají `aria-live` atribut. Screen readery neoznámí tyto změny.

**Řešení:** Přidat `role="status"` a `aria-live="polite"` na toast kontejner.

#### A3: Informace předávané pouze barvou
Status badges v některých kontextech spoléhají pouze na barvu bez textového doprovodu. Problematické pro barvoslepé uživatele.

#### A4: Chybějící `aria-busy` na formulářích
Při odesílání formuláře se zobrazí spinner, ale stav se neoznámí screen readerům.

---

## 7. Konfigurace a build

### Silné stránky

- **Moderní stack** — Next.js 16.1.6, React 19.2.3, TypeScript 5 strict
- **Aktuální závislosti** — žádné zastaralé balíčky
- **ESLint v9** — flat config s Next.js pravidly
- **PWA** — správná konfigurace, skipWaiting pro okamžité aktualizace

### Problémy

#### C1: Žádný testovací framework
Projekt nemá žádné testy — chybí Vitest/Jest, Testing Library, žádné E2E testy.

**Řešení:** Přidat Vitest + React Testing Library, začít s testy pro kritické server actions (sessions.ts, packages.ts).

#### C2: Chybějící pre-commit hooks
Žádný husky/lint-staged setup. Chybný kód se může dostat do repozitáře bez kontroly.

**Řešení:** `npm install -D husky lint-staged` a nakonfigurovat lint + typecheck pre-commit.

#### C3: Chybějící `.env.example`
Nový vývojář neví, jaké env proměnné jsou potřeba.

#### C4: Env proměnné bez runtime validace
**Soubory:** `src/lib/supabase/client.ts`, `server.ts`

```typescript
process.env.NEXT_PUBLIC_SUPABASE_URL!  // Non-null assertion bez kontroly
```

**Řešení:** Vytvořit `src/lib/env.ts` s validací při startu aplikace.

#### C5: ESLint bez custom rules
Chybí pravidla pro: nepoužívané importy, `console.log` v produkci, React hooks dependencies.

#### C6: TypeScript target ES2017
Může být aktualizován na ES2020 pro lepší podporu moderních JS features.

#### C7: Chybějící tailwind.config.ts
Tailwind v4 funguje bez config souboru, ale explicitní konfigurace zlepší DX a umožní pluginy.

---

## 8. Databáze

### Silné stránky

- **9 tabulek** — čistý normalizovaný schema
- **RLS na všech tabulkách** — data izolace per trainer
- **CHECK constraints** — `used_sessions >= 0`, `total_sessions > 0`, `duration 1-480 min`
- **Unique constraint** — `idx_one_active_package_per_client` vynucuje business pravidlo
- **RPC funkce** — atomické operace pro kritickou business logiku
- **5 migrací** — čistá evoluce schématu

### Problémy

#### D1: TOCTOU race condition při vytváření balíčků
**Soubor:** `src/lib/actions/packages.ts` (řádky 39-44)

Kontrola aktivního balíčku a vložení nového nejsou atomické. Mezi nimi může přijít souběžný request.

**Řešení:** Databázový unique constraint `idx_one_active_package_per_client` již existuje — stačí se spolehout na něj a odchytit constraint violation error.

#### D2: Chybějící indexy na často dotazované sloupce
Viz V6 výše.

#### D3: Storage RLS s neoptimálním subquery
```sql
auth.uid() IN (SELECT id FROM trainers)
```

Mohl by být optimalizovaný nebo cachovaný.

---

## 9. Prioritizovaný seznam vylepšení

### Kritické (bezpečnost, data integrity)

| # | Vylepšení | Soubor(y) | Effort |
|---|-----------|-----------|--------|
| 1 | Validace velikosti upload souborů (max 10 MB) | `inbody.ts` | Malý |
| 2 | Zod validace JSONB polí (sets, exercises, custom_data) | `session-exercises.ts`, `templates.ts` | Střední |
| 3 | Validace vstupů v `recurring.ts` (dayOfWeek, time, startDate) | `recurring.ts` | Malý |
| 4 | Validace vstupů v `settings.ts` (email format) | `settings.ts` | Malý |
| 5 | Použít `crypto.randomUUID()` místo `Math.random()` pro cesty fotek | `inbody.ts` | Malý |

### Vysoká priorita (výkon, UX)

| # | Vylepšení | Soubor(y) | Effort |
|---|-----------|-----------|--------|
| 6 | Vytvořit offline stránku `/app/offline/page.tsx` | Nový soubor | Malý |
| 7 | Batch delete v `deleteFutureRecurringSessions()` | `sessions.ts` | Malý |
| 8 | `Promise.all` pro signed URL generování | `inbody.ts` | Malý |
| 9 | Konsolidace dashboard dotazů | `dashboard.ts` | Střední |
| 10 | Přidat `loading="lazy"` na InBody obrázky | `inbody-photos.tsx` | Malý |
| 11 | Opravit `getLastExerciseSets()` fallback | `sessions.ts` | Střední |
| 12 | Přidat alt text na InBody fotky | `inbody-photos.tsx` | Malý |
| 13 | Přidat ARIA live regions na toast | `toast.tsx` | Malý |

### Střední priorita (kvalita kódu, DX)

| # | Vylepšení | Soubor(y) | Effort |
|---|-----------|-----------|--------|
| 14 | Extrahovat superset labeling do utility funkce | `utils.ts` | Malý |
| 15 | Přesunout status variant mapping do constants | `constants.ts` | Malý |
| 16 | Vytvořit `<IconCard>` komponentu | `ui/icon-card.tsx` | Malý |
| 17 | Vytvořit `.env.example` | Nový soubor | Malý |
| 18 | Přidat env runtime validaci | `lib/env.ts` | Malý |
| 19 | Nastavit Vitest + Testing Library | Config soubory | Střední |
| 20 | Přidat husky + lint-staged | Config soubory | Malý |
| 21 | Rozšířit ESLint pravidla | `eslint.config.mjs` | Malý |
| 22 | `useMemo` pro renderGroups v exercise editoru | `exercise-editor.tsx` | Malý |
| 23 | Přidat databázové indexy | Nová migrace | Malý |

### Nízká priorita (nice to have)

| # | Vylepšení | Soubor(y) | Effort |
|---|-----------|-----------|--------|
| 24 | Migrace ICS rate limiteru na Redis/Upstash | `api/ics/[token]/route.ts` | Střední |
| 25 | Aktualizovat TypeScript target na ES2020 | `tsconfig.json` | Malý |
| 26 | Bundle analyzer setup | `next.config.ts` | Malý |
| 27 | PWA update notifikace pro uživatele | Nová komponenta | Střední |
| 28 | Validace UUID formátu ICS tokenu | `api/ics/[token]/route.ts` | Malý |

---

## Závěr

FitCoach je kvalitně strukturovaná aplikace s promyšlenou architekturou pro single-trainer use case. Nejdůležitější oblasti pro zlepšení jsou:

1. **Bezpečnost** — doplnit chybějící validace vstupů (JSONB pole, upload limity, recurring params)
2. **Výkon** — eliminovat N+1 dotazy a sekvenční operace tam, kde lze paralelizovat
3. **DX** — přidat testy, pre-commit hooks a env validaci
4. **Přístupnost** — doplnit alt texty, ARIA live regions

Celkově je kódová základna na solidní úrovni a vylepšení jsou spíše inkrementální než strukturální.
