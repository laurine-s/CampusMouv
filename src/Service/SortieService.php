<?php

namespace App\Service;

use App\Entity\Sortie;
use App\Entity\User;
use App\Enum\Etat;
use App\Repository\SortieRepository;
use Doctrine\ORM\EntityManagerInterface;

class SortieService
{


    public function __construct(private SortieRepository $sortieRepository, private EntityManagerInterface $entityManager,)
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
        $sortie->setEtat(Etat::from('annulee'));
        $this->entityManager->flush();
    }


}
