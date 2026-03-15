# Cognify

## Versatile Multi-LLM Chat Application with User Profiles and Group Chats

Cognify je webová aplikace, která umožňuje uživatelům komunikovat s různými velkými jazykovými modely (LLM) a zároveň
spravovat své uživatelské profily. Aplikace podporuje skupinové chaty, správu tokenů pro využití LLM, rozvětvování
konverzací a jejich ukládání.

## Cíle projektu

Cílem této aplikace je nabídnout flexibilní prostředí, kde mohou uživatelé interagovat s více LLM službami a ostatními
uživateli, přičemž mají plnou kontrolu nad svým profilem a možnostmi interakcí. Aplikace zahrnuje následující klíčové
funkce:

- **Multi-LLM chat**: Možnost přepínání mezi různými LLM během chatu.
- **Groupchaty s LLM**: Uživatelé mohou sdílet chat s více lidmi v jednom chatu, kde každý může přispívat a komunikovat
  s LLM.
- **Správa uživatelských profilů**: Uživatelé mohou vytvářet a spravovat své profily.
- **Admin panel**: Správa tokenů a monitorování limitů (počet requestů/dolarů na určité časové období).
- **Rozvětvení konverzací**: Uživatelé mohou rozdělit konverzaci do různých větví a vizualizovat historii chatu, přičemž
  se mohou kdykoliv vrátit k předchozí větvi.
- **Ukládání zpráv**: Možnost ukládání jednotlivých zpráv nebo celých konverzací.

## Funkce aplikace

1. **Registrace a přihlášení uživatelů**: Uživatelé se mohou registrovat, přihlašovat a spravovat své účty.
2. **Groupchat s LLM**: Uživatelé mohou vytvářet skupinové konverzace s více lidmi, přičemž každý účastník může
   interagovat s LLM.
3. **Správa tokenů (admin)**: Správa počtu requestů nebo dolarového limitu, který každý uživatel může využít během
   určitého období. Tato možnost je dostupná pouze pro administrátory.
4. **Rozvětvení konverzace**: Uživatelé mohou větvit konverzace na různé scénáře a vizualizovat celou historii
   interakcí, s možností vracet se k předchozím větvím.
5. **Ukládání zpráv a konverzací**: Uživatelé mohou ukládat jednotlivé zprávy nebo celé konverzace pro budoucí
   reference.
6. **Základní statistiky**: Zobrazení statistik interakcí s různými LLM modely a přehled uživatelských aktivit.

## Technický stack

- **Frontend**: React
- **Backend**: Supabase
- **Jazyk**: TypeScript
- **Databáze**: PostgreSQL
- **Styling**: TailwindCSS
- **UI**: Shadcn UI

## Instalace a spuštění projektu

### 1. Klonování repozitáře

```bash
git clone https://github.com/tvuj-username/cognify.git
cd cognify
```

### 2. Instalace závislostí

Použijte následující příkaz pro instalaci všech potřebných závislostí projektu:

```bash
pnpm install
```

### 3. Nastavení prostředí

Backend používá vlastní `.env` soubor. Zkopírujte [backend/.env.example](backend/.env.example) do `backend/.env` a upravte hodnoty:

```env
PORT=3000
HOST=localhost
PORT_FALLBACK=false
MIKRO_ORM_TYPE=postgresql
MIKRO_ORM_HOST=localhost
MIKRO_ORM_PORT=5432
MIKRO_ORM_DB_NAME=cognify
MIKRO_ORM_USER=postgres
MIKRO_ORM_PASSWORD=postgres
```

Pri spusteni pres `pnpm dev` backend bezi s `NODE_ENV=development`, takze pokud je `PORT` obsazeny, automaticky zkusi dalsi volny port.

`PORT_FALLBACK` je volitelne a slouzi jako explicitni override. Vychozi chovani je:

- `NODE_ENV=development`: pokud je `PORT` obsazeny, backend se pokusi najit dalsi volny port.
- ostatni prostredi: backend selze s chybou, aby se neporusilo ocekavane bindovani portu (Docker/K8s/health checks).

Nastavenim `PORT_FALLBACK=true` muzete fallback povolit explicitne i mimo development. Nastavenim `PORT_FALLBACK=false` jej naopak vynutene vypnete i v developmentu.

Frontend očekává `VITE_API_BASE_URL` v `frontend/.env` (např. `VITE_API_BASE_URL=http://localhost:3000`).
Pokud backend při lokálním vývoji přejde kvůli obsazenému portu na jiný port, aktualizujte tuto hodnotu na skutečnou URL backendu.

### 4. Spuštění vývojového serveru

Aplikaci spustíte pomocí následujícího příkazu:

```bash
pnpm dev
```

Po spuštění bude frontend dostupný na `http://localhost:5173` a backend standardně na `http://localhost:3000`.

## Architektura

### Frontend

Aplikace využívá **React** pro komponentově orientovaný vývoj.

### Backend

**Supabase** zajišťuje autentizaci uživatelů, ukládání dat a poskytování backend API. Používá **PostgreSQL** databázi,
která ukládá uživatelské profily, zprávy, tokeny, statistiky a další interakce.

### Styling

Pro rychlou a efektivní tvorbu uživatelského rozhraní aplikace používá **TailwindCSS**, což zjednodušuje správu
responzivního designu a umožňuje dynamické přizpůsobení stylů přímo ve vývoji. Pro komponenty a UI design je využíván *
*Shadcn UI**.

### Databáze

Databázová vrstva využívá **PostgreSQL** a spravuje ji Supabase. Data zahrnují:

- Uživatelé (profily, přístupové role, statistiky)
- Chaty (groupchaty, jednotlivé zprávy, LLM interakce)
- Správa tokenů (limit počtu requestů a dolarových částek)
- Ukládání a historie konverzací

## Správa tokenů (Admin panel)

**Admin účet** poskytuje možnost spravovat využití LLM tokenů pro jednotlivé uživatele, nastavit limity pro počet
požadavků nebo finanční náklady za určité časové období. Administrátor může sledovat využití tokenů v reálném čase a
upravovat limity pro každého uživatele.

## Licence

Tento projekt je licencován pod licencí **MIT**. Jedná se o bakalářskou práci na Fakultě informatiky a elektroniky na
VŠB - Technické univerzitě Ostrava.
