# ZKA — Application de gestion de commerce

Application mobile **ZKA** pour piloter votre commerce depuis un téléphone : communiquez avec vos employés, suivez votre équipe, votre stock, vos ventes et vos revenus — le tout dans une interface soignée, en français, disponible sur **Android (APK)** et **iOS**.

> Construite avec **Expo (React Native + TypeScript)** : une seule base de code, deux plateformes.

> 🕹️ **Aperçu interactif** : ouvrez [`demo/zka-demo.html`](./demo/zka-demo.html) dans un navigateur pour manipuler une version jouable de l'application (connexion, ventes, messagerie, stock, revenus) — sans rien installer. C'est une démonstration ; l'application réelle est le projet Expo décrit ci-dessous.

---

## ✨ Fonctionnalités

| Module | Description |
| --- | --- |
| 🏠 **Tableau de bord** | Vue d'ensemble adaptée au rôle : chiffre d'affaires du mois, ventes du jour, panier moyen, valeur du stock, meilleurs vendeurs, alertes de stock, ventes récentes, graphique d'évolution (7 j / 30 j / 6 mois). |
| 💬 **Messagerie** | Communiquez avec vos employés : discussions de groupe (« Équipe ZKA ») et messages directs, avec compteur de non-lus. |
| 👥 **Équipe** | Liste des personnes qui travaillent pour vous : postes, statuts (actif / congé), coordonnées, performance individuelle (ventes, CA, commission), masse salariale. |
| 📦 **Stock** | Inventaire complet : catégories, recherche, valeur du stock, alertes de réapprovisionnement, ajustement des quantités, marges. |
| 🛒 **Ventes** | Historique groupé par jour, enregistrement d'une nouvelle vente (panier multi-produits, moyens de paiement, vendeur, client). Le stock se décrémente automatiquement. |
| 📈 **Revenus** | Analyse détaillée : évolution du CA, marge brute, répartition par vendeur, moyens de paiement (anneau), meilleurs produits. |
| ⚙️ **Réglages** | Nom de l'entreprise, devise (FCFA / € / $ / DH), préférences, réinitialisation des données de démonstration. |

### Deux profils
- **Patron / Direction** : accès complet (revenus, équipe, stock, gestion).
- **Employé** : espace personnel (mes ventes, ma commission, messagerie).

Choisissez le profil à l'écran de connexion — aucune inscription requise pour la démonstration.

---

## 🎨 Identité de marque ZKA

- **Violet-indigo** signature (`#5A4BE0`) — premium, moderne.
- **Or** (`#F5A623`) pour les revenus et accents.
- Dégradés de marque, mode **clair & sombre** automatique, typographie **Inter**.
- Le système de design complet se trouve dans `src/theme/`.

---

## 🚀 Démarrer en local

```bash
npm install
npx expo start
```

Puis :
- Scannez le QR code avec l'app **Expo Go** (Android/iOS), ou
- `npm run android` / `npm run ios` pour un émulateur/simulateur.

Les données sont **stockées localement** sur l'appareil (AsyncStorage) et générées au premier lancement.

---

## 📱 Générer l'application installable (APK Android & iOS)

Le projet utilise **EAS Build** (le service de build cloud d'Expo). Aucun Mac requis pour l'APK Android.

```bash
# 1. Installer l'outil et se connecter (une seule fois)
npm install -g eas-cli
eas login

# 2. Lier le projet (crée un projectId)
eas init

# 3. Générer l'APK Android (installable directement sur un téléphone)
eas build --platform android --profile preview
#   -> télécharge un fichier .apk à partager/installer

# 4. Générer l'app iOS (nécessite un compte Apple Developer)
eas build --platform ios --profile preview
```

- Le profil **`preview`** produit un **APK** (`buildType: apk`) directement installable sur Android.
- Le profil **`production`** produit un **AAB** pour le Google Play Store.
- Pour iOS, EAS gère la signature ; un compte Apple Developer est nécessaire pour installer sur un appareil physique ou publier sur l'App Store.

Voir la configuration dans [`eas.json`](./eas.json) et l'identité de l'app dans [`app.json`](./app.json)
(`bundleIdentifier` / `package` : `app.zka.business`).

---

## 🌐 Héberger la version web sur Vercel

La même base de code fournit aussi une **version web** (via react-native-web). C'est **cette version** qui peut être hébergée sur Vercel — les applications installables (APK Android / iOS) passent, elles, par EAS Build (voir ci-dessus), pas par Vercel.

Le projet est déjà configuré ([`vercel.json`](./vercel.json)) en mode **SPA** :

**Option A — depuis le tableau de bord Vercel (recommandé)**
1. Poussez le dépôt sur GitHub (déjà fait).
2. Sur [vercel.com](https://vercel.com) : **New Project** → importez le dépôt.
3. Vercel lit `vercel.json` automatiquement :
   - Build : `npx expo export --platform web`
   - Dossier de sortie : `dist`
4. **Deploy** → votre app est en ligne (ex. `https://zka.vercel.app`).

**Option B — en ligne de commande**
```bash
npm install -g vercel
npm run build:web   # génère le dossier dist/
vercel deploy --prebuilt   # ou simplement: vercel
```

Tester le build web en local :
```bash
npm run build:web       # génère dist/
npx serve dist          # sert la version web localement
```

> À savoir : la version web stocke les données dans le navigateur (localStorage). Les vibrations (haptique) sont ignorées sur le web, sans impact sur le fonctionnement.

---

## 🧱 Stack technique

- **Expo SDK 57** · React Native 0.86 · React 19 · TypeScript (strict)
- **expo-router** — navigation par fichiers (onglets + piles + modales)
- **Zustand** (+ persistance AsyncStorage) — état & données
- **react-native-svg** — graphiques (courbes, anneau) faits maison
- **expo-linear-gradient**, **@expo/vector-icons** (Ionicons), **Inter** (@expo-google-fonts)

## 🗂️ Structure du projet

```
src/
├── app/                 # Écrans (routes expo-router)
│   ├── _layout.tsx      # Racine : polices, thème, garde d'auth
│   ├── login.tsx        # Connexion (Patron / Employé)
│   ├── (tabs)/          # Onglets : Accueil, Ventes, Stock, Équipe, Messages
│   ├── employe/         # Fiche employé + création
│   ├── produit/         # Fiche produit + création
│   ├── discussion/[id]  # Écran de messagerie
│   ├── vente/nouvelle   # Nouvelle vente (modale)
│   ├── revenus.tsx      # Analyse des revenus
│   └── parametres.tsx   # Réglages
├── components/
│   ├── ui/              # Bibliothèque de composants (Card, Button, Avatar…)
│   └── charts/          # LineChart, BarChart, DonutChart
├── store/               # Zustand (données + authentification)
├── lib/                 # analytics, formatage, ids
├── data/                # Données de démonstration
├── theme/               # Couleurs, jetons de design, typographie
└── types/               # Types du domaine
```

---

## 📝 Notes

- Application **de démonstration** : les données (équipe, stock, ventes, messages) sont locales à l'appareil et peuvent être réinitialisées depuis **Réglages**.
- Pour connecter un vrai serveur (données partagées entre appareils, messagerie temps réel multi-utilisateurs), la couche `src/store` est isolée et peut être remplacée par des appels API.
