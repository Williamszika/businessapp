# Serveur partagé ZKA (Supabase)

Ce dossier prépare un **serveur commun** : une base de données en ligne + des
comptes, pour que la direction, les responsables et les commerciaux voient
**les mêmes données**, chacun depuis son téléphone.

## Ce que ça change

Aujourd'hui, chaque téléphone garde ses données pour lui. Avec ce serveur :
le boss attribue du stock → c'est enregistré en ligne → le commercial le voit
**en temps réel** sur son propre téléphone. Idem pour les ventes, l'équipe, etc.

## Étapes (à faire une fois, ~10 min, gratuit)

1. **Créer le projet**
   - Allez sur [supabase.com](https://supabase.com) → *Start your project* (compte gratuit).
   - *New project* → donnez un nom (« ZKA »), choisissez une région proche
     (ex. Europe/Paris), notez le mot de passe de la base.

2. **Créer la base**
   - Dans le projet : menu **SQL Editor** → *New query*.
   - Copiez tout le contenu de [`schema.sql`](./schema.sql), collez, cliquez **Run**.
   - S'il y a une erreur, envoyez-la moi : je corrige.

3. **Récupérer les 2 valeurs publiques** (sans danger à partager)
   - Menu **Project Settings → API**.
   - Copiez **Project URL** (ex. `https://xxxx.supabase.co`)
   - Copiez la clé **anon public** (`anon` / `publishable`).
   - ⚠️ Ne partagez **jamais** la clé `service_role` (secrète).

4. **Créer votre compte + amorcer la base**
   - Menu **Authentication → Users → Add user** : créez **votre** compte
     (email + mot de passe). Ce sera la direction (boss).
   - Ouvrez [`bootstrap.sql`](./bootstrap.sql), remplacez `VOTRE_EMAIL_ICI` par
     cet email, puis exécutez-le dans **SQL Editor**. Il crée le profil
     automatique des futurs comptes, remplit l'entrepôt de produits de départ,
     et vous promeut en direction.
   - Pour le reste de l'équipe : **Authentication → Add user** pour chaque
     responsable/commercial (leur profil est créé automatiquement en
     « commercial »). Je vous fournis ensuite un court script pour fixer les
     rôles « responsable » et les rattachements (envoyez-moi qui est quoi).

5. **Renseigner les 2 valeurs** dans [`demo/config.js`](../demo/config.js)
   (ou envoyez-les moi, je le fais). Tant qu'elles sont vides, l'app reste en
   mode démonstration local.

6. **Vérifier la connexion** : ouvrez [`demo/serveur.html`](../demo/serveur.html).
   - Non configuré → la page affiche les instructions.
   - Configuré → écran de connexion (email + mot de passe) ; une fois connecté,
     vous voyez l'entrepôt **en direct**, et un boss peut ajouter un produit de
     test qui apparaît instantanément sur les autres appareils connectés.
   C'est la preuve que comptes + base partagée + temps réel fonctionnent.

7. **Ensuite** : je branche l'application complète (le formulaire d'attribution,
   « Mon stock », les ventes…) sur ce serveur, et on teste ensemble.

## Ce que le serveur garantit déjà (dans `schema.sql`)

- **Rôles & permissions** : seul un boss modifie l'entrepôt ; un responsable ne
  peut approvisionner que ses propres commerciaux ; un commercial ne vend que ce
  qu'il détient.
- **Cohérence** : l'attribution de stock (`assign_stock`) et la vente
  (`record_sale`) sont exécutées **côté serveur**, de façon atomique, avec
  journalisation des mouvements — impossible de créer du stock à partir de rien.
- **Temps réel** : produits, stock détenu, mouvements et ventes se synchronisent
  automatiquement sur tous les téléphones connectés.

## Coût

Le palier gratuit de Supabase suffit largement pour une petite équipe. Au-delà,
le premier palier payant est de l'ordre de quelques dollars par mois.
