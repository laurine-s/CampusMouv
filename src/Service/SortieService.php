<?php

namespace App\Service;

use App\Entity\Sortie;
use App\Entity\User;
use App\Enum\Etat;
use App\Repository\SortieRepository;
use Doctrine\ORM\EntityManagerInterface;

class SortieService
{


    public function __construct(private SortieRepository $sortieRepository, private EntityManagerInterface $entityManager, private SortieEtatService $etatService)
    {
    }

    public function filterSorties(array $filters, User $user): array
    {
        return $this->sortieRepository->filterSorties($filters, $user);
    }

    public function getSortieListeParticipants(int $id): ?Sortie
    {
        return $this->sortieRepository->sortieParId($id);
    }

    public function cancelEvent(Sortie $sortie): void
    {
        $sortie->setEtat(Etat::ANNULEE);
        $this->entityManager->flush();
    }

    public function getSortiesAAfficher(): array
    {
        $allSorties = $this->sortieRepository->findAll();
        foreach ($allSorties as $sortie){
            $this->etatService->setEtatTemporel($sortie);
            $this->entityManager->persist($sortie);
        }

        $this->entityManager->flush();

        $sortiesAAfficher = $this->sortieRepository->findBy([
            'etat' => [Etat::OUVERTE, Etat::CLOTUREE, Etat::ACTIVITE_EN_COURS]
        ]);

        return $sortiesAAfficher;
    }


}
