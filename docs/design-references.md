# UnikaLove — Design References (visual spec)

Textual record of the reference images/videos supplied by the founder, so any session can build UI without the originals.

## 1. Brand identity (poster image)

- **Logo:** two interlocked hearts — one pink, one gold outline — above the wordmark **UnikaLove** ("Unika" dark charcoal, "Love" pink)
- **Tagline:** "CONNECTER LES CŒURS, CÉLÉBRER L'AMOUR" (letterspaced small caps) · Hero line: "**L'amour** n'a pas de frontières" (bold dark + pink)
- **Sub:** "Rencontrez des personnes sincères et construisez une histoire vraie."
- **Palette:** primary pink `#D6336C`, gold `#C9A24B`, cream background `#FAF3EC`, charcoal text `#2B2B2B`, Facebook blue and Apple black on their buttons
- **Signup card** ("Commencez votre histoire / Inscrivez-vous gratuitement"): rounded white card, stacked full-width buttons — S'inscrire avec e-mail (pink), Continuer avec Google (white), Facebook (blue), Apple (black); footer link "Déjà un compte ? **Se connecter**"
- **Photo treatment:** warm couple photos cut into angled diagonal shards with thin gold seams down the right side of the layout
- **Feature icons row:** Profils vérifiés · Sécurité & Confidentialité · Match intelligents · Ouvert à tous (Africains & amoureux du monde entier) — circular pastel icon chips
- **Bottom edge:** pink wave band with gold ornamental flourish
- Typography: geometric humanist sans (Poppins-like); generous rounding on all cards/buttons

## 2. Admin dashboard mockup

Light gray canvas, white cards, pink accent.
- **Sidebar:** Dashboard, Users, Matches, Conversations, Payments, Reports, Content Management, App Settings, Notifications, Support, Logout; admin profile chip pinned bottom
- **Header:** "Dashboard — Welcome back!…", date-range picker, notification bell with badge
- **KPI cards (4):** Total Users, Total Matches, Conversations, Revenue — big number + green ▲ % vs last week + tinted circular icon
- **User Growth:** pink line/area chart, 7-day range selector, hover tooltip
- **Matches Overview:** donut (New 45% pink / Active 36% amber / Expired 19% purple) with center total
- **Gender Distribution:** donut (Female 53% pink / Male 47% purple)
- **Top Active Users:** avatar list with match counts, View All
- **Recent Activity:** icon feed (new user, new match, message, payment) with relative timestamps

## 3. User dashboard mockup ("DateLuxe" style — build as UnikaLove)

- **Sidebar:** Dashboard, Discover, Likes (badge), Matches (badge), Messages (badge), Bookmarks, Profile, Settings + "Go Premium / Upgrade Now" card pinned bottom
- **Header:** greeting "Good evening, Alex 👋", Upgrade to Premium pill, bell, chat, avatar menu
- **Discover People:** photo cards (name, age, verified ✓, city, interest tags) with actions ✕ / ★ / ♥, horizontal paging
- **Daily Picks:** compact horizontal cards, "updated daily"
- **Right rail:** Profile Completeness ring (80%, "Complete Profile" CTA) · Who Liked You (blurred avatars + count, premium hook) · Your Matches list with unread dots · Safety Tips card (shield icon, "Learn more")
- **Banner:** "Be seen by more people" + Boost Profile button (pink)

## 4. Landing page reference (Framer site)

Target feel for `apps/landing`: smooth scroll, scroll-triggered reveals, parallax layers, hover micro-interactions, sticky nav that condenses on scroll. Rebuild with Next.js + Framer Motion + Lenis — the animation quality is a requirement, not decoration.

## 5. Videos (`assets/video/`)

- `header-bg.mp4` (9.6MB) — **landing hero background**: autoplay, muted, loop, playsInline, dark gradient overlay for text legibility, poster frame fallback, respect `prefers-reduced-motion`
- `loop.mp4` (6.6MB) — animated brand-image loop for a secondary landing section or auth screens
