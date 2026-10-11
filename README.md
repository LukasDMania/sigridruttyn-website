# sigridruttyn.be

Website for Sigrid Ruttyn, kinesist & lichaamswerker in Mortsel.

Static site built with [Astro](https://astro.build), hosted on Cloudflare Pages, texts editable via [Pages CMS](https://pagescms.org).

## Where things live

| What | File |
| --- | --- |
| Page texts (Wie ben ik, treatments, praktische info, privacy) | `src/content/pages/*.md` |
| Contact details, Calendly link, payment & cancellation text | `src/data/site.json` |
| Client reviews | `src/data/reviews.json` |
| Menu | `src/data/navigation.ts` |
| Colours & fonts | `src/styles/global.css` (`:root`) |
| Animations (smooth scroll, page transitions, breathing exercise) | `src/scripts/site.js` (GSAP + Lenis) |
| Home page headline & statement | `src/data/site.json` (`homeTitle`, `homeStatement`; `*woorden*` = cursief) |
| Photos | `public/images/` – set `image: /images/foto.jpg` in a page |

Prices and durations live once, in each treatment's front matter, and appear on the treatment page, the home page rows and the tarieven list.
Treatment pages can show optional blocks from their front matter: principles, steps, complaints, factors, a note and the preparation list (from `praktische-info.md`).
Everything works without JavaScript and respects "reduce motion"; the animations are an extra layer.

## Develop

```sh
npm install
npm run dev      # http://localhost:4321
npm run build    # output in dist/
```

## Go live (one-time)

1. **Domain**: register `sigridruttyn.be` at a Belgian registrar (Cloudflare Registrar does not sell `.be`), e.g. Combell, Versio, one.com – roughly €5–15/year.
2. **Hosting**: Cloudflare dashboard → Workers & Pages → Create → Pages → connect this GitHub repo.
   Framework preset *Astro*, build command `npm run build`, output directory `dist`. Free.
3. **Custom domain**: in the Pages project → Custom domains → add `www.sigridruttyn.be` and `sigridruttyn.be`.
   Easiest is to move the domain's nameservers to Cloudflare (free plan) so DNS + SSL are automatic.
4. **Editing for Sigrid**: log in at https://app.pagescms.org with GitHub, open this repo. `.pages.yml` defines the forms.
   Every save is a commit → Cloudflare rebuilds the site within a minute. Give Sigrid her own GitHub account as collaborator.
5. **Calendly**: paste her booking link in `site.json` → `calendlyUrl`. Until then the page shows phone/e-mail buttons.

### Changing the domain later

Add the new domain under Custom domains, update `site` in `astro.config.mjs`, and add a redirect rule for the old domain. ~15 minutes.

## Still to do

- Photos (portrait for *Wie ben ik?* / home, optionally one per treatment)
- Leen's review
- Calendly link
- Have the draft privacy statement (`src/content/pages/privacy.md`) checked
