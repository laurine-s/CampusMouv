<?php

namespace App\Enum;

enum Etat: string
{
    case CREEE = 'creee';
    case OUVERTE = 'ouverte';
    case CLOTUREE = 'cloturee';
    case ACTIVITE_EN_COURS = 'activite_en_cours';
    case PASSEE = 'passee';
    case ANNULEE = 'annulee';

    public function getLabel(): string
    {
        return match($this) {
            self::CREEE => 'Créée',
            self::OUVERTE => 'Ouverte',
            self::CLOTUREE => 'Clôturée',
            self::ACTIVITE_EN_COURS => 'Activité en cours',
            self::PASSEE => 'Passée',
            self::ANNULEE => 'Annulée',
        };
    }

}