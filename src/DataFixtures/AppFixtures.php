<?php

namespace App\DataFixtures;

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
        $campuses = [];
        foreach (['Rennes', 'Nantes', 'Niort', 'Quimper'] as $name) {
            $c = (new Campus())->setNom($name);
            $em->persist($c);
            $campuses[$name] = $c; // on garde une référence par nom
        }

        // === 4) Intérêts ===
        $interestNames = [
            "Cinéma","Séries TV","Musique","Lecture","Voyage","Sport",
            "Fitness / Musculation","Course à pied / Jogging","Vélo",
            "Restaurants / Gastronomie","Bars / Sorties nocturnes",
            "Jeux vidéo","Jeux de société","Shopping / Mode","Cuisine",
            "Technologie / Informatique","Photographie","Nature / Randonnée",
            "Théâtre / Spectacles","Art / Musées"
        ];

        foreach ($interestNames as $name) {
            $it = (new Interets())->setNom($name);
            $em->persist($it);
        }

        // === 5) Promos ===
        $cursus = ['D2WM', 'CDA', 'EADL'];
        $annee  = [2025, 2024, 2023, 2022];

        foreach ($cursus as $c) {
            foreach ($annee as $a) {
                $promo = new Promo();
                $promo->setAnnee($a);
                $promo->setCursus($c);
                $promo->setNom($c . '-' . $a);
                $em->persist($promo);
            }
        }

        // === 6) Utilisateurs ===
        $domain = 'campus-eni.fr';

        // Admin
        $user = new User();
        $user->setNom('DUDU');
        $user->setPrenom('Florent');
        $user->setEmail('Florent.DUDU@' . $domain);
        $user->setPassword($this->passwordHasher->hashPassword($user, 'F.dudu2025'));
        $user->setRoles(['ROLE_ADMIN']);

        // si User::setCampus attend une entité Campus (cas le plus fréquent)
        $user->setCampus($campuses['Rennes']);
        // si au contraire c'est une chaîne, remplace par: $user->setCampus('Rennes');

        $em->persist($user);

        // Utilisateur simple
        $user = new User();
        $user->setNom('PAPA');
        $user->setPrenom('Alex');
        $user->setEmail('Alex.PAPA@' . $domain);
        $user->setPassword($this->passwordHasher->hashPassword($user, 'A.papa2025'));
        $user->setRoles(['ROLE_USER']);
        $user->setCampus($campuses['Rennes']); // idem remarque ci-dessus
        $em->persist($user);

        // Commit
        $em->flush();
    }
}
