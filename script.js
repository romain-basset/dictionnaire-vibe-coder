// Le dictionnaire lit FICHES.md au chargement et le rend consultable.
// Le fichier Markdown reste la source unique : rien n'est dupliqué ici.

const conteneur = document.querySelector('#fiches');
const compteur = document.querySelector('#compteur');
const etat = document.querySelector('#etat');
const blocRecherche = document.querySelector('.recherche');
const champRecherche = document.querySelector('#champ-recherche');
const viderRecherche = document.querySelector('#vider-recherche');
const suggestions = document.querySelector('#suggestions');

// Renseigné une fois le fichier lu et découpé. Chaque entrée retient ses
// éléments dans la page et son texte préparé pour la recherche.
let fiches = [];

// La fiche dont le contenu porte actuellement des surlignages. On la
// retient pour pouvoir lui rendre son état d'origine.
let ficheSurlignee = null;

// Combien de caractères montrer de part et d'autre de l'occurrence.
const AVANT = 90;
const APRES = 230;

// ------------------------------------------------------------------
// Découpage du fichier
// ------------------------------------------------------------------

// Le numéro de tête est retiré des sections comme des fiches : dans la
// page, la position dit déjà le rang, et la table des matières n'a pas
// besoin d'une cote de bibliothèque.
function sansNumero(titre) {
  return titre.replace(/^[\d.]+\s*/, '');
}

// Un titre de niveau 1 ouvre une section, un titre de niveau 2 ouvre une
// fiche. Le tout premier niveau 1 est le titre du document : il ne porte
// aucune fiche, et le filtre final l'écarte pour cette raison.
function decouper(texte) {
  const lignes = texte.split('\n');
  const sections = [];
  let section = null;
  let fiche = null;

  for (const ligne of lignes) {
    const titreSection = ligne.match(/^# (.+)$/);
    const titreFiche = ligne.match(/^## (.+)$/);

    if (titreSection) {
      section = { titre: sansNumero(titreSection[1]), fiches: [] };
      sections.push(section);
      fiche = null;
      continue;
    }

    if (titreFiche && section) {
      fiche = { titre: sansNumero(titreFiche[1]), lignes: [] };
      section.fiches.push(fiche);
      continue;
    }

    if (fiche) {
      fiche.lignes.push(ligne);
    }
  }

  return sections.filter((section) => section.fiches.length > 0);
}

// ------------------------------------------------------------------
// Conversion du Markdown en HTML
// ------------------------------------------------------------------

// Neutralise les caractères qui seraient sinon lus comme du HTML. On passe
// par textContent, dont le navigateur se charge : c'est plus sûr qu'une
// liste de remplacements écrite à la main.
function echapper(texte) {
  const element = document.createElement('div');
  element.textContent = texte;
  return element.innerHTML;
}

// Le balisage qui vit à l'intérieur d'une ligne. Le code entre accents
// graves est traité en premier, mais son contenu reste soumis aux règles
// suivantes : un mot en gras à l'intérieur d'un code inline serait donc
// mis en forme. Le cas ne se présente pas dans les fiches.
function inline(texte) {
  return echapper(texte)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*([^*]+)\*/g, '$1<em>$2</em>');
}

// Découpe une ligne de tableau en cellules : on retire la barre verticale
// de début et de fin avant de séparer, sinon on obtiendrait deux cellules
// vides aux extrémités.
function cellules(ligne) {
  return ligne.replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim());
}

function convertirTableau(rangs) {
  const entete = cellules(rangs[0]);

  // La deuxième ligne ne contient que les tirets d'alignement : on la saute.
  const corps = rangs.slice(2);

  const html = ['<div class="tableau"><table><thead><tr>'];
  for (const cellule of entete) {
    html.push('<th>' + inline(cellule) + '</th>');
  }
  html.push('</tr></thead><tbody>');

  for (const rang of corps) {
    html.push('<tr>');
    for (const cellule of cellules(rang)) {
      html.push('<td>' + inline(cellule) + '</td>');
    }
    html.push('</tr>');
  }

  html.push('</tbody></table></div>');
  return html.join('');
}

// Vrai pour les lignes qui ouvrent un bloc à elles seules : elles ne
// peuvent donc pas être absorbées dans le paragraphe en cours.
function ouvreUnBloc(ligne) {
  return ligne.startsWith('```')
    || ligne.startsWith('|')
    || ligne.startsWith('#')
    || ligne.trim() === '---'
    || /^[-*] /.test(ligne)
    || /^\d+\. /.test(ligne);
}

function convertir(lignes) {
  const html = [];
  let i = 0;

  while (i < lignes.length) {
    const ligne = lignes[i];

    if (ligne.trim() === '') {
      i++;
      continue;
    }

    // Bloc de code : tout ce qui suit est pris tel quel, sans conversion,
    // jusqu'aux trois accents graves de fermeture.
    if (ligne.startsWith('```')) {
      const contenu = [];
      i++;
      while (i < lignes.length && !lignes[i].startsWith('```')) {
        contenu.push(lignes[i]);
        i++;
      }
      i++;
      html.push('<pre><code>' + echapper(contenu.join('\n')) + '</code></pre>');
      continue;
    }

    if (ligne.startsWith('|')) {
      const rangs = [];
      while (i < lignes.length && lignes[i].startsWith('|')) {
        rangs.push(lignes[i]);
        i++;
      }
      html.push(convertirTableau(rangs));
      continue;
    }

    const sousTitre = ligne.match(/^#{3,6} (.+)$/);
    if (sousTitre) {
      html.push('<h3>' + inline(sousTitre[1]) + '</h3>');
      i++;
      continue;
    }

    if (ligne.trim() === '---') {
      html.push('<hr>');
      i++;
      continue;
    }

    if (/^[-*] /.test(ligne)) {
      const items = [];
      while (i < lignes.length && /^[-*] /.test(lignes[i])) {
        items.push('<li>' + inline(lignes[i].slice(2)) + '</li>');
        i++;
      }
      html.push('<ul>' + items.join('') + '</ul>');
      continue;
    }

    if (/^\d+\. /.test(ligne)) {
      const items = [];
      while (i < lignes.length && /^\d+\. /.test(lignes[i])) {
        items.push('<li>' + inline(lignes[i].replace(/^\d+\.\s+/, '')) + '</li>');
        i++;
      }
      html.push('<ol>' + items.join('') + '</ol>');
      continue;
    }

    // Ce qui reste est un paragraphe : les lignes consécutives sont
    // rassemblées, comme le veut Markdown, jusqu'à une ligne vide.
    const paragraphe = [];
    while (i < lignes.length && lignes[i].trim() !== '' && !ouvreUnBloc(lignes[i])) {
      paragraphe.push(lignes[i].trim());
      i++;
    }
    if (paragraphe.length > 0) {
      html.push('<p>' + inline(paragraphe.join(' ')) + '</p>');
    }
  }

  return html.join('');
}

// ------------------------------------------------------------------
// Comparaison insensible à la casse et aux accents
// ------------------------------------------------------------------

function normaliser(texte) {
  return texte.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

// Même normalisation, mais en retenant d'où vient chaque caractère. Sans
// cette carte, on saurait qu'un texte contient le mot cherché sans pouvoir
// le surligner : retirer les accents décale les positions, un caractère
// accentué pouvant en produire un seul une fois nu.
function normaliserAvecCarte(texte) {
  let normalise = '';
  const indices = [];

  for (let i = 0; i < texte.length; i++) {
    const nu = normaliser(texte[i]);
    for (let k = 0; k < nu.length; k++) {
      normalise += nu[k];
      indices.push(i);
    }
  }

  return { normalise: normalise, indices: indices };
}

// Renvoie les positions, dans le texte d'origine, de chaque occurrence.
function trouverOccurrences(carte, recherche) {
  const positions = [];
  let depuis = 0;

  while (true) {
    const trouve = carte.normalise.indexOf(recherche, depuis);
    if (trouve === -1) {
      break;
    }

    positions.push({
      debut: carte.indices[trouve],
      fin: carte.indices[trouve + recherche.length - 1] + 1
    });

    depuis = trouve + recherche.length;
  }

  return positions;
}

// ------------------------------------------------------------------
// Construction de la page
// ------------------------------------------------------------------

// textContent colle bout à bout le texte de tous les éléments : un titre
// suivi d'un paragraphe donnerait « synthèseLe chemin ». On réinsère donc
// les séparations que le rendu visuel apporte. Le remplacement porte sur
// notre propre HTML, produit par convertir, et non sur du balisage venu
// d'ailleurs : c'est ce qui rend cette approche par motifs acceptable.
function texteLisible(html) {
  const provisoire = document.createElement('div');

  provisoire.innerHTML = html
    .replace(/<\/(p|h3|li|tr|pre|div)>/g, '</$1>\n')
    .replace(/<\/(td|th)>/g, '</$1> · ');

  return provisoire.textContent.replace(/[ \t]+/g, ' ');
}

function creerFiche(fiche, section, dossier) {
  const element = document.createElement('details');
  element.className = 'fiche';

  const entete = document.createElement('summary');
  entete.className = 'fiche-entete';
  entete.textContent = fiche.titre;

  const contenu = document.createElement('div');
  contenu.className = 'fiche-contenu';
  contenu.innerHTML = convertir(fiche.lignes);

  element.appendChild(entete);
  element.appendChild(contenu);

  // Le texte cherché est celui qui s'affiche, et non le Markdown source :
  // pas de barres verticales de tableau ni d'accents graves parasites.
  const texte = fiche.titre + '\n' + texteLisible(contenu.innerHTML);

  fiches.push({
    titre: fiche.titre,
    section: section.titre,
    element: element,
    dossier: dossier,
    entete: entete,
    contenu: contenu,
    html: contenu.innerHTML,
    texte: texte,
    carte: normaliserAvecCarte(texte)
  });

  return element;
}

function creerSection(section) {
  const dossier = document.createElement('details');
  dossier.className = 'dossier';

  const entete = document.createElement('summary');
  entete.className = 'dossier-entete';

  const nom = document.createElement('span');
  nom.className = 'dossier-nom';
  nom.textContent = section.titre;

  const tag = document.createElement('span');
  tag.className = 'dossier-tag';
  tag.textContent = section.fiches.length;

  entete.appendChild(nom);
  entete.appendChild(tag);

  const liste = document.createElement('div');
  liste.className = 'fiches-liste';

  for (const fiche of section.fiches) {
    liste.appendChild(creerFiche(fiche, section, dossier));
  }

  dossier.appendChild(entete);
  dossier.appendChild(liste);

  return dossier;
}

// Une pastille par section, qui ouvre la section et y fait défiler.
function creerPastille(section, dossier) {
  const pastille = document.createElement('button');
  pastille.type = 'button';
  pastille.className = 'pastille';
  pastille.textContent = section.titre;

  pastille.addEventListener('click', () => {
    dossier.open = !dossier.open;
    if (dossier.open) {
      dossier.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });

  return pastille;
}

// ------------------------------------------------------------------
// Surlignage
// ------------------------------------------------------------------

// Découpe un texte en fragments, en isolant les occurrences. Renvoie des
// noeuds DOM plutôt qu'une chaîne HTML : le texte des fiches n'a ainsi
// jamais à être réinterprété comme du balisage.
function fragmenter(texte, recherche) {
  const carte = normaliserAvecCarte(texte);
  const occurrences = trouverOccurrences(carte, recherche);
  const morceaux = [];
  let curseur = 0;

  for (const occurrence of occurrences) {
    if (occurrence.debut > curseur) {
      morceaux.push(document.createTextNode(texte.slice(curseur, occurrence.debut)));
    }

    const marque = document.createElement('mark');
    marque.textContent = texte.slice(occurrence.debut, occurrence.fin);
    morceaux.push(marque);

    curseur = occurrence.fin;
  }

  if (curseur < texte.length) {
    morceaux.push(document.createTextNode(texte.slice(curseur)));
  }

  return morceaux;
}

// Parcourt les noeuds de texte d'un élément et remplace ceux qui contiennent
// l'occurrence. createTreeWalker ne visite que le texte : le balisage déjà
// en place, tableaux et blocs de code compris, n'est jamais touché.
function surlignerDans(element, recherche) {
  const parcours = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
  const aTraiter = [];

  while (parcours.nextNode()) {
    if (normaliser(parcours.currentNode.nodeValue).includes(recherche)) {
      aTraiter.push(parcours.currentNode);
    }
  }

  // Le remplacement se fait après le parcours : modifier l'arbre pendant
  // qu'on le visite fausserait la progression.
  for (const noeud of aTraiter) {
    noeud.replaceWith(...fragmenter(noeud.nodeValue, recherche));
  }
}

// Le titre de la fiche compte autant que son corps : c'est souvent là que
// se trouve le mot cherché.
function surlignerDansFiche(fiche, recherche) {
  effacerSurlignage();

  surlignerDans(fiche.entete, recherche);
  surlignerDans(fiche.contenu, recherche);

  ficheSurlignee = fiche;
}

// Rend à la fiche son titre et son contenu d'origine, ceux d'avant les
// marques.
function effacerSurlignage() {
  if (ficheSurlignee) {
    ficheSurlignee.entete.textContent = ficheSurlignee.titre;
    ficheSurlignee.contenu.innerHTML = ficheSurlignee.html;
    ficheSurlignee = null;
  }
}

// ------------------------------------------------------------------
// Suggestions
// ------------------------------------------------------------------

// Prélève le texte autour de la première occurrence, en s'arrêtant sur des
// espaces plutôt qu'en tranchant au milieu d'un mot.
function extraire(fiche, occurrence) {
  const texte = fiche.texte;

  let debut = Math.max(0, occurrence.debut - AVANT);
  let fin = Math.min(texte.length, occurrence.fin + APRES);

  if (debut > 0) {
    const espace = texte.indexOf(' ', debut);
    if (espace !== -1 && espace < occurrence.debut) {
      debut = espace + 1;
    }
  }

  if (fin < texte.length) {
    const espace = texte.lastIndexOf(' ', fin);
    if (espace !== -1 && espace > occurrence.fin) {
      fin = espace;
    }
  }

  // Les retours à la ligne du texte source deviennent des espaces : dans
  // une suggestion de quelques lignes, ils créeraient des trous.
  let extrait = texte.slice(debut, fin).replace(/\s+/g, ' ').trim();

  if (debut > 0) {
    extrait = '… ' + extrait;
  }
  if (fin < texte.length) {
    extrait = extrait + ' …';
  }

  return extrait;
}

function creerSuggestion(fiche, recherche) {
  const element = document.createElement('li');

  const bouton = document.createElement('button');
  bouton.type = 'button';
  bouton.className = 'suggestion';

  // Le chemin est surligné lui aussi : le mot cherché s'y trouve souvent,
  // et le laisser nu donnerait l'impression que la fiche ne correspond pas.
  const chemin = document.createElement('span');
  chemin.className = 'suggestion-chemin';
  for (const morceau of fragmenter(fiche.section + ' › ' + fiche.titre, recherche)) {
    chemin.appendChild(morceau);
  }

  const extrait = document.createElement('span');
  extrait.className = 'suggestion-extrait';

  const occurrence = trouverOccurrences(fiche.carte, recherche)[0];
  for (const morceau of fragmenter(extraire(fiche, occurrence), recherche)) {
    extrait.appendChild(morceau);
  }

  bouton.appendChild(chemin);
  bouton.appendChild(extrait);
  bouton.addEventListener('click', () => ouvrirFiche(fiche, recherche));

  element.appendChild(bouton);
  return element;
}

// Le clic sur une suggestion amène la fiche au centre de l'écran, ouverte
// et surlignée, et referme la zone : on a trouvé, on lit.
function ouvrirFiche(fiche, recherche) {
  suggestions.hidden = true;

  fiche.dossier.open = true;
  fiche.element.open = true;

  surlignerDansFiche(fiche, recherche);

  // On centre sur la première occurrence, et non sur la fiche : une fiche
  // plus haute que l'écran laisserait sinon le mot cherché hors de vue.
  // Le repli sur la fiche ne devrait jamais servir, la recherche ayant
  // trouvé le mot quelque part.
  const premiere = fiche.element.querySelector('mark') || fiche.element;
  premiere.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// ------------------------------------------------------------------
// Recherche
// ------------------------------------------------------------------

// La liste des sections ne bouge jamais : c'est la table des matières.
// La recherche vit entièrement dans la zone de suggestions.
function rechercher() {
  const texte = champRecherche.value.trim();
  viderRecherche.hidden = (champRecherche.value === '');

  suggestions.innerHTML = '';

  if (texte === '') {
    suggestions.hidden = true;
    etat.hidden = true;
    effacerSurlignage();
    return;
  }

  const recherche = normaliser(texte);

  // La fiche ouverte suit ce qui est dans la barre : sans cela, elle
  // resterait surlignée sur le mot précédent. On capture la référence
  // avant l'appel, qui commence par effacer et remet la variable à null.
  const ouverte = ficheSurlignee;
  if (ouverte) {
    surlignerDansFiche(ouverte, recherche);
  }

  const trouvees = fiches.filter((fiche) => fiche.carte.normalise.includes(recherche));

  suggestions.hidden = false;
  etat.hidden = false;

  if (trouvees.length === 0) {
    const message = document.createElement('li');
    message.className = 'suggestion-vide';
    message.textContent = 'Aucune fiche';
    suggestions.appendChild(message);
    etat.textContent = 'Aucune fiche ne contient « ' + texte + ' »';
    return;
  }

  for (const fiche of trouvees) {
    suggestions.appendChild(creerSuggestion(fiche, recherche));
  }

  etat.textContent = trouvees.length === 1
    ? '1 fiche trouvée'
    : trouvees.length + ' fiches trouvées';
}

champRecherche.addEventListener('input', rechercher);

// Revenir dans la barre alors qu'elle contient déjà du texte réaffiche les
// suggestions, sans quoi elles resteraient fermées après le clic ailleurs.
champRecherche.addEventListener('focus', rechercher);

viderRecherche.addEventListener('click', () => {
  champRecherche.value = '';
  champRecherche.focus();
  rechercher();
});

// Un clic hors du bloc de recherche referme la zone, sans effacer ce qui
// est tapé : le surlignage de la fiche ouverte doit survivre à ce clic.
document.addEventListener('click', (evenement) => {
  if (!blocRecherche.contains(evenement.target)) {
    suggestions.hidden = true;
  }
});

// ------------------------------------------------------------------
// Chargement
// ------------------------------------------------------------------

async function charger() {
  // fetch lit un fichier voisin par une requête HTTP : la page doit donc
  // être servie, pas ouverte depuis le disque en file://.
  const reponse = await fetch('FICHES.md');

  if (!reponse.ok) {
    throw new Error('FICHES.md introuvable (' + reponse.status + ')');
  }

  const sections = decouper(await reponse.text());

  for (const section of sections) {
    const dossier = creerSection(section);
    conteneur.appendChild(dossier);
    compteur.appendChild(creerPastille(section, dossier));
  }
}

charger().catch((erreur) => {
  // Seul cas où la ligne d'état parle en dehors d'une recherche : rien ne
  // s'affichera dans la page, il faut donc dire pourquoi.
  etat.hidden = false;
  etat.textContent = 'Lecture impossible : ' + erreur.message
    + '. Servez la page avec npx serve plutôt que de l\'ouvrir depuis le disque.';
});
