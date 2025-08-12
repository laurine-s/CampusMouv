<?php

namespace App\Controller;

use App\Repository\SortieRepository;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
#[Route('/sortie', name: 'sortie_')]
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
}
