---
name: LinXiangFinance design system
description: Editorial financial-intelligence brand for 临象财经 / LinXiangFinance. Use when designing any LinXiang surface — news reader, fortune/I-Ching card, weekly mindmap, broker comparison, or marketing site. Provides Lora + DM Sans + DM Mono type tokens, paper-and-hairline color palette, 720-px editorial measure, Lucide icon conventions, and a click-through web UI kit (Home / News / Fortune). Tone is quiet, literary, no-bullshit, bilingual (中文 + English), no emoji.
---

# LinXiangFinance design system

This directory holds the complete design language for **临象财经 / LinXiangFinance** — an editorial financial-intelligence platform for retail investors. Every LinXiang artifact (landing pages, news reader, fortune card, weekly mindmap, marketing slides) should start here.

## When to invoke

Use this skill whenever you're designing:

- the LinXiang web product (Home, News, Fortune, Weekly Mindmap)
- marketing material for LinXiang
- a prototype styled "like 临象财经" or "editorial fintech, 720-px measure, Lora + DM Sans"
- anything that references the `ShopBack_PP` repo's editorial front-end

Do **not** use it for the legacy ShopBack cashback dashboard or the old Inter + Space Grotesk analytics screens.

## First steps

1. **Read `README.md`** — it documents brand voice, source files, content fundamentals, visual foundations, and iconography rules.
2. **Link `colors_and_type.css`** in any HTML artifact. It defines all color/type tokens plus semantic classes (`.lx-hero-title`, `.lx-section-title`, `.lx-card-title`, `.lx-eyebrow`, `.lx-meta`, `.lx-body`). Prefer these classes over raw sizes.
3. **Skim the `ui_kits/web/` prototype** for real-world component usage — the TopNav, NewsList, FortuneCard, WeeklyCard, CTA, and section-header patterns are all there.

## Non-negotiables

- **Measure:** 720–740 px centered column on editorial surfaces.
- **Type trio:** Lora (serif, titles), DM Sans (UI/body), DM Mono (meta). CJK fallbacks: Noto Serif SC, Noto Sans SC, JetBrains Mono.
- **Color:** paper + hairlines. One restrained primary blue. Sentiment tags are pastel-tinted with mid-sat borders. The 7-step I-Ching luck spectrum is Fortune-only.
- **No shadows** on editorial cards. Hairlines do the work.
- **Hover = opacity drop** (0.65–0.85), not color change.
- **Icons:** Lucide, stroke 1.5. No emoji in product copy. Arrows (`→`) are the signature CTA marker.
- **Bilingual by default:** Chinese leads, English follows. Sentence case in English.

## Assets

- `assets/brain.png` — glitchy neon brain, the brand's informal mascot / favicon. No wordmark logo exists; brand is always typeset.
- `assets/broker-logos/` — eight partner broker logos (AvaTrade, EBC, Exness, FXCM, IC Markets, Pepperstone, TMGM, Eightcap).

## Don't

- Don't invent gradients, hero orbs, or aurora backgrounds.
- Don't Title-Case English.
- Don't use emoji in editorial/marketing.
- Don't exceed 500–600 weight on any type.
- Don't drop shadows on editorial cards.
