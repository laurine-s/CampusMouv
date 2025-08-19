<?php

namespace App\Service;

use App\Entity\User;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;

class AdminUserService
{
    public function __construct(
        private UserRepository         $userRepository,
        private EntityManagerInterface $entityManager
    )
    {
    }

    public function getAllUsers(): array
    {
        return $this->userRepository->findAll();
    }

    public function toggleUser(User $user): void
    {
        $user->setIsActive(!$user->isActive());
        $this->entityManager->flush();
    }
}