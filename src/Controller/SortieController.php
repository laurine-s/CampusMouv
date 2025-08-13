<?php

namespace App\Controller;

use App\Entity\Sortie;
use App\Form\SortieType;
use App\Repository\SortieRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
#[Route('/sorties', name: 'sorties_')]
final class SortieController extends AbstractController
{
    #[Route('/', name: 'home', methods: ['GET'])]
    public function index(SortieRepository $sortieRepository): Response
    {
        $allSorties = $sortieRepository->findAll();
        return $this->render('sortie/sorties.html.twig', [
            'allSorties' => $allSorties,
        ]);
    }

    #[Route('/{id}/detail', name: 'detail', methods: ['GET'])]
    public function detail(int $id, SortieRepository $sortieRepository): Response
    {
        $sortieParId = $sortieRepository->sortieParId($id);
        return $this->render('sortie/detail.html.twig', [
            'sortie' => $sortieParId
        ]);
    }

    #[Route('/create', name: 'create', methods: ['GET', 'POST'])]
    public function create(Request $request, EntityManagerInterface $em): Response
    {
        $sortie = new Sortie();
        $form = $this->createForm(SortieType::class, $sortie);

        $form->handleRequest($request);
        if ($form->isSubmitted() && $form->isValid()) {
            if ($form->get('create')->isClicked()) {
                // Enregistrer ou traiter les données
                $em->persist($sortie);
                $em->flush();

                // Message temporaire success
                $this->addFlash('success', 'Message envoyé !');

                //Rediriger
                return $this->redirectToRoute('sortie_home');
            }

        }

        return $this->render('sortie/create.html.twig', [
            'form' => $form->createView(),
        ]);
    }

}
