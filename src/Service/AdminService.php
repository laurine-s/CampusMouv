<?php

namespace App\Service;

use App\Entity\Sortie;
use App\Entity\User;
use App\Enum\Etat;
use App\Repository\CampusRepository;
use App\Repository\SortieRepository;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;

class AdminService
{
    public function __construct(
        private UserRepository         $userRepository,
        private EntityManagerInterface $entityManager,
        private CampusRepository       $campusRepository,
        private SortieRepository       $sortiesRepository
    )
    {
    }

    // Fonctions concernant la gestion des utilisateurs
    public function importFromCsv(string $csvPath, bool $strict = true): array
    {
        // vérifie le fichier envoyé
        if (!is_readable($csvPath)) {
            return ['success' => 0, 'errors' => ["Fichier introuvable ou illisible : $csvPath"]];
        }

        $handle = fopen($csvPath, 'r');
        if ($handle === false) {
            return ['success' => 0, 'errors' => ["Impossible d’ouvrir le fichier : $csvPath"]];
        }

        // récupère les noms de campus (pour être valide, le CSV doit contenir uniquement des campus connus en DB
        $campusIndex = [];
        foreach ($this->campusRepository->findAll() as $campus) {
            $campusIndex[mb_strtolower(trim($campus->getNom()))] = $campus;
        }

        // index les lignes pour renvoyer les bons messages d'erreurs
        $lineNo = 1;
        $errors = [];
        $rows = [];
        $seenEmails = [];

        // Lecture du fichier CSV ligne par ligne
        // - fgetcsv($handle) lit une ligne et la transforme en tableau
        // - $lineNo++ permet de suivre le numéro de ligne (utile pour les messages d’erreur)
        // - array_map('trim', $data) supprime les espaces superflus autour de chaque valeur
        while (($data = fgetcsv($handle)) !== false) {
            $lineNo++;
            $data = array_map('trim', $data);

            // vérif. nb de colonnes dans le CSV
            if (count($data) < 5) {
                $errors[] = "Ligne $lineNo : le fichier doit contenir 5 colonnes (email, prénom, nom, mot de passe, campus).";
                continue;
            }

            [$email, $prenom, $nom, $password, $campusName] = $data;

            // vérifications
            if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
                $errors[] = "Ligne $lineNo : email invalide ($email).";
                continue;
            }

            if (!str_ends_with(mb_strtolower($email), '@campus-eni.fr')) {
                $errors[] = "Ligne $lineNo : l'adresse email doit se terminer par @campus-eni.fr ($email).";
                continue;
            }

            $emailKey = mb_strtolower($email);
            if (isset($seenEmails[$emailKey])) {
                $errors[] = "Ligne $lineNo : email dupliqué dans le fichier ($email).";
                continue;
            }
            $seenEmails[$emailKey] = true;

            if ($this->userRepository->findOneBy(['email' => $email])) {
                $errors[] = "Ligne $lineNo : utilisateur déjà existant ($email).";
                continue;
            }

            $campusKey = mb_strtolower(trim($campusName));
            if (!isset($campusIndex[$campusKey])) {
                $errors[] = "Ligne $lineNo : campus inconnu ($campusName).";
                continue;
            }

            // Si toutes les vérifications sont passées avec succès,
            // on ajoute la ligne courante dans le tableau $rows.
            // Chaque entrée contient les infos nécessaires à la création d'un utilisateur :
            // email, prénom, nom, mot de passe en clair (sera hashé plus tard), et campus associé.
            $rows[] = [
                'email' => $email,
                'prenom' => $prenom,
                'nom' => $nom,
                'password' => $password,
                'campus' => $campusIndex[$campusKey],
            ];
        }

        fclose($handle);

        // renvoie les erreurs
        if ($strict && $errors) {
            return ['success' => 0, 'errors' => $errors];
        }

        $created = 0;
        foreach ($rows as $r) {
            $user = (new User())
                ->setEmail($r['email'])
                ->setPrenom($r['prenom'])
                ->setNom($r['nom'])
                ->setPassword(password_hash($r['password'], PASSWORD_DEFAULT))
                ->setCampus($r['campus'])
                ->setRoles(['ROLE_USER']);

            $this->entityManager->persist($user);
            $created++;
        }

        // pousse en DB
        $this->entityManager->flush();

        return ['success' => $created, 'errors' => $errors];
    }

    public function getAllUsers(): array
    {
        return $this->userRepository->findAllOrderedByNom();
    }

    public function desactivateUser(User $user): void
    {
        $user->setIsActive(!$user->isActive());
        $this->entityManager->flush();
    }

    public function deleteUser(User $user): void
    {
        $this->entityManager->remove($user);
        $this->entityManager->flush();
    }


    // Fonctions concernant la gestion des sorties

    public function findEventsOrderedByNom(): array
    {
        return $this->sortiesRepository->findEventsOrderedByNom();
    }

    public function cancelEvent(Sortie $sortie): void
    {
        $sortie->setEtat(Etat::from('annulee'));
        $this->entityManager->flush();
    }

    public function deleteEvent(Sortie $sortie): void
    {
        $this->entityManager->remove($sortie);
        $this->entityManager->flush();
    }

    // Fonctions concernant la gestion des campus

    public function findCampusOrderedByNom(): array
    {
        return $this->campusRepository->findCampusOrderedByNom();
    }

}
