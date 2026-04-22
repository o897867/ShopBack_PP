# 临象财经 · LinXiangFinance — Design System

> **万象皆声，唯静者能听** — *All is noise, only the still can hear.*

Editorial financial intelligence for retail investors. Concise market news, AI‑summarised daily, plus a weekly deep‑dive mindmap and a playful daily I‑Ching "fortune" for traders. This design system captures the look, tone, tokens, and components of the live product.

---

## Index

| File / folder | Purpose |
|---|---|
| `README.md` | You are here. Brand context, content & visual foundations, iconography. |
| `colors_and_type.css` | Single source of truth for color/type tokens + semantic text primitives (`.lx-hero-title`, `.lx-eyebrow`, …). Import this in any artifact. |
| `SKILL.md` | Agent Skill frontmatter for Claude Code compatibility. |
| `assets/` | Brand imagery: `brain.png` (hero motif), `broker-logos/` (AvaTrade, EBC, Exness, FXCM, IC Markets, Pepperstone, TMGM, Eightcap). |
| `preview/` | HTML cards that populate the Design System tab — colors, type, components, spacing, brand. |
| `ui_kits/web/` | Full recreation of the LinXiang web product. Click‑through prototype (Home → News → Fortune → Weekly). `index.html` is the entry point; JSX components are modular (TopNav, NewsList, FortuneCard, WeeklyCard, …). |

---

## Source material

The system is derived from the production codebase:

- **Repo:** [github.com/o897867/ShopBack_PP](https://github.com/o897867/ShopBack_PP) @ `master` (commit `6d895ad9f815`).
  > Note: the repo README describes an earlier "ShopBack cashback" prototype — the *current* product on the `master` branch is the LinXiangFinance editorial platform (see `front-end/index.html`: *"FxLab — OneStop Trading Intelligence Platform"* and `front-end/src/pages/Home.jsx`: brand string `临象财经 / LinXiangFinance`). Both the legacy ShopBack dashboard screens and the new editorial Home/News/Fortune/Weekly screens coexist in the code; **this design system documents the editorial front end**, which is what end‑users see.
- **Key reference files consulted**
  - `front-end/index.html` — font loading, title
  - `front-end/src/index.css` — legacy theme tokens (Inter + Space Grotesk system; kept as dark‑theme inspiration)
  - `front-end/src/pages/Home.jsx` / `Home.css` — masthead, hero, stats strip, feature cards, two‑col news/weekly, fortune banner, CTA, footer
  - `front-end/src/pages/News.jsx` / `News.css` — masthead, category nav, meta bar, featured article, news list, live indicator
  - `front-end/src/pages/Fortune.jsx` / `Fortune.css` — shrine glyph, gua card, luck bar, 2×2 guidance grid
  - `front-end/src/components/TopNav.jsx` / `TopNav.css` — shared top bar, 740px measure

---

## Products

**LinXiangFinance (临象财经) — the web app**
Single React 19 + Vite SPA. Four public surfaces:

1. **Home** — masthead + hero + stats strip + 3 feature cards + news/weekly two‑column + fortune banner + broker open‑account CTA. 740px measure, editorial feel.
2. **News** (`/#news`) — newspaper‑style live news feed. Category nav, filters (sentiment / impact / language), featured top story, list, real‑time WebSocket updates.
3. **Fortune** (`/#fortune`) — *每日一卦 · 交易玄机*. Daily I‑Ching divination for traders. Shrine glyph → gua card with name, 象辞, verdict, 2×2 practical advice grid (今日操作 / 仓位建议 / 止损心法 / 吉时), and a 财运指数 bar.
4. **Weekly Mindmap** (`/weekly-mindmap`) — separate lazy‑loaded module. Timeline + graph + topics views, mobile/desktop viewport dispatch.

There's also a much larger **legacy analytics surface** (Trading/TradingView, OrderBook, Health, LeverageCalculator, LiquidityCrisisMap, Forum, Guide, Broker comparison…) accessed via the hamburger `Navigation` drawer. It uses an older token system (Inter/Space Grotesk + blue accent gradient). The editorial surface is the "real" brand; the legacy screens are being absorbed or retired.

---

## Content fundamentals

### Voice

Quiet, literary, slightly ironic. The brand promises to *cut noise* — so it writes short, with space around sentences. It mixes:

- **Compressed aphorism** — the Lora‑italic hero: *"万象皆声，唯静者能听"* / "All is noise, only the still can hear."
- **Plain utility** — descriptions read like a reliable friend, not a marketer: *"我们为普通投资者提供简洁、及时、不废话的市场资讯与交易参考"* ("We give ordinary investors concise, timely, no‑bullshit market intel"). Note the explicit *"不废话"* (no‑bullshit) — that's the house attitude.
- **Cheeky disclaimers** — the Fortune page's sign‑off is openly silly: *"本卦象纯属娱乐，亏损概不负责，盈利请记得烧香还愿"* ("Purely entertainment. Not responsible for losses; if you profit, remember to burn incense."). Humour never appears in News or Weekly — it's reserved for Fortune.

### Tone markers

- **First person plural** — "我们" / "we". Never "I". Rarely addresses user as "you"; the reader is assumed, not hailed.
- **No exclamation marks.** Even the "ready to trade?" CTA sits flat: *"准备好开始交易了吗？"*.
- **Arrows over chevrons.** Links and CTAs end in a literal `→` character: *"立即开户 →"*, *"了解更多 →"*, *"阅读完整周报 →"*. This is the brand's most recognizable micro‑signature.
- **Casing.** Chinese runs unchanged. English is **sentence case** (not Title Case) for labels and buttons: "Open account", "View all", "Real‑time news", "Weekly", "Learn more". Category filters in News are short nouns: Crypto, Policy, Indices, Forex.
- **No emoji** in product copy. A few utility icons (🔑, ⏸, ▶, ⟳) live only on admin/debug controls — never on marketing or editorial. **Iconography is line‑SVG Lucide**, not emoji.
- **Bilingual by default.** Every surface ships Chinese and English side‑by‑side; Chinese copy leads, English follows the same meter. Fortune is Chinese‑only (I‑Ching doesn't translate).
- **Dates & time.** Mono font. Chinese: `2026年4月22日 · 星期三`. English: `Wednesday, April 22, 2026`. Live timestamps: plain `14:32:07`. Relative: `3m ago` / `3分钟前`.
- **Numbers.** Mono font, no thousands separators under 4 digits, percentages with no decimal unless precision matters (`78%`, `4.2%`).

### Micro‑copy recipes

| Surface | Eyebrow | Title | Body |
|---|---|---|---|
| Hero | `面向散户的金融资讯平台` / mono 10px tracking 0.14em | *Lora italic aphorism, 32px* | DM Sans 13px muted, max 460px |
| Section | `关于我们` / `最新新闻` / mono 10px + hairline fill | — | — |
| News item | `BLOOMBERG` source (mono caps) | *Lora 14px 400* | DM Sans 12px 1.65 line‑height |
| Fortune | `每日一卦 · 交易玄机` | 卦名 `Lora 24px 600` | verdict DM Sans 1rem, 2px left border |

### What to avoid

- Marketing fluff: "revolutionary", "AI‑powered everything", "next generation". The brand promises *quiet*.
- Title Case English.
- Emoji in editorial/marketing.
- Hard‑sell language. The CTA *suggests* you "open account" — it doesn't say "unlock" or "claim".
- Bluish‑purple gradients, glowing bubbles, hero orbs. The legacy `index.css` has an aurora/bubble home page; it's being retired — don't replicate it in new work.

---

## Visual foundations

### Layout

- **Single column, 720–740px measure.** Every editorial surface (Home, News, Fortune) is centred in a narrow column (`max-width: 720px` or `740px`). Not fluid. Not grid‑heavy. This is the system's strongest shape — it reads like a journal.
- **Hero/body max 520px.** Hero descriptions wrap short. The aphorism breathes.
- **Section dividers are hairlines.** 1px (or 0.5px on retina) solid `var(--border)` across the full column, with ~32px vertical padding.
- **Section headers are mono eyebrow + hairline fill.** Pattern: `[MONO LABEL] ─────────────── [optional →]`. Label is 10–11px DM Mono, letter‑spacing 0.13–0.14em, uppercase; the line is `flex: 1; height: 1px; background: var(--border)`.
- **Stats strip** (hero→body transition) is a 3‑up `grid-template-columns: repeat(3, 1fr)` inside a bordered 8px‑radius container, with column dividers only.
- **Two‑column (news + weekly)** is `grid-template-columns: 1.4fr 1fr; gap: 32px`. Collapses to stacked at ≤768px.

### Typography

Three families, strict roles:

| Role | Family | Usage |
|---|---|---|
| **Serif display + body titles** | **Lora** (pairs with Noto Serif SC for CJK) | Brand mark, hero aphorism, section titles, card titles, article headings. Weights 400 / 500 / 600. |
| **Sans UI** | **DM Sans** (pairs with Noto Sans SC) | Body copy, buttons, form labels, nav links. Weights 300 / 400 / 500. |
| **Mono meta** | **DM Mono** (pairs with JetBrains Mono fallback) | Eyebrows, section labels, timestamps, source tags, week numbers, data labels in Fortune grid. Weight 400 primarily. |

- **Italic is a first‑class style** — the hero uses `<em>` set in Lora italic, with color dropped to `--text-muted`. Italics carry literary cadence, not emphasis.
- **Letter‑spacing** is tracked wide only on mono labels (`0.10em–0.16em`); serif gets a slight negative track (`-0.01em`); sans stays neutral.
- **No bold on body copy.** Weights top out at 500 for almost everything.

### Color

Paper‑plus‑hairline. The palette is intentionally narrow:

- **Surfaces** — `#f4f5f8` app bg, `#ffffff` paper, `#f8fafc` secondary, `#f0f0f0` softer.
- **Text** — `#1a1a1a` primary, `#6b7280` muted, `#999` tertiary, `#c0c0c0` quiet (eyebrow rest state).
- **Borders** — `#e5e5e5` standard hairline, `#f0f0f0` softer.
- **Primary blue** — `#3b82f6` for links, active nav, focus rings. Used sparingly — never as a background.
- **Sentiment** — green/amber/red hairline badges only. Backgrounds are *pastel tints* (`#f0fdf4`, `#fffbeb`, `#fef2f2`), borders mid‑sat, text deep. No solid‑filled sentiment pills.
- **I‑Ching luck spectrum** — the only place with a real 7‑step color ramp: `大吉 #22c55e → 吉 #4ade80 → 小吉 #facc15 → 平 #f59e0b → 险 #f97316 → 凶 #ef4444 → 大凶 #dc2626`. Used *only* on Fortune — don't repurpose.

### Dark mode

Near‑black paper — `#0f0f0f` app bg, `#1a1a1a` cards, `#2a2a2a` borders. Text warms to `#e5e5e5` / `#aaa` / `#666`. Same measure, same type, same spacing; only the values swap.

### Backgrounds

- **Flat paper by default.** No gradients, no illustration, no photography on editorial surfaces.
- **No hero image on Home.** The hero is just type.
- **The one decorative surface** is the legacy bubble/aurora homepage (`.home-bubbles` in `index.css`) — retired from the current Home but still in the codebase. Don't bring it forward.
- **Fortune has two concentric rings** (1px `#e5e5e5`, 1px `#f0f0f0`) around the gua glyph — geometric, not decorative.

### Borders & shadows

- **Hairline culture.** Almost every divider and card edge is a single 1px (often 0.5px on the News page) in `--border`. Shadows are *rare* — cards on editorial pages have none. The deeper `--shadow` / `--shadow-lg` tokens exist for the legacy dashboard screens only.
- **Radii — small.** 4px on selects/pills/search, 6px on buttons, 8px on cards and feature tiles, 12px on the weekly/fortune/CTA cards, 999px on pills/badges/luck‑bar track/fortune shrine ring. **Nothing is heavily rounded.**

### Elevation

None, essentially. The system doesn't use depth to communicate hierarchy — it uses **whitespace, hairlines, and type contrast**. A card is "elevated" by sitting inside a thin border, not by a drop shadow.

### Motion & interaction

- **Durations** — 120ms (button press), 150ms (hover), 300ms (crossfades, gua‑card reveal), 500–700ms (luck‑bar fill, shrine spin).
- **Easing** — plain `ease`. No spring, no bounce, no overshoot.
- **Hover state** on editorial links/items — **opacity drop to 0.65–0.85**, not color change. That's the signature hover.
- **Hover state** on buttons — background fades to `--panel-2` or `--bg-secondary`, no lift.
- **Active/press** — `transform: scale(0.97)` on primary buttons, `transform: translateY(0)` resets for cards.
- **Keyframed motion** is scoped to Fortune: `fortune-spin-in` (shrine glyph rotates in), `blink` (live dot, 2.5s), luck‑bar width transition (700ms).
- **No parallax, no scroll‑linked animation, no cursor trails.**

### Transparency & blur

Essentially unused on editorial surfaces. The legacy bubble home has backdrop blur — retired.

### Density

Compact. Body copy is 12–13px, not 16. Line heights are 1.55–1.75. Vertical rhythm between sections is 32px (`--sp-7`). Inside cards, 14–20px padding. This is a system tuned for *reading text*, not *scanning cards*.

---

## Iconography

### The brand image

`assets/brain.png` is the lone brand artefact. A glitchy, RGB‑split, neon‑on‑black brain side‑view used as the favicon. It signals: *"AI intelligence, a little weird, not corporate."* Treat it as the **master logo surrogate** — there is no official wordmark logo; the brand name is always set in type (Lora `临象` + Lora‑light `财经` / `LinXiang` + `Finance`).

### UI icons

- **Library:** **Lucide** (via `lucide-react`). All inline SVGs in the codebase match Lucide conventions — 24×24 viewBox, `stroke="currentColor"`, `stroke-width="1.5"`, no fills, round linecaps/joins. Examples from Home's feature cards: a circle‑with‑clock hands (*real‑time*), a line chart axis (*analysis*), a shield (*regulated*).
- **Substitution:** For HTML artifacts (no React), **link Lucide from CDN**:
  ```html
  <script src="https://unpkg.com/lucide@latest"></script>
  <i data-lucide="clock-3"></i>
  <script>lucide.createIcons();</script>
  ```
  Or inline the SVG directly. Match the product stroke width (1.5) and size (14–16px in UI, 20–24px on hero feature cards).
- **No icon fonts.** No Font Awesome, no Material Icons, no emoji as icons in editorial flows. A handful of unicode arrows (`→`, `↓`, `↑`) and symbols (`·` separator, `⟳` refresh) appear inline in button labels — that's intentional and matches the product's typographic style.

### Broker logos

`assets/broker-logos/` — real logos for eight forex/CFD brokers referenced by the product's broker comparison legacy feature. Use them at their native aspect, sit them on paper (never on color), size 20–40px tall, no drop shadow, no border.

### Emoji policy

**Don't.** Product copy has none. The few emoji in the legacy codebase (🔑 on "Health Token" nav item, 🔒 shields, ⏸ ▶ ⟳ on debug controls) are all in non‑editorial/admin surfaces and should be ported to Lucide where possible.

---

## Known caveats & substitutions

- **Fonts are loaded from Google Fonts** (Lora, DM Sans, DM Mono, Noto Serif/Sans SC, JetBrains Mono). No bundled `.ttf`/`.woff2` in the repo — the production site relies on the Google CDN too. If offline use is required, self‑host the four families with their full CJK subsets.
- **Brand wordmark logo:** none. The brand mark is always typeset. `brain.png` serves as the favicon and an informal "mascot" in hero artwork only.
- **The legacy Inter + Space Grotesk theme** (`front-end/src/index.css`) is preserved in the product for unconverted admin pages. New work should use the editorial Lora + DM Sans + DM Mono system documented here.

---

## Using this system

Any HTML artifact, slide, or prototype should:

1. Link the token sheet: `<link rel="stylesheet" href="colors_and_type.css">` (plus Google Fonts, which the token sheet already `@import`s).
2. Scaffold with the editorial measure: `max-width: 720px; margin: 0 auto;`.
3. Reach for the semantic type classes (`.lx-hero-title`, `.lx-section-title`, `.lx-card-title`, `.lx-eyebrow`, `.lx-meta`, `.lx-body`) before writing raw sizes.
4. Copy, don't invent, brand imagery — `assets/brain.png` and `assets/broker-logos/*` are the only approved bitmaps.
5. Pair a Chinese line with an English line when user‑facing; lead with Chinese for marketing, let the user's language toggle lead for utility.

**The signal is in the stillness. Don't crowd the page.**
