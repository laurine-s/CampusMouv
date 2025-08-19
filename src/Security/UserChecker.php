<?php

namespace App\Security;


use App\Entity\User;
use Symfony\Component\Security\Core\User\UserInterface;
use Symfony\Component\Security\Core\User\UserCheckerInterface;
use Symfony\Component\Security\Core\Exception\CustomUserMessageAccountStatusException;

class UserChecker implements UserCheckerInterface
{
    public function checkPreAuth(UserInterface $user): void
    {
        if (!$user instanceof User) {
            return;
        }

        if (!$user->isActive()) {
            // Ce message sera affiché sur la page de login
            throw new CustomUserMessageAccountStatusException('Votre compte a été désactivé par un administrateur.');
        }
    }

    public function checkPostAuth(UserInterface $user): void
    {
    }
}