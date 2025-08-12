<?php

namespace App\DataFixtures;

use App\Entity\Campus;
use App\Entity\Interets;
use App\Entity\Lieu;
use App\Entity\Sortie;
use Doctrine\Bundle\FixturesBundle\Fixture;
use Doctrine\Persistence\ObjectManager;

class AppFixtures extends Fixture
{
    public function load(ObjectManager $manager): void
    {
        $campus = new Campus();
        $campus->setNom('Rennes');
        $manager->persist($campus);

        $campus = new Campus();
        $campus->setNom('Nantes');
        $manager->persist($campus);

        $campus = new Campus();
        $campus->setNom('Niort');
        $manager->persist($campus);

        $campus = new Campus();
        $campus->setNom('Quimper');
        $manager->persist($campus);

        $faker = \Faker\Factory::create('fr_FR');
        for ($i = 0; $i < 10; $i++) {
            $interets = new Interets();
            $interets->setNom($faker->word());
            $manager->persist($interets);

            $lieu = new Lieu();
            $lieu->setNom($faker->word());


            $sortie = new Sortie();
            $sortie->setNom($faker->word());
            $date = $faker->dateTimeBetween('-30 days', '-1 days');
            $sortie->setDateHeureDebut(\DateTimeImmutable::createFromMutable($date));
            $sortie->setDuree($faker->numberBetween(30, 180));
            $sortie->setDateLimiteInscription(\DateTimeImmutable::createFromMutable($date));
            $sortie->setNbInscriptionMax($faker->numberBetween(1, 10));
            $sortie->setNbInscriptionmin($faker->numberBetween(1, 4));
            $sortie->setNbInscrits($faker->numberBetween(1, 10));
            $sortie->setInfos($faker->realText());
$sortie->setInterets($interets);
$sortie->setOrganisateur($idUser);
$sortie->addParticipant($idUser);

            $manager->persist($sortie);

        }
        $manager->flush();
    }
}
