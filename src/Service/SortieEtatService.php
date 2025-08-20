<?php

namespace App\Service;

use App\Entity\Sortie;
use App\Enum\Etat;
use DateTime;
use Doctrine\ORM\EntityManagerInterface;

class SortieEtatService
{

    public function __construct(private EntityManagerInterface $entityManager)
    {
    }

    public function setEtatTemporel(Sortie $sortie): void
    {
        // Si la sortie est "CREEE" ou "ANNULEE", on ne touche à rien
        if (in_array($sortie->getEtat(), [Etat::CREEE, Etat::ANNULEE], true)) {
            return;
        }

        $maintenant = new DateTime();
        $dateCloture = $sortie->getDateLimiteInscription();
        $dateDebut = $sortie->getDateHeureDebut();
        $dureeSortie = $sortie->getDuree();
        $dateFin = (clone $dateDebut)->modify('+' . $dureeSortie . ' minutes');
        $nbInscrits = $sortie->getNbInscrits();
        $nbMaxInscrits = $sortie->getNbInscriptionMax();

        if ($maintenant >= $dateFin) {
            $sortie->setEtat(Etat::PASSEE);
        }
        elseif ($maintenant >= $dateDebut) {
            $sortie->setEtat(Etat::ACTIVITE_EN_COURS);
        }
        elseif ($nbInscrits === $nbMaxInscrits || $maintenant > $dateCloture) {
            $sortie->setEtat(Etat::CLOTUREE);
        }
        else {
            $sortie->setEtat(Etat::OUVERTE);
        }

    }

    public function miseAJourEtatSortie(Sortie $sortie): void
    {
        $this->setEtatTemporel($sortie);
        $this->entityManager->persist($sortie);
        $this->entityManager->flush();
    }

}