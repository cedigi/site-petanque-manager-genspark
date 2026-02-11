# Petanque Manager — Landing Page

## Apercu du projet
- **Nom** : Petanque Manager
- **Objectif** : Landing page produit premium pour Petanque Manager, gestionnaire de tournois de petanque
- **Type** : Site one-page avec theme teal/bleu "underwater bokeh"
- **Stack** : Hono + TypeScript + Cloudflare Pages

## Fonctionnalites implementees

1. **Navbar sticky** avec logo officiel + 6 liens ancre (Accueil, Fonctionnalites, Tarifs, Telecharger, FAQ, Contact)
2. **Hero** : 2 colonnes (texte + mockup screenshot), titre H1, 3 bullets, 2 CTA (gold + outline)
3. **Fonctionnalites** : Grille 3x2 avec icones et descriptions (6 features)
4. **Apercu application** : 3 cartes avec captures reelles (Equipes, Matchs, Classement)
5. **Tarifs** : Toggle mensuel/annuel, 4 plans (Solo/Duo/Trio/Club Pack), 2 add-ons
6. **Telecharger** : 3 etapes numerotees + CTA
7. **FAQ** : 6 questions en accordion
8. **Contact** : Formulaire fonctionnel (nom, email, message) + infos contact
9. **Footer** : Logo + liens rapides + liens legaux + copyright
10. **API Contact** : Endpoint POST /api/contact

## URLs
- **Section Accueil** : `/#accueil`
- **Section Fonctionnalites** : `/#fonctionnalites`
- **Section Apercu** : `/#apercu`
- **Section Tarifs** : `/#tarifs`
- **Section Telecharger** : `/#telecharger`
- **Section FAQ** : `/#faq`
- **Section Contact** : `/#contact`
- **API Contact** : `POST /api/contact` (body JSON : name, email, message)

## Design
- **Palette** : Fond teal/bleu fonce avec degrades et bokeh
- **Cartes** : Opaques (pas de glassmorphism), bordures subtiles
- **Boutons** : Gold (primaire) + Outline teal (secondaire)
- **Typo** : Inter (Google Fonts)
- **Icones** : Font Awesome 6.5
- **Responsive** : Desktop-first, adapte tablette et mobile

## Architecture technique
```
webapp/
  src/
    index.tsx        # Backend Hono (HTML + API contact)
  public/static/
    style.css        # CSS complet (25K+ lignes)
    app.js           # JS interactif (navbar, toggle, FAQ, formulaire)
    images/          # Logo + 5 captures d'ecran
  ecosystem.config.cjs
  vite.config.ts
  wrangler.jsonc
  package.json
```

## Deploiement
- **Plateforme** : Cloudflare Pages
- **Status** : En developpement local
- **Build** : `npm run build` -> `dist/`
- **Dev** : `pm2 start ecosystem.config.cjs`
- **Deploy** : `npm run deploy`

## Date de mise a jour
2026-02-11
