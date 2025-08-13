<?php

namespace App\Twig;

use App\Repository\CampusRepository;
use Twig\Extension\AbstractExtension;
use Twig\Extension\GlobalsInterface;

class CampusExtension extends AbstractExtension implements GlobalsInterface
{
    public function __construct(
        private CampusRepository $campusRepository
    ) {}

    public function getGlobals(): array
    {
        return [
            'campusList' => $this->campusRepository->findAll()
        ];
    }
}