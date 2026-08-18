# Association Respect — Plateforme d'Audit (prototype)

Prototype de démonstration du dispositif d'audit anonyme de l'association :
le **sas d'anonymisation**. Un lien unique est diffusé à toute l'entreprise ;
en le suivant, chaque salarié reçoit un simple jeton de session généré dans
son navigateur, sans que son identité, son e-mail ou son adresse IP ne soient
jamais enregistrés.

## Fonctionnement

Deux vues sont accessibles en haut de l'écran :

- **Vue salarié** : le parcours de réponse au questionnaire (5 thématiques,
  échelle de 1 à 5, commentaire libre optionnel).
- **Vue auditeur** : le tableau de bord d'analyse, qui reste **verrouillé**
  tant que 5 réponses n'ont pas été collectées, afin de garantir qu'aucun
  résultat individuel ne puisse être déduit.

Pour voir le tableau se débloquer, répondez au questionnaire cinq fois (par
exemple depuis plusieurs onglets du même navigateur — les réponses sont
partagées entre onglets), puis consultez la vue auditeur : le score global,
le graphique par thématique et le tableau chiffré apparaissent
automatiquement, avec un export CSV possible.

## Lancer le prototype

Le prototype est une page statique (HTML/CSS/JS, sans dépendance ni étape de
build). Servez le dossier avec n'importe quel serveur statique, par exemple :

```bash
python3 -m http.server 8000
# puis ouvrir http://localhost:8000
```

(Ouvrir `index.html` directement en double-cliquant fonctionne aussi dans la
plupart des navigateurs, mais certains restreignent `localStorage` sur les
URL `file://` — un serveur local est donc recommandé.)

Les réponses sont stockées uniquement dans le `localStorage` du navigateur
(partagé entre les onglets d'un même navigateur) ; le bouton *Réinitialiser
les données de démonstration* dans la vue auditeur permet de repartir de
zéro.

## Limites de cette version de démonstration

Les mécanismes d'anonymisation et de verrouillage sont fonctionnels, mais la
mise en production réelle reste à construire : hébergement, génération d'un
lien unique par entreprise, stockage des réponses côté serveur, et
conformité RGPD complète.

