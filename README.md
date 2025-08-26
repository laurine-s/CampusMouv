# CampusMouv

## 📋 Présentation du projet

La société ENI souhaite développer pour ses stagiaires actifs ainsi que ses anciens stagiaires une plateforme web leur permettant d'organiser des sorties. 

La plateforme est une plateforme privée dont l'inscription sera gérée par le ou les administrateurs. Les sorties ainsi que les participants sont rattachés à un campus pour permettre une organisation géographique des sorties.

### 🎯 Problématique

Le grand nombre de stagiaires et leur répartition sur différents campus ne permet pas une organisation facile d'événements ou de sorties. Il n'existe pas de canal de communication officiel pour proposer ou consulter les sorties. 

Les outils actuels ne permettent pas de gérer :
- Les invitations suivant la situation géographique ou les intérêts des stagiaires
- Le nombre d'invités
- La date limite d'inscription

### 🎯 Objectif

Une solution réussie consisterait à permettre l'organisation de ces sorties et d'anticiper le nombre de participants, le lieu de la sortie et autres informations à connaître pour le bon déroulement de l'activité.

---

## ⚡ Pré-requis

- **PHP** >= 8.3
- **Symfony** >= 6.4
- **Symfony CLI** >= 5.12.0
- **Composer** >= 2.8.1
- **Twig** >= 3.21.1
- **Doctrine/ORM** >= 3.5.2
- **MySQL** >= 8.0

---

## 🚀 Installation & lancement

### 1. Installer les dépendances
```bash
composer install
```

### 2. Configurer la base de données

Dans votre fichier `.env.local`, renseignez par exemple :
```env
DATABASE_URL="mysql://root:@127.0.0.1:3306/campusmouv?serverVersion=8.0.32&charset=utf8mb4"
```

### 3. Configuration Cloudinary (gestion des photos)

Pour le lien avec Cloudinary (gestion des photos de profil et des photos de sorties), renseignez dans le fichier `.env.local` :

```env
###> cloudinary ###
CLOUDINARY_CLOUD_NAME=ton_cloud_name
CLOUDINARY_API_KEY=ton_api_key
CLOUDINARY_API_SECRET=ton_api_secret
```

### 4. Configuration SSL

1. **Télécharger le fichier cacert.pem**  
   https://curl.se/ca/cacert.pem

2. **Placer le fichier**  
   Place-le dans un dossier accessible, comme :  
   `D:\wamp64\bin\php\extras\ssl\cacert.pem`

3. **Modifier le fichier php.ini**  
   Ouvrez le fichier `php.ini`, cherchez la ligne contenant `curl.cainfo` et décommentez-la ou ajoutez-la si elle n'existe pas :
   ```ini
   curl.cainfo = "D:/wamp64/bin/php/extras/ssl/cacert.pem"
   ```

### 5. Configuration Papercut (gestion des mails)

Pour le lien avec Papercut (gestion des mails mot de passe oublié, désinscription) :

1. **Télécharger Papercut** : https://github.com/ChangemakerStudios/Papercut-SMTP/releases
2. **Écoute le port 25**

### 6. Finaliser l'installation

Puis exécutez :
```bash
composer install
symfony console doctrine:database:create
symfony console doctrine:migrations:migrate
symfony console doctrine:fixtures:load
symfony serve
```

---

## 🔑 Comptes de test

### Utilisateur administrateur (dev)
- **Nom** : DUDU
- **Prénom** : Florent
- **Email** : florent.dudu@campus-eni.fr
- **Password** : F.dudu2025
- **Campus** : Rennes

### Utilisateur standard
- **Nom** : PAPA
- **Prénom** : Alex
- **Email** : alex.papa@campus-eni.fr
- **Password** : A.papa2025
- **Campus** : Rennes

---

## ⚠️ Problématiques connues

**Gestion de mail** : la gestion n'est pas encore optimale en local via Papercut. Elle nécessiterait des ajustements.

---

## 🆘 Support

En cas de bug, merci de contacter :

- **Jonathan MINEL** - [GitHub](https://github.com/Minel-j)
- **Laurine SUSS** - [GitHub](https://github.com/laurine-s)
- **Laurence GUILLEVIC** - [GitHub](https://github.com/LaurenceGlc)
- **Romane BOULIER** - [GitHub](https://github.com/rfboulier)
