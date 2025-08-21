<?php

namespace App\Controller;

use App\Entity\Campus;
use App\Entity\Lieu;
use App\Entity\Sortie;
use App\Entity\User;
use App\Entity\Ville;
use App\Enum\Etat;
use App\Enum\Role;
use App\Form\LieuType;
use App\Form\SortieEditType;
use App\Form\SortieFilterType;
use App\Form\SortieType;
use App\Message\ReminderEmailMessage;
use App\Repository\CampusRepository;
use App\Repository\LieuRepository;
use App\Repository\SortieRepository;
use App\Repository\UserRepository;
use App\Service\CloudinaryService;
use App\Service\SortieEtatService;
use App\Service\MailService;
use App\Service\SortieInscriptionService;
use App\Service\SortieService;
use Cloudinary\Api\Exception\ApiError;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Messenger\Stamp\DelayStamp;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;
use Symfony\Component\Messenger\MessageBusInterface;


#[Route('/sorties', name: 'sorties_')]
//#[IsGranted(Role::PARTICIPANT->value)]
final class SortieController extends AbstractController
{
    #[Route('/filtre/{chemin}', name: 'home', defaults: ['chemin' => ''], methods: ['GET', 'POST'])]
    public function home(Request $request, SortieService $sortieService, SortieRepository $sortieRepository, string $chemin): Response
    {
        $user = $this->getUser();

        // Valeurs par défaut pour le formulaire
        $formOptions = [];
        if ($chemin === 'mes_sorties') {
            $formOptions = [
                'isCreee' => true,
                'isAnnulee' => true,
                'isParticipant' => true,
                'isOrganisateur' => true,
            ];
        }

        $form = $this->createForm(SortieFilterType::class, null, $formOptions);

        $form->handleRequest($request);

        $allSorties = $sortieService->getSortiesAAfficher();

        if ($form->isSubmitted() && $form->isValid()) {

            // Récupération des filtres
            $campus = $form->get('campus')->getData();
            $isCreee = $form->get('isCreee')->getData();
            $isAnnulee = $form->get('isAnnulee')->getData();
            $isParticipant = $form->get('isParticipant')->getData();
            $isOrganisateur = $form->get('isOrganisateur')->getData();

            $filters = [
                'campus' => $campus,
                'isCreee' => $isCreee,
                'isAnnulee' => $isAnnulee,
                'isParticipant' => $isParticipant,
                'isOrganisateur' => $isOrganisateur,
            ];

            $allSorties = $sortieService->filterSorties($filters, $user);
        } elseif ($chemin === 'mes_sorties') {

            $filters = [
                'campus' => null,
                'isCreee' => true,
                'isAnnulee' => true,
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
        Sortie $sortie, EntityManagerInterface $em, SortieInscriptionService $inscriptionService, SortieEtatService $etatService, MailService $mailService, MessageBusInterface $bus): Response
    {

        $user = $this->getUser();
        if (!$user) {
            $this->addFlash('warning', 'Connectez-vous pour vous inscrire.');
            return $this->redirectToRoute('app_login');
        }

        //On obtient la liste des participants à la sortie
        //$listeParticipants = $sortieService->getSortieListeParticipants($id);
        $listeParticipants = $sortie->getParticipants();

        if (!$listeParticipants) {
            $this->addFlash('danger', 'Sortie introuvable.');
            return $this->redirectToRoute('sorties_home');
        }


        // [$ok, $conditions] = (si deja_inscrit, pas_ouverte, delais_depasse, complet, ok)
        [$ok, $conditions] = $inscriptionService->inscription($sortie, $user);
        if (!$ok) {
            $this->addFlash('warning', $this->mapReasonToMessage($conditions));
            return $this->redirectToRoute('sorties_detail', ['id' => $sortie->getId()]);
        }

        // OK : inscrire
        $sortie->addParticipant($user);

        //nbInscrits synchro
        $sortie->setNbInscrits($sortie->getParticipants()->count());

        $em->flush();

        $etatService->miseAJourEtatSortie($sortie);

        // Envoi du mail
        // Envoi du mail confirmation inscription

        $mailService->sendInscriptionMail($user->getEmail(), $sortie->getNom());

//        // calcule le délai jusqu’à (dateDébut - 48h)
//        $now = new \DateTimeImmutable('now', new \DateTimeZone('Europe/Paris'));
//        $target = $sortie->getDateHeureDebut()->sub(new \DateInterval('PT5M'));
//        $delayMs = max(0, $target->getTimestamp() - $now->getTimestamp()) * 1000;
//
//        $bus->dispatch(
//            new ReminderEmailMessage($sortie->getId(), $user->getId()),
//            [ new DelayStamp($delayMs) ]
//        );


        $this->addFlash('success', 'Vous êtes bien inscrit !');
        return $this->redirectToRoute('sorties_detail', ['id' => $sortie->getId()]);
        // Envoi du rappel mail 48h avant la sortie
    }

    #[Route('/{id}/desinscription', name: 'desinscription', requirements: ['id' => '\d+'], methods: ['POST'])]
    public function desinscription(Sortie $sortie, EntityManagerInterface $em, SortieInscriptionService $policy, MailService $mailService, SortieEtatService $etatService): Response
    {
        $user = $this->getUser();
        if (!$user) {
            $this->addFlash('warning', 'Connectez-vous pour vous désinscrire.');
            return $this->redirectToRoute('app_login');
        }

        if (!$sortie) {
            $this->addFlash('danger', 'Sortie introuvable.');
            return $this->redirectToRoute('sorties_home');
        }

        // [$ok, $conditions] = (non_inscrit, ok)
        [$ok, $conditions] = $policy->desinscription($sortie, $user);
        if (!$ok) {
            $this->addFlash('warning', $this->mapReasonToMessage($conditions));
            return $this->redirectToRoute('sorties_detail', ['id' => $sortie->getId()]);
        }

        // OK désinscrire
        $sortie->removeParticipant($user);

        // garder nbInscrits synchro
        $sortie->setNbInscrits($sortie->getParticipants()->count());

        $em->flush();

        $etatService->miseAJourEtatSortie($sortie);


        // Envoi du mail confirmation desinscription
        $mailService->sendDesinscriptionMail($user->getEmail(), $sortie->getNom());

        $this->addFlash('success', 'Vous êtes désinscrit.');
        return $this->redirectToRoute('sorties_detail', ['id' => $sortie->getId()]);
    }

    private function mapReasonToMessage(string $conditions): string
    {
        return match ($conditions) {
            'deja_inscrit' => 'Vous êtes déjà inscrit à cette sortie.',
            'pas_ouverte' => 'Cette sortie n’est pas ouverte aux inscriptions.',
            'delais_depasse' => 'La date limite d’inscription est dépassée.',
            'non_inscrit' => 'Vous n’êtes pas inscrit à cette sortie.',
            'complet' => 'Cette sortie est complète.',
            'deja_debute' => 'Cette sortie a déjà débuté',
            default => 'Action non autorisée.',
        };
    }


    /**
     * @throws ApiError
     */
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

        // Gérer le formulaire lieu
        $formLieu->handleRequest($request);
        if ($formLieu->isSubmitted() && $formLieu->isValid()) {
            if ($formLieu->get('createLieu')->isClicked()) {

                // Récupérer les données de ville depuis les champs cachés JavaScript
                $villeNom = $request->request->get('ville_nom');
                $villeCodePostal = $request->request->get('ville_code_postal');

                // Vérifier qu'une ville a été sélectionnée
                if (!$villeNom || !$villeCodePostal) {
                    if ($request->isXmlHttpRequest()) {
                        return new JsonResponse([
                            'success' => false,
                            'error' => 'Veuillez sélectionner une ville via l\'autocomplétion.'
                        ], 400);
                    }
                    $this->addFlash('error', 'Veuillez sélectionner une ville via l\'autocomplétion.');
                    return $this->render('sortie/create.html.twig', [
                        'formSortie' => $formSortie->createView(),
                        'formLieu' => $formLieu->createView(),
                        'lieux' => $lieuxArray,
                        'allCampus' => $allCampus,
                        'lieuIdToSelect' => $lieuIdToSelect
                    ]);
                }

                // Chercher ou créer la ville
                $ville = $em->getRepository(Ville::class)->findOneBy([
                    'nom' => $villeNom,
                    'cp' => $villeCodePostal
                ]);

                if (!$ville) {
                    $ville = new Ville();
                    $ville->setNom($villeNom);
                    $ville->setCp($villeCodePostal);
                    $em->persist($ville);
                    $em->flush();
                }

                // Associer la ville au lieu
                $lieu->setVille($ville);

                // Récupérer et définir les coordonnées depuis les champs cachés JavaScript
                $latitude = $request->request->get('coordinates_latitude');
                $longitude = $request->request->get('coordinates_longitude');

                if ($latitude && $longitude) {
                    // S'assurer que ce sont des strings numériques valides
                    $latFloat = (float) str_replace(',', '.', $latitude);
                    $lngFloat = (float) str_replace(',', '.', $longitude);

                    $lieu->setLatitude($latFloat);
                    $lieu->setLongitude($lngFloat);

                    error_log("Coordonnées définies: lat=$latFloat, lng=$lngFloat");
                }

                // Sauvegarder le lieu
                $em->persist($lieu);
                $em->flush();

                if ($request->isXmlHttpRequest()) {
                    return new JsonResponse([
                        'success' => true,
                        'message' => 'Lieu créé avec succès !',
                        'lieu_id' => $lieu->getId()
                    ]);
                }

                $this->addFlash('success', 'Lieu créé avec succès !');
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
                }

                if ($formSortie->isValid() && $formSortie->get('createSortie')->isClicked()) {

                    if ($photoFile) {
                        // on transmet l'url à la sortie
                        $sortie->setPhoto($uploadPhoto['url']);
                    }
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
            'form' => null,
        ]);
    }

    #[Route('/{id}/cancel', name: 'cancel', methods: ['POST'])]
    public function cancelEvent(Sortie $sortie, SortieService $sortieService): Response
    {
        $sortieService->cancelEvent($sortie);
        $this->addFlash('success', 'La sortie ' . $sortie->getNom() . ' a bien été annulée !');
        return $this->redirectToRoute('sorties_home');
    }

    #[Route('/{id}/publication', name: 'publication', methods: ['POST'])]
    public function publication(Sortie $sortie, EntityManagerInterface $em): Response
    {
        $sortie->setEtat(Etat::OUVERTE);
        $em->persist($sortie);
        $em->flush();

        $this->addFlash('success', 'La sortie ' . $sortie->getNom() . ' a bien été publiée !');
        return $this->redirectToRoute('sorties_home');
    }

    /**
     * @throws ApiError
     */
    #[Route('/{id}/modification', name: 'modification', methods: ['GET', 'POST'])]
    public function modification(Request $request, Sortie $sortie, EntityManagerInterface $em, CloudinaryService $cloudinaryService): Response
    {

        $form = $this->createForm(SortieEditType::class, $sortie);
        $form->handleRequest($request);

        if ($form->isSubmitted()) {
            $photoFile = $form->get('photo')->getData();
            $uploadPhoto = [];

            if ($photoFile) {
                $uploadPhoto = $cloudinaryService->uploadPhoto($photoFile);

                if (!$uploadPhoto['success']) {
                    $this->addFlash('danger', $uploadPhoto['error']);
                    return $this->redirectToRoute('profil');
                }
            }

            if ($form->isValid()) {

                if ($photoFile) {
                    // on transmet l'url au user
                    $sortie->setPhoto($uploadPhoto['url']);
                }

                $em->persist($sortie);
                $em->flush();

                $this->addFlash('success', "L'événement a été mis à jour.");
                return $this->redirectToRoute('sorties_detail', ['id' => $sortie->getId()]);
            }
        }

        return $this->render('sortie/edit.html.twig', ['form' => $form->createView(), 'sortie' => $sortie]);
    }

}
