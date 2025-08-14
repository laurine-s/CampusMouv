<?php

namespace App\Controller;
use App\Enum\Role;
use App\Form\ChangePasswordType;
use App\Form\UserProfilType;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

final class UserController extends AbstractController
{
    #[Route('/profil', name: 'profil', methods: ['GET', 'POST'])]
    #[IsGranted(Role::PARTICIPANT->value)]
    public function profil(Request $request, EntityManagerInterface $em): Response
    {
        $user = $this->getUser();
        $form = $this->createForm(UserProfilType::class, $user);

        $form->handleRequest($request);

        if ($form->isSubmitted() && $form->isValid()) {


            $em->persist($user);
            $em->flush();
            $this->addFlash('success', "Profil mis à jour avec succès");
            return $this->redirectToRoute('profil');
        }


        return $this->render('user/profil.html.twig', [
            // 'user' => $user,
            'form' => $form->createView(),
        ]);


    }

    #[Route('/profil/password', name: 'password')]
    public function changePassword(Request $request, UserPasswordHasherInterface $passwordHasher, EntityManagerInterface $em): Response {
        // On récupère l'utilisateur connecté
        $user = $this->getUser();

        if (!$user) {
            throw $this->createAccessDeniedException('Vous devez être connecté pour modifier votre mot de passe.');
        }

        // Création du formulaire
        $form = $this->createForm(ChangePasswordType::class, $user);
        $form->handleRequest($request);

        if ($form->isSubmitted() && $form->isValid()) {
            // On récupère le nouveau mot de passe (champ "plainPassword" non mappé)
            $newPassword = $form->get('plainPassword')->getData();

            // On le hash et on l'enregistre
            $hashedPassword = $passwordHasher->hashPassword($user, $newPassword);
            $user->setPassword($hashedPassword);

            $em->flush();

            $this->addFlash('success', 'Votre mot de passe a bien été modifié.');

            return $this->redirectToRoute('profil'); // Redirection vers la page profil (à adapter)
        }

        return $this->render('user/changePassword.html.twig', [
            'form' => $form->createView(),
        ]);
    }
}
