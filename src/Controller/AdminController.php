<?php

namespace App\Controller;

use App\Entity\User;
use App\Enum\Role;
use App\Form\UserRegistrationAdminType;
use App\Form\ImportUserType;
use App\Service\AdminUserService;
use App\Service\DesactivateUserService;
use App\Service\ImportUserCSV;
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
    public function importUserCsv(Request $request, ImportUserCSV $importer): Response
    {
        $form = $this->createForm(ImportUserType::class);
        $form->handleRequest($request);
        $result = null;

        if ($form->isSubmitted()) {
            if (!$form->isValid()) {
                $this->addFlash('danger', 'Le fichier fourni est invalide (format/MIME/poids).');
                return $this->redirectToRoute('admin_import');
            }

            $csv = $form->get('csvFile')->getData();
            if (!$csv) {
                $this->addFlash('danger', 'Aucun fichier reçu.');
                return $this->redirectToRoute('admin_import');
            }

            // Extension stricte
            if (strtolower($csv->getClientOriginalExtension() ?? '') !== 'csv') {
                $this->addFlash('danger', 'Le fichier doit avoir l’extension .csv.');
                return $this->redirectToRoute('admin_import');
            }

            // Import (mode strict)
            $result = $importer->importFromCsv($csv->getPathname(), strict: true);

            if (!empty($result['errors'])) {
                foreach ($result['errors'] as $e) {
                    $this->addFlash('danger', $e);
                }
                return $this->redirectToRoute('admin_import');
            }

            $count = (int)($result['success'] ?? 0);
            if ($count > 0) {
                $this->addFlash('success', sprintf('Import réussi : %d utilisateur(s) créé(s).', $count));
            }

            return $this->redirectToRoute('admin_dashboard');
        }

        return $this->render('admin/user_import_admin.html.twig', [
            'form' => $form->createView(),
        ]);
    }

    #[Route('/users', name: 'list_users')]
    public function listUsers(AdminUserService $adminUserService): Response
    {
        $users = $adminUserService->getAllUsers();
        return $this->render('admin/users.html.twig', ['users' => $users]);
    }

    #[Route('/users/{id}/desactivate', name: 'desactivate', methods: ['GET'])]
    public function desactivateUser(User $user, AdminUserService $adminUserService): Response
    {
        $adminUserService->desactivateUser($user);
        return $this->redirectToRoute('admin_list_users');
    }

    #[Route('/users/{id}/delete', name: 'delete', methods: ['GET'])]
    public function deleteUser(User $user, AdminUserService $adminUserService): Response
    {
        $adminUserService->deleteUser($user);
        return $this->redirectToRoute('admin_list_users');
    }

}
