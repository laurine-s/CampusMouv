<?php

namespace App\Enum;

enum Role: string
{
    case PARTICIPANT = 'ROLE_USER';      // Utilisateur de base (étudiant)
    case ORGANISATEUR = 'ROLE_ORGANISATEUR'; // Peut créer/gérer des événements
    case ADMIN = 'ROLE_ADMIN';           // Administrateur complet

    public function getLabel(): string
    {
        return match ($this) {
            self::PARTICIPANT => 'Participant',
            self::ORGANISATEUR => 'Organisateur',
            self::ADMIN => 'Administrateur',
        };
    }

    // Méthode pour obtenir tous les rôles disponibles
    public static function getChoices(): array
    {
        $choices = [];
        foreach (self::cases() as $role) {
            $choices[$role->getLabel()] = $role->value;
        }
        return $choices;
    }
}