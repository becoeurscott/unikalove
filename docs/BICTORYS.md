# Bictorys — mise en service

Bictorys encaisse le Mobile Money ouest-africain (Wave, Orange Money, Free Money, MTN,
Moov, Maxit, Mobicash, Togocell) et la carte, via un checkout hébergé.

Le code vit dans [`bictorys.provider.ts`](../apps/api/src/modules/payments/bictorys.provider.ts),
derrière l'interface `PaymentProvider` commune à tous les moyens de paiement.

---

## 1. Ce qu'il faut faire — la liste complète

1. **Créer un compte** sur [bictorys.com](https://bictorys.com) et le faire valider
   (KYC entreprise : ils vérifient l'identité avant d'autoriser l'encaissement réel).
2. **Récupérer les clés** : dashboard → *Developers* → « Configuration des clés API et
   des webhooks ». Trois clés existent :
   - **clé secrète** → `BICTORYS_SECRET_KEY` (c'est celle du serveur) ;
   - clé publique → **non utilisée ici**, ne jamais la mettre côté serveur ;
   - **secret webhook** → `BICTORYS_WEBHOOK_SECRET`.

   > ⚠️ Une clé ne peut être copiée **qu'une seule fois** après génération. Mettez-la
   > tout de suite dans Render, pas dans un fichier ni dans une conversation.

3. **Déclarer l'URL du webhook** dans le dashboard :

   ```
   https://unikalove-api.onrender.com/api/v1/payments/webhook/bictorys
   ```

   Le secret voyage dans l'en-tête `X-Secret-Key`, pas dans l'URL : rien à ajouter au
   bout de l'adresse.

4. **Renseigner les variables sur Render** (Environment) :

   | Variable | Valeur |
   |---|---|
   | `BICTORYS_SECRET_KEY` | la clé secrète du dashboard |
   | `BICTORYS_WEBHOOK_SECRET` | le secret webhook du dashboard |
   | `BICTORYS_API_URL` | `https://api.bictorys.com` (prod) ou `https://api.test.bictorys.com` (bac à sable) |
   | `INTERNAL_CRON_TOKEN` | une chaîne aléatoire, si elle n'existe pas déjà |

   Tant qu'une des deux premières manque, Bictorys se déclare **désactivé** et
   n'apparaît pas comme moyen de paiement — c'est voulu : un moyen de paiement à
   moitié configuré ne doit jamais encaisser.

5. **Planifier la réconciliation** (voir §4). Sans elle, une vente dont le webhook
   s'est perdu n'est jamais créditée.

6. **Vérifier** : `GET /payments/status` doit répondre
   `{"enabled":true,"providers":["bictorys"]}`.

## 2. Prix

Contrairement à Chariow, Bictorys accepte **un montant libre**. `pricing.ts` reste donc
la seule source de vérité : rien à créer côté fournisseur, aucun catalogue à tenir à
jour, et aucun risque que le prix affiché diffère du prix débité.

## 3. Webhook

Bictorys **ne signe pas** ses notifications : il envoie l'en-tête `X-Secret-Key`
contenant le secret configuré. La comparaison se fait en temps constant ; un mauvais
secret renvoie 401.

Comme un secret partagé est plus faible qu'une signature, le corps du webhook n'est
**jamais** cru sur parole : il sert uniquement à savoir quelle transaction relire.
`PaymentsService` réinterroge `GET /pay/v1/transactions/{id}` avant tout crédit.

## 4. Réconciliation (obligatoire)

```bash
curl -X POST https://unikalove-api.onrender.com/api/v1/payments/internal/reconcile \
  -H "x-internal-token: $INTERNAL_CRON_TOKEN"
```

À brancher sur le même planificateur externe que `/payments/internal/sweep` (GitHub
Actions — l'instance Render s'endort, un cron interne ne partirait pas). Toutes les
5 minutes convient.

- les `PENDING` sont relus : réglés → crédités, échoués → `FAILED` ;
- les `PENDING` plus vieux que `PENDING_EXPIRE_HOURS` (défaut 2) passent en `FAILED` ;
- les `FAILED` des `RECONCILE_FAILED_DAYS` derniers jours (défaut 14) sont re-vérifiés,
  car Bictorys expire une charge abandonnée au bout de 2 h et un règlement tardif doit
  quand même être honoré.

## 5. Statuts

| Statut | Sens | Traitement |
|---|---|---|
| `pending`, `processing`, Initié, En attente | en cours | rien |
| `succeeded`, Succès | **argent reçu** | crédite |
| `authorized` | autorisation carte | crédite (recommandé par leur doc), mais re-vérifié |
| `failed`, Échoué | refus / erreur | échec |
| `cancelled`, `reversed`, Expiré | annulé, remboursé, abandonné (2 h) | échec |
| tout autre | inconnu | **traité comme en attente** — jamais un crédit |

## 6. Téléphone

Bictorys attend le numéro au format international **sans `+`** (`221771234567`) et un
pays ISO2 séparé. Le serveur le déduit de l'E.164 via libphonenumber ; `phoneCountry`
l'emporte s'il est fourni. Sans numéro exploitable, le checkout hébergé le demandera.

## 7. Points de vigilance

1. **Seul `succeeded` veut dire que l'argent est arrivé.**
2. **Ne jamais créditer sur la foi du webhook** — le secret partagé est falsifiable.
3. **Ne jamais dater un crédit à « maintenant »** lors d'un rattrapage : on prend le
   `timestamp` du fournisseur.
4. **Un statut inconnu n'est jamais un succès.**
5. La clé **publique** ne sert jamais côté serveur.

## 8. Ce qui a été vérifié

Contre un faux serveur Bictorys, tout le chemin de l'argent : checkout → `PENDING` →
règlement → webhook → crédit → abonnement actif. Plus : rejeu du webhook et
réconciliation ne créditent qu'une fois, un mauvais secret est rejeté en 401, un
règlement 4 jours après notre expiration est rattrapé, et le montant envoyé est bien
celui de `pricing.ts`.

**Non vérifié faute de compte réel** : la forme exacte du corps du webhook (la doc ne
documente que `status`, `paymentReference`, `amount`, `currency`) et l'URL de production
(la doc ne cite que l'environnement de test). À confirmer sur la première vraie
notification.
