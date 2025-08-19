<?php

namespace App\Controller;

use App\Entity\Campus;
use App\Entity\Lieu;
use App\Entity\Sortie;
use App\Entity\User;
use App\Enum\Role;
use App\Form\LieuType;
use App\Form\SortieType;
use App\Repository\CampusRepository;
use App\Repository\LieuRepository;
use App\Repository\SortieRepository;
use App\Repository\UserRepository;
use App\Service\CloudinaryService;
use App\Service\SortieInscriptionService;
use Cloudinary\Api\Exception\ApiError;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;


#[Route('/sorties', name: 'sorties_')]
//#[IsGranted(Role::PARTICIPANT->value)]
final class SortieController extends AbstractController
{
    #[Route('/', name: 'home', methods: ['GET'])]
    public function home(SortieRepository $sortieRepository): Response
    {
        $allSorties = $sortieRepository->findAll();
        return $this->render('sortie/sorties.html.twig', [
            'allSorties' => $allSorties,
        ]);
    }

    #[Route('/{id}/detail', name: 'detail', requirements: ['id' => '\d+'], methods: ['GET'])]
    public function detail(int $id, SortieRepository $sortieRepository): Response
    {
        $sortieParId = $sortieRepository->sortieParId($id);
        return $this->render('sortie/detail.html.twig', [
            'sortie' => $sortieParId
        ]);
    }

    #[Route('/{id}/delete', name: 'delete', requirements: ['id' => '\d+'], methods: ['POST'])]
    public function delete(int $id, SortieRepository $sortieRepository, EntityManagerInterface $entityManager, Request $request): Response
    {
        $sortieParId = $sortieRepository->sortieParId($id);

        // Vérifier si l'entité existe
        if (!$sortieParId) {
            $this->addFlash('error', 'Sortie introuvable');
            return $this->redirectToRoute('sorties_home');
        }

        $organisateur = $sortieParId->getOrganisateur();

        // Vérifier si l'utilisateur est autorisé
        if ($organisateur !== $this->getUser()) {
            $this->addFlash('error', 'Vous n\'êtes pas autorisé à supprimer cette sortie');
            return $this->redirectToRoute('sorties_home');
        }

        // Suppression
        $entityManager->remove($sortieParId);
        $entityManager->flush();

        $this->addFlash('success', 'Sortie supprimée avec succès');
        return $this->redirectToRoute('sorties_home');
    }

    #[Route('/{id}/inscription', name: 'inscription', requirements: ['id' => '\d+'], methods: ['POST'])]
    public function inscription(
        int $id, SortieRepository $sortieRepository, EntityManagerInterface $em, SortieInscriptionService $policy): Response
    {
        $user = $this->getUser();
        if (!$user) {
            $this->addFlash('warning', 'Connectez-vous pour vous inscrire.');
            return $this->redirectToRoute('app_login');
        }

        $sortie = $sortieRepository->find($id);
        if (!$sortie) {
            $this->addFlash('danger', 'Sortie introuvable.');
            return $this->redirectToRoute('sorties_home');
        }

        // [$ok, $conditions] = (si deja_inscrit, pas_ouverte, delais_depasse, complet, ok)
        [$ok, $conditions] = $policy->inscription($sortie, $user);
        if (!$ok) {
            $this->addFlash('warning', $this->mapReasonToMessage($conditions));
            return $this->redirectToRoute('sorties_detail', ['id' => $id]);
        }

        // OK : inscrire
        $sortie->addParticipant($user);

        //nbInscrits synchro
        $sortie->setNbInscrits($sortie->getParticipants()->count());

        $em->flush();

        $this->addFlash('success', 'Vous êtes bien inscrit !');
        return $this->redirectToRoute('sorties_detail', ['id' => $id]);
    }

    #[Route('/{id}/desinscription', name: 'desinscription', requirements: ['id' => '\d+'], methods: ['POST'])]
    public function desinscription(int $id, SortieRepository $sortieRepository, EntityManagerInterface $em, SortieInscriptionService $policy): Response
    {
        $user = $this->getUser();
        if (!$user) {
            $this->addFlash('warning', 'Connectez-vous pour vous désinscrire.');
            return $this->redirectToRoute('app_login');
        }

        $sortie = $sortieRepository->find($id);
        if (!$sortie) {
            $this->addFlash('danger', 'Sortie introuvable.');
            return $this->redirectToRoute('sorties_home');
        }

        // [$ok, $conditions] = (non_inscrit, ok)
        [$ok, $conditions] = $policy->desinscription($sortie, $user);
        if (!$ok) {
            $this->addFlash('warning', $this->mapReasonToMessage($conditions));
            return $this->redirectToRoute('sorties_detail', ['id' => $id]);
        }

        // OK désinscrire
        $sortie->removeParticipant($user);

        // garder nbInscrits synchro
        $sortie->setNbInscrits($sortie->getParticipants()->count());

        $em->flush();

        $this->addFlash('success', 'Vous êtes désinscrit.');
        return $this->redirectToRoute('sorties_detail', ['id' => $id]);
    }

    private function mapReasonToMessage(string $conditions): string
    {
        return match ($conditions) {
            'deja_inscrit' => 'Vous êtes déjà inscrit à cette sortie.',
            'pas_ouverte' => 'Cette sortie n’est pas ouverte aux inscriptions.',
            'delais_depasse' => 'La date limite d’inscription est dépassée.',
            'non_inscrit' => 'Vous n’êtes pas inscrit à cette sortie.', // ← aligné avec le service
            'complet' => 'Cette sortie est complète.',
            default => 'Action non autorisée.',
        };
    }


    /**
     * @throws ApiError
     */
//    #[Route('/create', name: 'create', methods: ['GET', 'POST'])]
//    public function create(Request $request, EntityManagerInterface $em, LieuRepository $lieuRepository, UserRepository $userRepository, CloudinaryService $cloudinaryService, CampusRepository $campusRepository): Response
//    {
//        $sortie = new Sortie();
//        $formSortie = $this->createForm(SortieType::class, $sortie);
//        $lieu = new Lieu();
//        $formLieu = $this->createForm(LieuType::class, $lieu);
//        $lieux = $lieuRepository->findAll();
//        $allCampus = $campusRepository->findAll();
//        $user = $userRepository->find($this->getUser());
//
//        $lieuxArray = [];
//        foreach ($lieux as $lieu) {
//            $lieuxArray[] = [
//                'id' => $lieu->getId(),
//                'nom' => $lieu->getNom(),
//                'campus' => [
//                    'id' => $lieu->getCampus() ? $lieu->getCampus()->getId() : null,
//                    'nom' => $lieu->getCampus() ? $lieu->getCampus()->getNom() : null
//                ]
//            ];
//        }
//
//        $formSortie->handleRequest($request);
//
//        if ($formSortie->isSubmitted()) {
//            $photoFile = $formSortie->get('photo')->getData();
//            $uploadPhoto = [];
//
//            if ($photoFile) {
//                $uploadPhoto = $cloudinaryService->uploadPhoto($photoFile);
//
//                if (!$uploadPhoto['success']) {
//                    $this->addFlash('danger', $uploadPhoto['error']);
//                    return $this->redirectToRoute('sorties_create');
//                }
//            }
//
//            if ($formSortie->isValid() && $formSortie->get('create')->isClicked()) {
//                // on transmet l'url à la sortie
//                dump($uploadPhoto);
//                $sortie->setPhoto($uploadPhoto['url']);
//
//                $sortie->addParticipant($this->getUser());
//                $sortie->setOrganisateur($this->getUser());
//                $roles = $user->getRoles();
//
//                if (!in_array('ROLE_ADMIN', $user->getRoles(), true)) {
//                    $user->setRoles(['ROLE_ORGANISATEUR']);
//                }
//
//
//                // Enregistrer ou traiter les données
//                $em->persist($sortie);
//                $em->persist($user);
//                $em->flush();
//
//                // Message temporaire success
//                $this->addFlash('success', 'Sortie créée !');
//
//                //Rediriger
//                return $this->redirectToRoute('sorties_home');
//
//            }
//        }
//
//        return $this->render('sortie/create.html.twig', [
//            'formSortie' => $formSortie->createView(),
//            'formLieu' => $formLieu->createView(),
//            'lieux' => $lieuxArray,
//            'allCampus' => $allCampus,
//        ]);
//    }
//
//    #[Route('/create/Lieu', name: 'createLieu', methods: ['GET', 'POST'])]
//    public function creationLieu(Request $request, EntityManagerInterface $em, LieuRepository $lieuRepository): Response
//    {
//        $lieu = new Lieu();
//        $form = $this->createForm(LieuType::class, $lieu);
//        $form->handleRequest($request);
//        if ($form->isSubmitted()) {
//            dump($lieu);
//            $em->persist($lieu);
//            $em->flush();
//
//        }
//        return $this->render('sortie/create.html.twig');
//
//
//    }

    #[Route('/create', name: 'create', methods: ['GET', 'POST'])]
    public function create(Request $request, EntityManagerInterface $em, LieuRepository $lieuRepository, UserRepository $userRepository, CloudinaryService $cloudinaryService, CampusRepository $campusRepository): Response
    {
        $sortie = new Sortie();
        $formSortie = $this->createForm(SortieType::class, $sortie);

        $lieu = new Lieu();
        $formLieu = $this->createForm(LieuType::class, $lieu);
        $lieuIdToSelect = $request->query->get('lieu_id');

        $lieux = $lieuRepository->findAll();
        $allCampus = $campusRepository->findAll();
        $user = $userRepository->find($this->getUser());

        // Préparer les données pour JavaScript
        $lieuxArray = [];
        foreach ($lieux as $lieuItem) {
            $lieuxArray[] = [
                'id' => $lieuItem->getId(),
                'nom' => $lieuItem->getNom(),
                'rue' => $lieuItem->getRue(),
                'ville' => $lieuItem->getVille() ? $lieuItem->getVille()->getNom() : '',
                'codePostal' => $lieuItem->getVille() ? $lieuItem->getVille()->getCp() : '',
                'campus' => [
                    'id' => $lieuItem->getCampus() ? $lieuItem->getCampus()->getId() : null,
                    'nom' => $lieuItem->getCampus() ? $lieuItem->getCampus()->getNom() : null
                ]
            ];
        }

        // Gérer le formulaire lieu
        $formLieu->handleRequest($request);
        if ($formLieu->isSubmitted() && $formLieu->isValid()) {
            if ($formLieu->get('createLieu')->isClicked()) {
                $em->persist($lieu);
                $em->flush();

                $this->addFlash('success', 'Lieu créé avec succès !');
                // Rediriger avec l'ID du lieu créé
                return $this->redirectToRoute('sorties_create', ['lieu_id' => $lieu->getId()]);
            }
        }

        // Gérer le formulaire sortie
        $formSortie->handleRequest($request);
        if ($formSortie->isSubmitted() && $formSortie->isValid()) {
            if ($formSortie->get('createSortie')->isClicked()) {
                // Votre logique existante pour la sortie
                $photoFile = $formSortie->get('photo')->getData();
                $uploadPhoto = [];

                if ($photoFile) {
                    $uploadPhoto = $cloudinaryService->uploadPhoto($photoFile);
                    if (!$uploadPhoto['success']) {
                        $this->addFlash('danger', $uploadPhoto['error']);
                        return $this->redirectToRoute('sorties_create');
                    }
                    $sortie->setPhoto($uploadPhoto['url']);
                }

                $sortie->addParticipant($this->getUser());
                $sortie->setOrganisateur($this->getUser());

                if (!in_array('ROLE_ADMIN', $user->getRoles(), true)) {
                    $user->setRoles(['ROLE_ORGANISATEUR']);
                }

                $em->persist($sortie);
                $em->persist($user);
                $em->flush();

                $this->addFlash('success', 'Sortie créée !');
                return $this->redirectToRoute('sorties_home');
            }
        }

        return $this->render('sortie/create.html.twig', [
            'formSortie' => $formSortie->createView(),
            'formLieu' => $formLieu->createView(),
            'lieux' => $lieuxArray,
            'allCampus' => $allCampus,
            'lieuIdToSelect' => $lieuIdToSelect, // Nouveau paramètre
        ]);
    }

    #[Route('/campus/{id}', name: 'parCampus', requirements: ['id' => '\d+'], methods: ['GET'])]
    public function parCampus(SortieRepository $sortieRepository, Campus $campus): Response
    {
        $allSorties = $sortieRepository->findBy(['campus' => $campus]);
        return $this->render('sortie/sorties.html.twig', [
            'allSorties' => $allSorties,
        ]);
    }

}
