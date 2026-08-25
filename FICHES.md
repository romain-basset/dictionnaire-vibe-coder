# Fiches de référence — Module Vibe Coding

Ces fiches sont issues de nos conversations : les questions de Romain, les débats sur le vocabulaire, et les formulations que nous avons validées ensemble. Elles ne reprennent pas les débats, seulement les conclusions qui lèvent les ambiguïtés. Les exemples sont ceux de sa propre pratique.

Dernière mise à jour : 2026-08-25 (J2 terminé, challenge du gestionnaire de favoris déployé).

---

# 1. Le terminal

## 1.1 Les chemins

Quatre noms spéciaux, valables dans n'importe quel dossier :

| Écriture | Désigne |
|---|---|
| `.` | le dossier où je suis |
| `..` | le dossier parent |
| `~` | le dossier personnel (`/Users/rbasset`) |
| `/` | la racine du disque |

`.` et `..` ne sont pas des conventions d'écriture : ce sont de véritables entrées présentes dans chaque dossier, visibles avec `ls -a`.

**Chemin absolu** : part de la racine, valable de partout (`/Users/rbasset/dev`). **Chemin relatif** : part de là où tu es (`config/settings.txt`). `pwd` donne toujours l'absolu.

**Deux usages distincts du point, à ne pas confondre :**
- `.` seul = le dossier courant → `grep -r "x" .`
- `.` en début de nom = fichier **caché**, invisible dans `ls` et dans le Finder → `.env`, `.gitignore`, `.git`

Un fichier caché n'est pas protégé, seulement discret. C'est la convention pour ranger la configuration.

## 1.2 Lire un fichier

| Commande | Effet |
|---|---|
| `cat fichier` | tout le contenu |
| `head fichier` | les 10 premières lignes |
| `tail fichier` | les 10 dernières lignes |
| `head -n 2` / `tail -n 1` | choisir le nombre de lignes |

`tail` est la commande des fichiers de journal : quand un programme échoue, l'erreur est à la fin.

## 1.3 Écrire dans un fichier

`>` **écrase** tout le contenu existant. `>>` **ajoute** à la fin. Les deux **créent** le fichier s'il n'existe pas — la différence n'apparaît que s'il existe déjà.

Il n'y a ni confirmation ni corbeille : un `>` à la place d'un `>>` détruit le contenu définitivement.

Exemple de sa pratique, où l'ordre est essentiel :

```bash
echo "node_modules/" > .gitignore   # crée le fichier
echo ".env" >> .gitignore           # complète
```

Inversés, la première ligne serait perdue.

## 1.4 Chercher : grep

```bash
grep -ri "erreur" .
```

| Élément | Rôle |
|---|---|
| `-r` | récursif : descend dans les sous-dossiers |
| `-i` | ignore la casse (`ERREUR`, `erreur`, `Erreur`) |
| `.` | le **point de départ** de la recherche, pas « tous les fichiers » |

C'est `-r` qui apporte le « tous », pas le point.

`-c` compte les lignes correspondantes au lieu de les afficher — équivalent de `| wc -l`, en plus court.

**Piège de portabilité :** sans chemin, `grep -r "motif"` fonctionne sur macOS (version BSD, qui prend le dossier courant par défaut) mais **bloque sous Linux** (version GNU, qui attend alors une saisie au clavier). Toujours écrire le point final, pour que la commande reste valable sur une machine serveur ou dans une CI.

## 1.5 Entrée et sortie standard

Toute commande possède deux canaux : une **entrée** (ce qu'elle lit) et une **sortie** (ce qu'elle produit). Par défaut, l'entrée est branchée sur le clavier, la sortie sur l'écran.

C'est pourquoi `wc -l` lancé seul semble figer le terminal : il attend que tu tapes quelque chose au clavier, puisque c'est là que son entrée est branchée. `Ctrl+D` signale la fin de la saisie ; il affiche alors `0`, n'ayant rien reçu.

**Les quatre façons de rebrancher ces canaux :**

| Écriture | Ce qui est rebranché |
|---|---|
| rien | entrée = clavier, sortie = écran |
| `commande > fichier` | la **sortie** va dans un fichier |
| `commande < fichier` | l'**entrée** vient d'un fichier |
| `A \| B` | la **sortie de A** devient l'**entrée de B** |

`>` et le pipe ne sont donc pas deux notions séparées : c'est la même idée, la redirection, appliquée à un canal différent.

## 1.6 Enchaîner des commandes

| Séparateur | Sens |
|---|---|
| retour à la ligne | fais ceci, puis cela |
| `&&` | fais ceci, **et si ça a réussi**, cela |
| `;` | fais ceci, puis cela, même en cas d'échec |
| `\|` | **transmets** le résultat de ceci à cela |

**La distinction qui compte : `&&` enchaîne, le pipe transmet.**

Démonstration vécue : `grep -i "erreur" erreurs.log | wc -l` affiche `3`, tandis que `grep -i "erreur" erreurs.log && wc -l` affiche les 3 lignes puis laisse `wc -l` attendre le clavier, faute d'avoir reçu quoi que ce soit.

Le `\` en fin de ligne est une **continuation** : il indique au shell que la commande n'est pas terminée. Sans lui, chaque ligne est exécutée séparément.

**Ce que « a réussi » veut dire, précisément :** toute commande se termine en renvoyant un **code de sortie**, un nombre. Zéro signifie succès, toute autre valeur un échec. C'est ce code, et lui seul, que `&&` consulte.

D'où un usage qui protège plutôt qu'il ne raccourcit :

```bash
git merge feat/recherche && git branch -d feat/recherche
```

Une fusion qui laisse un conflit sort avec un code non nul : la suppression de la branche n'a alors pas lieu. Le `&&` fait ici office de garde-fou, pas seulement de gain de frappe.

## 1.7 Les flags

Un **flag** est un réglage ajouté à une commande pour modifier son comportement.

- forme **courte** : un tiret et une lettre (`-v`)
- forme **longue** : deux tirets et un mot (`--verbose`)
- certains attendent une **valeur** juste après (`head -n 5`, `git commit -m "message"`)
- ils se combinent (`ls -la` équivaut à `ls -l -a`)

## 1.8 Les guillemets dans zsh

| Guillemets | zsh interprète |
|---|---|
| doubles | `$variable`, les backticks, le point d'exclamation |
| simples | **rien**, tout est littéral |

Conséquences pratiques rencontrées :
- une URL contenant un `&` doit être entre guillemets, sinon la commande est coupée et lancée en arrière-plan
- une URL contenant un `?` aussi : zsh a l'option `nomatch` active par défaut, le `?` y est un joker de noms de fichiers et la commande peut échouer sur `no matches found`
- pour écrire du code contenant `${...}` ou des backticks avec `echo`, il faut des guillemets **simples**

Retenir le principe : `echo` convient pour une ou deux lignes de texte simple. Dès qu'il s'agit de code, on utilise un éditeur — c'est plus rapide et sans piège d'échappement.

---

# 2. Git

## 2.1 Git et GitHub sont deux choses différentes

| | Git | GitHub |
|---|---|---|
| Nature | un **logiciel installé sur ta machine** | un **site web** |
| Rôle | enregistrer l'historique de ton code | héberger une copie de cet historique en ligne |
| Internet | pas nécessaire | nécessaire |
| Compte | aucun | oui |
| Obligatoire | oui, pour versionner | non |

Tes commits, ton historique, tes branches vivent dans un dossier caché `.git`, **sur ta machine**, et fonctionnent hors connexion. `git config` n'envoie rien nulle part : il écrit ton nom et ton email dans `~/.gitconfig`.

Le flag `--global` signifie « pour tous mes projets » : le dossier courant n'a aucune importance, et il n'est même pas nécessaire d'être dans un dépôt.

## 2.2 Le cycle en deux temps

`git add` sélectionne ce qui entrera dans le prochain enregistrement. `git commit` réalise l'enregistrement.

Pourquoi deux étapes : pour choisir précisément ce qui part. Si tu as modifié cinq fichiers, tu peux n'en enregistrer que deux et garder les autres pour un enregistrement séparé.

## 2.3 Le commit

Un **instantané figé des fichiers du projet**, identifié par un hash, contenant aussi le hash de son parent — ce qui forme une chaîne. Il est **immuable** : il ne bouge jamais, ne change jamais.

On fait un commit **sur** une branche, pas « à l'intérieur » d'une branche : un commit n'appartient à aucune branche en particulier.

Ce qui est photographié, ce sont **les fichiers du projet** (`README.md`, `app.js`). Le contenu du dossier `.git` n'est jamais dans un commit — vérifiable avec `git log --stat`.

## 2.4 Le hash

Une **empreinte numérique** : un calcul qui transforme un contenu en une suite de caractères de longueur fixe (40 caractères pour Git).

- même contenu, toujours le même hash
- un seul caractère modifié, et le hash devient totalement différent
- le hash court affiché par `git log` (`632686d`) n'est que le début du hash complet

**Pourquoi Git ne numérote pas 1, 2, 3 :** il est décentralisé. Deux personnes créent des commits en parallèle, sans se coordonner ; des numéros entraîneraient des collisions. Un hash calculé sur le contenu est unique sans coordination.

Le hash d'un commit inclut celui de son parent : modifier un ancien commit changerait tous les suivants, ce qui rend toute falsification visible.

## 2.5 La branche

**Un fichier de 41 octets dans `.git/refs/heads/`, contenant le hash du commit sur lequel elle est positionnée.** Le nom du fichier est le nom de la branche.

Les trois règles qui la relient au commit :

1. une branche pointe vers **exactement un** commit
2. un commit peut avoir **zéro, une ou plusieurs** branches qui pointent vers lui
3. quand tu fais un commit, la branche sur laquelle tu es **avance** sur le nouveau commit

**Formulation retenue :** `main` est un nom qui désigne toujours la photo la plus récente de sa série. Tu enregistres un nouveau commit, et `main` désigne celui-là. **Les commits ne bougent jamais, le nom se déplace.**

Une branche par fichier : deux branches donnent deux fichiers aux noms différents (`main` et `test-couleur`). Il n'y a jamais deux fichiers nommés `main`.

Conséquence : créer une branche est instantané même sur un projet de 10 000 fichiers, puisque Git n'écrit qu'un hash. Une branche n'est pas une copie du projet.

## 2.6 Pointer

« A pointe vers B » signifie **A contient l'adresse de B**.

Le sens ne s'inverse pas, et la preuve est dans le contenu des fichiers :

| Objet | Contient |
|---|---|
| fichier de branche `refs/heads/main` | **un hash de commit** |
| un commit | les fichiers, le message, l'auteur, la date, **le hash du parent** |

Un commit ne contient **jamais** de nom de branche — vérifiable avec `git cat-file -p <hash>`. Donc la branche connaît le commit, le commit ignore la branche.

`HEAD` répond à « où suis-je ? ». Il contient non pas un hash mais un chemin vers une branche : `ref: refs/heads/main`.

## 2.7 Lire un diff

`git diff` affiche ce qui a changé. C'est la commande centrale du module : c'est elle qui te permet de relire ce que l'IA a écrit avant de l'accepter.

```
@@ -1 +1,2 @@
 # Mon premier projet Git
+Ligne ajoutee apres le premier commit
```

**La ligne `@@` est une adresse**, elle indique à quel endroit du fichier tu regardes : `-1` = dans l'ancienne version, 1 ligne à partir de la ligne 1 ; `+1,2` = dans la nouvelle version, 2 lignes à partir de la ligne 1. Format : numéro de ligne, nombre de lignes. Quand le nombre est absent, il vaut 1.

**Piège : les symboles moins et plus ont deux sens selon la ligne où ils apparaissent.**

| Où | Moins | Plus |
|---|---|---|
| dans le `@@ ... @@` | ancienne version | nouvelle version |
| sur les lignes de contenu | ligne supprimée | ligne ajoutée |

Une ligne précédée d'un espace est du contexte inchangé. Les trois premières lignes (`diff --git`, `index`, les tirets et les plus) sont de la plomberie technique.

## 2.8 Merge et fast-forward

`git merge X` fusionne X **dans la branche où tu te trouves**.

**Fast-forward** (avance rapide) : quand la branche de destination n'a rien de nouveau de son côté, il n'y a rien à mélanger. Git déplace simplement le nom en avant sur le même chemin, et **aucun commit de fusion n'est créé**.

Situation vécue, avec les hash réels :

1. `main` pointe sur `632686d`
2. `git checkout -b test-couleur` : la nouvelle branche est créée sur le même commit — deux branches, un commit
3. commit sur la branche : `test-couleur` avance sur `3ddf269`, `main` reste sur `632686d`
4. `git merge test-couleur` depuis `main` : fast-forward, `main` avance sur `3ddf269`
5. les deux branches pointent sur `3ddf269`

Si `main` avait aussi reçu un commit entre-temps, les deux histoires auraient divergé et Git aurait dû créer un **commit de fusion** ayant deux parents — c'est là que des conflits peuvent apparaître.

## 2.9 Le sens du merge

**On se place toujours sur la branche qui va recevoir.** Le mélange de fichiers obtenu est le même dans les deux sens, mais **une seule des deux branches est modifiée**, et ce n'est pas la même.

| Commande | Où tu es | Qui avance | Qui reste intacte |
|---|---|---|---|
| `git merge test-couleur` | sur `main` | `main` | `test-couleur` |
| `git merge main` | sur `test-couleur` | `test-couleur` | `main` |

**Pourquoi une commande à double sens serait dangereuse :** le cas quotidien est celui d'une branche de travail inachevée, à mettre à jour avec les correctifs récents de `main`. Tu fais `git merge main` depuis ta branche : ton travail se met à jour, `main` ne bouge pas. Une fusion symétrique enverrait ton code inachevé dans `main`.

## 2.10 Supprimer une branche

`git branch -d nom` supprime **le fichier** `.git/refs/heads/nom`. Rien d'autre : les commits restent, et demeurent accessibles si une autre branche pointe dessus.

**Deux verrous distincts s'y opposent, à ne pas confondre.**

Le premier est la **branche courante** : Git refuse de supprimer celle que ton répertoire de travail occupe, fusionnée ou non.

```
error: cannot delete branch 'feat/edition-suppression' used by worktree at '...'
```

Le mot `worktree` est le terme Git pour l'**arbre de travail** : le répertoire où Git dépose les fichiers de la branche courante. Supprimer sa référence pendant que tu as ses fichiers sous les yeux n'aurait pas de sens.

Le second est la **fusion** : `-d` refuse une branche dont le travail n'a pas été fusionné (`error: the branch ... is not fully merged`). Le `-D` force la suppression, et les commits deviennent orphelins, disparaissant de `git log`.

**Piège de raisonnement, rencontré le 2026-08-24 :** avoir buté sur le premier verrou ne prouve pas qu'on avait oublié la fusion. Le message `used by worktree` serait apparu même la fusion faite. D'où l'ordre, qui ne se laisse pas intervertir :

```bash
git commit -m "..."
git switch main
git merge feat/ma-fonctionnalite
git branch -d feat/ma-fonctionnalite
```

## 2.11 Dans quel ordre initialiser un projet

**L'ordre entre `git init` et la création du `.gitignore` est indifférent.** Le `.gitignore` n'est qu'un fichier texte, relu par Git à chaque commande ; aucun des deux ne conditionne l'autre.

**L'ordre qui compte est ailleurs : le `.gitignore` doit exister avant le premier `git add`.** Sinon `git add .` fait entrer les milliers de fichiers de `node_modules` dans la zone de préparation, et il faut les en retirer avec `git rm --cached -r node_modules`.

Démarche retenue par Romain, valide : créer le `.gitignore` très tôt, et regrouper `git init`, `git add` et `git commit` au moment du versionnement. Elle ne perd rien, puisque **le premier commit capture l'état des fichiers au moment où il est fait**, pas leur histoire antérieure.

## 2.12 Le piège du commit sans message

`git commit` sans le flag `-m` ouvre l'**éditeur par défaut de Git** pour que tu y saisisses le message. Sur macOS, c'est **Vim** : un éditeur en terminal puissant, dont les commandes ne s'écrivent pas comme dans une fenêtre classique — beaucoup de débutants ne savent pas comment en sortir.

**Pour en sortir :**

1. `Esc` (deux ou trois fois, pour quitter à coup sûr le mode de saisie)
2. taper `:qa!` — les caractères doivent apparaître **en bas** de l'écran ; s'ils s'insèrent dans le texte, le `Esc` n'a pas pris
3. `Entrée`

Le vocabulaire de Vim : `:w` enregistre, `:q` quitte, `!` force. Donc `:wq` enregistre et quitte, `:qa!` quitte tout sans enregistrer.

**Échappatoire sans risque :** fermer l'onglet du terminal. Aucun commit n'est créé, les fichiers sont intacts, et le `git add` reste valide.

Dans le fichier ouvert par Vim, **les lignes commençant par un dièse sont ignorées** : elles servent à te rappeler ce qui va être commité. Toute autre ligne fait partie du message.

## 2.13 main n'a aucun statut particulier

Pour Git, `main` est une branche comme les autres — aucun privilège technique. Le nom par défaut était `master` avant 2020, et il est configurable.

Quand on dit « on ne pousse jamais directement sur `main` », ce n'est donc pas une contrainte de Git mais une **règle d'équipe**, appliquée par GitHub : `main` part automatiquement en production, donc tout ce qui y entre doit avoir été relu et testé.

## 2.14 Relier un dépôt local à GitHub

```bash
git remote add origin https://github.com/romain-basset/exo-starwars.git
git push -u origin main
```

**La phrase qui relie tous les termes :** ton dépôt local et son dépôt distant sont deux copies du même historique ; `git remote add origin <url>` enregistre l'adresse du distant sous le nom `origin`, et `git push -u origin main` envoie les commits de ta branche locale `main` vers ce distant, le `-u` mémorisant le lien pour que les prochains `git push` se passent d'arguments.

| Élément | Rôle |
|---|---|
| `remote` | un **dépôt distant** : la copie hébergée en ligne |
| `origin` | le **nom** donné à ce distant — convention, pas mot-clé |
| `git push` | envoie les commits locaux vers le distant |
| `-u` | mémorise le lien branche locale ↔ branche distante |

**Pourquoi « origin », alors que l'origine semble être le local :** le nom vient du cas d'usage historiquement dominant, le clonage. Avec `git clone`, le distant **est** bien l'origine de ta copie. Quand on crée le projet en local avant le distant, le nom devient trompeur — mais toute la documentation le suppose, en changer isolerait le projet.

**Le dépôt distant doit être créé vide**, sans README ni `.gitignore` : un dépôt pré-rempli contient déjà un commit, ce qui entre en conflit avec l'historique local au premier push.

**Ce que confirme la sortie du push :** `[new branch] main -> main` (la branche distante a été créée) et `branch 'main' set up to track 'origin/main'` (l'effet du `-u`).

**`git remote add` n'envoie rien et ne contacte même pas GitHub.** Elle écrit trois lignes dans `.git/config`, en local, sous une section `[remote "origin"]`. Elle ne vérifie ni que le dépôt existe, ni que tu as le droit d'y écrire : c'est le `git push` qui le découvre. Vérifiable par `cat .git/config`.

**Pourquoi un nom est obligatoire**, plutôt que `git remote add <url>` seul. Un dépôt local peut avoir plusieurs distants — le cas courant est le fork : `origin` pour ta copie, `upstream` par convention pour le projet d'origine, dont tu récupères les nouveautés sans pouvoir y écrire. Sans nom, impossible de désigner lequel. Le nom sert ensuite d'abréviation dans `git push origin main`, `git fetch origin`, `git pull origin main`.

Mais surtout, ce nom devient un **préfixe de référence**.

**La branche de suivi.** Après le premier push, Git crée `origin/main` : une référence **locale** qui retient où en était `main` chez le distant à ta dernière synchronisation. C'est elle qui permet à Git de dire « votre branche est en avance de 2 commits sur `origin/main` ». Sans nom de distant, cette référence n'aurait pas de forme.

**Vérifier qu'un push a eu lieu :** `git status`. Le discriminant est la ligne qui suit « Sur la branche main ». Si le push est passé, elle dit « Votre branche est à jour avec `origin/main` » — phrase qui n'existe que si le `-u` a créé le lien. Sinon, aucune mention de `origin/main` : Git ne sait pas à quoi comparer.

Nuance : `origin/main` étant une référence locale, `git status` dit si **toi** tu as poussé, pas si le distant a bougé depuis. Il n'interroge pas GitHub.

**`git clone` fait ce travail seul** : il enregistre automatiquement le dépôt cloné sous le nom `origin`. On ne tape `git remote add` que lorsqu'on part d'un dépôt local créé à la main.

## 2.15 L'URL d'un dépôt et le suffixe .git

| URL | Ce qu'elle désigne |
|---|---|
| `.../exo-starwars` | la **page web** du dépôt |
| `.../exo-starwars.git` | le **dépôt Git** lui-même, avec lequel Git dialogue |

GitHub accepte les deux, mais `.git` est la forme canonique — celle du bouton **Code → HTTPS**.

**`.git` n'est pas une extension de fichier** comme `.png`. C'est une convention de nommage de **dossier** : sur un serveur, un dépôt vit dans un dossier suffixé ainsi. C'est le même `.git` que le dossier caché de ton projet local.

## 2.16 Ce qu'il y a sur GitHub par rapport au local

**La même chose.** Mêmes commits, même historique, mêmes fichiers.

Deux différences, et ce sont les seules qui comptent en pratique :

1. ce que le `.gitignore` exclut n'y est pas — donc pas de `node_modules`
2. ce qui n'a pas été poussé n'y est pas — les commits locaux récents, tant que `git push` n'a pas été lancé

## 2.17 git clone

`git clone <url>` télécharge un dépôt distant en entier sur ta machine. En un seul geste, il :

1. crée un dossier au nom du projet
2. y copie tout l'historique, dans un `.git`
3. **reconstitue les fichiers** de la dernière version, lisibles, dans le dossier
4. enregistre automatiquement l'URL sous le nom `origin`

C'est l'inverse du parcours « créer en local puis pousser » : le clone part du distant. Et son quatrième point explique le nom `origin` — pour qui clone, le distant **est** l'origine.

## 2.18 Plusieurs comptes GitHub sur une machine

Le GitHub CLI gère plusieurs comptes en parallèle.

| Commande | Effet |
|---|---|
| `gh auth status` | liste les comptes et indique lequel est actif |
| `gh auth login` | ajoute un compte, sans supprimer les autres |
| `gh auth switch` | bascule le compte actif |

**Piège de l'authentification :** elle passe par le navigateur. Si celui-ci est connecté au mauvais compte, c'est ce compte-là qui sera autorisé. Se connecter au bon compte, ou utiliser une fenêtre privée, avant de lancer `gh auth login`.

**Choix stratégique retenu** (2026-08-14) : un compte GitHub **personnel**, sur un email perso durable, distinct du compte d'entreprise. Un email professionnel ou scolaire est temporaire ; le compte GitHub est une vitrine sur dix ans et son historique de contributions doit survivre aux changements d'employeur.

Le pseudo devient l'adresse publique du profil et apparaît dans l'URL de chaque dépôt. Modifiable, mais tout changement casse les liens existants.

## 2.19 git checkout, switch et restore

`git checkout` est une commande **historiquement surchargée** : trois usages différents, sans rien qui les distingue visuellement.

| Commande | Effet |
|---|---|
| `git checkout main` | basculer sur une branche existante |
| `git checkout -b test` | créer une branche **et** basculer dessus |
| `git checkout app.js` | **restaurer** ce fichier |

Git a reconnu le problème et séparé la commande en deux, depuis sa version 2.23 (2019) :

| Ancienne forme (enseignée par le cours) | Forme actuelle |
|---|---|
| `git checkout <branche>` | `git switch <branche>` |
| `git checkout -b <nom>` | `git switch -c <nom>` |
| `git checkout -- <fichier>` | `git restore <fichier>` |

Les deux fonctionnent. Les anciennes se croisent partout dans les tutoriels ; les nouvelles sont sans ambiguïté — `switch` pour les branches, `restore` pour les fichiers.

Le `-c` de `git switch -c` signifie **create**. Sans lui, `git switch` refuse un nom de branche qui n'existe pas : c'est précisément l'ambiguïté que la séparation a corrigée, là où `git checkout` acceptait les deux usages sans les distinguer.

**Créer une branche sans basculer dessus :**

```bash
git branch feat/recherche
```

La branche est créée, `HEAD` ne bouge pas. C'est d'ailleurs ce que `git switch -c` fait en interne : `git branch` puis `git switch`.

**Le second argument choisit le point de départ.** Sans lui, la branche naît sur le commit courant. Avec lui, sur celui qu'on désigne :

```bash
git branch correctif 3ec115b
```

Cohérent avec la définition de la branche : un fichier de 41 octets contenant un hash. Le second argument dit **quel hash y écrire**. Il accepte aussi un nom de branche — `git branch correctif main` part de `main`, même depuis une autre branche. `git switch -c` le prend également.

**Message à décoder :** « Updated 1 path from the index » signifie « un chemin restauré depuis l'index ». L'**index** est le nom technique de la zone de préparation, celle que `git add` remplit.

## 2.20 git stash : mettre un travail de côté

`git stash` est une **pile** où Git range temporairement les modifications non commitées. La commande sauvegarde le travail en cours et remet le répertoire de travail dans l'état du dernier commit — comme si rien n'avait été touché.

| Commande | Effet |
|---|---|
| `git stash` | range les modifications et nettoie le répertoire de travail |
| `git stash pop` | ressort la modification la plus récente et l'applique ici |
| `git stash list` | affiche ce qui est rangé |

**Pourquoi c'est nécessaire :** Git refuse une fusion qui écraserait des modifications non commitées. Il protège le travail plutôt que de le perdre.

**Cas vécu.** Deux fonctionnalités s'étaient accumulées sur la même branche, la première commitée mais non fusionnée, la seconde en cours. La séquence de remise en ordre :

```bash
git stash
git switch main
git merge feature/formulaire
git branch -d feature/formulaire
git switch -c feature/categories
git stash pop
```

Le message `Dropped refs/stash@{0}` confirme que le rangement a été retiré de la pile : le travail n'existe plus qu'à un seul endroit.

## 2.21 Relire un diff : ce que git diff montre, et jusqu'où relire

**`git diff` ne montre rien sur un fichier non suivi.** Un fichier neuf n'a aucune version antérieure à comparer. Pour le relire avant son premier commit : `git add .` puis `git diff --staged`, qui compare la zone de préparation au dernier commit.

**Jusqu'où relire ?** Le cours dit « toujours », ce qui est irréaliste à l'échelle d'un vrai projet. La stratégie retenue :

`git diff --stat` **systématiquement** — trois secondes, et il répond à une seule question : quels fichiers ont bougé, et y en a-t-il un que je n'attendais pas. Puis le **diff complet uniquement** quand le changement touche des données, des droits d'accès ou des secrets.

**Ce que le test à l'écran ne montre pas**, et qui justifie ce minimum :

- **ce qu'on n'a pas regardé** — une fonctionnalité voisine a pu être supprimée sans qu'on s'en aperçoive
- **les failles** — une application peut fonctionner parfaitement et fuir toutes ses données ; c'est la démonstration entière du J5
- **les cas limites** — ça marche avec trois éléments, on ne sait rien de zéro, de mille, ou d'un titre de cinq cents caractères

## 2.22 PR et MR

Même concept, deux noms : **PR** (*Pull Request*) sur GitHub, **MR** (*Merge Request*) sur GitLab. C'est une page web qui rassemble le diff complet de ta branche, une discussion ligne par ligne, le résultat des tests automatiques, et un bouton de fusion souvent bloqué tant que tout n'est pas vert.

C'est le point de passage obligé avant d'entrer dans `main`. Le workflow : branche → commits → push de la branche → PR → relecture et tests → fusion.

## 2.23 La boucle par fonctionnalité

Le cycle appliqué à chaque ajout de `bookmark-app` : **une branche, une fonctionnalité, un commit, une fusion.**

```bash
git switch -c feat/recherche
```
```bash
git --no-pager diff
```
```bash
git add .
```
```bash
git commit -m "feat: recherche de favoris"
```
```bash
git switch main
```
```bash
git merge feat/recherche
```
```bash
git branch -d feat/recherche
```
```bash
git push
```

**Ce que chaque étape achète.** La branche isole le travail en cours : `main` reste à tout moment dans un état qui fonctionne. La relecture du diff avant le commit ne consiste pas à tout comprendre, mais à **vérifier qu'il ne s'y trouve rien qu'on n'ait demandé** — c'est le seul filet quand le code est écrit par un tiers. Le commit fige un état auquel on peut revenir. La fusion verse le travail dans `main`. La suppression de la branche évite qu'une liste de branches mortes ne masque celles qui vivent. Le push publie, et déclenche le déploiement.

**Le rythme :** pousser après chaque fonctionnalité fusionnée, jamais seulement à la fin.

**Un commit devrait porter une seule chose.** Nos allers-retours de conception ont plusieurs fois produit des commits plus larges — recherche *et* intertitres de section dans le même. Git sait n'indexer qu'une partie des modifications d'un fichier, mais faute de le pratiquer, on a assumé le commit large **en le disant dans son message** plutôt que de le maquiller.

---

# 3. Réseau et HTTP

## 3.1 Le modèle client-serveur

Deux **rôles** dans un échange. Le **client** envoie la requête, le **serveur** attend les requêtes et y répond.

## 3.2 Serveur

**Un rôle dans un échange réseau : celui qui attend les requêtes et y répond.** Ce rôle est tenu à deux niveaux simultanément :

- la **machine serveur** : l'ordinateur, généralement distant, qui héberge le service
- le **programme serveur** : le logiciel qui écoute un port et répond aux requêtes (Express, nginx, PostgreSQL)

Les deux usages sont légitimes, et c'est de là que vient l'ambiguïté du mot. Sans précision, « serveur » désigne la machine, conformément au vocabulaire du cours.

**La preuve que c'est un rôle et non une catégorie de matériel :** avec `node app.js` puis `localhost:3000` dans le navigateur, un seul ordinateur — ton Mac — tient les deux rôles à la fois. Le navigateur est le client, ton programme Node est le serveur. Si « serveur » désignait un type d'ordinateur, cette situation serait impossible.

Une même machine fait tourner plusieurs programmes serveurs, chacun sur son port : Express sur 3000, PostgreSQL sur 5432, SSH sur 22.

## 3.3 Le trajet d'une requête

1. tu tapes une **URL**
2. le **DNS** traduit le nom (`exemple.com`) en adresse IP (`93.184.216.34`)
3. le navigateur **fabrique la requête HTTP** et l'envoie à cette adresse
4. le serveur exécute le code correspondant
5. il renvoie la **réponse HTTP**
6. le navigateur affiche

**Ce que le navigateur fait de l'adresse IP :** rien d'autre que l'utiliser comme destination. L'URL sert aux humains, l'IP sert au réseau.

**D'où vient la requête :** personne ne la fournit au navigateur, **il la fabrique** en découpant l'URL que tu as tapée.

```
https://api.github.com/users/torvalds
  │            │              │
protocole    l'hôte        le chemin
```

Ces morceaux sont ensuite répartis à deux endroits de la requête :

```
GET /users/torvalds HTTP/1.1     ← le chemin, sur la première ligne
Host: api.github.com             ← l'hôte, dans un en-tête
```

Le protocole n'apparaît nulle part dans la requête : il a servi avant, pour établir la connexion.

**Pourquoi `Host` est un en-tête séparé :** une même adresse IP héberge souvent des centaines de sites. Sans cet en-tête, le serveur reçoit la requête sans savoir quel site est demandé.

## 3.4 HTTP

*HyperText Transfer Protocol*. Un **protocole** est un ensemble de règles de format que deux machines respectent pour se comprendre.

Ses trois règles fondamentales :

1. **c'est toujours le client qui parle en premier** — le serveur ne peut jamais te contacter spontanément
2. **une requête, une réponse** — pas d'échange libre
3. **aucune mémoire** — le serveur ne se souvient pas de ta requête précédente ; c'est précisément pour cela que les cookies existent

Le format imposé :

| Requête (client → serveur) | Réponse (serveur → client) |
|---|---|
| une **méthode** : `GET`, `POST`… | un **code de statut** : `200`, `404`… |
| un **chemin** : `/sport` | |
| des **en-têtes** | des **en-têtes** |
| un **corps**, facultatif | un **corps** : le HTML, le JSON |

**HTTPS** est le même protocole dans un tuyau chiffré : seul le transport change, les règles sont identiques.

## 3.5 La requête est-elle toujours la même ?

La **structure**, oui : toujours une méthode, un chemin, un hôte, des en-têtes. C'est un standard mondial. Le **contenu**, non : le chemin, l'hôte et surtout les en-têtes varient.

Précision utile : **taper une URL dans la barre d'adresse produit toujours un `GET`.** Les `POST` viennent des formulaires ou du JavaScript.

Conséquence qui prépare J3-J4 : deux personnes tapant la même URL envoient deux requêtes différentes, parce que leurs cookies diffèrent — et reçoivent donc deux pages différentes.

## 3.6 Les codes de statut

La première ligne de la réponse. Groupés par premier chiffre :

| Famille | Sens |
|---|---|
| **2xx** | succès |
| **4xx** | erreur de **ton** côté (le client) |
| **5xx** | erreur de **leur** côté (le serveur) |

| Code | Signification |
|---|---|
| `200` | OK |
| `301` | Moved Permanently — la ressource a changé d'adresse |
| `401` | il faut s'authentifier |
| `403` | authentifié, mais pas autorisé |
| `404` | ce chemin n'existe pas |
| `429` | trop de requêtes |
| `500` | leur bug, pas le tien |

Sur un `301`, **curl ne suit pas la redirection** par défaut, contrairement à un navigateur qui le fait sans rien dire. Le flag `-L` la suit. Cas vécu : `facebook/react` renvoie un `301` vers `react/react`, et le corps de la réponse indiquait lui-même l'URL cible — illustration de la méthode de débogage : lire le statut, puis lire le corps.

## 3.7 Les en-têtes

Des métadonnées qui accompagnent un message. **Chaque message a les siennes** : la requête a ses en-têtes, la réponse a les siens.

| En-tête | Envoyé par le client | Reçu du serveur |
|---|---|---|
| `Host` | quel site je demande | |
| `User-Agent` | qui je suis | |
| `Accept` | le format que je **voudrais** | |
| `Authorization` | ma clé d'API | |
| `Cookie` | ma session | |
| `Content-Type` | le format du corps que j'envoie | le format du corps renvoyé |
| `Content-Length` | | la taille de la réponse |
| `Server` | | qui a répondu |
| `Set-Cookie` | | « garde ce cookie » |

Dialogue typique : le client envoie `Accept: application/json`, le serveur répond `Content-Type: application/json`.

## 3.8 Content-Type et types MIME

Le format `type/sous-type` s'appelle un **type MIME**. Inventé pour les pièces jointes d'emails, repris par HTTP.

La famille avant le slash :

| Famille | Signifie | Exemples |
|---|---|---|
| `text/` | destiné à être **lu** | `text/html`, `text/plain`, `text/css` |
| `image/` | une image | `image/png` |
| `application/` | destiné à être **traité par un programme** | `application/json`, `application/pdf`, `application/zip` |

Le classement est conventionnel, pas absolu : le JSON reste parfaitement lisible par un humain.

Express pose cet en-tête automatiquement : `res.send()` avec du texte donne `text/html`, `res.json()` donne `application/json`. Tu n'écris aucun en-tête.

## 3.9 L'URL

```
https://api.github.com/users/torvalds/repos?per_page=5&sort=updated
```

| Partie | Valeur |
|---|---|
| protocole | `https://` |
| hôte | `api.github.com` |
| chemin | `/users/torvalds/repos` — slash initial inclus |
| **query string** | `?per_page=5&sort=updated` |

La query string transporte des paramètres optionnels, sous forme `clé=valeur`, séparés par `&`. C'est le **serveur** qui définit les paramètres acceptés : on ne peut pas les inventer.

Le chemin n'est jamais vide : `/` est son minimum, et correspond à la page d'accueil.

## 3.10 JSON

*JavaScript Object Notation*. Le format d'échange du web, utilisé par tous les langages malgré son nom.

`{}` regroupe des paires clé-valeur (un objet), `[]` contient une liste ordonnée (un tableau), et les deux s'imbriquent.

## 3.11 API, endpoint, chemin, route

### La phrase de synthèse

Le **chemin** est ce que le client demande ; la **route** est ce que tu déclares sur ton serveur pour y répondre ; un chemin couvert par une route est un **endpoint** ; et l'ensemble de tes endpoints, avec pour chacun sa méthode et son format de réponse, constitue ton **API**.

### API

**Application Programming Interface** — l'ensemble des points d'entrée qu'un programme expose pour être utilisé **par un autre programme**.

Le mot décisif est **Programming** : une API s'adresse à du code, jamais à un humain. Le critère est donc le **destinataire**, et il tranche sans arbitraire :

| Route | Destinataire | Dans l'API ? |
|---|---|---|
| `/` et `/about` | un humain, via son navigateur | **non** — ce sont des pages |
| `/api/character` | un programme | **oui** |

**La notion dépasse le web.** Express expose lui aussi une API : `app.get`, `app.use`, `res.json` sont les points d'entrée par lesquels ton code utilise le framework. Ton `app.js` consomme l'API d'Express.

Elle est définie par le **code**, pas par le matériel : le même code déplacé sur une autre machine expose la même API. Et **elle n'ajoute aucune étape au trajet** d'une requête : on interroge un serveur, l'API est l'ensemble des demandes qu'il accepte.

**Le préfixe `/api` est une pure convention de nommage**, sans effet technique. Il signale au lecteur de l'URL que l'endpoint s'adresse à du code ; `/donnees-personnage` fonctionnerait à l'identique. Ce qui distingue réellement les deux types de routes n'est pas leur chemin mais **ce qu'elles renvoient** : `res.send` avec du HTML, ou `res.json` avec des données.

*Formulation antérieure de ces fiches, corrigée le 2026-08-21 parce que trop large : « la liste des chemins que le code sait traiter » englobait à tort les pages HTML.*

### Endpoint

Un point d'entrée de cette interface : un chemin, avec sa méthode et son format de réponse, qu'un **programme** peut appeler.

**Conséquence à assumer : une route qui renvoie une page HTML n'est pas un endpoint.** Le terme juste pour `/` et `/about` est « route », ou « page ».

Dans la conversation courante, beaucoup de développeurs emploient « endpoint » pour n'importe quelle URL exposée, pages comprises. C'est un usage relâché, pas la définition — à savoir lire sans l'adopter.

### Chemin

Ce que le client envoie : la partie de l'URL après l'hôte. Un chemin existe même si le serveur n'en fait rien — `/nimportequoi` est un chemin, mais pas un endpoint, puisque le serveur répond « Cannot GET ».

### Route

Ce que le serveur déclare pour traiter une requête : une **méthode**, un **chemin**, et le **code** à exécuter. `app.get('/about', fonction)` est une route.

Preuve qu'une route est plus large qu'un chemin : `app.get('/posts')` et `app.post('/posts')` portent le même chemin et constituent deux routes distinctes.

### Le format de réponse

Ce qu'un développeur voulant consommer une API doit connaître, en deux volets :

- **le type de contenu** : HTML ou JSON
- **la structure des données** : quels champs, sous quels noms

Le format de réponse de `/api/character` est un objet JSON contenant exactement `name`, `birth_year`, `mass` et `height`. C'est ce même besoin qui a obligé à découvrir les noms de champs de SWAPI avant de pouvoir écrire le code.

## 3.12 Site web contre API

Même parcours, même protocole. La seule différence est **ce que le serveur renvoie**, donc côté réponse :

| Le serveur renvoie | On parle de |
|---|---|
| du HTML, destiné à un humain via un navigateur | un site web |
| du JSON, destiné à un programme | une API |

Vérifié par tes propres commandes : `curl claude.com` renvoie du HTML, `curl api.github.com/users/torvalds` renvoie du JSON. GitHub a séparé les deux par un sous-domaine `api.`.

## 3.13 La phrase de synthèse du trajet complet

Le client envoie une **requête HTTP** à un **serveur** — un ordinateur distant — sur lequel tourne un **programme** ; l'**API** de ce programme est l'ensemble de ses **endpoints**, c'est-à-dire les points d'entrée qu'un autre programme peut appeler, et quand la requête vise l'un d'eux, le programme exécute le code correspondant et produit la **réponse du serveur**.

---

# 4. curl

## 4.1 Ce que c'est

Un **programme en ligne de commande** qui envoie une requête HTTP et affiche la réponse brute. Son nom vient de « client for URLs ».

C'est un navigateur sans fenêtre : mêmes étapes — fabriquer la requête, l'envoyer, recevoir la réponse — mais le texte reçu est affiché tel quel, sans mise en page.

| | Navigateur | curl |
|---|---|---|
| Fabrication de la requête | à sa façon, tu ne décides rien | **tu peux** tout décider |
| Affichage | mis en page | texte brut |
| Méthode | toujours `GET` en tapant une URL | au choix |
| En-têtes | ceux qu'il veut | ceux que tu écris |

Par défaut, curl envoie une requête minimale — trois en-têtes contre une dizaine pour un navigateur.

## 4.2 Les flags

| Flag | Effet |
|---|---|
| `-i` | affiche les en-têtes de la réponse au-dessus du corps |
| `-s` | silencieux : supprime la barre de progression, utile avant un pipe |
| `-L` | suit les redirections (`301`) |
| `-X` | change la méthode (`-X POST`) |
| `-H` | ajoute un en-tête à la **requête** |
| `-d` | fournit le **corps** de la requête |

Envoyer des données :

```bash
curl -X POST https://jsonplaceholder.typicode.com/posts \
  -H "Content-Type: application/json" \
  -d '{"userId": 1, "title": "Mon premier post", "body": "Bonjour depuis curl !"}'
```

Guillemets **simples** autour du `-d`, pour ne pas entrer en conflit avec les guillemets doubles du JSON.

**Le motif universel de toute API :** tu envoies des données en POST, le serveur crée la ressource, et il renvoie l'objet créé **avec son nouvel identifiant**.

## 4.3 Pourquoi curl ne remplace pas un programme

**La raison décisive : curl est un client, pas un serveur.** Il sait envoyer des requêtes, pas en recevoir. Il est incapable d'écouter un port et d'attendre qu'un visiteur se connecte. Ce sont deux rôles opposés du dialogue HTTP.

Deux limites secondaires : aucune logique (pas de variables, conditions ni boucles) et aucune mémoire entre deux exécutions.

curl est bel et bien utilisé en production, mais toujours dans son rôle de **client** : scripts d'automatisation, vérifications de disponibilité, tâches planifiées.

Sa place dans le travail : lire la documentation → tester en curl → traduire en code.

## 4.4 De curl au code

Chaque commande curl se traduit terme pour terme en appel `fetch` :

| En curl | En JavaScript |
|---|---|
| l'URL | premier argument de `fetch` |
| `-H "Clé: Valeur"` | l'objet `headers` |
| `-X POST` | `method: 'POST'` |
| `-d '{...}'` | `body` |

## 4.5 Lire une documentation d'API

La compétence n'est pas de mémoriser des API, c'est de traduire une documentation en requête. Les accolades marquent les emplacements à remplacer :

```
GET /repos/{owner}/{repo}/issues
```

devient, pour les 5 issues fermées de `react` chez `facebook` :

```bash
curl -L "https://api.github.com/repos/facebook/react/issues?state=closed&per_page=5"
```

**Et ne jamais présumer des noms de champs.** Deux méthodes fiables pour les connaître : lire le début de la réponse (`| head -40`), ou lire la documentation de l'endpoint.

---

# 5. Node et npm

## 5.1 Node.js

Un programme qui **exécute du JavaScript en dehors d'un navigateur**. Le terme technique est **runtime** (environnement d'exécution).

Avant Node, JavaScript ne tournait que dans un navigateur. Node permet de l'exécuter sur ta machine ou sur un serveur — c'est ce qui rend possible d'écrire un programme serveur en JavaScript.

Deux modes : `node` seul ouvre le REPL, `node fichier.js` exécute un fichier.

## 5.2 Ouvrir contre exécuter

**Un franchissement conceptuel majeur.** Jusqu'à `node hello.js`, tous les fichiers manipulés étaient des **données inertes** : créés, lus, cherchés, versionnés. Ils ne faisaient rien.

Avec Node, le contenu d'un fichier devient des **instructions actives**.

| Commande | Ce que le fichier devient |
|---|---|
| `open -e app.js` | il s'**ouvre** : il s'affiche, on peut le lire et le modifier |
| `cat app.js` | du contenu qu'on affiche |
| `node app.js` | il s'**exécute** : les instructions sont réalisées, rien ne s'affiche |

**Le fichier ne change pas : c'est la commande qui décide de son statut.** Le même `app.js` est une donnée pour `cat`, un programme pour `node`.

Corollaire vérifié : **l'extension ne compte pas pour Node.** Elle ne sert qu'à toi et à ton éditeur. `cp app.js essai.txt && node essai.txt` démarre le serveur normalement.

## 5.3 Le REPL

*Read-Eval-Print Loop* : une console interactive. Tu tapes une ligne de JavaScript, Node l'exécute immédiatement et affiche le résultat, puis attend la suivante. Aucun fichier nécessaire. On en sort avec `.exit`.

**La différence avec un fichier :** le REPL affiche automatiquement le résultat de chaque ligne. Un fichier s'exécute en silence et n'affiche que ce qu'on lui demande explicitement d'afficher — d'où `console.log`.

Vérifié : un fichier contenant `2 + 3` n'affiche rien ; `console.log(2 + 3)` affiche `5`.

## 5.4 console.log

L'instruction qui **affiche une valeur**. Tout ce qui est entre les parenthèses est écrit dans le terminal.

C'est l'équivalent exact du `print()` de Python.

## 5.5 npm, packages et registre

**npm** (*Node Package Manager*) s'installe avec Node.

Un **package** est du code écrit par quelqu'un d'autre, réutilisable, publié dans un **registre**. Les packages dont ton projet a besoin s'appellent ses **dépendances**.

Le **registre npm** est un serveur public hébergeant plus de 2 millions de packages, à l'adresse `registry.npmjs.org`. `npm install` n'est donc qu'une requête HTTP : `curl -s https://registry.npmjs.org/express` renvoie le JSON du package. Le site `npmjs.com` sert à les consulter.

Attention au vocabulaire : le mot **bibliothèque** désigne le package lui-même, pas le registre.

## 5.6 package.json contre node_modules

`npm install express` produit trois changements :

| Élément | Contenu |
|---|---|
| `node_modules/` | le code téléchargé d'Express et de ses dépendances |
| `dependencies` dans `package.json` | la ligne `"express": "^5.2.1"` |
| `package-lock.json` | les versions **exactes** installées |

Le `^` autorise npm à installer une version plus récente **compatible** : corrections et ajouts, mais pas un changement majeur qui casserait ton code. Là où `package.json` dit « une version 5 compatible », `package-lock.json` enregistre « exactement la 5.2.1 » — ce qui garantit que ton collègue installera les mêmes versions.

**L'arbre de dépendances :** installer un seul package a créé 65 dossiers, parce qu'Express dépend d'autres packages, qui dépendent à leur tour d'autres.

**Reconstructible** signifie que tu peux supprimer `node_modules` entièrement et le récupérer à l'identique : `npm install` lit la liste de `package.json` et retélécharge tout. Aucune information n'est perdue.

| Fichier | Versionné dans Git ? |
|---|---|
| `package.json` | **oui** — c'est la liste |
| `package-lock.json` | **oui** — ce sont les versions exactes |
| `node_modules/` | **non** — c'est le résultat, reconstructible |

## 5.7 Installer et importer sont deux actions différentes

| Action | Qui la fait | Effet |
|---|---|---|
| **Installer** (`npm install express`) | npm, une seule fois | télécharge le code **sur le disque** |
| **Importer** (`require('express')`) | ton programme, à chaque exécution | charge ce code **en mémoire** et te le rend utilisable |

**Pourquoi Node ne charge pas automatiquement tout `node_modules` :** un projet réel contient des centaines de packages installés, dont un fichier donné n'utilise que deux ou trois. Tout charger à chaque démarrage serait lent et inutile. Chaque fichier importe donc ce dont **il** a besoin.

## 5.8 Comment require trouve un module

C'est **la forme de la chaîne** passée à `require` qui décide où Node va chercher.

| Ce que tu écris | Ce que Node en déduit |
|---|---|
| `require('express')` | pas de point, pas de slash → **nom de package** : chercher dans `node_modules` |
| `require('./game')` | commence par un point → **chemin de fichier**, relatif au fichier courant |
| `require('/Users/...')` | commence par un slash → chemin absolu |
| `require('fs')` | **module natif** de Node, intégré au runtime |

L'ordre dans lequel Node tranche :

1. est-ce un module natif (`fs`, `http`, `path`, `os`) ? → le charger directement, sans rien chercher sur le disque
2. commence-t-il par un point ou un slash ? → aller chercher ce fichier précis
3. sinon → nom de package : chercher `node_modules` dans le dossier courant, puis **remonter les dossiers parents** jusqu'à le trouver

C'est pourquoi ton `require('express')` fonctionne sans que tu précises aucun chemin. Et pourquoi une faute de frappe donne `Cannot find module 'expres'` : Node a bien cherché, sans trouver ce nom.

**Quel fichier est chargé dans le dossier du package :** un package contient des dizaines de fichiers. Node lit le `package.json` **du package** et charge celui indiqué par son champ `main` — le même champ que dans ton propre `package.json`. Vérifiable avec `head -20 node_modules/express/package.json`.

## 5.9 npx et les trois modes d'installation

**`npx`** exécute un package **sans l'installer durablement** : il le télécharge, le lance, et n'en garde rien dans le projet.

Le critère de choix entre les trois modes est toujours le même : **ton code en a-t-il besoin pour fonctionner ?**

| Commande | Ce qui est installé | Pour quoi |
|---|---|---|
| `npm install express` | dans `node_modules`, inscrit dans `package.json` | une **dépendance** de ton code |
| `npm install -g nodemon` | sur toute la machine, hors projet | un **outil** utilisé partout |
| `npx serve` | rien de durable | un outil **ponctuel** |

Express est une dépendance : `app.js` contient `require('express')`, le programme ne démarre pas sans lui. `serve` n'en est pas une : ni `index.html` ni `script.js` ne le mentionnent, il ne sert qu'à livrer les fichiers pendant le développement. Qui clone le projet n'en a aucun besoin.

Deux avantages de `npx` au passage : toujours la dernière version, et un `node_modules` qui ne gonfle pas d'outils étrangers au programme.

**`serve`** est justement un de ces outils : un petit programme serveur autonome, qui expose un dossier par HTTP. L'équivalent de `app.use(express.static('public'))`, sans avoir à écrire de code.

## 5.10 .gitignore

Un fichier texte contenant **une liste de noms**, un par ligne. Git la lit à chaque commande et ignore tout ce qui correspond.

`echo ".env" >> .gitignore` écrit **le texte** `.env` — quatre caractères — dans le fichier. Aucun fichier n'est déplacé ni imbriqué.

Il se place à la racine du projet, au même niveau que ce qu'il ignore.

## 5.11 Les secrets

Une **clé d'API** est une chaîne secrète qui identifie ton application auprès d'un service. Elle fonctionne comme un mot de passe.

Écrite **en dur** — directement dans le code — elle part sur GitHub au premier `push`. Des robots scannent les dépôts publics en continu ; une clé exposée est exploitée en quelques minutes.

Les trois pièces de la solution :

1. **variable d'environnement** — une valeur fournie au programme au démarrage, que le code lit par `process.env.MA_CLE` au lieu de la contenir
2. **le fichier `.env`** — une variable par ligne, `CLE=valeur`, sans espaces autour du signe égal ni guillemets
3. **`.gitignore`** — où l'on inscrit `.env` pour qu'il ne soit jamais envoyé

**Le point crucial :** Git conserve tout son historique. Commiter une clé puis supprimer le fichier ne suffit pas, elle reste consultable. Une clé qui a fui ne se cache pas : elle se **révoque** — on la désactive chez le fournisseur et on en génère une nouvelle.

---

## 5.12 Deux fonctionnalités déjà natives dans Node

Deux corrections au cours, vérifiées sur ta version (Node 22) :

**`fetch` est natif depuis Node 18.** Tu l'as utilisé sans rien installer, et il n'apparaît pas dans ton `package.json`. Avant 2022, il fallait un package (`node-fetch`, `axios`) — beaucoup de tutoriels le mentionnent encore inutilement.

**Le redémarrage automatique est natif depuis Node 18**, avec le flag `--watch` :

```bash
node --watch app.js
```

Le cours fait installer `nodemon`, qui date de 2010, bien avant que Node ne sache le faire. Il reste dans les cours par habitude. Sans `nodemon`, Node lit le fichier une seule fois au démarrage : toute modification exige alors un `Ctrl+C` suivi d'un `node app.js`.

## 5.13 Le flag -g de npm

`-g` signifie **global** : installer le package pour toute la machine plutôt que dans le projet courant.

| | Sans `-g` | Avec `-g` |
|---|---|---|
| Où va le code | `node_modules/` du projet | un dossier système |
| Inscrit dans `package.json` | oui, dans `dependencies` | **non** |
| Utilisable | dans ce projet seulement | depuis n'importe quel dossier |

**Le critère :** `-g` pour les **outils en ligne de commande** utilisés partout, sans `-g` pour les **dépendances de ton code**. Express a donc été installé sans `-g` : `app.js` en a besoin pour fonctionner, il doit voyager avec le projet.

**Conséquence :** un package global n'étant pas dans `package.json`, il n'est pas reconstruit par `npm install`. Qui clone ton projet ne l'aura pas.

Même mot et même sens que dans `git config --global` : pour toute la machine, pas seulement ce projet.

---

# 6. Express et JavaScript

## 6.1 Bibliothèque contre framework

| | Qui contrôle le déroulement |
|---|---|
| **Bibliothèque** | **toi** — tu appelles son code quand tu en as besoin |
| **Framework** | **lui** — il appelle ton code aux moments qu'il a prévus |

**Express est un framework**, et c'est le terme de sa propre documentation. Le cours l'appelle « bibliothèque » au §1 et « framework » au §5 : le terme juste est framework.

La démonstration est dans ton propre code : tu écris `app.get('/', (req, res) => { ... })` mais tu n'exécutes jamais cette fonction. Tu la confies à Express, qui l'appellera à chaque requête sur `/`. À l'inverse, quand tu appelles `fetch(...)`, c'est toi qui décides du moment — comportement de bibliothèque.

## 6.2 Le serveur minimal, ligne par ligne

```js
const express = require('express');
const app = express();
const port = 3000;

app.get('/', (req, res) => {
  res.send('Hello, World! This is my first server.');
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
```

**`require('express')`** — la fonction de Node qui importe un module, ici le framework téléchargé dans `node_modules`.

**`express()`** — exécute le framework, qui **fabrique** un objet application et le renvoie. Rangé dans `app`, ce nom n'est qu'une convention : `const serveur = express()` fonctionnerait aussi.

**`const port = 3000`** — le numéro de port, dans une variable pour ne l'écrire qu'une fois.

**`app.get('/', fonction)`** — la déclaration d'une route. `app.get` est une **méthode fournie par Express**, attachée à l'objet qu'il a fabriqué. Les paramètres `req` et `res` sont la requête reçue et la réponse à construire.

**`res.send(...)`** — écrit le corps de la réponse.

**`app.listen(port, fonction)`** — démarre l'écoute. C'est cette ligne qui maintient le programme actif : normalement un programme se termine à sa dernière ligne, mais ici Node reste en attente de requêtes. Le terminal semble bloqué, sans rendre le prompt : c'est normal. La fonction fournie n'est exécutée qu'une fois, au démarrage.

Node lit le fichier **une seule fois**, au démarrage : toute modification exige un redémarrage (`Ctrl+C` puis `node app.js`), ou l'usage de `nodemon`, qui surveille les fichiers et redémarre automatiquement.

## 6.3 res.send contre res.json

`res.send()` renvoie du texte, avec `Content-Type: text/html`. `res.json()` reçoit un objet JavaScript, le convertit en JSON et pose `Content-Type: application/json`.

Vérifié avec `curl -i` : l'en-tête change alors que tu n'as écrit aucun en-tête. C'est le framework qui adapte l'enveloppe selon la méthode employée.

Une réponse construite par du code est **dynamique** : `/api/time` renvoie une heure différente à chaque requête, parce que le code est exécuté à neuf pour chaque visiteur.

## 6.4 Le JavaScript nécessaire pour lire

**`const`** déclare une variable dont la valeur ne sera pas remplacée. `let` sert quand elle doit changer.

**Les parenthèses déclenchent l'exécution** : `express()` signifie « exécute la fonction `express` ». Ce qu'on met dedans est un **argument**.

**Le point désigne une fonction qui appartient à quelque chose** : `app.get(...)` se lit « exécute la fonction `get` de `app` ». Une fonction rattachée à un objet s'appelle une **méthode** — `console.log` en est une.

**Les guillemets délimitent du texte**, simples ou doubles indifféremment. Sans guillemets, `express` serait un nom de variable.

**Les backticks** permettent d'insérer une variable dans le texte avec `${...}` : `` `localhost:${port}` `` produit `localhost:3000`. Avec des guillemets normaux, tu obtiendrais littéralement `${port}`.

**Les accolades délimitent un bloc de code.** **Le point-virgule termine une instruction.**

**La fonction fléchée** :

```js
(req, res) => { res.send('Hello'); }
```

Une fonction sans nom : à gauche de la flèche ce qu'elle reçoit, à droite ce qu'elle exécute. Elle n'a pas besoin de nom parce que tu ne l'appelles pas toi-même — tu la **passes en argument** à un autre code, qui la déclenchera au bon moment. Procédé très courant en JavaScript.

**L'indentation est cosmétique en JavaScript**, contrairement à Python où elle fait partie de la syntaxe. Des espaces parasites en début de ligne n'ont aucun effet.

## 6.5 Les trois « express » de deux lignes

```js
const express = require('express');
const app = express();
```

| Écriture | Ce que c'est | Imposé ou libre |
|---|---|---|
| `'express'` entre guillemets | du **texte** : le nom du dossier dans `node_modules` | **imposé** |
| `express` après `const` | le **nom de la variable** où tu ranges le résultat | **libre** |
| `express()` | l'**exécution** du contenu de cette variable | suit le nom choisi |

Ce que `require` renvoie ici est une **fonction** — d'où la possibilité de l'appeler avec des parenthèses. Le résultat de cet appel est l'objet application.

La démonstration qui lève la confusion — ce code est strictement équivalent :

```js
const monFramework = require('express');
const app = monFramework();
```

**Les parenthèses exécutent ce que la variable contient**, et cela n'a de sens que si son contenu est une fonction. `const port = 3000; port();` donne `TypeError: port is not a function`.

**Et une variable contient le résultat d'une expression, pas l'expression.** La chronologie exacte : `require('express')` s'exécute une seule fois à la ligne de déclaration, renvoie une fonction, qui est rangée dans la variable ; plus tard, `express()` exécute cette fonction. Ton `express()` ne rappelle donc jamais `require`. Comme `const x = 2 + 3` stocke `5`, pas l'opération.

## 6.6 Les fichiers statiques et les middlewares

Un **fichier statique** est servi **tel quel** : le serveur le lit sur le disque et l'envoie à l'identique, sans traitement. L'opposé d'une réponse dynamique, construite par du code à chaque requête — comme `/api/time`, qui recalcule l'heure à chaque visite.

```js
app.use(express.static('public'));
```

Cette ligne rend accessible tout le contenu du dossier `public/`, sans écrire une seule route.

**Le nom du dossier n'apparaît pas dans l'URL.** Il devient la racine des fichiers servis.

| Fichier sur le disque | URL pour l'atteindre |
|---|---|
| `public/style.css` | `/style.css` |
| `public/images/logo.png` | `/images/logo.png` |

**Ce qui est cherché est le chemin de la requête.** Une requête `GET /about` fait chercher `public/about` ; absent, Express passe aux routes. Cas particulier : pour la racine, `express.static` cherche par convention un fichier `index.html`.

**Piège du challenge J1 :** l'énoncé impose que tout le HTML soit généré depuis `app.js`. Un `public/index.html` serait servi **avant** la route `/`, puisque `express.static` est examiné en premier — et la page dynamique ne s'afficherait jamais.

**Pourquoi un dossier dédié plutôt que le projet entier :** tout ce qui est dans ce dossier est téléchargeable par n'importe qui. Servir la racine du projet rendrait `.env` et `package.json` publics. C'est une frontière de sécurité.

**Middleware** — `app.use(...)` enregistre du code exécuté à **chaque requête**, avant les routes, quel que soit le chemin. Là où `app.get('/about', ...)` ne concerne qu'un chemin. D'où sa place **avant** les routes dans le fichier.

## 6.7 Ce que fait exactement node app.js

Deux phases distinctes.

**Au démarrage**, Node exécute le fichier de haut en bas, une fois :

| Ligne | Ce qui se passe réellement |
|---|---|
| `require('express')` | cherche le package, exécute son code, range la fonction obtenue |
| `express()` | appelle cette fonction, qui fabrique l'objet application. **Aucun port n'est encore ouvert.** |
| `const port = 3000` | la valeur est rangée |
| `app.use(...)` | Express **note** une instruction pour plus tard. Rien ne s'exécute. |
| `app.listen(port, callback)` | **tout change ici** : Node demande au système d'exploitation de réserver le port et d'écouter les connexions, puis exécute la fonction fournie |

Les lignes précédentes ne font que **préparer**. Seule la dernière ouvre le port. Ensuite le programme **ne se termine pas** : Node reste actif tant qu'une écoute est en cours — d'où le prompt qui ne revient pas.

**Quand une requête arrive :**

1. le système d'exploitation transmet la connexion au programme
2. Express regarde la méthode et le chemin demandés
3. il parcourt ce qui a été enregistré **dans l'ordre d'écriture du fichier**
4. le premier élément qui correspond répond, et l'examen s'arrête
5. si rien ne correspond : « Cannot GET /chemin »

**L'ordre d'écriture dans `app.js` est l'ordre d'examen des requêtes.**

## 6.8 Quand ton serveur devient client

Une route peut interroger une autre API. Ton programme tient alors **les deux rôles** : serveur pour ton visiteur, client pour l'API distante.

```js
app.get('/starwars', async (req, res) => {
  try {
    const response = await fetch('https://swapi.info/api/people/1');
    const character = await response.json();
    res.send(`Personnage : ${character.name} — taille ${character.height} cm`);
  } catch (error) {
    res.status(500).send('Impossible de recuperer le personnage');
  }
});
```

### async et await : gérer le temps

Un appel réseau prend du temps. JavaScript ne bloque pas pendant ce délai : il continue d'exécuter la suite — avantage réel, puisque le serveur peut traiter d'autres requêtes pendant l'attente, mais problème quand on a besoin du résultat pour continuer.

Ce que `fetch(...)` renvoie **immédiatement** n'est pas la réponse, mais un objet appelé **promesse** : la représentation d'un résultat à venir.

**`await`** signifie : ne continue pas cette fonction avant que la promesse soit résolue. Sans lui, la variable contiendrait la promesse, pas les données.

**`async`** est obligatoire sur toute fonction contenant un `await`. Sans elle, Node refuse le `await` avec une erreur de syntaxe.

### Pourquoi deux await

| Ligne | Ce qu'on attend |
|---|---|
| `await fetch(...)` | que la réponse **arrive** : statut et en-têtes |
| `await response.json()` | que le **corps** soit entièrement lu et converti en objet JavaScript |

### Pourquoi fetch ne livre pas le corps

**Une réponse HTTP n'arrive pas d'un bloc.** Statut et en-têtes d'abord — c'est court. Le corps ensuite, éventuellement en plusieurs morceaux.

`fetch` rend la main dès que les en-têtes sont là, ce qui permet de **décider avant de télécharger** : sur un `404`, inutile de lire le corps ; sur un corps de 500 Mo, on peut refuser de le charger.

**Seconde raison, décisive : `fetch` ne sait pas dans quel format tu veux le corps.**

| Méthode | Ce qu'elle produit |
|---|---|
| `response.json()` | convertit le JSON en objet JavaScript |
| `response.text()` | garde le corps en texte brut |
| `response.blob()` | données binaires, pour une image ou un fichier |

D'où la répartition : **`response` est l'enveloppe** (statut, en-têtes), **`character` est le contenu décodé**. Vérifiable en ajoutant `console.log(response.status)` juste après le premier `await` : `200` s'affiche alors que le corps n'a pas encore été lu.

### try, catch et le statut

Si une instruction du bloc `try` échoue, l'exécution **saute immédiatement** dans le `catch`, sans exécuter le reste du `try`. Ce qui peut échouer ici : réseau coupé, API en panne, réponse illisible. Sans `catch`, l'erreur remonte et peut arrêter le serveur — pour tous les visiteurs, pas seulement celui-là.

`res.status(500)` fixe le code de statut. Sans cette précision, Express renverrait `200 OK` accompagné d'un message d'erreur : une réponse mensongère.

### Accéder à un champ de l'objet reçu

Les données sont dans l'objet `character`, pas dans des variables séparées. On y accède avec le point : `character.name`, `character.birth_year`. Écrire `${name}` seul provoque une erreur, puisqu'aucune variable de ce nom n'est définie.

Le point sert à deux usages, distingués par la présence de parenthèses : **sans parenthèses**, on lit une **propriété** (`character.name`) ; **avec**, on appelle une **méthode** (`response.json()`).

Note sur SWAPI : les valeurs `height` et `mass` sont des **chaînes de caractères** (`"172"`, `"77"`), pas des nombres. Sans conséquence pour un affichage, à savoir pour un calcul.

## 6.9 req.query : lire un paramètre d'URL

`req` est l'objet **requête**, qu'Express passe à ta fonction. Il contient tout ce que le client a envoyé, dont `req.query` : un objet rassemblant les paramètres de l'URL.

| URL demandée | `req.query` vaut | `req.query.name` vaut |
|---|---|---|
| `/about?name=Sara` | `{ name: 'Sara' }` | `'Sara'` |
| `/about?name=Luke&lang=fr` | `{ name: 'Luke', lang: 'fr' }` | `'Luke'` |
| `/about` | `{}` | `undefined` |

C'est la **query string** du §4 — celle écrite dans les commandes `curl "...posts?userId=1"` — vue depuis le côté qui la reçoit.

**La valeur par défaut :**

```js
const name = req.query.name || 'visiteur';
```

L'opérateur `||` se lit **« ou, à défaut »** : si la valeur de gauche existe, on la prend ; sinon on prend celle de droite. Indispensable dès qu'un paramètre est optionnel — un visiteur qui tape `/about` sans paramètre ne doit pas voir « Bonjour undefined ».

## 6.10 res.json attend un objet, pas du texte

| Méthode | Ce qu'elle attend |
|---|---|
| `res.send(...)` | du **texte** — d'où le HTML |
| `res.json(...)` | un **objet JavaScript**, qu'elle convertit elle-même en JSON |

**La syntaxe littérale d'un objet JavaScript**, presque identique au JSON du §4 :

```js
{ cle: valeur, autreCle: autreValeur }
```

Des accolades, des paires `clé: valeur`, séparées par des virgules. Seule différence avec le JSON : en JavaScript les clés n'ont pas besoin de guillemets.

**Sauf** si la clé contient un espace, un tiret ou un accent — les guillemets deviennent alors obligatoires, sinon Node refuse le fichier avec une `SyntaxError` :

```js
"Année de naissance": data.birth_year
```

**Mais la convention est de ne jamais en avoir besoin.** Une API est consommée par du code : `data.birth_year` est simple, `data["Année de naissance"]` est pénible. C'est pourquoi les API emploient des noms courts, sans espace ni accent — SWAPI lui-même utilise `birth_year`, `mass`, `height`. Les libellés lisibles appartiennent au HTML, destiné à un humain.

**Une symétrie à retenir**, le même nom servant aux deux sens :

| Appel | Conversion |
|---|---|
| `response.json()` | JSON **reçu** → objet JavaScript |
| `res.json(objet)` | objet JavaScript → JSON **envoyé** |

## 6.11 Autant de routes que de comportements, pas que de pages

Une route associe **un chemin et une méthode** à du code. Ce que ce code renvoie est libre — la relation avec les pages n'est pas de un pour un.

| Cas | Exemple |
|---|---|
| une route qui renvoie une page | la route `/` |
| une route qui ne renvoie **pas** de page | `/api/character` renvoie du JSON, `/contact` du texte brut |
| une seule route qui sert **des milliers** de pages | `/terrains/:id` répond à `/terrains/1`, `/terrains/42`… en lisant l'identifiant |
| des pages servies **sans aucune route** | `express.static`, qui sert tout un dossier |

Le troisième cas est le plus courant dans les applications réelles. Il sera rencontré en J3 sur « Le Spot », pour afficher chaque terrain de padel.

---

# 7. HTML

## 7.1 La structure minimale d'une page

```html
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Mon personnage préféré</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <h1>Un titre</h1>
  <p>Un paragraphe</p>
</body>
</html>
```

| Élément | Rôle |
|---|---|
| `<!DOCTYPE html>` | déclare au navigateur qu'il s'agit de HTML moderne |
| `<html lang="fr">` | la racine du document ; `lang` annonce la langue |
| `<head>` | les informations **sur** la page — rien n'y est affiché |
| `<meta charset="UTF-8">` | l'encodage des caractères |
| `<title>` | le texte de l'onglet du navigateur |
| `<link rel="stylesheet" href="...">` | demande au navigateur de charger une feuille de style |
| `<body>` | le contenu visible |

**Le `charset` n'est pas optionnel avec du contenu français.** Sans lui, le navigateur peut interpréter les accents avec un autre encodage et afficher des caractères parasites.

Les navigateurs sont tolérants et complètent une structure absente — c'est pourquoi une page réduite à un `h1` et des `p` s'affiche quand même. Mais la balise `link` doit exister, sinon le style ne se charge pas.

## 7.2 Servir un CSS ne suffit pas : le HTML doit le réclamer

Deux conditions indépendantes, et il faut les deux :

1. le fichier doit être **accessible** — c'est le rôle d'`express.static`, vérifiable en ouvrant `/style.css` dans le navigateur
2. la page doit le **demander** — c'est le rôle de la balise `link`

Un fichier servi mais non réclamé ne s'applique pas : la page s'affiche sans style. Piège vécu sur le challenge J1.

Le `href="style.css"` ne mentionne pas `public`, puisque ce dossier est la racine des fichiers servis.

## 7.3 Les liens

```html
<a href="/about">À propos de ce site</a>
```

| Élément | Rôle |
|---|---|
| `<a>` | la balise de lien (*anchor*) |
| `href="..."` | la destination |
| le texte entre les balises | ce qui est visible et cliquable |

**Mettre le slash initial** : `href="/about"` désigne le chemin depuis la racine du site, donc il fonctionne depuis n'importe quelle page. Sans slash, la destination est calculée relativement à la page courante, ce qui casse dès que les chemins se compliquent.

## 7.4 Éléments de bloc et éléments en ligne

| Type | Comportement | Exemples |
|---|---|---|
| **bloc** | occupe toute la largeur, provoque un retour à la ligne | `p`, `h1`, `div` |
| **en ligne** | s'insère dans le flux du texte sans le rompre | `a`, `span` |

Conséquence pratique : un lien placé seul après un paragraphe s'affiche **collé** à celui-ci, sans espacement, puisque rien ne lui en donne. L'entourer d'un `p` lui apporte sa propre ligne et la marge définie par le CSS.

C'est la raison technique — en plus de l'exigence de l'énoncé — d'écrire `<p><a href="/about">…</a></p>`.

---

# 8. JavaScript dans le navigateur

## 8.1 Le même nom de fichier, deux mondes

Dans `exo-starwars`, `app.js` est exécuté par **Node**, côté serveur. Dans `bookmark-app`, `script.js` est envoyé au **navigateur**, qui l'exécute lui-même.

`node script.js` échouerait sur `ReferenceError: document is not defined` : Node exécute bien le fichier, mais il n'a aucune page à manipuler. C'est pourquoi ce projet se lance avec un serveur de fichiers (`npx serve .`) et non avec `node`.

La chaîne réelle : le serveur **livre** les trois fichiers ; le navigateur lit `index.html`, y trouve la balise `<script src="script.js">`, réclame ce fichier, et **l'exécute**. Le serveur n'exécute rien.

D'où la convention de nommage retenue : `app.js` pour du code serveur, `script.js` pour du code navigateur.

## 8.2 Vanilla, persistance, localStorage

**Vanilla** signifie « sans framework », dans la version d'origine du langage. Du JavaScript vanilla est celui que le navigateur comprend nativement, sans React ni jQuery. Le terme est consacré dans le métier.

**La persistance** est la capacité d'une donnée à survivre à la fermeture de la page. Sans elle, tout disparaît au rafraîchissement — troisième règle de HTTP, aucune mémoire d'une requête à l'autre.

**localStorage** est un espace de stockage fourni par le navigateur, propre à chaque site, qui conserve des paires clé-valeur durablement, y compris après fermeture complète du navigateur. Il ne contient que du **texte**, avec une capacité d'environ cinq mégaoctets.

| Méthode | Effet |
|---|---|
| `localStorage.setItem(cle, valeur)` | enregistre |
| `localStorage.getItem(cle)` | relit, ou renvoie `null` si la clé n'existe pas |
| `localStorage.removeItem(cle)` | supprime une entrée |

Comme il ne stocke que du texte alors que les données sont un tableau d'objets, il faut convertir dans les deux sens :

```js
localStorage.setItem('favoris', JSON.stringify(favoris));
favoris = JSON.parse(localStorage.getItem('favoris'));
```

C'est le même JSON que celui du §4, employé ici comme **format de stockage** plutôt que d'échange.

**Le point qui compte :** localStorage vit dans le navigateur du visiteur, donc les données ne quittent jamais sa machine. Chacun a ses propres données, invisibles pour les autres, et vider le cache les efface définitivement. C'est ce qui permet une application sans serveur ni base.

### « Propre à chaque site » : l'origine

Le navigateur ouvre un espace de stockage par **origine**, c'est-à-dire le triplet **protocole + hôte + port** : `https` + `bookmark-app-rouge-gamma.vercel.app` + le port 443 par défaut. Deux origines différentes n'accèdent jamais au même espace.

Conséquence vécue en déployant : les favoris ajoutés en local, sous l'origine `file://`, n'apparaissent pas sur la version en ligne. Ce n'est pas un bug, ce sont deux espaces distincts.

**Ce que cela règle, et ce que cela ne règle pas.** Partager l'application avec d'autres personnes ne demande aucun système de comptes : chacune aura automatiquement sa propre liste, invisible des autres, sans qu'une ligne soit écrite pour cela — le cloisonnement qu'on attendrait de comptes, le navigateur le donne déjà. En revanche, tes amis reçoivent **l'application, pas tes données** ; et une même personne ne retrouve pas les siennes en changeant de navigateur ou de machine. Partager des données entre utilisateurs, ou les suivre d'un appareil à l'autre, exige un serveur qui les stocke — et là seulement, des comptes.

### sessionStorage, son jumeau

Même interface, même syntaxe, une durée de vie différente : `sessionStorage` est vidé dès que l'onglet se ferme. C'est lui qui ne survit pas à la fermeture, pas `localStorage`.

### localStorage contre cookie

La différence tient en un mot : **le cookie voyage, localStorage reste.**

Un cookie est joint automatiquement par le navigateur à **chaque requête** vers le site qui l'a posé, dans l'en-tête `Cookie`. Le serveur le relit donc à chaque fois : c'est ce qui maintient une session ouverte d'une page à l'autre. localStorage n'est jamais transmis — seul le JavaScript de la page peut le lire, et il ne part sur le réseau que si le code l'envoie explicitement.

| | Cookie | localStorage |
|---|---|---|
| Envoyé au serveur | à chaque requête, automatiquement | jamais |
| Lu par | le serveur **et** le JavaScript | le JavaScript seul |
| Taille | environ 4 Ko | environ 5 Mo |
| Expiration | une date, fixée à la pose | aucune |

Un cookie peut en outre être marqué `HttpOnly`, ce qui le rend invisible au JavaScript. C'est la raison pour laquelle les jetons de session y sont rangés plutôt que dans localStorage : un script injecté dans la page ne peut pas les lire.

## 8.3 Le DOM

Le **DOM** (*Document Object Model*) est la représentation de la page telle que le navigateur la manipule : un arbre d'objets, un par balise, que le JavaScript peut lire et modifier. L'objet `document` en est la racine.

| Instruction | Effet |
|---|---|
| `document.querySelector('#id')` | retrouve un élément par son sélecteur CSS |
| `document.createElement('li')` | fabrique un nouvel élément, non encore inséré |
| `parent.appendChild(enfant)` | insère un élément dans un autre |
| `element.textContent = '...'` | définit le texte d'un élément |
| `element.innerHTML = ''` | remplace tout le contenu HTML — ici, pour vider |
| `element.className = '...'` | affecte une classe CSS |

Le motif employé dans le projet : on vide le conteneur, puis on le reconstruit entièrement à partir du tableau de données. Sans le vidage préalable, les éléments s'ajouteraient en double à chaque appel.

**Ces méthodes ne resserviront pas au-delà de J2.** À partir de J3, React manipule le DOM à ta place et `querySelector`, `createElement` et `appendChild` disparaissent.

## 8.4 textContent contre innerHTML : une question de sécurité

| Instruction | Ce qu'elle fait du contenu |
|---|---|
| `element.textContent = valeur` | l'insère **comme du texte**, balises comprises |
| `element.innerHTML = valeur` | l'**interprète comme du HTML** |

Conséquence : construire une page avec `innerHTML` et des données saisies par un utilisateur permet à celui-ci d'injecter du code exécutable dans la page — c'est la faille **XSS**, au programme de J5.

Le projet emploie donc `createElement` et `textContent` partout où des données utilisateur sont affichées. Test de vérification : saisir un titre valant `<script>alert('coucou')</script>`. Il doit s'afficher littéralement, balises visibles, sans qu'aucune fenêtre ne s'ouvre.

## 8.5 Les événements

```js
formulaire.addEventListener('submit', (evenement) => {
  evenement.preventDefault();
  ...
});
```

`addEventListener` attache une fonction à un événement : « quand ceci se produit sur cet élément, exécute cela ». La fonction n'est jamais appelée par toi — le navigateur la déclenche, exactement comme Express appelle les fonctions de tes routes.

`preventDefault()` **annule le comportement par défaut** du navigateur. Ici, un formulaire soumis provoque normalement un rechargement complet de la page ; sans cette ligne, le tableau de données serait perdu à chaque ajout.

## 8.6 details et summary : un dépliage sans JavaScript

```html
<details open>
  <summary>Développement</summary>
  <ul>…</ul>
</details>
```

`<details>` est un élément HTML natif qui gère lui-même l'ouverture et la fermeture. `<summary>` est la partie toujours visible, celle sur laquelle on clique. L'attribut `open` définit l'état initial ; en JavaScript, `element.open = true` l'ouvre.

Aucune ligne de JavaScript n'est nécessaire pour le dépliage, et l'accès au clavier comme aux lecteurs d'écran est acquis d'office. On retire le triangle par défaut avec `list-style: none` sur le `summary`, et on dessine son propre chevron.

## 8.7 Quelques formes JavaScript rencontrées

**`push` et `unshift`** ajoutent un élément à un tableau : `push` à la fin, `unshift` **en tête**. D'où l'affichage du dernier favori en haut de la pile.

**Le point d'exclamation** inverse une valeur vrai/faux. `dossier.open = !dossier.open` fait donc basculer un état à chaque clic.

**Un objet comme table de comptage.** Pour compter des occurrences, on utilise un objet dont les clés sont les valeurs rencontrées :

```js
comptes[favori.categorie] = (comptes[favori.categorie] || 0) + 1;
```

Le `||` fournit `0` à la première rencontre, puisque la clé n'existe pas encore. Le même motif, avec un tableau en valeur, permet de **grouper** au lieu de compter.

**`for...in` contre `for...of`.** `for (const x of tableau)` parcourt les **valeurs** d'un tableau ; `for (const cle in objet)` parcourt les **clés** d'un objet.

## 8.8 Deux détails de CSS utiles

**Les variables CSS** se déclarent avec deux tirets et se lisent avec `var()`. Regroupées dans un bloc `:root`, elles définissent la palette en un seul endroit :

```css
:root { --accent: #7c6cff; }
button { color: var(--accent); }
```

**`:focus-within`** sélectionne un conteneur dont un **enfant** a le focus. C'est ce qui permet d'éclaircir un libellé quand on clique dans son champ, alors qu'aucun sélecteur CSS ne peut remonter d'un élément vers son frère précédent :

```css
.champ:focus-within label { color: var(--texte); }
```


---

# 9. Claude Code

## 9.1 Les modes de permission

Un mode de permission décide de ce que Claude peut faire **sans demander**. On bascule de l'un à l'autre avec `Shift+Tab`. Ce sont des modes de Claude Code lui-même, pas du terminal qui l'héberge : ils sont identiques partout.

| Mode | Ce qui passe sans demander |
|---|---|
| **manual** | les lectures seulement — chaque écriture de fichier, chaque commande, chaque accès réseau demande |
| **accept edits** | les lectures, les modifications de fichiers, et les commandes courantes de manipulation de fichiers (`mkdir`, `touch`, `mv`, `cp`) |
| **plan** | les lectures ; Claude explore et propose un plan, mais ne peut rien modifier tant que le plan n'est pas approuvé |
| **auto** | tout, mais un second modèle — un **classifieur** — examine chaque action à la place de l'utilisateur |

Deux autres modes existent, absents du cycle courant : `dontAsk`, qui n'autorise que des outils pré-approuvés, pour la CI ; et `bypassPermissions`, qui ne vérifie rien, réservé aux conteneurs isolés.

**Le mode qui correspond à un travail relu** est `manual` ou `accept edits` : on voit passer ce qui est fait. Le cours ne présente que le `plan mode`, au niveau 4, pour les changements complexes — explorer avant de toucher.

---

# 10. Mise en ligne

## 10.1 Ce qu'est un hébergeur, et ce que Vercel ajoute

Un **hébergeur** fait tourner ton code sur ses machines, joignable en permanence à une adresse publique, même ton ordinateur éteint. Vercel en est un.

Ce qu'il ajoute, et qui change la façon de travailler : il **se branche sur ton dépôt GitHub**. À l'installation, Vercel pose un *webhook* sur le dépôt — une notification que GitHub envoie à chaque événement. À chaque push, GitHub prévient Vercel, qui tire le code et déploie. Tu ne reviens plus sur Vercel pour publier.

Au moment d'autoriser Vercel sur GitHub, choisir **« Only select repositories »** plutôt que « All repositories » : rien n'oblige à lui donner accès à l'ensemble de tes dépôts.

## 10.2 Production et prévisualisation

| Push sur | Produit |
|---|---|
| `main` | un déploiement de **production**, celui que voient les visiteurs |
| une autre branche | un déploiement de **prévisualisation** : une URL séparée, pour tester en ligne sans toucher à la production |

C'est le pendant hébergé de la discipline de branches.

## 10.3 Deux adresses, deux rôles

Vercel affiche deux URL pour un même déploiement, et la distinction compte :

- le **domaine de production**, stable, qui pointe toujours vers le dernier déploiement de `main` — c'est celui qu'on partage
- l'**adresse du déploiement**, propre à un build et **figée sur son commit** : elle continue de servir cette version-là après les push suivants

C'est cette seconde adresse qui rend possible le retour en arrière immédiat sur une version antérieure.

## 10.4 Tes messages de commit deviennent ton historique de production

Vercel identifie chaque déploiement par le **commit** qui l'a produit, pas par un numéro qu'il inventerait : la ligne affiche le message du commit, son hash court et la branche.

Conséquence à laquelle on ne pense pas en écrivant un commit : un message « fix » ou « wip » sera illisible dans trois mois, quand il faudra trouver quel déploiement a introduit un bug.

## 10.5 Ce pour quoi on revient sur Vercel

Plus jamais pour publier. Mais pour attacher un nom de domaine à soi plutôt qu'une adresse en `.vercel.app`, poser des variables d'environnement, lire les journaux d'erreurs, ou revenir en arrière sur un déploiement qui a cassé quelque chose.

## 10.6 Un projet statique n'a rien à compiler

`bookmark-app` n'a aucune dépendance et aucun script de build : Vercel sert `index.html`, `style.css` et `script.js` tels quels. Le build a duré une seconde. Il n'y avait aucun réglage à toucher — dans un cas pareil, laisser le *framework preset* sur « Other ».
