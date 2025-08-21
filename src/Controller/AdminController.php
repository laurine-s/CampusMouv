<?php

namespace App\Controller;

use App\Entity\Campus;
use App\Entity\Sortie;
use App\Entity\User;
use App\Enum\Role;
use App\Form\CampusType;
use App\Form\UserRegistrationAdminType;
use App\Form\ImportUserType;
use App\Service\AdminService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Form\Extension\Core\Type\FileType;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/admin', name: 'admin_')]
final class AdminController extends AbstractController
{

    #[Route(('/'), name: 'dashboard', methods: ['GET'])]
    #[IsGranted(Role::ADMIN->value)]
    public function dashboard(): Response
    {
        return $this->render('admin/dashboard.html.twig');
    }


    // // Fonctions concernant la gestion des utilisateurs
    #[Route('/register', name: 'register')]
    #[IsGranted(Role::ADMIN->value)]
    public function register(Request $request, UserPasswordHasherInterface $userPasswordHasher, EntityManagerInterface $entityManager): Response
    {
        $user = new User();
        $form = $this->createForm(UserRegistrationAdminType::class, $user);
        $form->handleRequest($request);

        if ($form->isSubmitted() && $form->isValid()) {
            /** @var string $plainPassword */
            $plainPassword = $form->get('plainPassword')->getData();

            $user->setPassword($userPasswordHasher->hashPassword($user, $plainPassword));

            $entityManager->persist($user);
            $entityManager->flush();

            $this->addFlash('success', sprintf('Import réussi : 1 utilisateur créé.'));

            return $this->redirectToRoute('admin_dashboard'); // à changer par la vue admin
        }

        return $this->render('admin/user_register_admin.html.twig', [
            'registrationForm' => $form,
        ]);
    }

    #[Route('/import', name: 'import', methods: ['GET', 'POST'])]
    #[IsGranted(Role::ADMIN->value)]
    public function importUserCsv(Request $request, AdminService $adminUserService): Response
    {
        // Création et gestion du formulaire d’upload CSV
        $form = $this->createForm(ImportUserType::class);
        $form->handleRequest($request);
        $result = null;

        if ($form->isSubmitted()) {
            if (!$form->isValid()) {
                // Vérifie la validité du formulaire
                $this->addFlash('danger', 'Le fichier fourni est invalide.');
                return $this->redirectToRoute('admin_import');
            }

            // Récupère le fichier CSV
            $csv = $form->get('csvFile')->getData();
            if (!$csv) {
                $this->addFlash('danger', 'Aucun fichier reçu.');
                return $this->redirectToRoute('admin_import');
            }

            // Vérifie que l’extension est bien .csv
            if (strtolower($csv->getClientOriginalExtension() ?? '') !== 'csv') {
                $this->addFlash('danger', 'Le fichier doit avoir l’extension .csv.');
                return $this->redirectToRoute('admin_import');
            }

            // Appelle le service d’import (mode strict activé)
            $result = $adminUserService->importFromCsv($csv->getPathname(), strict: true);

            // Si erreurs : affichage des messages et retour sur la page d’import
            if (!empty($result['errors'])) {
                foreach ($result['errors'] as $e) {
                    $this->addFlash('danger', $e);
                }
                return $this->redirectToRoute('admin_import');
            }

            // Si succès : affiche un message avec le nombre d’utilisateurs créés
            $count = (int)($result['success'] ?? 0);
            if ($count > 0) {
                $this->addFlash('success', sprintf('Import réussi : %d utilisateur(s) créé(s).', $count));
            }

            // Redirection vers le tableau de bord admin
            return $this->redirectToRoute('admin_dashboard');
        }

        // Si première visite (GET) → affiche la vue avec le formulaire
        return $this->render('admin/user_import_admin.html.twig', [
            'form' => $form->createView(),
        ]);
    }

    #[Route('/users', name: 'list_users')]
    #[IsGranted(Role::ADMIN->value)]
    public function listUsers(AdminService $adminService): Response
    {
        $users = $adminService->getAllUsers();
        return $this->render('admin/users.html.twig', ['users' => $users]);
    }

    #[Route('/users/{id}/desactivate', name: 'desactivate_user', methods: ['GET'])]
    #[IsGranted(Role::ADMIN->value)]
    public function desactivateUser(User $user, AdminService $adminService): Response
    {
        $adminService->desactivateUser($user);
        return $this->redirectToRoute('admin_list_users');
    }

    #[Route('/users/{id}/delete', name: 'delete_user', methods: ['GET'])]
    #[IsGranted(Role::ADMIN->value)]
    public function deleteUser(User $user, AdminService $adminService): Response
    {
        $adminService->deleteUser($user);
        return $this->redirectToRoute('admin_list_users');
    }

    // Fonctions concernant la gestion des sorties
    #[Route('/sorties', name: 'list_sorties')]
    #[IsGranted(Role::ADMIN->value)]
    public function listSorties(AdminService $adminService): Response
    {
        $sorties = $adminService->findEventsOrderedByNom();
        return $this->render('admin/sorties.html.twig', ['sorties' => $sorties]);
    }

    #[Route('/sorties/{id}/cancel', name: 'cancel_event', methods: ['GET'])]
    #[IsGranted(Role::ADMIN->value)]
    public function cancelEvent(Sortie $sortie, AdminService $adminService): Response
    {
        $adminService->cancelEvent($sortie);
        return $this->redirectToRoute('admin_list_sorties');
    }

    #[Route('/sorties/{id}/delete', name: 'delete_event', methods: ['GET'])]
    #[IsGranted(Role::ADMIN->value)]
    public function deleteEvent(Sortie $sortie, AdminService $adminService): Response
    {
        $adminService->deleteEvent($sortie);
        return $this->redirectToRoute('admin_list_sorties');
    }

    // Fonctions concernant la gestion des campus
    #[Route('/campus', name: 'list_campus')]
    #[IsGranted(Role::ADMIN->value)]
    public function listCampus(AdminService $adminService): Response
    {
        $campus = $adminService->findCampusOrderedByNom();
        return $this->render('admin/campus.html.twig', ['campus' => $campus]);
    }

    // Suppression pas encore opérationnelle, il faut gérer côté vue l'affichage quand un campus est supprimé

//    #[Route('/campus/{id}/delete', name: 'delete_campus', methods: ['GET'])]
//    public function deleteCampus(Campus $campus, AdminService $adminService): Response
//    {
//        $adminService->deleteCampus($campus);
//        return $this->redirectToRoute('admin_list_campus');
//    }
    #[Route('/register/campus', name: 'register_campus')]
    #[IsGranted(Role::ADMIN->value)]
    public function registerCampus(Request $request, EntityManagerInterface $entityManager): Response
    {
        $campus = new Campus();
        $form = $this->createForm(CampusType::class, $campus);
        $form->handleRequest($request);

        if ($form->isSubmitted() && $form->isValid()) {


            $entityManager->persist($campus);
            $entityManager->flush();

            $this->addFlash('success', ('Import réussi : 1 campus créé.'));

            return $this->redirectToRoute('admin_list_campus'); // à changer par la vue admin
        }

        return $this->render('admin/campus_register_admin.html.twig', [
            'campusType' => $form->createView(),
        ]);
    }
}
