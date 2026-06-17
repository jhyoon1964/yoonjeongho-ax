# Slate — shop surfaces

Implementation of the **Slate Design System** e-commerce surfaces, built from the
Claude Design handoff bundle (`claude.ai/design`). Slate is a minimal lifestyle
editorial shop — charcoal `#1E1E1E` / ice-blue `#A8C8D8` / off-white `#F5F5F3`,
sharp corners, hairline borders, generous whitespace, Pretendard + JetBrains Mono.

These are standalone static pages — **independent of the rest of this repo** (윤정호's
personal site). Open `slate/index.html` to browse all three surfaces.

## Pages

| File | Surface | Notes |
|---|---|---|
| `index.html` | Launcher | Links to the three surfaces |
| `website.html` | Desktop e-commerce | Home (hero + grid) · PLP · PDP · cart badge — vanilla-JS click-through (`site.js`) |
| `app.html` | Mobile app | iOS frame · home · PDP (pinned CTA) · cart · bottom nav |
| `kiosk.html` | Popup kiosk | 1280×800 landscape · browse · detail · cart summary · checkout → confirmation |
| `intro.html` | Brand reel | 15초 SS 2026 신상 컬렉션 인트로 영상 — 16:9, 텍스트 애니메이션, 차콜 + 아이스 블루. 자동 재생, 클릭 시 다시 재생 |

## How it was built

The handoff bundle's prototypes were React-via-CDN mockups. They've been recreated as
**real static HTML/CSS + vanilla JS** (the technology that fits this repo), matching the
prototypes' visual output rather than copying their internal structure.

- `styles.css` — design-system entry (copied verbatim from the bundle): fonts → tokens → reset.
- `tokens/`, `base/`, `fonts/` — design-system foundation, copied verbatim (229 tokens).
- `shop.css` — the shop surfaces' component/layout CSS, authored against the tokens
  (inline prototype styles converted to real classes).
- `site.js` — website controller (SPA navigation, product grid, PDP, wishlist, cart).
- `app.html` / `kiosk.html` — each carries its own inline controller.

## Run

Any static server from the repo root, e.g. `python -m http.server 8765`, then open
`http://localhost:8765/slate/index.html`. Fonts load from CDN (Pretendard, JetBrains Mono).
