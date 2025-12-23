# Nacrtaj i Pogodi 🎨

Zabavna multiplayer igra crtanja i pogađanja inspirisana igrom Drawful. Igrači crtaju na svojim telefonima dok drugi pokušavaju pogoditi šta je nacrtano!

## 🎮 Kako igrati

1. **Kreiraj igru** - Jedan igrač kreira sobu i dobija 5-slovni kod
2. **Pridruži se** - Ostali igrači unose kod na svojim telefonima
3. **Crtaj** - Jedan igrač crta zadani pojam
4. **Pogađaj** - Ostali igrači pišu lažne odgovore
5. **Glasaj** - Svi glasaju za odgovor koji misle da je tačan
6. **Bodovi** - Zarađuj bodove za tačne odgovore i prevaru drugih!

## 🚀 Pokretanje

### Preduvjeti
- Node.js 18+
- Convex račun (besplatan na [convex.dev](https://convex.dev))

### Instalacija

```bash
# Instaliraj zavisnosti
npm install

# Pokreni Convex dev server (ovo će te uputiti da kreiraš projekat)
npx convex dev

# U drugom terminalu, pokreni Next.js
npm run dev
```

Aplikacija će biti dostupna na `http://localhost:3000`

### Deployment na Vercel

1. Push projekat na GitHub
2. Importuj u Vercel
3. Dodaj environment varijablu:
   - `NEXT_PUBLIC_CONVEX_URL` - tvoj Convex production URL

## 🛠️ Tehnologije

- **Next.js 15** - React framework
- **TypeScript** - Tipizacija
- **Tailwind CSS** - Stilizacija
- **shadcn/ui** - UI komponente
- **Convex** - Real-time baza podataka

## 📱 Funkcionalnosti

- ✅ Mobile-first dizajn
- ✅ Real-time sinkronizacija
- ✅ Touch-optimizirani canvas za crtanje
- ✅ 5-slovni kodovi za sobe
- ✅ Sistem bodovanja
- ✅ Potpuno na bosanskom jeziku

## 📁 Struktura projekta

```
draw-it/
├── src/
│   ├── app/                 # Next.js stranice
│   │   ├── page.tsx        # Početna stranica
│   │   └── game/[code]/    # Stranica igre
│   ├── components/
│   │   ├── ui/             # shadcn komponente
│   │   └── game/           # Komponente igre
│   └── lib/
│       └── i18n/           # Prijevodi
├── convex/                  # Convex backend
│   ├── schema.ts           # Shema baze
│   ├── games.ts            # Logika igara
│   ├── players.ts          # Logika igrača
│   ├── rounds.ts           # Logika rundi
│   └── guesses.ts          # Logika odgovora
└── public/
```

## 🎯 Bodovanje

- **1000 bodova** - Za tačan odgovor
- **500 bodova** - Za svaku osobu koju prevariš lažnim odgovorom
- **500 bodova** - Crtač dobija za svakog igrača koji pogodi

---

Napravljeno sa ❤️ za zabavu sa prijateljima!
