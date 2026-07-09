# Fonction serveur « create-user » (créer des comptes depuis l'app)

Cette fonction permet à la **direction** de créer les comptes de l'équipe
(email + mot de passe) **depuis l'application**, en toute sécurité. La clé
d'administration reste sur le serveur Supabase — jamais dans la page web.

## Déploiement depuis le tableau de bord Supabase (sans installer d'outil)

1. Supabase → menu **Edge Functions** (à gauche).
2. Cliquez **Deploy a new function** → **Via editor** (éditeur dans le navigateur).
3. **Nom de la fonction** : tapez exactement **`create-user`**.
4. Effacez le contenu par défaut, puis **collez tout** le contenu de
   [`create-user/index.ts`](./create-user/index.ts).
5. **Important** : décochez / désactivez l'option **« Verify JWT »** (ou
   *Enforce JWT verification*) pour cette fonction — la vérification est faite
   à l'intérieur du code (on contrôle nous-mêmes que l'appelant est « boss »).
6. Cliquez **Deploy**.

C'est tout. Les variables `SUPABASE_URL`, `SUPABASE_ANON_KEY` et
`SUPABASE_SERVICE_ROLE_KEY` sont fournies automatiquement par Supabase — rien à
configurer.

## Vérifier

Dans l'application (connecté en direction) → onglet **Équipe** → **Créer un
compte** : renseignez email + mot de passe + rôle. Le compte est créé et
apparaît aussitôt dans la liste. Si un message d'erreur s'affiche, copiez-le.

> Alternative en ligne de commande (si vous utilisez la CLI Supabase) :
> `supabase functions deploy create-user --no-verify-jwt`
