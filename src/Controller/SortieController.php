<?php

namespace App\Controller;

use App\Entity\Campus;
use App\Entity\Lieu;
use App\Entity\Sortie;
use App\Entity\User;
use App\Enum\Role;
use App\Form\LieuType;
use App\Form\SortieFilterType;
use App\Form\SortieType;
use App\Repository\CampusRepository;
use App\Repository\LieuRepository;
use App\Repository\SortieRepository;
use App\Repository\UserRepository;
use App\Service\CloudinaryService;
use App\Service\SortieInscriptionService;
use App\Service\SortieService;
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
    #[Route('/{chemin}', name: 'home', defaults: ['chemin' => ''], methods: ['GET', 'POST'])]
    public function home(Request $request, SortieService $sortieService, SortieRepository $sortieRepository, string $chemin): Response
    {
        $user = $this->getUser();
        $form = $this->createForm(SortieFilterType::class);
        $form->handleRequest($request);

        $allSorties = $sortieRepository->findAll();

        if($form->isSubmitted() && $form->isValid()){

            // Récupération des filtres
            $campus = $form->get('campus')->getData();
            $isParticipant = $form->get('isParticipant')->getData();
            $isOrganisateur = $form->get('isOrganisateur')->getData();

            $filters = [
                'campus' => $campus,
                'isParticipant' => $isParticipant,
                'isOrganisateur' => $isOrganisateur,
            ];

            $allSorties = $sortieService->filterSorties($filters, $user);
        }elseif ($chemin === 'mes_sorties'){

            $filters = [
                'campus' => null,
                'isParticipant' => true,
                'isOrganisateur' => true,
            ];

            $allSorties = $sortieService->filterSorties($filters, $user);
        }


        return $this->render('sortie/sorties.html.twig', [
            'allSorties' => $allSorties,
            'form' => $form->createView(),
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
        int $id, SortieRepository $sortieRepository, EntityManagerInterface $em, SortieInscriptionService $policy, SortieService $sortieService): Response
    {

        $user = $this->getUser();
        if (!$user) {
            $this->addFlash('warning', 'Connectez-vous pour vous inscrire.');
            return $this->redirectToRoute('app_login');
        }


        $sortie = $sortieService->getSortieListeParticipants($id);

        if (!$sortie) {
            $this->addFlash('danger', 'Sortie introuvable.');
            return $this->redirectToRoute('sorties_home');
        }


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
            'deja_inscrit'   => 'Vous êtes déjà inscrit à cette sortie.',
            'pas_ouverte'    => 'Cette sortie n’est pas ouverte aux inscriptions.',
            'delais_depasse' => 'La date limite d’inscription est dépassée.',
            'non_inscrit'    => 'Vous n’êtes pas inscrit à cette sortie.',
            'complet'        => 'Cette sortie est complète.',
            'deja_debute'    => 'Cette sortie a déjà débuté',
            default          => 'Action non autorisée.',
        };
    }


    /**
     * @throws ApiError
     */
    #[Route('/create', name: 'create', methods: ['GET', 'POST'])]
    public function create(Request $request, EntityManagerInterface $em, LieuRepository $lieuRepository, UserRepository $userRepository, CloudinaryService $cloudinaryService, CampusRepository $campusRepository): Response
    {
        $sortie = new Sortie();
        $form = $this->createForm(SortieType::class, $sortie);
        $lieu = new Lieu();
        $formLieu = $this->createForm(LieuType::class, $lieu);
        $allLieux = $lieuRepository->findAll();
        $allCampus = $campusRepository->findAll();
        $user = $userRepository->find($this->getUser());

        $form->handleRequest($request);

        if ($form->isSubmitted()) {
            $photoFile = $form->get('photo')->getData();
            $uploadPhoto = [];

            if ($photoFile) {
                $uploadPhoto = $cloudinaryService->uploadPhoto($photoFile);

                if (!$uploadPhoto['success']) {
                    $this->addFlash('danger', $uploadPhoto['error']);
                    return $this->redirectToRoute('sorties_create');
                }
            }

            if ($form->isValid() && $form->get('create')->isClicked()) {

                if ($photoFile) {
                    // on transmet l'url à la sortie
                    $sortie->setPhoto($uploadPhoto['url']);
                }

                $sortie->addParticipant($this->getUser());
                $sortie->setOrganisateur($this->getUser());
                $roles = $user->getRoles();

                if (!in_array('ROLE_ADMIN', $user->getRoles(), true)) {
                    $user->setRoles(['ROLE_ORGANISATEUR']);
                }


                // Enregistrer ou traiter les données
                $em->persist($sortie);
                $em->persist($user);
                $em->flush();

                // Message temporaire success
                $this->addFlash('success', 'Sortie créée !');

                //Rediriger
                return $this->redirectToRoute('sorties_home');

            }
        }

        return $this->render('sortie/create.html.twig', [
            'form' => $form->createView(),
            'allLieux' => $allLieux,
            'allCampus' => $allCampus,
        ]);
    }

    #[Route('/campus/{id}', name: 'parCampus', requirements: ['id' => '\d+'], methods: ['GET'])]
    public function parCampus(SortieRepository $sortieRepository, Campus $campus): Response
    {
        $allSorties = $sortieRepository->findBy(['campus' => $campus]);
        return $this->render('sortie/sorties.html.twig', [
            'allSorties' => $allSorties,
            'form' => null,
        ]);
    }

}
