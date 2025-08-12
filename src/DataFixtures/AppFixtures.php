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

class AppFixtures extends Fixture
{
    public function load(ObjectManager $manager): void
    {
        $faker = \Faker\Factory::create('fr_FR');

        // --- Campus existants ---
        $campusNames = ['Rennes', 'Nantes', 'Niort', 'Quimper'];
        $campuses = [];
        foreach ($campusNames as $name) {
            $c = new Campus();
            $c->setNom($name);
            $manager->persist($c);
            $campuses[] = $c; // on garde la référence pour lier ensuite
        }

        // --- Intérêts ---
        $interetsAll = [];
        for ($i = 0; $i < 10; $i++) {
            $interet = new Interets();
            $interet->setNom($faker->unique()->word());
            $manager->persist($interet);
            $interetsAll[] = $interet;
        }

        // --- Villes ---
        $villesAll = [];
        for ($i = 0; $i < 10; $i++) {
            $ville = new Ville();
            $ville->setNom($faker->unique()->word());
            $ville->setCp($faker->postcode());
            $manager->persist($ville);
            $villesAll[] = $ville;
        }

        // --- Lieux ---
        $lieuxAll = [];
        for ($i = 0; $i < 10; $i++) {
            $lieu = new Lieu();
            $lieu->setNom($faker->unique()->word());
            $lieu->setRue($faker->streetAddress());
            $lieu->setLatitude($faker->latitude());
            $lieu->setLongitude($faker->longitude());
            $lieu->setVille($faker->randomElement($villesAll));
            $manager->persist($lieu);
            $lieuxAll[] = $lieu;
        }

        // --- Promos ---
//        $cursus = ['D2WM', 'CDA', 'BAC+5'];
//        $nbrPromo = ['01', '02', '03'];
//        $promoAll = [];
//        for ($i = 0; $i < 10; $i++) {
//            $promo = new Promo();
//            // ATTENTION: concaténer des chaînes en PHP = ".", pas "-"
//            $promo->setNom(sprintf(
//                '%d-%s-%s',
//                $faker->numberBetween(2000, 2025),
//                $faker->randomElement($cursus),
//                $faker->randomElement($nbrPromo)
//            ));
//            $promo->setVille($faker->randomElement($villesAll));
//            $manager->persist($promo);
//            $promoAll[] = $promo;
//        }
        // --- Promos ---
        $cursus = ['D2WM', 'CDA', 'BAC+5'];
        $nbrPromo = ['01','02','03'];
        $promoAll = [];
        $used = [];

        for ($i = 0; $i < 10; $i++) {
            $annee  = $faker->numberBetween(2020, 2025);
            $cur    = $faker->randomElement($cursus);
            $num    = $faker->randomElement($nbrPromo);
            $code   = sprintf('%d-%s-%s', $annee, $cur, $num);

            // éviter les doublons si nécessaire
            if (isset($used[$code])) { $i--; continue; }
            $used[$code] = true;

            $promo = new Promo();
            $promo->setNom($code);             // "2024-D2WM-01"
            $promo->setAnnee($annee);
            $promo->setCursus($cur);
            $manager->persist($promo);
            $promoAll[] = $promo;
        }




        // --- Users ---
        $usersAll = [];
        for ($i = 0; $i < 10; $i++) {
            $user = new User();
            $user->setNom($faker->lastName());                 // () obligatoires
            $user->setPrenom($faker->firstName());
            $user->setEmail($faker->unique()->safeEmail());
            $user->setPassword($faker->password());
            // Si User::campus est une relation ManyToOne vers Campus, on doit setter un objet, pas un entier
            $user->setCampus($faker->randomElement($campuses));
            $user->setBio($faker->realText(180));              // borné pour éviter un pavé
            $user->addInteret($faker->randomElement($interetsAll));
            $user->setPromo($faker->randomElement($promoAll));
            $manager->persist($user);
            $usersAll[] = $user;
        }

        // --- Sorties ---
        for ($i = 0; $i < 10; $i++) {
            $sortie = new Sortie();
            $sortie->setNom($faker->word());

            $dateDebut = $faker->dateTimeBetween('-30 days', '+15 days');
            $dateLimite = (clone $dateDebut)->modify('-3 days');

            $sortie->setDateHeureDebut(\DateTimeImmutable::createFromMutable($dateDebut));
            $sortie->setDuree($faker->numberBetween(30, 180));
            $sortie->setDateLimiteInscription(\DateTimeImmutable::createFromMutable($dateLimite));
            $sortie->setNbInscriptionMax($faker->numberBetween(5, 20));
            // Vérifie le nom exact du setter: NbInscriptionMin vs NbInscriptionmin
            if (method_exists($sortie, 'setNbInscriptionMin')) {
                $sortie->setNbInscriptionMin($faker->numberBetween(1, 4));
            } else {
                $sortie->setNbInscriptionmin($faker->numberBetween(1, 4));
            }
            $sortie->setNbInscrits($faker->numberBetween(1, 10));
            $sortie->setInfos($faker->realText(200));
            $sortie->setEtat($faker->randomElement(Etat::cases()));
            $sortie->setCampus($faker->randomElement($campuses));

            // Selon ton modèle, c'est peut-être setInteret() (singulier) ou addInteret()
            if (method_exists($sortie, 'setInterets')) {
                $sortie->setInterets($faker->randomElement($interetsAll));
            } elseif (method_exists($sortie, 'setInteret')) {
                $sortie->setInteret($faker->randomElement($interetsAll));
            }

            $organisateur = $faker->randomElement($usersAll);
            $sortie->setOrganisateur($organisateur);

            // éviter d’avoir le même en participant
            $participant = $faker->randomElement(array_filter($usersAll, fn ($u) => $u !== $organisateur));
            $sortie->addParticipant($participant);

            $manager->persist($sortie);
        }

        $manager->flush();
    }

}
