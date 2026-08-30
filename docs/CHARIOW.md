# Chariow — mise en service

Chariow est un **checkout hébergé** pour le Mobile Money africain (Orange Money, Wave,
MTN, Moov) qui encaisse aussi la carte. UnikaLove vend ses propres abonnements : on
utilise donc **un seul compte plateforme**, pas un compte par vendeur.

Le code vit dans [`chariow.provider.ts`](../apps/api/src/modules/payments/chariow.provider.ts)
derrière l'interface `PaymentProvider` commune à Stripe et Moneroo.

---

## 1. La contrainte qui dicte tout le reste

**Chariow débite le prix du produit configuré dans SA boutique.** L'API n'accepte aucun
montant personnalisé. Chaque combinaison vendable doit donc exister comme produit dans le
dashboard Chariow, et être déclarée ici.

Conséquence directe : le prix affiché par l'application (`pricing.ts`) n'est qu'un
affichage. Le montant réellement débité est celui que Chariow renvoie, et c'est **lui**
qui est enregistré sur le `Payment` — devise comprise. Si les deux divergent, un
avertissement est loggé mais la vente passe : la boutique fait foi.

## 2. Produits à créer dans Chariow

Les clés sont `PLAN_JOURS` pour un abonnement et le `sku` pour un pack de crédits.
Créez uniquement ce que vous vendez — une clé absente donne une erreur explicite au
moment du checkout, jamais un débit du mauvais montant.

| Clé | Ce que c'est | Prix catalogue (XOF) |
|---|---|---|
| `PREMIUM_30` | Premium, 1 mois | 2 500 |
| `PREMIUM_90` | Premium, 3 mois | 6 500 |
| `PREMIUM_180` | Premium, 6 mois | 12 000 |
| `PREMIUM_365` | Premium, 1 an | 21 000 |
| `PREMIUM_PLUS_30` | Premium+, 1 mois | 5 000 |
| `PREMIUM_PLUS_90` | Premium+, 3 mois | 13 000 |
| `PREMIUM_PLUS_180` | Premium+, 6 mois | 24 000 |
| `PREMIUM_PLUS_365` | Premium+, 1 an | 42 000 |
| `BOOST_1` | 1 Boost | 1 000 |
| `BOOST_5` | 5 Boosts | 4 000 |
| `SUPER_LIKE_10` | 10 Super Likes | 2 000 |
| `SPOTLIGHT_1` | 1 Spotlight | 3 000 |

> Les prix de cette table viennent de `pricing.ts`. Alignez le produit Chariow dessus,
> ou changez `pricing.ts` — sinon l'affichage ment sur ce qui sera débité.

## 3. Variables d'environnement

| Variable | Rôle |
|---|---|
| `CHARIOW_API_KEY` | Clé du dashboard Chariow → API |
| `CHARIOW_WEBHOOK_SECRET` | Secret que vous choisissez ; il voyage dans l'URL du webhook |
| `CHARIOW_PRODUCTS` | JSON `{"PREMIUM_30":"prod_…", …}` — la table ci-dessus |
| `CHARIOW_API_URL` | Défaut `https://api.chariow.com/v1` |
| `INTERNAL_CRON_TOKEN` | Protège `/payments/internal/reconcile` |

Les trois premières sont obligatoires : sans l'une d'elles, Chariow se déclare
**désactivé** et ne s'affiche pas comme moyen de paiement (`GET /payments/status`).

## 4. Webhook

Dans le dashboard Chariow, pointez le webhook sur :

```
https://unikalove-api.onrender.com/api/v1/payments/webhook/chariow?secret=<CHARIOW_WEBHOOK_SECRET>
```

Chariow **ne signe pas** ses callbacks : le secret dans l'URL est la seule
authentification, comparé en temps constant. Un mauvais secret renvoie 401.

Le corps du webhook n'est jamais cru sur parole : il sert uniquement à savoir quelle
vente relire. `PaymentsService` re-interroge `GET /sales/{id}` avant de créditer quoi que
ce soit.

## 5. Réconciliation (obligatoire, pas optionnelle)

Le webhook est optionnel côté Chariow et une vente peut se régler après que l'acheteur a
fermé l'onglet. Le rattrapage par **pull** est donc ce qui garantit qu'aucune vente n'est
perdue :

```bash
curl -X POST https://unikalove-api.onrender.com/api/v1/payments/internal/reconcile \
  -H "x-internal-token: $INTERNAL_CRON_TOKEN"
```

À brancher sur le même planificateur externe que `/payments/internal/sweep` (GitHub
Actions — l'instance Render s'endort, un cron in-process ne partirait pas). Toutes les
5 minutes est un bon rythme.

Ce que fait le passage :

- les `PENDING` sont relus ; réglés → crédités, échoués → `FAILED` ;
- les `PENDING` plus vieux que `PENDING_EXPIRE_HOURS` (défaut 2) passent en `FAILED` ;
- les `FAILED` des `RECONCILE_FAILED_DAYS` derniers jours (défaut 14) sont **re-vérifiés**,
  parce qu'une vente réglée tardivement doit quand même être honorée.

## 6. Règles à ne pas casser

Chacune correspond à un incident déjà vu en production ailleurs, et à un test.

1. **`settled` veut dire payé.** Les fonds sont encaissés — ce n'est pas un état
   intermédiaire.
2. **L'ordre des tests de statut compte.** `unpaid` contient `paid` : le cas « en
   attente » se teste en premier, sinon une vente non payée est créditée.
3. **Ne jamais figer la devise.** Une boutique Chariow peut être en USD ; on enregistre
   `purchase.amount.currency`.
4. **Ne jamais dater un crédit à « maintenant »** lors d'un rattrapage : on prend
   `settled_at` / `paid_at` du fournisseur, sinon la date de création du paiement.
5. **Ne jamais créditer sur la foi du webhook** — toujours relire la vente.
6. **Ne jamais laisser un `FAILED` définitif** avant la fin de la fenêtre de 14 jours.
7. **Le téléphone n'est pas un E.164.** Chariow veut
   `{ number: <national>, country_code: <ISO2> }` et répond 400 sinon.

## 7. Téléphone — le piège principal

Le client envoie trois champs (`phone` E.164, `phoneCountry` ISO2, `phoneLocal`
national) ; le serveur essaie dans l'ordre : pays + local, puis E.164, puis pays +
chiffres bruts, puis une table d'indicatifs africains.

Conséquence pratique : **un numéro africain passe même sans `phoneCountry`**, un numéro
de la diaspora (+33, +1) en a besoin — ou d'un E.164 valide. Le formulaire doit donc
toujours envoyer le pays quand il le connaît.

## 8. Vérifier sans compte Chariow

Le chemin complet a été validé contre un faux serveur Chariow local :
checkout → `PENDING` → vente réglée → réconciliation → `COMPLETED` + abonnement actif +
crédits inclus. Les cas couverts : double-crédit impossible (webhook + rejeu +
réconciliation = un seul crédit), règlement tardif après expiration, `unpaid` ignoré,
mauvais secret rejeté, produit non mappé refusé proprement.
