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

4. **Créer les comptes de votre équipe**
   - Menu **Authentication → Users → Add user** : créez un compte
     (email + mot de passe) pour chaque personne (boss, responsables, commerciaux).
   - Puis, dans **SQL Editor**, on renseignera leur rôle (boss / responsable /
     commercial) et les rattachements. Je vous fournirai le petit script une fois
     les comptes créés (il suffit de coller les emails).

5. **Me donner les 2 valeurs de l'étape 3**
   - Je branche alors l'application dessus (connexion, lecture/écriture partagée,
     synchro temps réel) et je teste avec vous.

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
