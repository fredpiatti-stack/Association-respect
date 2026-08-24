# R.E.S.P.E.C.T — Site de l'association (prototype)

Site de démonstration de l'association **R.E.S.P.E.C.T** (Réseau d'Écoute et
de Soutien et de Protection des Employé·es Contre la Toxicité).

Pages principales :

- `index.html` — mission de l'association, valeurs, diagnostic des
  situations couvertes, accompagnement, et sections **Devenir bénévole** /
  **Devenir partenaire**
- `chiffres.html` — statistiques sourcées sur le harcèlement et le mal-être
  au travail, dont l'impact économique pour les entreprises
- `audit.html` — présentation de l'audit R.E.S.P.E.C.T pour les entreprises
- `label.html` — présentation du Label R.E.S.P.E.C.T
- `contact.html` — coordonnées

`outil-audit.html`, `benevoles.html` et `partenaires.html` sont conservés
comme redirections vers leur nouvel emplacement, pour ne pas casser
d'anciens liens.

## Lancer le site

C'est un site statique (HTML/CSS, sans dépendance ni étape de build).
Servez le dossier avec n'importe quel serveur statique, par exemple :

```bash
python3 -m http.server 8000
# puis ouvrir http://localhost:8000
```

Le site est installable comme application (PWA) sur iPhone et Android.

## Limites de cette version de démonstration

Plusieurs éléments restent à compléter avant une mise en production réelle :
l'identité légale de l'association (mentions légales), les adresses e-mail
et l'adresse postale définitives.
