<?php

namespace App\Service;

use App\Entity\Sortie;
use App\Entity\User;
use App\Enum\Etat;
use DateTime;
use Doctrine\ORM\EntityManagerInterface;

final class SortieInscriptionService
{


    public function __construct(private SortieEtatService $etatService, private EntityManagerInterface $entityManager)
    {
    }

    // Règles inscription:
    //- sortie OUVERTE
    // - date limite non dépassée
    // - user pas déjà inscrit
    // - complet
    /* @return array{0:bool,1:string} [$ok, $conditions]
     */
    public function inscription(Sortie $sortie, User $user): array
    {
        $this->etatService->miseAJourEtatSortie($sortie);

        if ($sortie->getParticipants()->contains($user)) {
            return [false, 'deja_inscrit'];
        }

        if ($sortie->getEtat() !== Etat::OUVERTE) {
            return [false, 'pas_ouverte'];
        }

//        $delais = $sortie->getDateLimiteInscription();
//        $now = new \DateTimeImmutable();
//        if ($delais instanceof \DateTimeInterface && $delais < $now) {
//            return [false, 'delais_depasse'];
//        }
//
//        $now = new \DateTimeImmutable();
//        $debut = $sortie->getDateHeureDebut();
//        if ($debut instanceof \DateTimeInterface && $debut <= $now) {
//            return [false, 'deja_debute'];
//        }
//
//
//        $max = $sortie->getNbInscriptionMax();
//        if ($max !== null) {
//            $participants = $sortie->getParticipants()->count();
//            if ($participants >= $max) {
//                return [false, 'complet'];
//            }
//        }

        return [true, 'ok'];
    }

    // Règle désinscription:
    // user doit être inscrit
    /* @return array{0:bool,1:string} */

    public function desinscription(Sortie $sortie, User $user): array
    {
        $this->etatService->miseAJourEtatSortie($sortie);

        $maintenant = new DateTime();
        $dateCloture = $sortie->getDateLimiteInscription();

        if ($sortie->getEtat() !== Etat::OUVERTE && $maintenant >= $dateCloture){
            return [false, 'desinscription_impossible'];
        }

        if (!$sortie->getParticipants()->contains($user)) {
            return [false, 'non_inscrit'];
        }
        return [true, 'ok'];
    }

//    public function checkEtatInscriptionDesinscription(Sortie $sortie): void
//    {
//        $nbInscrits = $sortie->getNbInscrits();
//        $nbMax = $sortie->getNbInscriptionMax();
//
//        if ($nbInscrits === $nbMax) {
//            $sortie->setEtat(Etat::CLOTUREE);
//        }
//
//        if ($nbInscrits < $nbMax) {
//            $sortie->setEtat(Etat::OUVERTE);
//        }
//
//    }

}
