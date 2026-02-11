import { Hono } from 'hono'
import { cors } from 'hono/cors'

const app = new Hono()

app.use('/api/*', cors())

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
    </div>
  </nav>

  <!-- ========== HERO ========== -->
  <section class="hero" id="accueil">
    <div class="hero-bg-bokeh"></div>
    <div class="container hero-grid">
      <div class="hero-content">
        <h1 class="hero-title">Organisez vos tournois de p\u00e9tanque en quelques clics</h1>
        <p class="hero-subtitle">Cr\u00e9ez les \u00e9quipes, g\u00e9n\u00e9rez les tours, saisissez les scores&nbsp;: le classement s\u2019actualise automatiquement, sans prise de t\u00eate.</p>
        <ul class="hero-bullets">
          <li><i class="fas fa-check-circle"></i> Lancez un tournoi en 2 minutes, sans prise de t\u00eate.</li>
          <li><i class="fas fa-check-circle"></i> Moins d\u2019erreurs&nbsp;: matchs &amp; classement automatis\u00e9s.</li>
          <li><i class="fas fa-check-circle"></i> Gagnez du temps le jour J (clubs, concours, \u00e9v\u00e9nements).</li>
        </ul>
        <div class="hero-cta">
          <a href="#telecharger" class="btn btn-gold"><i class="fas fa-download"></i> T\u00e9l\u00e9chargez pour PC</a>
          <a href="#fonctionnalites" class="btn btn-outline"><i class="fas fa-eye"></i> Voir les fonctionnalit\u00e9s</a>
        </div>
        <p class="hero-micro">Windows 10/11 &bull; Essai gratuit 14 jours &bull; Fonctionne hors ligne</p>
      </div>
      <div class="hero-visual">
        <div class="hero-mockup zoomable" data-lightbox-src="/static/images/screenshot-nouveau.png" data-lightbox-alt="Cr\u00e9ation de tournoi">
          <img src="/static/images/screenshot-nouveau.png" alt="Capture P\u00e9tanque Manager - Cr\u00e9ation de tournoi" class="hero-screenshot">
        </div>
      </div>
    </div>
  </section>

  <!-- ========== FONCTIONNALITES ========== -->
  <section class="section" id="fonctionnalites">
    <div class="container">
      <h2 class="section-title">Fonctionnalit\u00e9s cl\u00e9s</h2>
      <p class="section-subtitle">Tout ce qu\u2019il faut pour g\u00e9rer un tournoi de A \u00e0 Z.</p>
      <div class="features-grid">
        <div class="feature-card">
          <div class="feature-icon"><i class="fas fa-trophy"></i></div>
          <h3>Formats de tournoi</h3>
          <p>T\u00eate-\u00e0-t\u00eate, doublette, triplette, m\u00eal\u00e9e, poules\u2026 tous les formats classiques de la p\u00e9tanque sont pris en charge.</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon"><i class="fas fa-magic"></i></div>
          <h3>G\u00e9n\u00e9ration automatique</h3>
          <p>Matchs et tours g\u00e9n\u00e9r\u00e9s automatiquement selon la logique du tournoi. Fini les tableaux papier.</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon"><i class="fas fa-map-marked-alt"></i></div>
          <h3>Gestion des terrains</h3>
          <p>R\u00e9partition claire des terrains, modifiable si besoin. Tout est visible d\u2019un coup d\u2019\u0153il.</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon"><i class="fas fa-user-clock"></i></div>
          <h3>BYE automatique</h3>
          <p>Si nombre impair d\u2019\u00e9quipes, le BYE est g\u00e9r\u00e9 automatiquement. Z\u00e9ro bricolage.</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon"><i class="fas fa-chart-line"></i></div>
          <h3>Classement live</h3>
          <p>Victoires, points marquis/encaiss\u00e9s, diff\u00e9rentiel : mise \u00e0 jour instantan\u00e9e apr\u00e8s chaque match.</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon"><i class="fas fa-users"></i></div>
          <h3>\u00c9quipes &amp; joueurs</h3>
          <p>Gestion simple, rapide. Pr\u00eat pour impression ou partage en quelques clics.</p>
        </div>
      </div>
    </div>
  </section>

  <!-- ========== APERCU APPLICATION ========== -->
  <section class="section section-alt" id="apercu">
    <div class="container">
      <h2 class="section-title">Aper\u00e7u de l\u2019application</h2>
      <p class="section-subtitle">D\u00e9couvrez l\u2019interface pens\u00e9e pour la simplicit\u00e9 et l\u2019efficacit\u00e9.</p>
      <div class="screenshots-grid">
        <div class="screenshot-card">
          <div class="screenshot-img-wrap zoomable" data-lightbox-src="/static/images/screenshot-equipes.png" data-lightbox-alt="\u00c9quipes &amp; joueurs">
            <img src="/static/images/screenshot-equipes.png" alt="Gestion des \u00e9quipes" class="screenshot-img">
          </div>
          <h3>\u00c9quipes &amp; joueurs</h3>
          <p>Cr\u00e9ez vos \u00e9quipes en quelques secondes (t\u00eate-\u00e0-t\u00eate, doublette, triplette\u2026). Ajoutez/\u00e9ditez les joueurs facilement, tout est pr\u00eat avant le lancement.</p>
        </div>
        <div class="screenshot-card">
          <div class="screenshot-img-wrap zoomable" data-lightbox-src="/static/images/screenshot-matchs.png" data-lightbox-alt="Matchs">
            <img src="/static/images/screenshot-matchs.png" alt="Gestion des matchs" class="screenshot-img">
          </div>
          <h3>Matchs</h3>
          <p>G\u00e9n\u00e9rez automatiquement les tours et les terrains, puis saisissez les scores en un clic. Moins d\u2019erreurs, et les r\u00e9sultats se mettent \u00e0 jour au fur et \u00e0 mesure.</p>
        </div>
        <div class="screenshot-card">
          <div class="screenshot-img-wrap zoomable" data-lightbox-src="/static/images/screenshot-classement.png" data-lightbox-alt="Classement">
            <img src="/static/images/screenshot-classement.png" alt="Classement en direct" class="screenshot-img">
          </div>
          <h3>Classement</h3>
          <p>Classement en direct apr\u00e8s chaque partie&nbsp;: victoires, points, diff\u00e9rentiel et d\u00e9partage clair. Visualisez instantan\u00e9ment qui est devant.</p>
        </div>
        <div class="screenshot-card">
          <div class="screenshot-img-wrap zoomable" data-lightbox-src="/static/images/screenshot-poules.png" data-lightbox-alt="Tournois en poules">
            <img src="/static/images/screenshot-poules.png" alt="Tournois en poules" class="screenshot-img">
          </div>
          <h3>Tournois en poules</h3>
          <p>Organisez vos tournois en poules avec une vue compl\u00e8te&nbsp;: phases de groupes, qualifications automatiques et tableau final. Id\u00e9al pour les grands tournois.</p>
        </div>
      </div>
    </div>
  </section>

  <!-- ========== TARIFS ========== -->
  <section class="section" id="tarifs">
    <div class="container">
      <h2 class="section-title">Tarifs</h2>
      <p class="section-subtitle">Choisissez l\u2019offre adapt\u00e9e \u00e0 votre club ou \u00e0 votre usage.</p>
      
      <!-- Pass Evenement -->
      <div class="pricing-event-wrap">
        <div class="pricing-card pricing-card-event">
          <div class="pricing-event-badge"><i class="fas fa-bolt"></i> Offre ponctuelle</div>
          <div class="pricing-event-layout">
            <div class="pricing-event-left">
              <h3>Pass \u00c9v\u00e9nement</h3>
              <p class="pricing-event-tagline">Id\u00e9al pour les comit\u00e9s de quartier, campings, entreprises, qui souhaitent cr\u00e9er un \u00e9v\u00e8nement unique.</p>
            </div>
            <div class="pricing-event-center">
              <ul class="pricing-features">
                <li><i class="fas fa-check"></i> Dur\u00e9e : 7 jours</li>
                <li><i class="fas fa-check"></i> 2 PC inclus</li>
                <li><i class="fas fa-check"></i> Acc\u00e8s complet : tournois, terrains, scores, classement, impressions</li>
                <li><i class="fas fa-check"></i> Activation en ligne, utilisation possible hors ligne ensuite</li>
              </ul>
            </div>
            <div class="pricing-event-right">
              <div class="pricing-event-price">29\u20ac<small> unique</small></div>
              <a href="#telecharger" class="btn btn-gold">Choisir ce pass</a>
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
        <span class="pricing-badge">\u00c9conomisez jusqu\u2019\u00e0 23%</span>
      </div>

      <div class="pricing-grid">
        <div class="pricing-card">
          <div class="pricing-card-header">
            <h3>Solo</h3>
            <p class="pricing-desc">1 PC</p>
          </div>
          <div class="pricing-price">
            <span class="price-monthly">19\u20ac<small>/mois</small></span>
            <span class="price-annual hidden">180\u20ac<small>/an</small></span>
          </div>
          <ul class="pricing-features">
            <li><i class="fas fa-check"></i> 1 licence PC</li>
            <li><i class="fas fa-check"></i> Tous les formats de tournoi</li>
            <li><i class="fas fa-check"></i> Mises \u00e0 jour incluses</li>
            <li><i class="fas fa-check"></i> Support par email</li>
          </ul>
          <a href="#telecharger" class="btn btn-outline btn-block">Choisir Solo</a>
        </div>
        <div class="pricing-card pricing-card-popular">
          <div class="pricing-popular-badge">Populaire</div>
          <div class="pricing-card-header">
            <h3>Duo</h3>
            <p class="pricing-desc">2 PC</p>
          </div>
          <div class="pricing-price">
            <span class="price-monthly">25\u20ac<small>/mois</small></span>
            <span class="price-annual hidden">240\u20ac<small>/an</small></span>
          </div>
          <ul class="pricing-features">
            <li><i class="fas fa-check"></i> 2 licences PC</li>
            <li><i class="fas fa-check"></i> Tous les formats de tournoi</li>
            <li><i class="fas fa-check"></i> Mises \u00e0 jour incluses</li>
            <li><i class="fas fa-check"></i> Support prioritaire</li>
          </ul>
          <a href="#telecharger" class="btn btn-gold btn-block">Choisir Duo</a>
        </div>
        <div class="pricing-card">
          <div class="pricing-card-header">
            <h3>Trio</h3>
            <p class="pricing-desc">3 PC</p>
          </div>
          <div class="pricing-price">
            <span class="price-monthly">30\u20ac<small>/mois</small></span>
            <span class="price-annual hidden">288\u20ac<small>/an</small></span>
          </div>
          <ul class="pricing-features">
            <li><i class="fas fa-check"></i> 3 licences PC</li>
            <li><i class="fas fa-check"></i> Tous les formats de tournoi</li>
            <li><i class="fas fa-check"></i> Mises \u00e0 jour incluses</li>
            <li><i class="fas fa-check"></i> Support prioritaire</li>
          </ul>
          <a href="#telecharger" class="btn btn-outline btn-block">Choisir Trio</a>
        </div>
        <div class="pricing-card">
          <div class="pricing-card-header">
            <h3>Club Pack</h3>
            <p class="pricing-desc">5 PC</p>
          </div>
          <div class="pricing-price">
            <span class="price-monthly">39\u20ac<small>/mois</small></span>
            <span class="price-annual hidden">360\u20ac<small>/an</small></span>
          </div>
          <ul class="pricing-features">
            <li><i class="fas fa-check"></i> 5 licences PC</li>
            <li><i class="fas fa-check"></i> Tous les formats de tournoi</li>
            <li><i class="fas fa-check"></i> Mises \u00e0 jour incluses</li>
            <li><i class="fas fa-check"></i> Support prioritaire d\u00e9di\u00e9</li>
          </ul>
          <a href="#telecharger" class="btn btn-outline btn-block">Choisir Club Pack</a>
        </div>
      </div>

      <!-- Add-ons -->
      <div class="addons-grid">
        <div class="addon-card">
          <div class="addon-icon"><i class="fas fa-palette"></i></div>
          <div class="addon-info">
            <h4>Module Logo Club</h4>
            <p>Personnalisez vos impressions avec votre logo.</p>
          </div>
          <div class="addon-price">
            <span class="price-monthly">5\u20ac<small>/mois</small></span>
            <span class="price-annual hidden">49\u20ac<small>/an</small></span>
          </div>
        </div>
        <div class="addon-card">
          <div class="addon-icon"><i class="fas fa-laptop"></i></div>
          <div class="addon-info">
            <h4>PC suppl\u00e9mentaire</h4>
            <p>Ajoutez un PC \u00e0 votre licence existante.</p>
          </div>
          <div class="addon-price">
            <span class="price-monthly">5\u20ac<small>/mois</small></span>
            <span class="price-annual hidden">49\u20ac<small>/an</small></span>
          </div>
        </div>
      </div>

      <p class="pricing-note">Essai gratuit 14 jours. Licence activable sur X PC selon l\u2019offre.</p>
      <div class="pricing-cta">
        <a href="#telecharger" class="btn btn-gold"><i class="fas fa-download"></i> T\u00e9l\u00e9charger l\u2019essai</a>
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
      <p class="download-compat">Compatible Windows 10/11 &bull; Fonctionne hors ligne &bull; Id\u00e9al pour clubs</p>
      <div class="download-cta">
        <a href="#" class="btn btn-gold btn-lg"><i class="fas fa-download"></i> T\u00e9l\u00e9charger pour PC</a>
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
            <span>Quelle diff\u00e9rence entre 1/2/3/5 PC ?</span>
            <i class="fas fa-chevron-down faq-chevron"></i>
          </button>
          <div class="faq-answer">
            <p>Chaque plan permet d\u2019activer la licence sur un nombre d\u00e9fini de PC. Par exemple, le plan Duo permet d\u2019installer et d\u2019utiliser P\u00e9tanque Manager sur 2 ordinateurs diff\u00e9rents simultan\u00e9ment.</p>
          </div>
        </div>
        <div class="faq-item">
          <button class="faq-question" aria-expanded="false">
            <span>Comment ajouter un PC suppl\u00e9mentaire ?</span>
            <i class="fas fa-chevron-down faq-chevron"></i>
          </button>
          <div class="faq-answer">
            <p>Utilisez l\u2019add-on \u00ab PC suppl\u00e9mentaire \u00bb \u00e0 5\u20ac/mois (ou 49\u20ac/an). Vous pouvez en ajouter autant que n\u00e9cessaire depuis votre espace client.</p>
          </div>
        </div>
        <div class="faq-item">
          <button class="faq-question" aria-expanded="false">
            <span>\u00c0 quoi sert le module \u00ab Logo Club \u00bb ?</span>
            <i class="fas fa-chevron-down faq-chevron"></i>
          </button>
          <div class="faq-answer">
            <p>Ce module vous permet d\u2019int\u00e9grer le logo de votre club sur tous les documents imprim\u00e9s (feuilles de match, classements, tableaux). Parfait pour un rendu professionnel.</p>
          </div>
        </div>
        <div class="faq-item">
          <button class="faq-question" aria-expanded="false">
            <span>Comment fonctionne le BYE automatique ?</span>
            <i class="fas fa-chevron-down faq-chevron"></i>
          </button>
          <div class="faq-answer">
            <p>Lorsqu\u2019il y a un nombre impair d\u2019\u00e9quipes, le logiciel attribue automatiquement un BYE (repos) \u00e0 une \u00e9quipe \u00e0 chaque tour, en veillant \u00e0 ce que chaque \u00e9quipe ne b\u00e9n\u00e9ficie qu\u2019une seule fois du BYE si possible. L\u2019\u00e9quipe exempt\u00e9e re\u00e7oit une victoire 13\u20130.</p>
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
      <div class="contact-wrap">
        <div class="contact-info">
          <div class="contact-info-item">
            <i class="fas fa-envelope"></i>
            <div>
              <h4>Email support</h4>
              <a href="mailto:support@petanque-manager.fr">support@petanque-manager.fr</a>
            </div>
          </div>
          <div class="contact-info-item">
            <i class="fas fa-clock"></i>
            <div>
              <h4>D\u00e9lai de r\u00e9ponse</h4>
              <p>R\u00e9ponse sous 24\u201348h</p>
            </div>
          </div>
          <div class="contact-logo">
            <img src="/static/images/logo.png" alt="P\u00e9tanque Manager" class="contact-logo-img">
          </div>
        </div>
        <form class="contact-form" id="contactForm">
          <div class="form-group">
            <label for="contactName">Nom</label>
            <input type="text" id="contactName" name="name" placeholder="Votre nom" required>
          </div>
          <div class="form-group">
            <label for="contactEmail">Email</label>
            <input type="email" id="contactEmail" name="email" placeholder="votre@email.com" required>
          </div>
          <div class="form-group">
            <label for="contactMessage">Message</label>
            <textarea id="contactMessage" name="message" rows="5" placeholder="Votre message\u2026" required></textarea>
          </div>
          <button type="submit" class="btn btn-gold btn-block"><i class="fas fa-paper-plane"></i> Envoyer</button>
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
          <li><a href="#tarifs">Tarifs</a></li>
          <li><a href="#telecharger">T\u00e9l\u00e9charger</a></li>
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

  <script src="/static/app.js"></script>
</body>
</html>`)
})

export default app
