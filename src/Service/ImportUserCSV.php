<?php

namespace App\Service;

use App\Entity\User;
use App\Repository\CampusRepository;
use Doctrine\ORM\EntityManagerInterface;

class ImportUserCSV
{
    public function __construct(
        private EntityManagerInterface $entityManager, private CampusRepository $campusRepository)
    {
    }

    public function importFromCsv(string $csvPath, bool $strict = true): array
    {
        if (!is_readable($csvPath)) {
            return ['success' => 0, 'errors' => ["Fichier introuvable ou illisible : $csvPath"]];
        }

        $handle = fopen($csvPath, 'r');
        if ($handle === false) {
            return ['success' => 0, 'errors' => ["Impossible d’ouvrir le fichier : $csvPath"]];
        }

        // Index des campus existants (clé = nom normalisé)
        $campusIndex = [];
        foreach ($this->campusRepository->findAll() as $c) {
            $campusIndex[mb_strtolower(trim($c->getNom()))] = $c;
        }

        $lineNo  = 1;
        $errors  = [];
        $rows    = [];                 // lignes prêtes à être insérées si aucune erreur
        $seenEmails = [];              // doublons internes au fichier

        while (($data = fgetcsv($handle)) !== false) {
            $lineNo++;
            $data = array_map('trim', $data);

            if (count($data) < 5) {
                $errors[] = "Attention : le fichier doit contenir cinq colonnes (email, prénom, nom, password, campus)";
                continue;
            }

            [$email, $prenom, $nom, $password, $campusName] = $data;

            // Email valide + domaine imposé
            if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
                $errors[] = "Ligne $lineNo : email invalide ($email).";
                continue;
            }
            if (!str_ends_with(mb_strtolower($email), '@campus-eni.fr')) {
                $errors[] = "Ligne $lineNo : l'adresse mail doit finir par @campus-eni.fr ($email).";
                continue;
            }

            // Doublon dans le fichier
            $emailKey = mb_strtolower($email);
            if (isset($seenEmails[$emailKey])) {
                $errors[] = "Ligne $lineNo : email dupliqué dans le fichier ($email).";
                continue;
            }
            $seenEmails[$emailKey] = true;

            // Doublon en base
            if ($this->entityManager->getRepository(User::class)->findOneBy(['email' => $email])) {
                $errors[] = "Ligne $lineNo : utilisateur déjà existant ($email).";
                continue;
            }

            // Campus (match insensible à la casse + trim)
            $campusKey = mb_strtolower(trim($campusName));
            if (!isset($campusIndex[$campusKey])) {
                $errors[] = "Ligne $lineNo : campus inconnu ($campusName).";
                continue;
            }

            // Stocke la ligne validée pour insertion ultérieure
            $rows[] = [
                'email'  => $email,
                'prenom' => $prenom,
                'nom'    => $nom,
                'password' => $password,
                'campus' => $campusIndex[$campusKey],
            ];
        }
        fclose($handle);

        // Mode strict : s'il y a une seule erreur, on n'insère rien.
        if ($strict && $errors) {
            return ['success' => 0, 'errors' => $errors];
        }

        // Insertion des lignes valides
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
        $this->entityManager->flush();

        return ['success' => $created, 'errors' => $errors];
    }
}