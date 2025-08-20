<?php
//
//namespace App\DataFixtures;
//
//use App\Entity\Campus;
//use App\Entity\Interets;
//use App\Entity\Lieu;
//use App\Entity\Promo;
//use App\Entity\Sortie;
//use App\Entity\User;
//use App\Entity\Ville;
//use App\Enum\Etat;
//use Doctrine\Bundle\FixturesBundle\Fixture;
//use Doctrine\Persistence\ObjectManager;
//use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
//
//class AppFixtures extends Fixture
//{
//
//    public function __construct(private UserPasswordHasherInterface $passwordHasher)
//    {
//    }
//
//
//    public function load(ObjectManager $manager): void
//    {
//        $faker = \Faker\Factory::create('fr_FR');
//
//        // --- Campus existants (inchangé) ---
//        $campusNames = ['Rennes', 'Nantes', 'Niort', 'Quimper'];
//        $campuses = [];
//        foreach ($campusNames as $name) {
//            $c = new Campus();
//            $c->setNom($name);
//            $manager->persist($c);
//            $campuses[] = $c;
//        }
//
//        // --- Intérêts (liste réaliste + ton intérêt spécifique) ---
//        $interetLabels = [
//            'Jeux de société', 'Randonnée', 'Cinéma', 'Lecture', 'Cuisine',
//            'Course à pied', 'Jeux vidéo', 'Photographie', 'Voyages', 'Musique',
//            'Magic Escape Games' // ton ajout
//        ];
//        $interetsAll = [];
//        foreach ($interetLabels as $label) {
//            $interet = new Interets();
//            $interet->setNom($label);
//            $manager->persist($interet);
//            $interetsAll[] = $interet;
//        }
//
//        // --- Villes FR cohérentes (nom + CP) ---
//        $villeCp = [
//            ['Rennes', '35000'],
//            ['Nantes', '44000'],
//            ['Niort', '79000'],
//            ['Quimper', '29000'],
//            ['Vannes', '56000'],
//            ['Angers', '49000'],
//            ['Laval', '53000'],
//            ['Saint-Brieuc', '22000'],
//            ['La Rochelle', '17000'],
//            ['Brest', '29200'],
//        ];
//        $villesAll = [];
//        foreach ($villeCp as [$nomVille, $cp]) {
//            $ville = new Ville();
//            $ville->setNom($nomVille);
//            $ville->setCp($cp);
//            $manager->persist($ville);
//            $villesAll[] = $ville;
//        }
//
//        // --- Lieux (noms et adresses plausibles, lat/lon France) ---
//        $typesLieu = ['Parc', 'Café', 'Cinéma', 'Bowling', 'Salle de sport', 'Escape game', 'Musée', 'Bistrot', 'Brasserie', 'Médiathèque'];
//        $lieuxAll = [];
//        for ($i = 0; $i < 15; $i++) {
//            $ville = $faker->randomElement($villesAll);
//            $type = $faker->randomElement($typesLieu);
//            $lieu = new Lieu();
//            $lieu->setNom($type . ' ' . $ville->getNom());
//            $lieu->setRue($faker->streetAddress());
//            // France métropolitaine approx : lat 42.3–51.1 / lon -4.9–8.2
//            $lieu->setLatitude($faker->randomFloat(6, 42.3, 51.1));
//            $lieu->setLongitude($faker->randomFloat(6, -4.9, 8.2));
//            $lieu->setVille($ville);
//            $manager->persist($lieu);
//            $lieu->setCampus($faker->randomElement($campuses));
//            $lieuxAll[] = $lieu;
//        }
//
//        // --- Promos (format propre + unique) ---
//        $cursus = ['D2WM', 'CDA', 'EADL'];
//        $promoAll = [];
//        $used = [];
//        for ($i = 0; $i < 10; $i++) {
//            $annee = $faker->numberBetween(2021, (int)date('Y')); // pas dans le futur
//            $cur = $faker->randomElement($cursus);
//            $num = str_pad((string)$faker->numberBetween(1, 12), 2, '0', STR_PAD_LEFT);
//            $code = sprintf('%d-%s-%s', $annee, $cur, $num);
//
//            if (isset($used[$code])) {
//                $i--;
//                continue;
//            }
//            $used[$code] = true;
//
//            $promo = new Promo();
//            $promo->setNom($code);
//            $promo->setAnnee($annee);
//            $promo->setCursus($cur);
//            $manager->persist($promo);
//            $promoAll[] = $promo;
//        }
//
//        // --- Users ---
//        $usersAll = [];
//
//        $pseudoUsed = [];
//
//        for ($i = 0; $i < 20; $i++) {
//            $user = new User();
//            $prenom = $faker->firstName();
//            $nom = $faker->lastName();
//
//            $user->setNom($nom);
//            $user->setPrenom($prenom);
//
//            // Pseudo unique basé sur prénom.nom + éventuel chiffre
//            $basePseudo = $this->slugify($prenom . '.' . $nom);
//            $pseudo = $basePseudo;
//            $suffix = 1;
//            while (isset($pseudoUsed[$pseudo])) {
//                $pseudo = $basePseudo . $suffix++;
//            }
//            $pseudoUsed[$pseudo] = true;
//            $user->setPseudo($pseudo);
//
//            // Email propre et stable
//            $email = strtolower($this->ascii($prenom) . '.' . $this->ascii($nom) . '@' . $domain);
//            $user->setEmail($email);
//
//            // ⚠️ idéalement : injecter UserPasswordHasherInterface et hasher "password"
//            // Ici on met une valeur simple (à adapter selon ton security.yaml / encoders)
//            $user->setPassword('password');
//
//            $user->setCampus($faker->randomElement($campuses));
//            $user->setBio($faker->realTextBetween(80, 180));
//
//            // 1 à 3 intérêts
//            $nbInterets = $faker->numberBetween(1, 3);
//            $interetsPick = $faker->randomElements($interetsAll, $nbInterets);
//            foreach ($interetsPick as $iObj) {
//                $user->addInteret($iObj);
//            }
//
//            $user->setPromo($faker->randomElement($promoAll));
//
//            $manager->persist($user);
//            $usersAll[] = $user;
//        }
//
//        $annee2025 = 2025;
//        //----User en dur----
//        $user = new User();
//        $nom = 'Boulier';
//        $prenom = 'romane';
//        $user->setNom($nom);                 // () obligatoires
//        $user->setPrenom($prenom);
//        $user->setPseudo('MamanRomane');
//        $user->setEmail($prenom . '.' . $nom . $annee2025 . '@' . $domain);
//        $hashedPassword = $this->passwordHasher->hashPassword($user, "16-Avril2007");
//        $user->setPassword($hashedPassword);
//        // Si User::campus est une relation ManyToOne vers Campus, on doit setter un objet, pas un entier
//        $user->setCampus($faker->randomElement($campuses));
//        $user->setBio($faker->realText(180));              // borné pour éviter un pavé
//        $user->addInteret($faker->randomElement($interetsAll));
//        $user->setPromo($faker->randomElement($promoAll));
//        $user->setRoles(['ROLE_ADMIN']);
//        $manager->persist($user);
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
//        $user->setRoles(['ROLE_ADMIN']);
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
//        $user->setRoles(['ROLE_ADMIN']);
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
//        $user->setRoles(['ROLE_ADMIN']);
//        $manager->persist($user);
//
//        // --- Sorties (cohérence des bornes et des relations) ---
//        for ($i = 0; $i < 20; $i++) {
//            $sortie = new Sortie();
//
//            $lieu = $faker->randomElement($lieuxAll);
//            $typeEvenement = $faker->randomElement(['Soirée', 'Sortie', 'Atelier', 'Afterwork', 'Tournoi', 'Projection', 'Rando']);
//            $sortie->setNom($typeEvenement . ' ' . $lieu->getNom());
//
//            // Dates : inscription avant le début
//            $dateDebut = $faker->dateTimeBetween('+2 days', '+60 days');
//            $dateLimite = (clone $dateDebut)->modify('-' . $faker->numberBetween(2, 15) . ' days');
//
//            $sortie->setDateHeureDebut(\DateTimeImmutable::createFromMutable($dateDebut));
//            $sortie->setDuree($faker->numberBetween(45, 240)); // minutes
//            $sortie->setDateLimiteInscription(\DateTimeImmutable::createFromMutable($dateLimite));
//
//            // Capacités et inscrits cohérents
//            $nbInscritsMax = $faker->numberBetween(8, 30);
//            $nbInscritsMin = $faker->numberBetween(2, max(2, (int)floor($nbInscritsMax / 3)));
//            $nbInscrits = $faker->numberBetween($nbInscritsMin, $nbInscritsMax);
//
//            $sortie->setNbInscriptionMax($nbInscritsMax);
//            $sortie->setNbInscriptionMin($nbInscritsMin);
//            $sortie->setNbInscrits($nbInscrits);
//
//            $sortie->setInfos($faker->realTextBetween(120, 220));
//
//            // Etat : si ton Enum a des valeurs précises c’est mieux de mapper selon la date.
//            // Ici on reste générique pour éviter de casser selon ton code :
//            $sortie->setEtat($faker->randomElement(Etat::cases()));
//
//            // Campus = celui de l’organisateur (logique)
//            $organisateur = $faker->randomElement($usersAll);
//            $sortie->setOrganisateur($organisateur);
//            $sortie->setCampus($organisateur->getCampus());
//
//            // Lieu choisi plus haut
//            $sortie->setLieu($lieu);
//
//            // 1 à 2 intérêts
//            if (method_exists($sortie, 'addInteret')) {
//                foreach ($faker->randomElements($interetsAll, $faker->numberBetween(1, 2)) as $iObj) {
//                    $sortie->addInteret($iObj);
//                }
//            } elseif (method_exists($sortie, 'setInteret')) {
//                $sortie->setInteret($faker->randomElement($interetsAll));
//            } elseif (method_exists($sortie, 'setInterets')) {
//                $sortie->setInterets($faker->randomElement($interetsAll));
//            }
//
//            // Participants distincts de l’organisateur et ≤ max
//            $pool = array_values(array_filter($usersAll, fn($u) => $u !== $organisateur));
//            shuffle($pool);
//            $nbToAdd = min($nbInscrits, count($pool));
//            for ($k = 0; $k < $nbToAdd; $k++) {
//                $sortie->addParticipant($pool[$k]);
//            }
//
//            $manager->persist($sortie);
//        }
//
//        $manager->flush();
//    }
//
//// ----------------- Helpers -----------------
//    private function ascii(string $value): string
//    {
//        // enlève accents et caractères spéciaux
//        $v = iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $value);
//        $v = preg_replace('/[^A-Za-z0-9\.]+/', '', $v ?? $value);
//        return $v ? $v : $value;
//    }
//
//    private function slugify(string $value): string
//    {
//        $v = iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $value);
//        $v = strtolower($v ?? $value);
//        $v = preg_replace('/[^a-z0-9]+/i', '.', $v);
//        $v = trim($v, '.');
//        return $v ?: strtolower($value);
//    }
//
//}

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

final class AppFixtures extends Fixture
{
    public function __construct(private UserPasswordHasherInterface $passwordHasher)
    {
    }

    public function load(ObjectManager $em): void
    {
        // === 1) Campus fixes ===
        $campusByName = [];
        foreach (['Rennes', 'Nantes', 'Niort', 'Quimper'] as $name) {
            $c = (new Campus())->setNom($name);
            $em->persist($c);
            $campusByName[$name] = $c;
        }

        // === 2) Villes (avec CP) ===
        // Rennes
        $rennes = (new Ville())->setNom('Rennes')->setCp('35000');
        // Nantes
        $nantes = (new Ville())->setNom('Nantes')->setCp('44000');
        // Niort
        $niort = (new Ville())->setNom('Niort')->setCp('79000');
        // Quimper
        $quimper = (new Ville())->setNom('Quimper')->setCp('29000');

        $em->persist($rennes);
        $em->persist($nantes);
        $em->persist($niort);
        $em->persist($quimper);

        // === 3) Lieux réalistes (adresse officielle + lat/long) ===
        // RENNES
        // Parc du Thabor — Place Saint-Melaine, 35000 Rennes — 48.11417, -1.67000
        // (Coordonnées et adresse : Office de tourisme/ Wikipédia/ guides locaux). :contentReference[oaicite:0]{index=0}
        $thabor = (new Lieu())
            ->setNom('Parc du Thabor')
            ->setRue('Place Saint-Melaine')
            ->setLatitude(48.11417)
            ->setLongitude(-1.67000)
            ->setVille($rennes)
            ->setCampus($campusByName['Rennes']);
        // Les Champs Libres — 10 cours des Alliés, 35000 Rennes — ~47. 48.1079? (on fixe coord officielles page "Infos pratiques")
        // Coord adresse : site officiel. :contentReference[oaicite:1]{index=1}
        $champsLibres = (new Lieu())
            ->setNom('Les Champs Libres')
            ->setRue('10 Cours des Alliés')
            ->setLatitude(48.1049) // proximité gare; précision suffisante pour fixture
            ->setLongitude(-1.6722)
            ->setVille($rennes)
            ->setCampus($campusByName['Rennes']);
        // Le Liberté — 1 Esplanade Charles de Gaulle, 35000 Rennes — coords approx
        // Adresse : Mapcarta. :contentReference[oaicite:2]{index=2}
        $leLiberte = (new Lieu())
            ->setNom('Le Liberté')
            ->setRue('1 Esplanade Charles de Gaulle')
            ->setLatitude(48.1068)
            ->setLongitude(-1.6740)
            ->setVille($rennes)
            ->setCampus($campusByName['Rennes']);

        // NANTES
        // Les Machines de l’Île — Parc des Chantiers, Bd Léon Bureau, 44200 Nantes — 47.20647, -1.56430. :contentReference[oaicite:3]{index=3}
        $machines = (new Lieu())
            ->setNom("Les Machines de l'Île")
            ->setRue('Parc des Chantiers, Boulevard Léon Bureau')
            ->setLatitude(47.206472)
            ->setLongitude(-1.564297)
            ->setVille($nantes)
            ->setCampus($campusByName['Nantes']);
        // Jardin des Plantes — Rue Stanislas Baudry, 44000 Nantes — 47.21944, -1.54278. :contentReference[oaicite:4]{index=4}
        $jardinPlantes = (new Lieu())
            ->setNom('Jardin des Plantes')
            ->setRue('Rue Stanislas Baudry')
            ->setLatitude(47.219444444)
            ->setLongitude(-1.542777778)
            ->setVille($nantes)
            ->setCampus($campusByName['Nantes']);
        // Île de Versailles — Quai de Versailles, 44000 Nantes — 47.22397, -1.55368 (quai). :contentReference[oaicite:5]{index=5}
        $ileVersailles = (new Lieu())
            ->setNom('Île de Versailles')
            ->setRue('Quai de Versailles')
            ->setLatitude(47.22397)
            ->setLongitude(-1.55368)
            ->setVille($nantes)
            ->setCampus($campusByName['Nantes']);

        // NIORT
        // Donjon de Niort — Place du Donjon, 79000 Niort — 46.3220, -0.4590. :contentReference[oaicite:6]{index=6}
        $donjonNiort = (new Lieu())
            ->setNom('Donjon de Niort')
            ->setRue('Place du Donjon')
            ->setLatitude(46.3220)
            ->setLongitude(-0.4590)
            ->setVille($niort)
            ->setCampus($campusByName['Niort']);
        // Jardins de la Brèche — Jardins de la Brèche, 79000 Niort — 46.32274, -0.45795. :contentReference[oaicite:7]{index=7}
        $breche = (new Lieu())
            ->setNom('Jardins de la Brèche')
            ->setRue('Jardins de la Brèche')
            ->setLatitude(46.3227427327)
            ->setLongitude(-0.4579473020)
            ->setVille($niort)
            ->setCampus($campusByName['Niort']);

        // QUIMPER
        // Cathédrale Saint-Corentin — Place Saint-Corentin, 29000 Quimper — 47.9962, -4.1023. :contentReference[oaicite:8]{index=8}
        $cathedraleQuimper = (new Lieu())
            ->setNom('Cathédrale Saint-Corentin')
            ->setRue('Place Saint-Corentin')
            ->setLatitude(47.996224)
            ->setLongitude(-4.102296)
            ->setVille($quimper)
            ->setCampus($campusByName['Quimper']);
        // Musée des Beaux-Arts — 40 Place Saint-Corentin, 29000 Quimper — 47.9963, -4.1023. :contentReference[oaicite:9]{index=9}
        $museeQuimper = (new Lieu())
            ->setNom('Musée des Beaux-Arts de Quimper')
            ->setRue('40 Place Saint-Corentin')
            ->setLatitude(47.9963)
            ->setLongitude(-4.1023)
            ->setVille($quimper)
            ->setCampus($campusByName['Quimper']);
        // Jardin de la Retraite — 35 Rue Élie Fréron, 29000 Quimper — 47.997855, -4.101158. :contentReference[oaicite:10]{index=10}
        $jardinRetraite = (new Lieu())
            ->setNom('Jardin de la Retraite')
            ->setRue('35 Rue Élie Fréron')
            ->setLatitude(47.997855)
            ->setLongitude(-4.101158)
            ->setVille($quimper)
            ->setCampus($campusByName['Quimper']);

        foreach ([
                     $thabor, $champsLibres, $leLiberte,
                     $machines, $jardinPlantes, $ileVersailles,
                     $donjonNiort, $breche,
                     $cathedraleQuimper, $museeQuimper, $jardinRetraite
                 ] as $lieu) {
            $em->persist($lieu);
        }

        // === 4) Intérêts ===
        $interestNames = ['Randonnée', 'Cinéma', 'Jeux vidéo', 'Musique', 'Gastronomie', 'Musées', 'Photographie', 'Théâtre'];
        $interets = [];
        foreach ($interestNames as $name) {
            $it = (new Interets())->setNom($name);
            $em->persist($it);
            $interets[] = $it;
        }

        // === 5) Promos ===
        $promos = [];
        $promos[] = (new Promo())->setNom('D2WM')->setAnnee(2025)->setCursus('Dév Web & Mobile');
        $promos[] = (new Promo())->setNom('Java SE')->setAnnee(2025)->setCursus('Java Standard');
        $promos[] = (new Promo())->setNom('Full Stack')->setAnnee(2025)->setCursus('JS/Java');
        foreach ($promos as $p) {
            $em->persist($p);
        }

        // === 6) Users (20 utilisateurs, emails @campus-eni.fr, téléphone FR, pseudos uniques) ===
        $people = [
            ['Alice', 'Martin', 'Rennes'], ['Bruno', 'Lefevre', 'Rennes'], ['Camille', 'Robert', 'Rennes'],
            ['David', 'Moreau', 'Nantes'], ['Emma', 'Petit', 'Nantes'], ['Franck', 'Dubois', 'Nantes'],
            ['Gaelle', 'Laurent', 'Niort'], ['Hugo', 'Simon', 'Niort'], ['Ines', 'Michel', 'Niort'],
            ['Jules', 'Garcia', 'Quimper'], ['Kenza', 'Lambert', 'Quimper'], ['Leo', 'Bonnet', 'Quimper'],
            ['Maya', 'Rousseau', 'Rennes'], ['Nina', 'Colin', 'Nantes'], ['Olivier', 'Renaud', 'Niort'],
            ['Paul', 'Guerin', 'Quimper'], ['Quentin', 'Fontaine', 'Rennes'], ['Romy', 'Bernard', 'Nantes'],
            ['Sara', 'Lopez', 'Niort'], ['Tom', 'Robin', 'Quimper'],
        ];

        $usersByCampus = ['Rennes' => [], 'Nantes' => [], 'Niort' => [], 'Quimper' => []];

        $i = 1;
        foreach ($people as [$prenom, $nom, $campusName]) {
            $u = new User();
            $email = strtolower($prenom . '.' . $nom) . '@campus-eni.fr';
            $u->setEmail($email)
                ->setPrenom($prenom)
                ->setNom($nom)
                ->setPseudo(strtolower($prenom) . $i)
                ->setBio(null)
                ->setIsActive(true)
                ->setNumeroTelephone($this->fakeFrPhone($i))
                ->setCampus($campusByName[$campusName])
                ->setPromo($promos[array_rand($promos)]);

            // mot de passe : "Password123!"
            $u->setPassword($this->passwordHasher->hashPassword($u, 'Password123!'));

            // Intérêts aléatoires (2 à 4)
            shuffle($interets);
            foreach (array_slice($interets, 0, random_int(2, 4)) as $it) {
                $u->addInteret($it);
            }

            $em->persist($u);
            $usersByCampus[$campusName][] = $u;
            $i++;
        }

        // === 7) Sorties (événements) par ville/lieu ===
        $now = new \DateTimeImmutable('now', new \DateTimeZone('Europe/Paris'));
        $sortiesSpecs = [
            // Rennes
            ['nom' => "Pique-nique au Thabor", 'lieu' => $thabor, 'campus' => 'Rennes', 'duree' => 120, 'j+' => 14, 'h' => '12:00', 'max' => 20, 'min' => 5, 'interet' => 'Gastronomie'],
            ['nom' => "Expo & bibliothèque aux Champs Libres", 'lieu' => $champsLibres, 'campus' => 'Rennes', 'duree' => 90, 'j+' => 21, 'h' => '17:30', 'max' => 15, 'min' => 4, 'interet' => 'Musées'],
            // Nantes
            ['nom' => "Balade du Grand Éléphant", 'lieu' => $machines, 'campus' => 'Nantes', 'duree' => 60, 'j+' => 10, 'h' => '15:00', 'max' => 25, 'min' => 6, 'interet' => 'Photographie'],
            ['nom' => "Visite botanique au Jardin des Plantes", 'lieu' => $jardinPlantes, 'campus' => 'Nantes', 'duree' => 75, 'j+' => 28, 'h' => '10:00', 'max' => 18, 'min' => 6, 'interet' => 'Randonnée'],
            // Niort
            ['nom' => "Visite du Donjon de Niort", 'lieu' => $donjonNiort, 'campus' => 'Niort', 'duree' => 80, 'j+' => 12, 'h' => '14:00', 'max' => 20, 'min' => 5, 'interet' => 'Histoire'],
            ['nom' => "Afterwork aux Jardins de la Brèche", 'lieu' => $breche, 'campus' => 'Niort', 'duree' => 90, 'j+' => 7, 'h' => '18:30', 'max' => 30, 'min' => 8, 'interet' => 'Musique'],
            // Quimper
            ['nom' => "Patrimoine à la Cathédrale", 'lieu' => $cathedraleQuimper, 'campus' => 'Quimper', 'duree' => 60, 'j+' => 16, 'h' => '16:00', 'max' => 20, 'min' => 5, 'interet' => 'Musées'],
            ['nom' => "Croquis au Jardin de la Retraite", 'lieu' => $jardinRetraite, 'campus' => 'Quimper', 'duree' => 120, 'j+' => 25, 'h' => '11:00', 'max' => 16, 'min' => 4, 'interet' => 'Photographie'],
        ];

        // Garantir que les intérêts utilisés existent (sinon on retombe sur un proche)
        $fallback = $interets[0];
        $interetsByName = [];
        foreach ($interets as $it) {
            $interetsByName[$it->getNom()] = $it;
        }
        $ensureInterest = function (string $name) use ($interetsByName, $fallback) {
            return $interetsByName[$name] ?? $fallback;
        };

        foreach ($sortiesSpecs as $spec) {
            $dateStart = $this->atTimePlusDays($now, $spec['j+'], $spec['h']);
            $dateLimit = $dateStart->modify('-3 days');

            $s = (new Sortie())
                ->setNom($spec['nom'])
                ->setCampus($campusByName[$spec['campus']])
                ->setLieu($spec['lieu'])
                ->setDateHeureDebut($dateStart)
                ->setDuree($spec['duree'])
                ->setDateLimiteInscription($dateLimit)
                ->setNbInscriptionMax($spec['max'])
                ->setNbInscriptionMin($spec['min'])
                ->setInfos('Sortie conviviale organisée par les étudiants du campus ' . $spec['campus'])
                ->setEtat(Etat::OUVERTE)
                ->setInterets($ensureInterest($spec['interet']));

            // organiser = premier utilisateur du campus (s’il existe)
            $organiser = $usersByCampus[$spec['campus']][0] ?? null;
            if ($organiser) {
                $s->setOrganisateur($organiser);
            }

            // participants aléatoires du campus (incluant potentiellement l’organisateur)
            $participants = $usersByCampus[$spec['campus']];
            shuffle($participants);
            $take = min(random_int(5, min(12, count($participants))), $spec['max']);
            $count = 0;
            foreach (array_slice($participants, 0, $take) as $u) {
                $s->addParticipant($u);
                $count++;
            }
            $s->setNbInscrits($count);

            $em->persist($s);

            $faker = \Faker\Factory::create('fr_FR');
            $domain = 'campus-eni.fr';
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
            $user->setCampus($faker->randomElement($campusByName));
            $user->setBio($faker->realText(180));              // borné pour éviter un pavé
            $user->addInteret($faker->randomElement($interets));
            $user->setPromo($faker->randomElement($promos));
            $user->setRoles(['ROLE_ADMIN']);
            $em->persist($user);

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
            $user->setCampus($faker->randomElement($campusByName));
            $user->setBio($faker->realText(180));              // borné pour éviter un pavé
            $user->addInteret($faker->randomElement($interets));
            $user->setPromo($faker->randomElement($promos));
            $user->setRoles(['ROLE_ADMIN']);
            $em->persist($user);

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
            $user->setCampus($faker->randomElement($campusByName));
            $user->setBio($faker->realText(180));              // borné pour éviter un pavé
            $user->addInteret($faker->randomElement($interets));
            $user->setPromo($faker->randomElement($promos));
            $user->setRoles(['ROLE_ADMIN']);
            $em->persist($user);

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
            $user->setCampus($faker->randomElement($campusByName));
            $user->setBio($faker->realText(180));              // borné pour éviter un pavé
            $user->addInteret($faker->randomElement($interets));
            $user->setPromo($faker->randomElement($promos));
            $user->setRoles(['ROLE_ADMIN']);
            $em->persist($user);
        }


        $em->flush();
    }

    private function atTimePlusDays(\DateTimeImmutable $from, int $plusDays, string $hhmm): \DateTimeImmutable
    {
        [$h, $m] = explode(':', $hhmm);
        return $from
            ->setTime((int)$h, (int)$m)
            ->modify("+{$plusDays} days");
    }


    // Téléphones FR valides (+33 ou 0)
    private function fakeFrPhone(int $i): string
    {
        $prefix = ['06', '07'][($i % 2)];
        // génère un 06 xx xx xx xx formaté sans espaces (validator accepte 0X######### ou +33X########)
        $digits = str_pad((string)($i * 1234 % 100000000), 8, '0', STR_PAD_LEFT);
        return $prefix . preg_replace('/(\d{2})(?=\d)/', '$1', $digits); // ex : 06XXXXXXXX
    }
}
