<?php

namespace App\Service;

use App\Entity\Sortie;
use App\Entity\User;
use App\Repository\SortieRepository;

class SortieService
{

    public function __construct(private SortieRepository $sortieRepository)
    {
    }

    public function filterSorties(array $filters, User $user): array
    {
        return $this->sortieRepository->filterSorties($filters, $user);
    }

    public function getSortieListeParticipants(int $id): ?Sortie
    {
        return $this->sortieRepository->findDetailById($id);
    }



}
