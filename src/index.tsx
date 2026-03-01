import { Hono } from 'hono'
import { cors } from 'hono/cors'
import checkout from './routes/checkout'
import webhook from './routes/webhook'
import account from './routes/account'

type Bindings = {
  STRIPE_SECRET_KEY: string
  STRIPE_PUBLISHABLE_KEY: string
  STRIPE_WEBHOOK_SECRET: string
  SUPABASE_URL: string
  SUPABASE_SERVICE_ROLE_KEY: string
  SUPABASE_ANON_KEY: string
}

const app = new Hono<{ Bindings: Bindings }>()

app.use('/api/*', cors())

// Mount Stripe routes
app.route('/', checkout)
app.route('/', webhook)

// Mount client portal API routes
app.route('/', account)

// API: return Supabase config for frontend auth
app.get('/api/config', (c) => {
  return c.json({
    supabase_url: c.env.SUPABASE_URL,
    supabase_anon_key: c.env.SUPABASE_ANON_KEY,
  })
})

// API contact form endpoint
app.post('/api/contact', async (c) => {
  try {
    const body = await c.req.json()
    const { name, email, message } = body
    if (!name || !email || !message) {
      return c.json({ success: false, error: 'Tous les champs sont requis.' }, 400)
    }
    // In production, send email or store in DB
    return c.json({ success: true, message: 'Message envoy\u00e9 avec succ\u00e8s !' })
  } catch {
    return c.json({ success: false, error: 'Erreur lors de l\'envoi.' }, 500)
  }
})

app.get('/', (c) => {
  return c.html(`<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>P\u00e9tanque Manager \u2014 Gestionnaire de tournois moderne</title>
  <meta name="description" content="Organisez vos tournois de p\u00e9tanque en quelques clics. Cr\u00e9ez les \u00e9quipes, g\u00e9n\u00e9rez les tours, saisissez les scores : le classement s\u2019actualise automatiquement.">
  <link rel="icon" type="image/png" href="/static/images/logo.png">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
  <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.5.0/css/all.min.css" rel="stylesheet">
  <link href="/static/style.css" rel="stylesheet">
</head>
<body>

  <!-- ========== 3D BACKGROUND CANVAS ========== -->
  <canvas id="bgCanvas"></canvas>

  <!-- ========== NAVBAR ========== -->
  <nav class="navbar" id="navbar">
    <div class="nav-container">
      <a href="#accueil" class="nav-logo">
        <img src="/static/images/logo.png" alt="P\u00e9tanque Manager Logo" class="nav-logo-img">
        <span class="nav-logo-text">P\u00e9tanque Manager</span>
      </a>
      <button class="nav-toggle" id="navToggle" aria-label="Menu">
        <i class="fas fa-bars"></i>
      </button>
      <ul class="nav-links" id="navLinks">
        <li><a href="#accueil" class="nav-link active">Accueil</a></li>
        <li><a href="#fonctionnalites" class="nav-link">Fonctionnalit\u00e9s</a></li>
        <li><a href="#tarifs" class="nav-link">Tarifs</a></li>
        <li><a href="#telecharger" class="nav-link">T\u00e9l\u00e9charger</a></li>
        <li><a href="#faq" class="nav-link">FAQ</a></li>
        <li><a href="#contact" class="nav-link">Contact</a></li>
      </ul>
      <!-- Auth indicator: login button or user avatar -->
      <div class="nav-auth" id="navAuth">
        <a href="/espace-client/login" class="nav-auth-login" id="navAuthLogin" title="Se connecter">
          <i class="fas fa-sign-in-alt"></i> <span>Connexion</span>
        </a>
        <a href="/espace-client" class="nav-auth-user" id="navAuthUser" style="display:none;" title="Mon espace client">
          <span class="nav-auth-avatar" id="navAuthAvatar"></span>
          <span class="nav-auth-email" id="navAuthEmail"></span>
          <i class="fas fa-chevron-right nav-auth-arrow"></i>
        </a>
      </div>
    </div>
  </nav>

  <!-- ========== HERO ========== -->
  <section class="hero" id="accueil">
    <div class="hero-bg-bokeh"></div>
    <div class="container hero-grid">
      <div class="hero-content">
        <h1 class="hero-title">Organisez vos tournois de p\u00e9tanque plus vite, plus proprement, plus professionnellement.</h1>
        <p class="hero-subtitle">P\u00e9tanque Manager vous permet de g\u00e9rer vos \u00e9quipes, g\u00e9n\u00e9rer les matchs, suivre le classement, imprimer vos feuilles, afficher un Mode TV en direct, et produire des PDF personnalis\u00e9s avec le logo de votre club.</p>
        <p class="hero-highlights"><span><i class="fas fa-tv"></i> Mode TV en direct</span> <span><i class="fas fa-language"></i> Interface en 3 langues</span> <span><i class="fas fa-file-pdf"></i> PDF avec logo du club</span> <span><i class="fas fa-wifi-slash"></i> Fonctionne m\u00eame sans internet</span></p>
        <div class="hero-cta">
          <a href="#telecharger" class="btn btn-gold"><i class="fas fa-download"></i> T\u00e9l\u00e9charger pour PC</a>
          <a href="#fonctionnalites" class="btn btn-outline"><i class="fas fa-eye"></i> D\u00e9couvrir les fonctionnalit\u00e9s</a>
        </div>
        <p class="hero-micro">Windows 10/11 \u2022 Essai gratuit 14 jours \u2022 FR / EN / NL</p>
      </div>
      <div class="hero-visual">
        <div class="hero-mockup zoomable" data-lightbox-src="/static/images/screenshot-mode-tv.png" data-lightbox-alt="Mode TV \u2014 Affichage grand \u00e9cran">
          <img src="/static/images/screenshot-mode-tv.png" alt="P\u00e9tanque Manager \u2014 Mode TV" class="hero-screenshot">
        </div>
      </div>
    </div>
  </section>

  <!-- ========== BANDEAU POINTS FORTS ========== -->
  <section class="section-strengths">
    <div class="container">
      <div class="strengths-grid">
        <div class="strength-item">
          <div class="strength-icon"><i class="fas fa-tv"></i></div>
          <h3>Mode TV intégré</h3>
          <p>Affichage lisible et moderne des matchs et scores sur grand écran.</p>
        </div>
        <div class="strength-item">
          <div class="strength-icon"><i class="fas fa-language"></i></div>
          <h3>3 langues incluses</h3>
          <p>Interface en français, anglais et néerlandais.</p>
        </div>
        <div class="strength-item">
          <div class="strength-icon"><i class="fas fa-palette"></i></div>
          <h3>Logo du club personnalisé</h3>
          <p>Votre logo sur les PDF et dans le Mode TV.</p>
        </div>
        <div class="strength-item">
          <div class="strength-icon"><i class="fas fa-wifi-slash"></i></div>
          <h3>Utilisable hors ligne</h3>
          <p>Fonctionne sans connexion, idéal pour les concours sur site.</p>
        </div>
        <div class="strength-item">
          <div class="strength-icon"><i class="fas fa-user-shield"></i></div>
          <h3>Espace client</h3>
          <p>Gérez vos licences et appareils en toute autonomie.</p>
        </div>
      </div>
    </div>
  </section>

  <!-- ========== POURQUOI PETANQUE MANAGER ========== -->
  <section class="section section-alt" id="pourquoi">
    <div class="container">
      <div class="why-grid">
        <div class="why-content">
          <h2 class="section-title section-title-left">Un logiciel pensé pour les clubs, pas pour compliquer l’organisation</h2>
          <p class="why-text">Fini les feuilles improvisées, les classements recalculés à la main et les erreurs de dernière minute. Pétanque Manager centralise toute l’organisation du tournoi dans une interface simple, rapide et visuelle.</p>
          <p class="why-label">Vous gérez :</p>
          <ul class="why-list">
            <li><i class="fas fa-check"></i> Les équipes et les joueurs</li>
            <li><i class="fas fa-check"></i> Les matchs et les terrains</li>
            <li><i class="fas fa-check"></i> Les scores en temps réel</li>
            <li><i class="fas fa-check"></i> Le classement automatique</li>
            <li><i class="fas fa-check"></i> Les impressions et exports PDF</li>
            <li><i class="fas fa-check"></i> L’affichage public via le Mode TV</li>
          </ul>
        </div>
        <div class="why-visual">
          <div class="why-mockup zoomable" data-lightbox-src="/static/images/screenshot-classement.png" data-lightbox-alt="Classement automatique">
            <img src="/static/images/screenshot-classement.png" alt="Classement automatique" class="why-screenshot">
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- ========== FONCTIONNALITES ========== -->
  <section class="section" id="fonctionnalites">
    <div class="container">
      <h2 class="section-title">Les fonctionnalités qui font gagner du temps</h2>
      <p class="section-subtitle">Tout ce dont vous avez besoin pour organiser un tournoi du début à la fin.</p>
      <div class="features-grid">
        <div class="feature-card">
          <div class="feature-icon"><i class="fas fa-trophy"></i></div>
          <h3>Gestion complète du tournoi</h3>
          <p>Créez votre tournoi en quelques clics, ajoutez vos équipes, définissez le nombre de terrains et lancez automatiquement les tours.</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon"><i class="fas fa-magic"></i></div>
          <h3>Génération automatique des matchs</h3>
          <p>Le logiciel génère les rencontres en tenant compte de la logique du tournoi, du classement et de la gestion des terrains.</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon"><i class="fas fa-chart-line"></i></div>
          <h3>Classement mis à jour automatiquement</h3>
          <p>Victoires, points marqués, encaissés et différentiels recalculés instantanément après chaque résultat.</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon"><i class="fas fa-tv"></i></div>
          <h3>Mode TV pour affichage en direct</h3>
          <p>Diffusez les matchs, scores et terrains sur un écran dédié avec une présentation claire, moderne et valorisante pour le public.</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon"><i class="fas fa-file-pdf"></i></div>
          <h3>Exports PDF professionnels</h3>
          <p>Imprimez ou exportez la liste des équipes, les tours et le classement final dans des documents propres et lisibles.</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon"><i class="fas fa-palette"></i></div>
          <h3>Logo du club intégré</h3>
          <p>Personnalisez vos documents et votre affichage avec le logo de votre club, visible sur les PDF et dans le Mode TV.</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon"><i class="fas fa-language"></i></div>
          <h3>Interface multilingue</h3>
          <p>Basculez l’interface en français, anglais ou néerlandais directement depuis les paramètres.</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon"><i class="fas fa-wifi-slash"></i></div>
          <h3>Utilisation hors ligne</h3>
          <p>Le tournoi peut être géré sans dépendre d’une connexion internet. Idéal pour les concours en extérieur.</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon"><i class="fas fa-user-shield"></i></div>
          <h3>Espace client en ligne</h3>
          <p>Gérez vos abonnements, licences et appareils depuis votre espace personnel. Transférez une licence d’un PC à l’autre en toute autonomie.</p>
        </div>
      </div>
    </div>
  </section>

  <!-- ========== CAPTURES D'ECRAN ========== -->
  <section class="section section-alt" id="apercu">
    <div class="container">
      <h2 class="section-title">Un rendu moderne, clair et immédiatement exploitable</h2>
      <p class="section-subtitle">Conçu pour être agréable à utiliser en situation réelle : à la table de marque, pendant les inscriptions, pendant les tours, et lors de l’affichage des résultats.</p>
      <div class="screenshots-grid">
        <div class="screenshot-card">
          <div class="screenshot-img-wrap zoomable" data-lightbox-src="/static/images/screenshot-equipes.png" data-lightbox-alt="Gestion rapide des équipes">
            <img src="/static/images/screenshot-equipes.png" alt="Gestion rapide des équipes" class="screenshot-img">
          </div>
          <h3>Équipes</h3>
          <p>Ajout et gestion rapide des équipes avec une interface claire et lisible.</p>
        </div>
        <div class="screenshot-card">
          <div class="screenshot-img-wrap zoomable" data-lightbox-src="/static/images/screenshot-matchs.png" data-lightbox-alt="Suivi des tours et saisie des scores">
            <img src="/static/images/screenshot-matchs.png" alt="Suivi des tours et saisie des scores" class="screenshot-img">
          </div>
          <h3>Matchs</h3>
          <p>Suivi des tours, scores et terrains en un seul écran.</p>
        </div>
        <div class="screenshot-card">
          <div class="screenshot-img-wrap zoomable" data-lightbox-src="/static/images/screenshot-classement.png" data-lightbox-alt="Classement automatique en temps réel">
            <img src="/static/images/screenshot-classement.png" alt="Classement automatique en temps réel" class="screenshot-img">
          </div>
          <h3>Classement</h3>
          <p>Mise à jour automatique en temps réel après chaque résultat.</p>
        </div>
        <div class="screenshot-card screenshot-card-featured">
          <div class="screenshot-img-wrap zoomable" data-lightbox-src="/static/images/screenshot-mode-tv.png" data-lightbox-alt="Mode TV — Affichage public moderne">
            <img src="/static/images/screenshot-mode-tv.png" alt="Mode TV — Affichage public moderne" class="screenshot-img">
          </div>
          <h3><i class="fas fa-tv" style="color:var(--teal);margin-right:8px;"></i>Mode TV</h3>
          <p>Affichage public moderne des matchs et scores sur grand écran.</p>
        </div>
        <div class="screenshot-card screenshot-card-featured">
          <div class="screenshot-img-wrap zoomable" data-lightbox-src="/static/images/screenshot-export-pdf.png" data-lightbox-alt="Exports PDF imprimables">
            <img src="/static/images/screenshot-export-pdf.png" alt="Exports PDF imprimables" class="screenshot-img">
          </div>
          <h3><i class="fas fa-file-pdf" style="color:var(--teal);margin-right:8px;"></i>PDF</h3>
          <p>Exports imprimables avec logo du club et mise en page professionnelle.</p>
        </div>
        <div class="screenshot-card screenshot-card-featured screenshot-card-wide">
          <div class="screenshot-img-wrap zoomable" data-lightbox-src="/static/images/screenshot-parametres.png" data-lightbox-alt="Paramètres — Langues, Licence, Logo">
            <img src="/static/images/screenshot-parametres.png" alt="Paramètres — Langue, Licence, Logo" class="screenshot-img">
          </div>
          <h3><i class="fas fa-cog" style="color:var(--teal);margin-right:8px;"></i>Paramètres / Langues / Licence</h3>
          <p>Choix de la langue (FR/EN/NL), gestion de licence et personnalisation avec le logo du club.</p>
        </div>
      </div>
    </div>
  </section>

  <!-- ========== POUR QUI ========== -->
  <section class="section" id="pourqui">
    <div class="container">
      <h2 class="section-title">Pensé pour les clubs qui veulent gagner en sérieux</h2>
      <p class="section-subtitle">Que vous soyez un club établi ou un bénévole qui organise son premier concours, Pétanque Manager s’adapte.</p>
      <div class="target-grid">
        <div class="target-item"><div class="target-icon"><i class="fas fa-users"></i></div><span>Clubs de pétanque</span></div>
        <div class="target-item"><div class="target-icon"><i class="fas fa-trophy"></i></div><span>Organisateurs de concours</span></div>
        <div class="target-item"><div class="target-icon"><i class="fas fa-hand-holding-heart"></i></div><span>Associations sportives</span></div>
        <div class="target-item"><div class="target-icon"><i class="fas fa-heart"></i></div><span>Bénévoles qui veulent une solution simple et fiable</span></div>
        <div class="target-item"><div class="target-icon"><i class="fas fa-star"></i></div><span>Structures qui veulent un rendu plus moderne et professionnel</span></div>
      </div>
    </div>
  </section>

  <!-- ========== BENEFICES CONCRETS ========== -->
  <section class="section section-alt" id="benefices">
    <div class="container">
      <h2 class="section-title">Ce que votre club y gagne</h2>
      <p class="section-subtitle">Des bénéfices concrets, visibles dès le premier tournoi.</p>
      <div class="benefits-grid">
        <div class="benefit-card">
          <div class="benefit-icon"><i class="fas fa-clock"></i></div>
          <h3>Moins de temps perdu</h3>
          <p>La préparation et la gestion du tournoi deviennent plus rapides grâce à l’automatisation.</p>
        </div>
        <div class="benefit-card">
          <div class="benefit-icon"><i class="fas fa-check-double"></i></div>
          <h3>Moins d’erreurs</h3>
          <p>Le classement, les tours et les documents sont générés automatiquement. Plus de recalculs manuels.</p>
        </div>
        <div class="benefit-card">
          <div class="benefit-icon"><i class="fas fa-award"></i></div>
          <h3>Meilleure image du club</h3>
          <p>Avec le logo du club, le Mode TV et des documents propres, votre organisation paraît plus sérieuse et plus moderne.</p>
        </div>
        <div class="benefit-card">
          <div class="benefit-icon"><i class="fas fa-smile"></i></div>
          <h3>Plus de confort le jour J</h3>
          <p>Tout est centralisé dans un seul outil, exploitable même sans internet.</p>
        </div>
      </div>
    </div>
  </section>

  <!-- ========== CTA FINAL ========== -->
  <section class="section section-cta-final" id="cta-final">
    <div class="container cta-final-content">
      <h2 class="cta-final-title">Passez à une organisation de tournoi plus moderne</h2>
      <p class="cta-final-text">Essayez Pétanque Manager et équipez votre club d’un outil conçu pour organiser, afficher et imprimer vos tournois proprement.</p>
      <p class="cta-final-summary">Pétanque Manager : gestion des équipes, matchs, scores, classement automatique, Mode TV, exports PDF personnalisés avec logo du club, interface multilingue FR/EN/NL.</p>
      <div class="cta-final-buttons">
        <a href="#telecharger" class="btn btn-gold btn-lg"><i class="fas fa-download"></i> T\u00e9l\u00e9charger pour PC</a>
        <a href="#contact" class="btn btn-outline btn-lg"><i class="fas fa-comments"></i> Nous contacter</a>
      </div>
    </div>
  </section>

  <!-- ========== TARIFS ========== -->
  <section class="section" id="tarifs">
    <div class="container">
      <h2 class="section-title">Tarifs</h2>
      <p class="section-subtitle">Choisissez l\u2019offre adapt\u00e9e \u00e0 votre club ou \u00e0 votre usage.</p>

      <!-- Pass Evenement horizontal -->
      <div class="pricing-pass-wrap">
        <div class="pricing-pass-card">
          <div class="pricing-pass-badge"><i class="fas fa-bolt"></i> Offre ponctuelle</div>
          <div class="pricing-pass-layout">
            <div class="pricing-pass-left">
              <h3>Pass \u00c9v\u00e9nement</h3>
              <p class="pricing-pass-tagline">Id\u00e9al pour les concours, comp\u00e9titions ou \u00e9v\u00e9nements ponctuels.</p>
            </div>
            <div class="pricing-pass-center">
              <ul class="pricing-features">
                <li><i class="fas fa-check"></i> 2 licences PC</li>
                <li><i class="fas fa-check"></i> Acc\u00e8s complet 7 jours</li>
                <li><i class="fas fa-check"></i> Fonctionne hors ligne</li>
                <li><i class="fas fa-check"></i> Tournois, terrains, scores, classement</li>
              </ul>
            </div>
            <div class="pricing-pass-right">
              <div class="pricing-pass-price">14\u20ac<small> unique</small></div>
              <a href="#" class="btn btn-gold" data-plan-code="event_7d">Choisir ce pass</a>
            </div>
          </div>
        </div>
      </div>

      <div class="pricing-toggle-wrap">
        <span class="pricing-toggle-label" id="labelMensuel">Mensuel</span>
        <button class="pricing-toggle" id="pricingToggle" aria-label="Basculer mensuel/annuel">
          <span class="pricing-toggle-knob"></span>
        </button>
        <span class="pricing-toggle-label" id="labelAnnuel">Annuel</span>
        <span class="pricing-badge">\u00c9conomisez jusqu\u2019\u00e0 2 mois</span>
      </div>

      <div class="pricing-grid">
        <div class="pricing-card">
          <div class="pricing-card-header">
            <h3>Solo</h3>
            <p class="pricing-desc">1 PC</p>
          </div>
          <div class="pricing-price">
            <span class="price-monthly">19\u20ac<small>/mois</small></span>
            <span class="price-annual hidden">209\u20ac<small>/an</small></span>
            <span class="price-annual-bonus hidden">1 mois offert</span>
          </div>
          <ul class="pricing-features">
            <li><i class="fas fa-check"></i> 1 licence PC</li>
            <li><i class="fas fa-check"></i> Tous les formats de tournoi</li>
            <li><i class="fas fa-check"></i> Mises \u00e0 jour incluses</li>
            <li><i class="fas fa-check"></i> Support par email</li>
          </ul>
          <a href="#" class="btn btn-outline btn-block" data-plan-code="solo_m">Choisir Solo</a>
        </div>
        <div class="pricing-card pricing-card-popular">
          <div class="pricing-popular-badge">Populaire</div>
          <div class="pricing-card-header">
            <h3>Duo</h3>
            <p class="pricing-desc">2 PC</p>
          </div>
          <div class="pricing-price">
            <span class="price-monthly">27\u20ac<small>/mois</small></span>
            <span class="price-annual hidden">297\u20ac<small>/an</small></span>
            <span class="price-annual-bonus hidden">1 mois offert</span>
          </div>
          <ul class="pricing-features">
            <li><i class="fas fa-check"></i> 2 licences PC</li>
            <li><i class="fas fa-check"></i> Tous les formats de tournoi</li>
            <li><i class="fas fa-check"></i> Mises \u00e0 jour incluses</li>
            <li><i class="fas fa-check"></i> Support prioritaire</li>
          </ul>
          <a href="#" class="btn btn-gold btn-block" data-plan-code="duo_m">Choisir Duo</a>
        </div>
        <div class="pricing-card">
          <div class="pricing-card-header">
            <h3>Trio</h3>
            <p class="pricing-desc">3 PC</p>
          </div>
          <div class="pricing-price">
            <span class="price-monthly">34\u20ac<small>/mois</small></span>
            <span class="price-annual hidden">340\u20ac<small>/an</small></span>
            <span class="price-annual-bonus hidden">2 mois offerts</span>
          </div>
          <ul class="pricing-features">
            <li><i class="fas fa-check"></i> 3 licences PC</li>
            <li><i class="fas fa-check"></i> Tous les formats de tournoi</li>
            <li><i class="fas fa-check"></i> Mises \u00e0 jour incluses</li>
            <li><i class="fas fa-check"></i> Support prioritaire</li>
          </ul>
          <a href="#" class="btn btn-outline btn-block" data-plan-code="trio_m">Choisir Trio</a>
        </div>
        <div class="pricing-card">
          <div class="pricing-card-header">
            <h3>Club Pack</h3>
            <p class="pricing-desc">5 PC</p>
          </div>
          <div class="pricing-price">
            <span class="price-monthly">41\u20ac<small>/mois</small></span>
            <span class="price-annual hidden">410\u20ac<small>/an</small></span>
            <span class="price-annual-bonus hidden">2 mois offerts</span>
          </div>
          <ul class="pricing-features">
            <li><i class="fas fa-check"></i> 5 licences PC</li>
            <li><i class="fas fa-check"></i> Tous les formats de tournoi</li>
            <li><i class="fas fa-check"></i> Mises \u00e0 jour incluses</li>
            <li><i class="fas fa-check"></i> Support prioritaire d\u00e9di\u00e9</li>
          </ul>
          <a href="#" class="btn btn-outline btn-block" data-plan-code="club_m">Choisir Club Pack</a>
        </div>
      </div>

      <div class="pricing-license-info">
        <p><i class="fas fa-key"></i> Apr\u00e8s paiement : vous recevez une cl\u00e9 de licence \u00e0 coller dans l\u2019application (<strong>Param\u00e8tres \u2192 Licence</strong>).</p>
      </div>

      <p class="pricing-note">Essai gratuit 14 jours. Licence activable sur X PC selon l\u2019offre.</p>
      <div class="pricing-cta">
        <a href="#telecharger" class="btn btn-gold"><i class="fas fa-download"></i> T\u00e9l\u00e9charger pour PC</a>
      </div>
    </div>
  </section>

  <!-- ========== TELECHARGER ========== -->
  <section class="section section-alt" id="telecharger">
    <div class="container">
      <h2 class="section-title">T\u00e9l\u00e9charger</h2>
      <p class="section-subtitle">Pr\u00eat en 3 \u00e9tapes. C\u2019est aussi simple que \u00e7a.</p>
      <div class="download-steps">
        <div class="download-step">
          <div class="step-number">1</div>
          <div class="step-icon"><i class="fas fa-download"></i></div>
          <h3>T\u00e9l\u00e9charger l\u2019installateur Windows</h3>
          <p>Un fichier l\u00e9ger, installation en quelques secondes.</p>
        </div>
        <div class="download-step">
          <div class="step-number">2</div>
          <div class="step-icon"><i class="fas fa-play-circle"></i></div>
          <h3>Lancer l\u2019essai 14 jours</h3>
          <p>Toutes les fonctionnalit\u00e9s, sans engagement.</p>
        </div>
        <div class="download-step">
          <div class="step-number">3</div>
          <div class="step-icon"><i class="fas fa-key"></i></div>
          <h3>Activer la licence si besoin</h3>
          <p>Choisissez votre plan et continuez sans interruption.</p>
        </div>
      </div>
      <p class="download-compat">Compatible Windows 10/11 &bull; Fonctionne hors ligne &bull; FR / EN / NL &bull; Id\u00e9al pour clubs</p>
      <div class="download-cta">
        <a href="#" class="btn btn-gold btn-lg"><i class="fas fa-download"></i> T\u00e9l\u00e9charger pour PC</a>
      </div>
    </div>
  </section>


  <!-- ========== ESPACE CLIENT ========== -->
  <section class="section" id="espace-client">
    <div class="container">
      <div class="ec-header">
        <span class="ec-badge"><i class="fas fa-shield-alt"></i> Espace client</span>
        <h2 class="section-title">Votre espace client, simple et autonome</h2>
        <p class="section-subtitle">Consultez vos abonnements, gérez vos licences et transférez librement votre logiciel d’un PC à l’autre — sans contacter le support.</p>
      </div>

      <!-- Mockup UI -->
      <div class="ec-mockup-container">
        <div class="ec-mockup">
          <div class="ec-mockup-titlebar">
            <div class="ec-mockup-dots"><span></span><span></span><span></span></div>
            <span class="ec-mockup-url"><i class="fas fa-lock"></i> petanque-manager.eu/mon-compte</span>
          </div>
          <div class="ec-mockup-body">

            <!-- Bloc A : Connexion -->
            <div class="ec-panel ec-panel-login">
              <div class="ec-panel-icon"><i class="fas fa-sign-in-alt"></i></div>
              <h4>Connexion</h4>
              <div class="ec-form-demo">
                <div class="ec-input-demo"><i class="fas fa-envelope"></i><span>votre@email.com</span></div>
                <div class="ec-input-demo"><i class="fas fa-lock"></i><span>••••••••</span></div>
                <div class="ec-btn-demo">Se connecter</div>
                <span class="ec-link-demo">Mot de passe oublié ?</span>
              </div>
            </div>

            <!-- Bloc B : Mes abonnements -->
            <div class="ec-panel">
              <div class="ec-panel-header">
                <div class="ec-panel-icon"><i class="fas fa-credit-card"></i></div>
                <h4>Mes abonnements</h4>
              </div>
              <div class="ec-table">
                <div class="ec-table-row ec-table-head">
                  <span>Formule</span><span>Statut</span><span>Renouvellement</span><span>PC autorisés</span><span>PC utilisés</span>
                </div>
                <div class="ec-table-row">
                  <span class="ec-cell-bold">Duo</span>
                  <span><span class="ec-status ec-status-active">Actif</span></span>
                  <span>15 avril 2026</span>
                  <span>2</span>
                  <span>1 / 2</span>
                </div>
              </div>
            </div>

            <!-- Bloc C : Mes licences -->
            <div class="ec-panel">
              <div class="ec-panel-header">
                <div class="ec-panel-icon"><i class="fas fa-key"></i></div>
                <h4>Mes licences</h4>
              </div>
              <div class="ec-table">
                <div class="ec-table-row ec-table-head">
                  <span>Clé de licence</span><span>Plan</span><span>Statut</span><span>Activée le</span>
                </div>
                <div class="ec-table-row">
                  <span class="ec-cell-mono">PM-DUO-XXXX-XXXX-7F3A</span>
                  <span>Duo</span>
                  <span><span class="ec-status ec-status-active">Active</span></span>
                  <span>15 mars 2026</span>
                </div>
              </div>
            </div>

            <!-- Bloc D : Mes appareils -->
            <div class="ec-panel">
              <div class="ec-panel-header">
                <div class="ec-panel-icon"><i class="fas fa-desktop"></i></div>
                <h4>Mes appareils</h4>
              </div>
              <div class="ec-table">
                <div class="ec-table-row ec-table-head">
                  <span>Nom du PC</span><span>Empreinte</span><span>Activé le</span><span>Dernier check-in</span><span>Statut</span><span></span>
                </div>
                <div class="ec-table-row">
                  <span class="ec-cell-bold">PC-BUVETTE</span>
                  <span class="ec-cell-mono ec-cell-dim">a7f3…c91d</span>
                  <span>15 mars 2026</span>
                  <span>28 février 2026</span>
                  <span><span class="ec-status ec-status-active">Actif</span></span>
                  <span><button class="ec-btn-release"><i class="fas fa-unlock"></i> Libérer</button></span>
                </div>
                <div class="ec-table-row ec-row-free">
                  <span class="ec-cell-dim">Emplacement libre</span>
                  <span>—</span>
                  <span>—</span>
                  <span>—</span>
                  <span><span class="ec-status ec-status-free">Disponible</span></span>
                  <span></span>
                </div>
              </div>
              <p class="ec-panel-hint"><i class="fas fa-info-circle"></i> Libérez un appareil pour réutiliser cette même licence sur un autre PC.</p>
            </div>

          </div>
        </div>
      </div>

      <!-- Transfert de PC en 4 etapes -->
      <div class="ec-transfer">
        <h3 class="ec-transfer-title"><i class="fas fa-exchange-alt"></i> Comment changer de PC ?</h3>
        <p class="ec-transfer-intro">Votre licence reste identique. Seul l’appareil lié change.</p>
        <div class="ec-steps">
          <div class="ec-step">
            <div class="ec-step-num">1</div>
            <div class="ec-step-icon"><i class="fas fa-sign-in-alt"></i></div>
            <p>Connectez-vous à votre espace client</p>
          </div>
          <div class="ec-step-arrow"><i class="fas fa-chevron-right"></i></div>
          <div class="ec-step">
            <div class="ec-step-num">2</div>
            <div class="ec-step-icon"><i class="fas fa-list"></i></div>
            <p>Ouvrez la liste de vos appareils</p>
          </div>
          <div class="ec-step-arrow"><i class="fas fa-chevron-right"></i></div>
          <div class="ec-step">
            <div class="ec-step-num">3</div>
            <div class="ec-step-icon"><i class="fas fa-unlock"></i></div>
            <p>Cliquez sur « Libérer cet appareil »</p>
          </div>
          <div class="ec-step-arrow"><i class="fas fa-chevron-right"></i></div>
          <div class="ec-step">
            <div class="ec-step-num">4</div>
            <div class="ec-step-icon"><i class="fas fa-laptop"></i></div>
            <p>Activez la même licence sur le nouveau PC</p>
          </div>
        </div>
        <div class="ec-transfer-note">
          <i class="fas fa-lightbulb"></i> La clé de licence ne change jamais. Vous libérez simplement un emplacement pour le réattribuer.
        </div>
      </div>

      <!-- Avantages commerciaux -->
      <div class="ec-advantages">
        <div class="ec-adv-card">
          <div class="ec-adv-icon"><i class="fas fa-hand-pointer"></i></div>
          <h4>Autonomie totale</h4>
          <p>Gérez tout vous-même, 24h/24, sans contacter le support.</p>
        </div>
        <div class="ec-adv-card">
          <div class="ec-adv-icon"><i class="fas fa-sync-alt"></i></div>
          <h4>Changement de PC facile</h4>
          <p>Remplacez un ordinateur en 30 secondes. Idéal pour buvettes, secrétariats, PC partagés.</p>
        </div>
        <div class="ec-adv-card">
          <div class="ec-adv-icon"><i class="fas fa-users-cog"></i></div>
          <h4>Multi-postes maîtrisés</h4>
          <p>Voyez en un coup d’œil quels PC utilisent votre licence et combien de places restent.</p>
        </div>
        <div class="ec-adv-card">
          <div class="ec-adv-icon"><i class="fas fa-building"></i></div>
          <h4>Pensé pour les clubs</h4>
          <p>Gérez les postes du club de manière professionnelle, comme une vraie structure organisée.</p>
        </div>
      </div>

    </div>
  </section>

  <!-- ========== FAQ ========== -->
  <section class="section" id="faq">
    <div class="container">
      <h2 class="section-title">Questions fr\u00e9quentes</h2>
      <p class="section-subtitle">Les r\u00e9ponses aux questions que vous vous posez.</p>
      <div class="faq-list">
        <div class="faq-item">
          <button class="faq-question" aria-expanded="false">
            <span>Est-ce que \u00e7a fonctionne hors ligne ?</span>
            <i class="fas fa-chevron-down faq-chevron"></i>
          </button>
          <div class="faq-answer">
            <p>Oui, P\u00e9tanque Manager fonctionne enti\u00e8rement hors ligne. Aucune connexion internet n\u2019est n\u00e9cessaire pour g\u00e9rer vos tournois. Id\u00e9al pour les terrains de p\u00e9tanque sans Wi-Fi.</p>
          </div>
        </div>
        <div class="faq-item">
          <button class="faq-question" aria-expanded="false">
            <span>Comment marche l\u2019essai 14 jours ?</span>
            <i class="fas fa-chevron-down faq-chevron"></i>
          </button>
          <div class="faq-answer">
            <p>T\u00e9l\u00e9chargez et installez le logiciel. Toutes les fonctionnalit\u00e9s sont accessibles pendant 14 jours, sans carte bancaire. \u00c0 la fin de l\u2019essai, choisissez le plan qui vous convient.</p>
          </div>
        </div>
        <div class="faq-item">
          <button class="faq-question" aria-expanded="false">
            <span>Comment fonctionne le Mode TV ?</span>
            <i class="fas fa-chevron-down faq-chevron"></i>
          </button>
          <div class="faq-answer">
            <p>Branchez un \u00e9cran ou une TV sur votre PC, activez le Mode TV dans l\u2019application. Les matchs en cours et les r\u00e9sultats s\u2019affichent en grand, lisibles de loin. Le logo de votre club appara\u00eet \u00e9galement \u00e0 l\u2019\u00e9cran.</p>
          </div>
        </div>
        <div class="faq-item">
          <button class="faq-question" aria-expanded="false">
            <span>Quelle diff\u00e9rence entre 1/2/3/5 PC ?</span>
            <i class="fas fa-chevron-down faq-chevron"></i>
          </button>
          <div class="faq-answer">
            <p>Chaque plan permet d\u2019activer la licence sur un nombre d\u00e9fini de PC. Par exemple, le plan Duo permet d\u2019installer et d\u2019utiliser P\u00e9tanque Manager sur 2 ordinateurs diff\u00e9rents simultan\u00e9ment.</p>
          </div>
        </div>
        <div class="faq-item">
          <button class="faq-question" aria-expanded="false">
            <span>Comment activer la licence sur plusieurs PC ?</span>
            <i class="fas fa-chevron-down faq-chevron"></i>
          </button>
          <div class="faq-answer">
            <p>Vous pouvez activer sur X PC selon votre formule. Vous g\u00e9rez vos appareils dans l\u2019app (bient\u00f4t portail web).</p>
          </div>
        </div>
        <div class="faq-item">
          <button class="faq-question" aria-expanded="false">
            <span>Que se passe-t-il si internet coupe le jour du tournoi ?</span>
            <i class="fas fa-chevron-down faq-chevron"></i>
          </button>
          <div class="faq-answer">
            <p>\u00c7a continue. L\u2019app fonctionne hors ligne. La licence se v\u00e9rifie p\u00e9riodiquement.</p>
          </div>
        </div>
        <div class="faq-item">
          <button class="faq-question" aria-expanded="false">
            <span>Comment transférer ma licence sur un autre PC ?</span>
            <i class="fas fa-chevron-down faq-chevron"></i>
          </button>
          <div class="faq-answer">
            <p>Connectez-vous à votre espace client, accédez à la liste de vos appareils, libérez l’ancien PC, puis activez la même clé de licence sur le nouveau. La clé ne change pas : seul l’appareil associé est remplacé.</p>
          </div>
        </div>
        <div class="faq-item">
          <button class="faq-question" aria-expanded="false">
            <span>L’espace client est-il obligatoire pour utiliser le logiciel ?</span>
            <i class="fas fa-chevron-down faq-chevron"></i>
          </button>
          <div class="faq-answer">
            <p>Non. Le logiciel fonctionne en totale autonomie une fois la licence activée. L’espace client sert uniquement à consulter vos abonnements et à gérer vos appareils (transfert de PC, libération d’un poste, etc.).</p>
          </div>
        </div>
        <div class="faq-item">
          <button class="faq-question" aria-expanded="false">
            <span>Puis-je annuler ?</span>
            <i class="fas fa-chevron-down faq-chevron"></i>
          </button>
          <div class="faq-answer">
            <p>Oui, \u00e0 tout moment. La licence reste valable jusqu\u2019\u00e0 la fin de la p\u00e9riode pay\u00e9e.</p>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- ========== CONTACT ========== -->
  <section class="section section-alt" id="contact">
    <div class="container">
      <h2 class="section-title">Contact</h2>
      <p class="section-subtitle">Une question ? N\u2019h\u00e9sitez pas \u00e0 nous \u00e9crire.</p>
      <div class="contact-wrap contact-wrap-centered">
        <form class="contact-form" id="contactForm">
          <p class="contact-email-line"><i class="fas fa-envelope"></i> <a href="mailto:contact@petanque-manager.eu">contact@petanque-manager.eu</a></p>
          <div class="form-row">
            <div class="form-group">
              <label for="contactName">Nom</label>
              <input type="text" id="contactName" name="name" placeholder="Votre nom" required>
            </div>
            <div class="form-group">
              <label for="contactEmail">Email</label>
              <input type="email" id="contactEmail" name="email" placeholder="votre@email.com" required>
            </div>
          </div>
          <div class="form-group">
            <label for="contactMessage">Message</label>
            <textarea id="contactMessage" name="message" rows="3" placeholder="Votre message\u2026" required></textarea>
          </div>
          <button type="submit" class="btn btn-gold btn-block"><i class="fas fa-paper-plane"></i> Envoyer</button>
          <p class="contact-response-time"><i class="fas fa-clock"></i> R\u00e9ponse sous 24\u201348h</p>
          <div id="contactStatus" class="contact-status"></div>
        </form>
      </div>
    </div>
  </section>

  <!-- ========== FOOTER ========== -->
  <footer class="footer">
    <div class="container footer-grid">
      <div class="footer-brand">
        <img src="/static/images/logo.png" alt="P\u00e9tanque Manager" class="footer-logo">
        <p><strong>P\u00e9tanque Manager</strong> &mdash; par CediSoft</p>
        <p class="footer-tagline">Le gestionnaire de tournois moderne.</p>
      </div>
      <div class="footer-links">
        <h4>Liens rapides</h4>
        <ul>
          <li><a href="#fonctionnalites">Fonctionnalit\u00e9s</a></li>
          <li><a href="#pourquoi">Pourquoi P\u00e9tanque Manager</a></li>
          <li><a href="#tarifs">Tarifs</a></li>
          <li><a href="#telecharger">T\u00e9l\u00e9charger</a></li>
          <li><a href="#telecharger"><i class="fas fa-download"></i> T\u00e9l\u00e9chargement .exe</a></li>
          <li><a href="/espace-client/login">Espace client</a></li>
          <li><a href="#contact">Contact</a></li>
        </ul>
      </div>
      <div class="footer-links">
        <h4>L\u00e9gal</h4>
        <ul>
          <li><a href="#">Mentions l\u00e9gales</a></li>
          <li><a href="#">Politique de confidentialit\u00e9</a></li>
          <li><a href="#">CGV</a></li>
        </ul>
      </div>
    </div>
    <div class="footer-bottom">
      <div class="container">
        <p>&copy; 2026 P\u00e9tanque Manager par CediSoft. Tous droits r\u00e9serv\u00e9s.</p>
      </div>
    </div>
  </footer>

  <!-- ========== LIGHTBOX ========== -->
  <div class="lightbox-overlay" id="lightbox">
    <div class="lightbox-content">
      <button class="lightbox-close" id="lightboxClose" aria-label="Fermer"><i class="fas fa-times"></i></button>
      <button class="lightbox-nav prev" id="lightboxPrev" aria-label="Pr\u00e9c\u00e9dent"><i class="fas fa-chevron-left"></i></button>
      <button class="lightbox-nav next" id="lightboxNext" aria-label="Suivant"><i class="fas fa-chevron-right"></i></button>
      <img src="" alt="" class="lightbox-img" id="lightboxImg">
      <p class="lightbox-caption" id="lightboxCaption"></p>
    </div>
  </div>

  <script src="/static/bg3d.js"></script>
  <script src="/static/app.js"></script>
</body>
</html>`)
})

// ========== SUCCESS PAGE ==========
app.get('/success', (c) => {
  return c.html(`<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Paiement r\u00e9ussi — P\u00e9tanque Manager</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
  <link rel="icon" href="/static/images/logo.png">
  <link rel="stylesheet" href="/static/style.css">
  <style>
    .success-page { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 40px 20px; }
    .success-card { background: var(--bg-card); border: 1px solid var(--border-card); border-radius: var(--radius-lg); padding: 48px 40px; max-width: 560px; text-align: center; }
    .success-icon { font-size: 3.5rem; color: #2dd4bf; margin-bottom: 20px; }
    .success-title { color: #fff; font-size: 1.8rem; font-weight: 800; margin-bottom: 12px; }
    .success-text { color: rgba(255,255,255,0.7); font-size: 1rem; line-height: 1.7; margin-bottom: 24px; }
    .license-box { background: rgba(45,212,191,0.08); border: 1px solid rgba(45,212,191,0.25); border-radius: 12px; padding: 20px; margin: 24px 0; }
    .license-label { color: rgba(255,255,255,0.6); font-size: 0.85rem; margin-bottom: 8px; }
    .license-key { color: #d4a843; font-size: 1.3rem; font-weight: 700; font-family: 'Courier New', monospace; letter-spacing: 1px; word-break: break-all; }
    .license-loading { color: rgba(255,255,255,0.5); font-style: italic; }
    .success-steps { text-align: left; margin: 24px 0; padding: 0 20px; }
    .success-steps li { color: rgba(255,255,255,0.7); margin-bottom: 10px; font-size: 0.92rem; }
    .success-steps li strong { color: #fff; }
  </style>
</head>
<body>
  <div class="success-page">
    <div class="success-card">
      <div class="success-icon"><i class="fas fa-check-circle"></i></div>
      <h1 class="success-title">Paiement r\u00e9ussi !</h1>
      <p class="success-text">Merci pour votre achat. Votre licence P\u00e9tanque Manager est activ\u00e9e.</p>
      
      <div class="license-box">
        <div class="license-label"><i class="fas fa-key"></i> Votre cl\u00e9 de licence</div>
        <div class="license-key" id="licenseKey"><span class="license-loading">Chargement...</span></div>
      </div>

      <ol class="success-steps">
        <li>Ouvrez <strong>P\u00e9tanque Manager</strong> sur votre PC</li>
        <li>Allez dans <strong>Param\u00e8tres \u2192 Licence</strong></li>
        <li>Collez votre cl\u00e9 et cliquez <strong>Activer</strong></li>
      </ol>

      <p class="success-text">Votre cl\u00e9 a aussi \u00e9t\u00e9 envoy\u00e9e par email. Conservez-la pr\u00e9cieusement.</p>
      
      <a href="/" class="btn btn-gold"><i class="fas fa-home"></i> Retour \u00e0 l\u2019accueil</a>
    </div>
  </div>

  <script>
    (async () => {
      const params = new URLSearchParams(window.location.search);
      const sessionId = params.get('session_id');
      if (!sessionId) return;

      try {
        const res = await fetch('/api/stripe/session/' + sessionId);
        if (res.ok) {
          const data = await res.json();
          if (data.license_key) {
            document.getElementById('licenseKey').textContent = data.license_key;
          } else {
            document.getElementById('licenseKey').innerHTML = '<span class="license-loading">Votre cl\\u00e9 sera envoy\\u00e9e par email sous quelques minutes.</span>';
          }
        }
      } catch (e) {
        document.getElementById('licenseKey').innerHTML = '<span class="license-loading">Cl\\u00e9 en cours de g\\u00e9n\\u00e9ration. V\\u00e9rifiez vos emails.</span>';
      }
    })();
  </script>
  <canvas id="bgCanvas"></canvas>
  <script src="/static/bg3d.js"></script>
</body>
</html>`)
})

// ========== CANCEL PAGE ==========
app.get('/cancel', (c) => {
  return c.html(`<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Paiement annul\u00e9 — P\u00e9tanque Manager</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
  <link rel="icon" href="/static/images/logo.png">
  <link rel="stylesheet" href="/static/style.css">
  <style>
    .cancel-page { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 40px 20px; }
    .cancel-card { background: var(--bg-card); border: 1px solid var(--border-card); border-radius: var(--radius-lg); padding: 48px 40px; max-width: 480px; text-align: center; }
    .cancel-icon { font-size: 3.5rem; color: #f59e0b; margin-bottom: 20px; }
    .cancel-title { color: #fff; font-size: 1.8rem; font-weight: 800; margin-bottom: 12px; }
    .cancel-text { color: rgba(255,255,255,0.7); font-size: 1rem; line-height: 1.7; margin-bottom: 28px; }
    .cancel-buttons { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }
  </style>
</head>
<body>
  <div class="cancel-page">
    <div class="cancel-card">
      <div class="cancel-icon"><i class="fas fa-times-circle"></i></div>
      <h1 class="cancel-title">Paiement annul\u00e9</h1>
      <p class="cancel-text">Votre paiement n\u2019a pas \u00e9t\u00e9 finalis\u00e9. Aucun montant n\u2019a \u00e9t\u00e9 d\u00e9bit\u00e9.</p>
      <p class="cancel-text">Vous pouvez r\u00e9essayer \u00e0 tout moment ou profiter de l\u2019essai gratuit de 14 jours.</p>
      <div class="cancel-buttons">
        <a href="/#tarifs" class="btn btn-gold"><i class="fas fa-redo"></i> Voir les tarifs</a>
        <a href="/" class="btn btn-outline"><i class="fas fa-home"></i> Accueil</a>
      </div>
    </div>
  </div>
  <canvas id="bgCanvas"></canvas>
  <script src="/static/bg3d.js"></script>
</body>
</html>`)
})

// ========== API: Get session info (for success page) ==========
app.get('/api/stripe/session/:id', async (c) => {
  try {
    const sessionId = c.req.param('id')
    const supabaseUrl = c.env.SUPABASE_URL
    const serviceKey = c.env.SUPABASE_SERVICE_ROLE_KEY

    // Look up subscription by Stripe session — search recent subscriptions
    const res = await fetch(
      `https://api.stripe.com/v1/checkout/sessions/${sessionId}`,
      {
        headers: {
          'Authorization': `Bearer ${c.env.STRIPE_SECRET_KEY}`,
        },
      }
    )

    if (!res.ok) return c.json({ error: 'Session not found' }, 404)

    const session = await res.json() as any
    const email = session.customer_email || session.customer_details?.email
    const metadata = session.metadata || {}

    // Try to find the license key in Supabase
    if (metadata.user_id || email) {
      const query = metadata.user_id
        ? `user_id=eq.${metadata.user_id}&status=eq.active&order=created_at.desc&limit=1`
        : `status=eq.active&order=created_at.desc&limit=1`

      const licRes = await fetch(`${supabaseUrl}/rest/v1/pm_license_keys?${query}`, {
        headers: {
          'apikey': serviceKey,
          'Authorization': `Bearer ${serviceKey}`,
        },
      })

      if (licRes.ok) {
        const licenses = await licRes.json() as any[]
        if (licenses.length) {
          return c.json({
            license_key: licenses[0].license_key,
            plan_code: metadata.plan_code,
            email,
          })
        }
      }
    }

    return c.json({
      license_key: null,
      plan_code: metadata.plan_code,
      email,
      message: 'License is being generated. Check your email.',
    })
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

// ========== ESPACE CLIENT — LOGIN PAGE ==========
app.get('/espace-client/login', (c) => {
  return c.html(`<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Connexion — Espace client — Pétanque Manager</title>
  <link rel="icon" type="image/png" href="/static/images/logo.png">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
  <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.5.0/css/all.min.css" rel="stylesheet">
  <link href="/static/style.css" rel="stylesheet">
  <link href="/static/portal.css" rel="stylesheet">
</head>
<body class="portal-body">
  <canvas id="bgCanvas"></canvas>

  <div class="portal-login-page">
    <div class="portal-login-card">
      <a href="/" class="portal-logo-link">
        <img src="/static/images/logo.png" alt="Pétanque Manager" class="portal-logo">
      </a>
      <h1 class="portal-login-title">Espace client</h1>
      <p class="portal-login-subtitle">Connectez-vous pour gérer vos abonnements, licences et appareils.</p>

      <form id="loginForm" class="portal-form">
        <div class="portal-form-group">
          <label for="loginEmail"><i class="fas fa-envelope"></i> Email</label>
          <input type="email" id="loginEmail" placeholder="votre@email.com" required autocomplete="email">
        </div>
        <div class="portal-form-group">
          <label for="loginPassword"><i class="fas fa-lock"></i> Mot de passe</label>
          <input type="password" id="loginPassword" placeholder="Votre mot de passe" required autocomplete="current-password">
        </div>
        <div id="loginError" class="portal-alert portal-alert-error" style="display:none;"></div>
        <button type="submit" class="btn btn-gold btn-block portal-btn-submit" id="loginBtn">
          <i class="fas fa-sign-in-alt"></i> Se connecter
        </button>
      </form>

      <div class="portal-login-links">
        <a href="#" id="forgotPasswordLink" class="portal-link">Mot de passe oublié ?</a>
      </div>

      <!-- Forgot password form (hidden by default) -->
      <div id="forgotSection" class="portal-forgot-section" style="display:none;">
        <h3>Réinitialisation du mot de passe</h3>
        <p>Entrez votre adresse email pour recevoir un lien de réinitialisation.</p>
        <form id="forgotForm" class="portal-form">
          <div class="portal-form-group">
            <label for="forgotEmail"><i class="fas fa-envelope"></i> Email</label>
            <input type="email" id="forgotEmail" placeholder="votre@email.com" required>
          </div>
          <div id="forgotStatus" class="portal-alert" style="display:none;"></div>
          <button type="submit" class="btn btn-outline btn-block" id="forgotBtn">
            <i class="fas fa-paper-plane"></i> Envoyer le lien
          </button>
        </form>
        <a href="#" id="backToLogin" class="portal-link"><i class="fas fa-arrow-left"></i> Retour à la connexion</a>
      </div>

      <div class="portal-login-footer">
        <a href="/" class="portal-link"><i class="fas fa-arrow-left"></i> Retour au site</a>
      </div>
    </div>
  </div>

  <script src="/static/bg3d.js"></script>
  <script>
  document.addEventListener('DOMContentLoaded', () => {
    // Check if already logged in
    const token = localStorage.getItem('pm_access_token');
    if (token) {
      window.location.href = '/espace-client';
      return;
    }

    const loginForm = document.getElementById('loginForm');
    const loginError = document.getElementById('loginError');
    const loginBtn = document.getElementById('loginBtn');
    const forgotSection = document.getElementById('forgotSection');
    const forgotLink = document.getElementById('forgotPasswordLink');
    const backToLogin = document.getElementById('backToLogin');
    const forgotForm = document.getElementById('forgotForm');
    const forgotStatus = document.getElementById('forgotStatus');

    // Toggle forgot password
    forgotLink.addEventListener('click', (e) => {
      e.preventDefault();
      loginForm.style.display = 'none';
      document.querySelector('.portal-login-links').style.display = 'none';
      forgotSection.style.display = 'block';
    });

    backToLogin.addEventListener('click', (e) => {
      e.preventDefault();
      loginForm.style.display = 'block';
      document.querySelector('.portal-login-links').style.display = 'flex';
      forgotSection.style.display = 'none';
    });

    // Login handler
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      loginError.style.display = 'none';
      
      const email = document.getElementById('loginEmail').value.trim();
      const password = document.getElementById('loginPassword').value;
      
      if (!email || !password) {
        loginError.textContent = 'Veuillez remplir tous les champs.';
        loginError.style.display = 'block';
        return;
      }

      loginBtn.disabled = true;
      loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Connexion...';

      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });

        const data = await res.json();

        if (res.ok && data.access_token) {
          localStorage.setItem('pm_access_token', data.access_token);
          localStorage.setItem('pm_refresh_token', data.refresh_token);
          localStorage.setItem('pm_user_email', data.user.email);
          localStorage.setItem('pm_user_id', data.user.id);
          window.location.href = '/espace-client';
        } else {
          loginError.textContent = data.error || 'Identifiants invalides.';
          loginError.style.display = 'block';
        }
      } catch (err) {
        loginError.textContent = 'Erreur réseau. Veuillez réessayer.';
        loginError.style.display = 'block';
      }

      loginBtn.disabled = false;
      loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Se connecter';
    });

    // Forgot password handler
    forgotForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('forgotEmail').value.trim();
      if (!email) return;

      const btn = document.getElementById('forgotBtn');
      btn.disabled = true;
      btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Envoi...';

      try {
        const res = await fetch('/api/auth/reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        });

        const data = await res.json();
        forgotStatus.textContent = data.message || 'Email envoyé si le compte existe.';
        forgotStatus.className = 'portal-alert portal-alert-success';
        forgotStatus.style.display = 'block';
      } catch (err) {
        forgotStatus.textContent = 'Erreur réseau.';
        forgotStatus.className = 'portal-alert portal-alert-error';
        forgotStatus.style.display = 'block';
      }

      btn.disabled = false;
      btn.innerHTML = '<i class="fas fa-paper-plane"></i> Envoyer le lien';
    });
  });
  </script>
</body>
</html>`)
})

// ========== ESPACE CLIENT — DASHBOARD PAGE ==========
app.get('/espace-client', (c) => {
  return c.html(`<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Mon compte — Espace client — Pétanque Manager</title>
  <link rel="icon" type="image/png" href="/static/images/logo.png">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
  <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.5.0/css/all.min.css" rel="stylesheet">
  <link href="/static/style.css" rel="stylesheet">
  <link href="/static/portal.css" rel="stylesheet">
</head>
<body class="portal-body">
  <canvas id="bgCanvas"></canvas>

  <!-- Portal Navbar -->
  <nav class="portal-navbar">
    <div class="portal-nav-container">
      <a href="/" class="portal-nav-logo">
        <img src="/static/images/logo.png" alt="Pétanque Manager" class="portal-nav-logo-img">
        <span class="portal-nav-logo-text">Pétanque Manager</span>
        <span class="portal-nav-badge">Espace client</span>
      </a>
      <div class="portal-nav-right">
        <span class="portal-nav-email" id="navEmail"></span>
        <button class="portal-btn-logout" id="logoutBtn" title="Déconnexion">
          <i class="fas fa-sign-out-alt"></i> Déconnexion
        </button>
      </div>
    </div>
  </nav>

  <!-- Loading state -->
  <div class="portal-loading" id="portalLoading">
    <div class="portal-loading-spinner">
      <i class="fas fa-spinner fa-spin"></i>
      <p>Chargement de votre espace client...</p>
    </div>
  </div>

  <!-- Dashboard content (hidden until loaded) -->
  <main class="portal-main" id="portalMain" style="display:none;">
    <div class="portal-container">

      <!-- Welcome banner -->
      <div class="portal-welcome">
        <div class="portal-welcome-left">
          <h1><i class="fas fa-user-circle"></i> Bienvenue</h1>
          <p id="welcomeEmail"></p>
        </div>
        <div class="portal-welcome-right">
          <a href="/" class="btn btn-outline btn-sm"><i class="fas fa-arrow-left"></i> Retour au site</a>
        </div>
      </div>

      <!-- Summary cards -->
      <div class="portal-summary-grid" id="summaryGrid">
        <div class="portal-summary-card">
          <div class="portal-summary-icon"><i class="fas fa-credit-card"></i></div>
          <div class="portal-summary-data">
            <span class="portal-summary-value" id="sumActiveSubs">—</span>
            <span class="portal-summary-label">Abonnement(s) actif(s)</span>
          </div>
        </div>
        <div class="portal-summary-card">
          <div class="portal-summary-icon"><i class="fas fa-key"></i></div>
          <div class="portal-summary-data">
            <span class="portal-summary-value" id="sumActiveLicenses">—</span>
            <span class="portal-summary-label">Licence(s) active(s)</span>
          </div>
        </div>
        <div class="portal-summary-card">
          <div class="portal-summary-icon"><i class="fas fa-desktop"></i></div>
          <div class="portal-summary-data">
            <span class="portal-summary-value" id="sumUsedSlots">—</span>
            <span class="portal-summary-label">PC utilisé(s)</span>
          </div>
        </div>
        <div class="portal-summary-card">
          <div class="portal-summary-icon"><i class="fas fa-plus-circle"></i></div>
          <div class="portal-summary-data">
            <span class="portal-summary-value" id="sumFreeSlots">—</span>
            <span class="portal-summary-label">Emplacement(s) libre(s)</span>
          </div>
        </div>
      </div>

      <!-- Subscriptions -->
      <section class="portal-section">
        <div class="portal-section-header">
          <h2><i class="fas fa-credit-card"></i> Mes abonnements</h2>
        </div>
        <div class="portal-table-wrap" id="subsTableWrap">
          <p class="portal-empty" id="subsEmpty" style="display:none;"><i class="fas fa-inbox"></i>Aucun abonnement actif.</p>
          <table class="portal-table" id="subsTable" style="display:none;">
            <thead>
              <tr>
                <th>Formule</th>
                <th>Période</th>
                <th>Statut</th>
                <th>Début</th>
                <th>Renouvellement</th>
                <th>PC autorisés</th>
              </tr>
            </thead>
            <tbody id="subsBody"></tbody>
          </table>
        </div>
      </section>

      <!-- Licenses -->
      <section class="portal-section">
        <div class="portal-section-header">
          <h2><i class="fas fa-key"></i> Mes licences</h2>
        </div>
        <div class="portal-table-wrap" id="licTableWrap">
          <p class="portal-empty" id="licEmpty" style="display:none;"><i class="fas fa-key"></i>Aucune licence trouvée.</p>
          <table class="portal-table" id="licTable" style="display:none;">
            <thead>
              <tr>
                <th>Clé de licence</th>
                <th>Plan associé</th>
                <th>Statut</th>
                <th>Appareils</th>
                <th>Créée le</th>
                <th>Expire le</th>
              </tr>
            </thead>
            <tbody id="licBody"></tbody>
          </table>
        </div>
        <div class="portal-info-box">
          <i class="fas fa-shield-alt"></i>
          <span>La clé de licence ne change <strong>jamais</strong>, même lors d'un transfert de PC. Seul l'appareil associé est remplacé.</span>
        </div>
      </section>

      <!-- Devices -->
      <section class="portal-section">
        <div class="portal-section-header">
          <h2><i class="fas fa-desktop"></i> Mes appareils</h2>
        </div>
        <div class="portal-table-wrap" id="devTableWrap">
          <p class="portal-empty" id="devEmpty" style="display:none;"><i class="fas fa-laptop"></i>Aucun appareil enregistré.</p>
          <table class="portal-table" id="devTable" style="display:none;">
            <thead>
              <tr>
                <th>Nom du PC</th>
                <th>Empreinte</th>
                <th>Licence</th>
                <th>Activé le</th>
                <th>Dernier check-in</th>
                <th>Statut</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody id="devBody"></tbody>
          </table>
        </div>
        <div class="portal-info-box">
          <i class="fas fa-lightbulb"></i>
          <span>Libérez un appareil pour réutiliser la même licence sur un autre PC. La clé ne change pas.</span>
        </div>
      </section>

      <!-- Transfer steps -->
      <section class="portal-section portal-transfer-section">
        <h3><i class="fas fa-exchange-alt"></i> Comment changer de PC ?</h3>
        <div class="portal-transfer-steps">
          <div class="portal-transfer-step">
            <div class="portal-transfer-num">1</div>
            <p>Connectez-vous à votre espace client</p>
          </div>
          <div class="portal-transfer-arrow"><i class="fas fa-chevron-right"></i></div>
          <div class="portal-transfer-step">
            <div class="portal-transfer-num">2</div>
            <p>Repérez le PC à libérer dans la liste</p>
          </div>
          <div class="portal-transfer-arrow"><i class="fas fa-chevron-right"></i></div>
          <div class="portal-transfer-step">
            <div class="portal-transfer-num">3</div>
            <p>Cliquez « Libérer ce PC »</p>
          </div>
          <div class="portal-transfer-arrow"><i class="fas fa-chevron-right"></i></div>
          <div class="portal-transfer-step">
            <div class="portal-transfer-num">4</div>
            <p>Activez la même clé sur le nouveau PC</p>
          </div>
        </div>
      </section>

    </div>
  </main>

  <!-- Release confirmation modal -->
  <div class="portal-modal-overlay" id="releaseModal" style="display:none;">
    <div class="portal-modal">
      <div class="portal-modal-header">
        <h3><i class="fas fa-unlock"></i> Libérer cet appareil ?</h3>
        <button class="portal-modal-close" id="releaseModalClose"><i class="fas fa-times"></i></button>
      </div>
      <div class="portal-modal-body">
        <p>Vous êtes sur le point de libérer l'appareil :</p>
        <p style="font-size:1.05rem;"><strong id="releaseDeviceName"></strong></p>
        <ul class="portal-modal-info">
          <li><i class="fas fa-check"></i> L'emplacement sera immédiatement disponible</li>
          <li><i class="fas fa-key"></i> Votre clé de licence reste <strong>identique</strong></li>
          <li><i class="fas fa-laptop"></i> Vous pourrez activer cette licence sur un autre PC</li>
        </ul>
      </div>
      <div class="portal-modal-footer">
        <button class="btn btn-outline" id="releaseCancelBtn">Annuler</button>
        <button class="btn btn-gold" id="releaseConfirmBtn"><i class="fas fa-unlock"></i> Confirmer la libération</button>
      </div>
    </div>
  </div>

  <script src="/static/bg3d.js"></script>
  <script>
  document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('pm_access_token');
    const refreshToken = localStorage.getItem('pm_refresh_token');

    if (!token) {
      window.location.href = '/espace-client/login';
      return;
    }

    const loading = document.getElementById('portalLoading');
    const main = document.getElementById('portalMain');
    const navEmail = document.getElementById('navEmail');
    const welcomeEmail = document.getElementById('welcomeEmail');

    // Set email from localStorage quickly
    const storedEmail = localStorage.getItem('pm_user_email');
    if (storedEmail) {
      navEmail.textContent = storedEmail;
      welcomeEmail.textContent = storedEmail;
    }

    // Toast notification system
    function showToast(message, type) {
      const existing = document.querySelector('.portal-toast');
      if (existing) existing.remove();
      const toast = document.createElement('div');
      toast.className = 'portal-toast portal-toast-' + type;
      toast.innerHTML = '<i class="fas fa-' + (type === 'success' ? 'check-circle' : 'exclamation-circle') + '" style="margin-right:8px;"></i>' + message;
      document.body.appendChild(toast);
      setTimeout(() => { toast.style.opacity = '0'; toast.style.transform = 'translateY(-10px)'; setTimeout(() => toast.remove(), 300); }, 4000);
    }

    // Logout
    document.getElementById('logoutBtn').addEventListener('click', async () => {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { 'Authorization': 'Bearer ' + token },
        });
      } catch {}
      localStorage.removeItem('pm_access_token');
      localStorage.removeItem('pm_refresh_token');
      localStorage.removeItem('pm_user_email');
      localStorage.removeItem('pm_user_id');
      window.location.href = '/espace-client/login';
    });

    // Fetch dashboard data
    loadDashboard();

    async function apiCall(url, options) {
      options = options || {};
      let currentToken = localStorage.getItem('pm_access_token');
      const res = await fetch(url, {
        method: options.method || 'GET',
        headers: {
          'Authorization': 'Bearer ' + currentToken,
          'Content-Type': 'application/json',
        },
        body: options.body || undefined,
      });

      // If 401, try refresh
      if (res.status === 401 && refreshToken) {
        const refreshRes = await fetch('/api/auth/refresh', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh_token: refreshToken }),
        });

        if (refreshRes.ok) {
          const rd = await refreshRes.json();
          localStorage.setItem('pm_access_token', rd.access_token);
          localStorage.setItem('pm_refresh_token', rd.refresh_token);
          return fetch(url, {
            method: options.method || 'GET',
            headers: {
              'Authorization': 'Bearer ' + rd.access_token,
              'Content-Type': 'application/json',
            },
            body: options.body || undefined,
          });
        } else {
          localStorage.clear();
          window.location.href = '/espace-client/login';
          return null;
        }
      }

      return res;
    }

    async function loadDashboard() {
      try {
        const res = await apiCall('/api/account/dashboard');
        if (!res || !res.ok) {
          if (res && res.status === 401) {
            localStorage.clear();
            window.location.href = '/espace-client/login';
            return;
          }
          throw new Error('Failed to load');
        }

        const data = await res.json();

        // Update email
        if (data.user) {
          navEmail.textContent = data.user.email;
          welcomeEmail.textContent = data.user.email;
          localStorage.setItem('pm_user_email', data.user.email);
        }

        // Summary cards
        document.getElementById('sumActiveSubs').textContent = data.summary.active_subscriptions;
        document.getElementById('sumActiveLicenses').textContent = data.summary.active_licenses;
        document.getElementById('sumUsedSlots').textContent = data.summary.used_slots + ' / ' + data.summary.total_slots;
        document.getElementById('sumFreeSlots').textContent = data.summary.free_slots;

        // Tables
        renderSubscriptions(data.subscriptions);
        renderLicenses(data.licenses);
        renderDevices(data.devices);

        // Show main, hide loading
        loading.style.display = 'none';
        main.style.display = 'block';
      } catch (err) {
        console.error('Dashboard load error:', err);
        loading.innerHTML = '<div class="portal-loading-spinner"><i class="fas fa-exclamation-triangle" style="color:#e74c3c;font-size:2.5rem;display:block;margin-bottom:16px;"></i><p>Erreur de chargement.<br><a href="/espace-client/login" style="color:var(--gold);text-decoration:underline;">Reconnectez-vous</a></p></div>';
      }
    }

    function renderSubscriptions(subs) {
      const table = document.getElementById('subsTable');
      const empty = document.getElementById('subsEmpty');
      const body = document.getElementById('subsBody');

      if (!subs || !subs.length) {
        empty.style.display = 'block';
        table.style.display = 'none';
        return;
      }

      empty.style.display = 'none';
      table.style.display = 'table';
      body.innerHTML = subs.map(function(s) {
        return '<tr>' +
          '<td data-label="Formule" class="portal-cell-bold">' + esc(s.plan_name) + '</td>' +
          '<td data-label="Période">' + esc(s.billing_period_label) + '</td>' +
          '<td data-label="Statut"><span class="portal-status portal-status-' + s.status_type + '">' + esc(s.status_label) + '</span></td>' +
          '<td data-label="Début">' + fmtDate(s.started_at) + '</td>' +
          '<td data-label="Renouvellement">' + fmtDate(s.current_period_end) + '</td>' +
          '<td data-label="PC autorisés">' + s.included_seats + ' PC</td>' +
          '</tr>';
      }).join('');
    }

    function renderLicenses(lics) {
      const table = document.getElementById('licTable');
      const empty = document.getElementById('licEmpty');
      const body = document.getElementById('licBody');

      if (!lics || !lics.length) {
        empty.style.display = 'block';
        table.style.display = 'none';
        return;
      }

      empty.style.display = 'none';
      table.style.display = 'table';
      body.innerHTML = lics.map(function(l) {
        // Slot dots visual
        var dots = '';
        for (var i = 0; i < l.max_devices; i++) {
          dots += '<span class="portal-slot-dot ' + (i < l.active_devices ? 'portal-slot-dot-used' : 'portal-slot-dot-free') + '"></span>';
        }
        return '<tr>' +
          '<td data-label="Clé" class="portal-cell-mono">' + esc(l.license_key_masked) + '</td>' +
          '<td data-label="Plan">' + esc(l.plan_name) + '</td>' +
          '<td data-label="Statut"><span class="portal-status portal-status-' + l.status_type + '">' + esc(l.status_label) + '</span></td>' +
          '<td data-label="Appareils"><div class="portal-slot-bar">' + dots + '</div><span style="font-size:0.78rem;color:rgba(255,255,255,0.5);margin-left:6px;">' + l.active_devices + '/' + l.max_devices + '</span></td>' +
          '<td data-label="Créée le">' + fmtDate(l.created_at) + '</td>' +
          '<td data-label="Expire le">' + fmtDate(l.expires_at) + '</td>' +
          '</tr>';
      }).join('');
    }

    function renderDevices(devs) {
      const table = document.getElementById('devTable');
      const empty = document.getElementById('devEmpty');
      const body = document.getElementById('devBody');

      if (!devs || !devs.length) {
        empty.style.display = 'block';
        table.style.display = 'none';
        return;
      }

      empty.style.display = 'none';
      table.style.display = 'table';
      body.innerHTML = devs.map(function(d) {
        var isActive = d.status === 'active';
        var fingerprint = d.device_hash ? d.device_hash.substring(0, 4) + '\\u2026' + d.device_hash.slice(-4) : '\\u2014';
        var releaseBtn = isActive
          ? '<button class="portal-btn-release" data-activation-id="' + d.activation_id + '" data-device-name="' + esc(d.device_name) + '"><i class="fas fa-unlock"></i> Libérer ce PC</button>'
          : '<span class="portal-text-dim">' + esc(d.status_label) + '</span>';
        return '<tr class="' + (isActive ? '' : 'portal-row-dim') + '">' +
          '<td data-label="Nom du PC" class="portal-cell-bold"><i class="fas fa-' + (d.os_name === 'Windows' ? 'windows' : 'desktop') + '" style="color:var(--teal);margin-right:6px;font-size:0.9rem;"></i>' + esc(d.device_name) + '</td>' +
          '<td data-label="Empreinte" class="portal-cell-dim" style="font-family:monospace;font-size:0.8rem;letter-spacing:0.5px;">' + fingerprint + '</td>' +
          '<td data-label="Licence" class="portal-cell-mono" style="font-size:0.75rem;">' + esc(d.license_key_masked) + '</td>' +
          '<td data-label="Activé le">' + fmtDate(d.activated_at) + '</td>' +
          '<td data-label="Dernier check-in">' + fmtDate(d.last_seen_at) + '</td>' +
          '<td data-label="Statut"><span class="portal-status portal-status-' + d.status_type + '">' + esc(d.status_label) + '</span></td>' +
          '<td data-label="Action">' + releaseBtn + '</td>' +
          '</tr>';
      }).join('');

      // Attach release handlers
      document.querySelectorAll('.portal-btn-release').forEach(function(btn) {
        btn.addEventListener('click', function() { openReleaseModal(btn.dataset.activationId, btn.dataset.deviceName); });
      });
    }

    // Release modal
    var modal = document.getElementById('releaseModal');
    var modalClose = document.getElementById('releaseModalClose');
    var cancelBtn = document.getElementById('releaseCancelBtn');
    var confirmBtn = document.getElementById('releaseConfirmBtn');
    var pendingActivationId = null;

    function openReleaseModal(activationId, deviceName) {
      pendingActivationId = activationId;
      document.getElementById('releaseDeviceName').textContent = deviceName;
      modal.style.display = 'flex';
    }

    function closeReleaseModal() {
      modal.style.display = 'none';
      pendingActivationId = null;
    }

    modalClose.addEventListener('click', closeReleaseModal);
    cancelBtn.addEventListener('click', closeReleaseModal);
    modal.addEventListener('click', function(e) { if (e.target === modal) closeReleaseModal(); });

    // ESC key closes modal
    document.addEventListener('keydown', function(e) { if (e.key === 'Escape' && modal.style.display === 'flex') closeReleaseModal(); });

    confirmBtn.addEventListener('click', async function() {
      if (!pendingActivationId) return;

      confirmBtn.disabled = true;
      confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Libération en cours...';

      try {
        var res = await apiCall('/api/account/devices/' + pendingActivationId + '/release', {
          method: 'POST',
        });

        var data = await res.json();

        if (res.ok && data.success) {
          closeReleaseModal();
          showToast(data.message || 'Appareil libéré avec succès !', 'success');
          // Reload dashboard
          loading.style.display = 'flex';
          main.style.display = 'none';
          await loadDashboard();
        } else {
          showToast(data.error || 'Erreur lors de la libération.', 'error');
        }
      } catch (err) {
        showToast('Erreur réseau. Veuillez réessayer.', 'error');
      }

      confirmBtn.disabled = false;
      confirmBtn.innerHTML = '<i class="fas fa-unlock"></i> Confirmer la libération';
    });

    // Helpers
    function fmtDate(dateStr) {
      if (!dateStr) return '\\u2014';
      try {
        var d = new Date(dateStr);
        return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
      } catch (e) { return dateStr; }
    }

    function esc(str) {
      if (!str) return '';
      var div = document.createElement('div');
      div.textContent = str;
      return div.innerHTML;
    }
  });
  </script>
</body>
</html>`)
})

export default app
