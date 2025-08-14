<?php

namespace App\DataFixtures;

use App\Entity\Campus;
use App\Entity\Interets;
use App\Entity\Lieu;
use App\Entity\Promo;
use App\Entity\Sortie;
use App\Entity\User;
use App\Entity\Ville;
use App\Enum\Etat;
use Doctrine\Bundle\FixturesBundle\Fixture;
use Doctrine\Persistence\ObjectManager;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

class AppFixtures extends Fixture
{

    public function __construct(private UserPasswordHasherInterface $passwordHasher)
    {
    }

//    public function load(ObjectManager $manager): void
//    {
//        $faker = \Faker\Factory::create('fr_FR');
//
////        // --- Campus existants ---
////        $campusNames = ['Rennes', 'Nantes', 'Niort', 'Quimper'];
////        $campuses = [];
////        foreach ($campusNames as $name) {
////            $c = new Campus();
////            $c->setNom($name);
////            $manager->persist($c);
////            $campuses[] = $c; // on garde la référence pour lier ensuite
////        }
////
////        // --- Intérêts ---
////        $interetsAll = [];
////        for ($i = 0; $i < 10; $i++) {
////            $interet = new Interets();
////            $interet->setNom($faker->unique()->word());
////            $manager->persist($interet);
////            $interetsAll[] = $interet;
////        }
////        //----Intereret
////        $interet = new Interets();
////        $interet->setNom('Magic Escape Games');
////        $manager->persist($interet);
////
////        // --- Villes ---
////        $villesAll = [];
////        for ($i = 0; $i < 10; $i++) {
////            $ville = new Ville();
////            $ville->setNom($faker->unique()->word());
////            $ville->setCp($faker->postcode());
////            $manager->persist($ville);
////            $villesAll[] = $ville;
////        }
////
////        // --- Lieux ---
////        $lieuxAll = [];
////        for ($i = 0; $i < 10; $i++) {
////            $lieu = new Lieu();
////            $lieu->setNom($faker->unique()->word());
////            $lieu->setRue($faker->streetAddress());
////            $lieu->setLatitude($faker->latitude());
////            $lieu->setLongitude($faker->longitude());
////            $lieu->setVille($faker->randomElement($villesAll));
////            $manager->persist($lieu);
////            $lieuxAll[] = $lieu;
////        }
////
////
////        // --- Promos ---
////        $cursus = ['D2WM', 'CDA', 'BAC+5'];
////        $nbrPromo = ['01', '02', '03'];
////        $promoAll = [];
////        $used = [];
////
////        for ($i = 0; $i < 10; $i++) {
////            $annee = $faker->numberBetween(2020, 2025);
////            $cur = $faker->randomElement($cursus);
////            $num = $faker->randomElement($nbrPromo);
////            $code = sprintf('%d-%s-%s', $annee, $cur, $num);
////
////            // éviter les doublons si nécessaire
////            if (isset($used[$code])) {
////                $i--;
////                continue;
////            }
////            $used[$code] = true;
////
////            $promo = new Promo();
////            $promo->setNom($code);             // "2024-D2WM-01"
////            $promo->setAnnee($annee);
////            $promo->setCursus($cur);
////            $manager->persist($promo);
////            $promoAll[] = $promo;
////        }
////
////
////        // --- Users ---
////        $usersAll = [];
////        $domain = 'campus-eni.fr';
////
////
////        for ($i = 0; $i < 10; $i++) {
////            $annee2025 = $faker->numberBetween(2020, 2025);
////            $user = new User();
////            $nom = $faker->firstName();
////            $prenom = $faker->lastName();
////            $user->setNom($nom);                 // () obligatoires
////            $user->setPrenom($prenom);
////            $user->setPseudo($faker->unique()->word());
////            $user->setEmail($prenom . '.' . $nom . $annee2025 . '@' . $domain);
////            $user->setPassword($faker->password());
////            // Si User::campus est une relation ManyToOne vers Campus, on doit setter un objet, pas un entier
////            $user->setCampus($faker->randomElement($campuses));
////            $user->setBio($faker->realText(180));              // borné pour éviter un pavé
////            $user->addInteret($faker->randomElement($interetsAll));
////            $user->setPromo($faker->randomElement($promoAll));
////            $manager->persist($user);
////            $usersAll[] = $user;
////        }
////
//        $annee2025 = 2025;
////        //----User en dur----
////        $user = new User();
////        $nom = 'Boulier';
////        $prenom = 'romane';
////        $user->setNom($nom);                 // () obligatoires
////        $user->setPrenom($prenom);
////        $user->setPseudo('MamanRomane');
////        $user->setEmail($prenom . '.' . $nom . $annee2025 . '@' . $domain);
////        $hashedPassword = $this->passwordHasher->hashPassword($user, "16-Avril2007");
////        $user->setPassword($hashedPassword);
////        // Si User::campus est une relation ManyToOne vers Campus, on doit setter un objet, pas un entier
////        $user->setCampus($faker->randomElement($campuses));
////        $user->setBio($faker->realText(180));              // borné pour éviter un pavé
////        $user->addInteret($faker->randomElement($interetsAll));
////        $user->setPromo($faker->randomElement($promoAll));
////        $manager->persist($user);
//
//        //----User en dur----
//        $user = new User();
//        $nom = 'Guillevic';
//        $prenom = 'laurence';
//        $user->setNom($nom);                 // () obligatoires
//        $user->setPrenom($prenom);
//        $user->setPseudo("LuxAndLyraLover's");
//        $user->setEmail($prenom . '.' . $nom . $annee2025 . '@' . $domain);
//        $hashedPassword = $this->passwordHasher->hashPassword($user, "@Lux56700");
//        $user->setPassword($hashedPassword);
//        // Si User::campus est une relation ManyToOne vers Campus, on doit setter un objet, pas un entier
//        $user->setCampus($faker->randomElement($campuses));
//        $user->setBio($faker->realText(180));              // borné pour éviter un pavé
//        $user->addInteret($faker->randomElement($interetsAll));
//        $user->setPromo($faker->randomElement($promoAll));
//        $manager->persist($user);
//
//        //----User en dur----
//        $user = new User();
//        $nom = 'Süss';
//        $prenom = 'laurine';
//        $user->setNom($nom);                 // () obligatoires
//        $user->setPrenom($prenom);
//        $user->setPseudo('McGonagall');
//        $user->setEmail($prenom . '.' . $nom . $annee2025 . '@' . $domain);
//        $hashedPassword = $this->passwordHasher->hashPassword($user, "@Azerty123");
//        $user->setPassword($hashedPassword);
//        // Si User::campus est une relation ManyToOne vers Campus, on doit setter un objet, pas un entier
//        $user->setCampus($faker->randomElement($campuses));
//        $user->setBio($faker->realText(180));              // borné pour éviter un pavé
//        $user->addInteret($faker->randomElement($interetsAll));
//        $user->setPromo($faker->randomElement($promoAll));
//        $manager->persist($user);
//
//        //----User en dur----
//        $user = new User();
//        $nom = 'Minel';
//        $prenom = 'jonathan';
//        $user->setNom($nom);                 // () obligatoires
//        $user->setPrenom($prenom);
//        $user->setPseudo('Jojo');
//        $user->setEmail($prenom . '.' . $nom . $annee2025 . '@' . $domain);
//        $hashedPassword = $this->passwordHasher->hashPassword($user, "@Azerty123");
//        $user->setPassword($hashedPassword);
//        // Si User::campus est une relation ManyToOne vers Campus, on doit setter un objet, pas un entier
//        $user->setCampus($faker->randomElement($campuses));
//        $user->setBio($faker->realText(180));              // borné pour éviter un pavé
//        $user->addInteret($faker->randomElement($interetsAll));
//        $user->setPromo($faker->randomElement($promoAll));
//        $manager->persist($user);
//
//
////        // --- Sorties ---
////        for ($i = 0; $i < 10; $i++) {
////            $sortie = new Sortie();
////            $sortie->setNom($faker->word());
////
////            $dateDebut = $faker->dateTimeBetween('-30 days', '+15 days');
////            $dateLimite = (clone $dateDebut)->modify('+3 days');
////
////            $sortie->setDateHeureDebut(\DateTimeImmutable::createFromMutable($dateDebut));
////            $sortie->setDuree($faker->numberBetween(30, 180));
////            $sortie->setDateLimiteInscription(\DateTimeImmutable::createFromMutable($dateLimite));
////            $nbInscritsMax = $faker->numberBetween(5, 20);
////            $sortie->setNbInscriptionMax($nbInscritsMax);
////            $sortie->setNbInscriptionMin($faker->numberBetween(1, $nbInscritsMax));
////            $sortie->setNbInscrits($faker->numberBetween(1, 10));
////            $sortie->setInfos($faker->realText(200));
////            $sortie->setEtat($faker->randomElement(Etat::cases()));
////            $sortie->setCampus($faker->randomElement($campuses));
////            $sortie->setLieu($faker->randomElement($lieuxAll));
////
////            // Selon ton modèle, c'est peut-être setInteret() (singulier) ou addInteret()
////            if (method_exists($sortie, 'setInterets')) {
////                $sortie->setInterets($faker->randomElement($interetsAll));
////            } elseif (method_exists($sortie, 'setInteret')) {
////                $sortie->setInteret($faker->randomElement($interetsAll));
////            }
////
////            $organisateur = $faker->randomElement($usersAll);
////            $sortie->setOrganisateur($organisateur);
////
////            // éviter d’avoir le même en participant
////            $participant = $faker->randomElement(array_filter($usersAll, fn($u) => $u !== $organisateur));
////            $sortie->addParticipant($participant);
////
////            $manager->persist($sortie);
////        }
//
//        $manager->flush();
//    }
    public function load(ObjectManager $manager): void
    {
        $faker = \Faker\Factory::create('fr_FR');

        // --- Campus existants (inchangé) ---
        $campusNames = ['Rennes', 'Nantes', 'Niort', 'Quimper'];
        $campuses = [];
        foreach ($campusNames as $name) {
            $c = new Campus();
            $c->setNom($name);
            $manager->persist($c);
            $campuses[] = $c;
        }

        // --- Intérêts (liste réaliste + ton intérêt spécifique) ---
        $interetLabels = [
            'Jeux de société', 'Randonnée', 'Cinéma', 'Lecture', 'Cuisine',
            'Course à pied', 'Jeux vidéo', 'Photographie', 'Voyages', 'Musique',
            'Magic Escape Games' // ton ajout
        ];
        $interetsAll = [];
        foreach ($interetLabels as $label) {
            $interet = new Interets();
            $interet->setNom($label);
            $manager->persist($interet);
            $interetsAll[] = $interet;
        }

        // --- Villes FR cohérentes (nom + CP) ---
        $villeCp = [
            ['Rennes', '35000'],
            ['Nantes', '44000'],
            ['Niort', '79000'],
            ['Quimper', '29000'],
            ['Vannes', '56000'],
            ['Angers', '49000'],
            ['Laval', '53000'],
            ['Saint-Brieuc', '22000'],
            ['La Rochelle', '17000'],
            ['Brest', '29200'],
        ];
        $villesAll = [];
        foreach ($villeCp as [$nomVille, $cp]) {
            $ville = new Ville();
            $ville->setNom($nomVille);
            $ville->setCp($cp);
            $manager->persist($ville);
            $villesAll[] = $ville;
        }

        // --- Lieux (noms et adresses plausibles, lat/lon France) ---
        $typesLieu = ['Parc', 'Café', 'Cinéma', 'Bowling', 'Salle de sport', 'Escape game', 'Musée', 'Bistrot', 'Brasserie', 'Médiathèque'];
        $lieuxAll = [];
        for ($i = 0; $i < 15; $i++) {
            $ville = $faker->randomElement($villesAll);
            $type = $faker->randomElement($typesLieu);
            $lieu = new Lieu();
            $lieu->setNom($type . ' ' . $ville->getNom());
            $lieu->setRue($faker->streetAddress());
            // France métropolitaine approx : lat 42.3–51.1 / lon -4.9–8.2
            $lieu->setLatitude($faker->randomFloat(6, 42.3, 51.1));
            $lieu->setLongitude($faker->randomFloat(6, -4.9, 8.2));
            $lieu->setVille($ville);
            $manager->persist($lieu);
            $lieuxAll[] = $lieu;
        }

        // --- Promos (format propre + unique) ---
        $cursus = ['D2WM', 'CDA', 'BAC+5'];
        $promoAll = [];
        $used = [];
        for ($i = 0; $i < 10; $i++) {
            $annee = $faker->numberBetween(2021, (int)date('Y')); // pas dans le futur
            $cur = $faker->randomElement($cursus);
            $num = str_pad((string)$faker->numberBetween(1, 12), 2, '0', STR_PAD_LEFT);
            $code = sprintf('%d-%s-%s', $annee, $cur, $num);

            if (isset($used[$code])) {
                $i--;
                continue;
            }
            $used[$code] = true;

            $promo = new Promo();
            $promo->setNom($code);
            $promo->setAnnee($annee);
            $promo->setCursus($cur);
            $manager->persist($promo);
            $promoAll[] = $promo;
        }

        // --- Users ---
        $usersAll = [];
        $domain = 'campus-eni.fr';
        $pseudoUsed = [];

        for ($i = 0; $i < 20; $i++) {
            $user = new User();
            $prenom = $faker->firstName();
            $nom = $faker->lastName();

            $user->setNom($nom);
            $user->setPrenom($prenom);

            // Pseudo unique basé sur prénom.nom + éventuel chiffre
            $basePseudo = $this->slugify($prenom . '.' . $nom);
            $pseudo = $basePseudo;
            $suffix = 1;
            while (isset($pseudoUsed[$pseudo])) {
                $pseudo = $basePseudo . $suffix++;
            }
            $pseudoUsed[$pseudo] = true;
            $user->setPseudo($pseudo);

            // Email propre et stable
            $email = strtolower($this->ascii($prenom) . '.' . $this->ascii($nom) . '@' . $domain);
            $user->setEmail($email);

            // ⚠️ idéalement : injecter UserPasswordHasherInterface et hasher "password"
            // Ici on met une valeur simple (à adapter selon ton security.yaml / encoders)
            $user->setPassword('password');

            $user->setCampus($faker->randomElement($campuses));
            $user->setBio($faker->realTextBetween(80, 180));

            // 1 à 3 intérêts
            $nbInterets = $faker->numberBetween(1, 3);
            $interetsPick = $faker->randomElements($interetsAll, $nbInterets);
            foreach ($interetsPick as $iObj) {
                $user->addInteret($iObj);
            }

            $user->setPromo($faker->randomElement($promoAll));

            $manager->persist($user);
            $usersAll[] = $user;
        }

        $annee2025 = 2025;
        //----User en dur----
        $user = new User();
        $nom = 'Boulier';
        $prenom = 'romane';
        $user->setNom($nom);                 // () obligatoires
        $user->setPrenom($prenom);
        $user->setPseudo('MamanRomane');
        $user->setEmail($prenom . '.' . $nom . $annee2025 . '@' . $domain);
        $hashedPassword = $this->passwordHasher->hashPassword($user, "16-Avril2007");
        $user->setPassword($hashedPassword);
        // Si User::campus est une relation ManyToOne vers Campus, on doit setter un objet, pas un entier
        $user->setCampus($faker->randomElement($campuses));
        $user->setBio($faker->realText(180));              // borné pour éviter un pavé
        $user->addInteret($faker->randomElement($interetsAll));
        $user->setPromo($faker->randomElement($promoAll));
        $user->setRoles(['ROLE_ADMIN']);
        $manager->persist($user);

        //----User en dur----
        $user = new User();
        $nom = 'Guillevic';
        $prenom = 'laurence';
        $user->setNom($nom);                 // () obligatoires
        $user->setPrenom($prenom);
        $user->setPseudo("LuxAndLyraLover's");
        $user->setEmail($prenom . '.' . $nom . $annee2025 . '@' . $domain);
        $hashedPassword = $this->passwordHasher->hashPassword($user, "@Lux56700");
        $user->setPassword($hashedPassword);
        // Si User::campus est une relation ManyToOne vers Campus, on doit setter un objet, pas un entier
        $user->setCampus($faker->randomElement($campuses));
        $user->setBio($faker->realText(180));              // borné pour éviter un pavé
        $user->addInteret($faker->randomElement($interetsAll));
        $user->setPromo($faker->randomElement($promoAll));
        $user->setRoles(['ROLE_ADMIN']);
        $manager->persist($user);

        //----User en dur----
        $user = new User();
        $nom = 'Süss';
        $prenom = 'laurine';
        $user->setNom($nom);                 // () obligatoires
        $user->setPrenom($prenom);
        $user->setPseudo('McGonagall');
        $user->setEmail($prenom . '.' . $nom . $annee2025 . '@' . $domain);
        $hashedPassword = $this->passwordHasher->hashPassword($user, "@Azerty123");
        $user->setPassword($hashedPassword);
        // Si User::campus est une relation ManyToOne vers Campus, on doit setter un objet, pas un entier
        $user->setCampus($faker->randomElement($campuses));
        $user->setBio($faker->realText(180));              // borné pour éviter un pavé
        $user->addInteret($faker->randomElement($interetsAll));
        $user->setPromo($faker->randomElement($promoAll));
        $user->setRoles(['ROLE_ADMIN']);
        $manager->persist($user);

        //----User en dur----
        $user = new User();
        $nom = 'Minel';
        $prenom = 'jonathan';
        $user->setNom($nom);                 // () obligatoires
        $user->setPrenom($prenom);
        $user->setPseudo('Jojo');
        $user->setEmail($prenom . '.' . $nom . $annee2025 . '@' . $domain);
        $hashedPassword = $this->passwordHasher->hashPassword($user, "@Azerty123");
        $user->setPassword($hashedPassword);
        // Si User::campus est une relation ManyToOne vers Campus, on doit setter un objet, pas un entier
        $user->setCampus($faker->randomElement($campuses));
        $user->setBio($faker->realText(180));              // borné pour éviter un pavé
        $user->addInteret($faker->randomElement($interetsAll));
        $user->setPromo($faker->randomElement($promoAll));
        $user->setRoles(['ROLE_ADMIN']);
        $manager->persist($user);

        // --- Sorties (cohérence des bornes et des relations) ---
        for ($i = 0; $i < 20; $i++) {
            $sortie = new Sortie();

            $lieu = $faker->randomElement($lieuxAll);
            $typeEvenement = $faker->randomElement(['Soirée', 'Sortie', 'Atelier', 'Afterwork', 'Tournoi', 'Projection', 'Rando']);
            $sortie->setNom($typeEvenement . ' ' . $lieu->getNom());

            // Dates : inscription avant le début
            $dateDebut = $faker->dateTimeBetween('+2 days', '+60 days');
            $dateLimite = (clone $dateDebut)->modify('-' . $faker->numberBetween(2, 15) . ' days');

            $sortie->setDateHeureDebut(\DateTimeImmutable::createFromMutable($dateDebut));
            $sortie->setDuree($faker->numberBetween(45, 240)); // minutes
            $sortie->setDateLimiteInscription(\DateTimeImmutable::createFromMutable($dateLimite));

            // Capacités et inscrits cohérents
            $nbInscritsMax = $faker->numberBetween(8, 30);
            $nbInscritsMin = $faker->numberBetween(2, max(2, (int)floor($nbInscritsMax / 3)));
            $nbInscrits = $faker->numberBetween($nbInscritsMin, $nbInscritsMax);

            $sortie->setNbInscriptionMax($nbInscritsMax);
            $sortie->setNbInscriptionMin($nbInscritsMin);
            $sortie->setNbInscrits($nbInscrits);

            $sortie->setInfos($faker->realTextBetween(120, 220));

            // Etat : si ton Enum a des valeurs précises c’est mieux de mapper selon la date.
            // Ici on reste générique pour éviter de casser selon ton code :
            $sortie->setEtat($faker->randomElement(Etat::cases()));

            // Campus = celui de l’organisateur (logique)
            $organisateur = $faker->randomElement($usersAll);
            $sortie->setOrganisateur($organisateur);
            $sortie->setCampus($organisateur->getCampus());

            // Lieu choisi plus haut
            $sortie->setLieu($lieu);

            // 1 à 2 intérêts
            if (method_exists($sortie, 'addInteret')) {
                foreach ($faker->randomElements($interetsAll, $faker->numberBetween(1, 2)) as $iObj) {
                    $sortie->addInteret($iObj);
                }
            } elseif (method_exists($sortie, 'setInteret')) {
                $sortie->setInteret($faker->randomElement($interetsAll));
            } elseif (method_exists($sortie, 'setInterets')) {
                $sortie->setInterets($faker->randomElement($interetsAll));
            }

            // Participants distincts de l’organisateur et ≤ max
            $pool = array_values(array_filter($usersAll, fn($u) => $u !== $organisateur));
            shuffle($pool);
            $nbToAdd = min($nbInscrits, count($pool));
            for ($k = 0; $k < $nbToAdd; $k++) {
                $sortie->addParticipant($pool[$k]);
            }

            $manager->persist($sortie);
        }

        $manager->flush();
    }

// ----------------- Helpers -----------------
    private function ascii(string $value): string
    {
        // enlève accents et caractères spéciaux
        $v = iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $value);
        $v = preg_replace('/[^A-Za-z0-9\.]+/', '', $v ?? $value);
        return $v ? $v : $value;
    }

    private function slugify(string $value): string
    {
        $v = iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $value);
        $v = strtolower($v ?? $value);
        $v = preg_replace('/[^a-z0-9]+/i', '.', $v);
        $v = trim($v, '.');
        return $v ?: strtolower($value);
    }

}
