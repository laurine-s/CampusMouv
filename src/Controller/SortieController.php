<?php

namespace App\Controller;

use App\Entity\Campus;
use App\Entity\Sortie;
use App\Enum\Role;
use App\Form\SortieType;
use App\Repository\LieuRepository;
use App\Repository\SortieRepository;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
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

    #[Route('/{id}/inscription', name: 'inscription', requirements: ['id' => '\d+'], methods: ['POST'])]
    public function inscription(int $id, SortieRepository $sortieRepository, Request $request, EntityManagerInterface $em): Response
    {
        $user = $this->getUser();
        $sortie = $sortieRepository->find($id);


        // inscription déjà effectuée
        if ($sortie->getParticipants()->contains($user)) {
            $this->addFlash('warning', 'Vous êtes déjà inscrit à cette sortie.');
            return $this->redirectToRoute('sorties_detail', ['id' => $sortie->getId()]);
        }


        // sinon tu es bien inscrit
        $sortie->addParticipant($user);
        $em->flush();

        $this->addFlash('success', 'Vous êtes bien inscrit !');
        return $this->redirectToRoute('sorties_detail', ['id' => $sortie->getId()]);
    }

    #[Route('/{id}/desinscription', name: 'desinscription', requirements: ['id' => '\d+'], methods: ['POST'])]
    public function desinscription(int $id, SortieRepository $sortieRepository, EntityManagerInterface $em, Request $request): Response
    {
        $sortie = $sortieRepository->find($id);
        $user = $this->getUser();


        //tu te désistes
        if ($sortie->getParticipants()->contains($user)) {
            $sortie->removeParticipant($user);
            $em->flush();
            $this->addFlash('success', 'Vous êtes désinscrit.');
        }

        return $this->redirectToRoute('sorties_detail', ['id' => $sortie->getId()]);
    }


    #[Route('/create', name: 'create', methods: ['GET', 'POST'])]
    public function create(Request $request, EntityManagerInterface $em, LieuRepository $lieuRepository, UserRepository $userRepository): Response
    {
        $sortie = new Sortie();
        $form = $this->createForm(SortieType::class, $sortie);
        $allLieux = $lieuRepository->findAll();
        $user = $userRepository->find($this->getUser());

        $form->handleRequest($request);
        if ($form->isSubmitted() && $form->isValid()) {
            if ($form->get('create')->isClicked()) {
                $sortie->addParticipant($this->getUser());
                $sortie->setOrganisateur($this->getUser());
                $user->setRoles(['ROLE_ORGANISATEUR']);
                // Enregistrer ou traiter les données
                $em->persist($sortie);
                $em->persist($user);
                dump($sortie);
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
