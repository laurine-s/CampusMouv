<?php

namespace App\Controller;

use App\Repository\CampusRepository;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

final class MainController extends AbstractController
{
    #[Route('/', name: 'main_home')]
    public function home(CampusRepository $campusRepository): Response
    {
        // Récupérer tous les campus pour la navigation si nécessaire
        $campusList = $campusRepository->findAll();

        return $this->render('main/home.html.twig', [
            'campusList' => $campusList
        ]);
    }

    #[Route('/a-propos', name: 'main_apropos')]
    public function apropos(): Response
    {
        return $this->render('main/apropos.html.twig');
    }

    #[Route('/contact', name: 'main_contact')]
    public function contact(): Response
    {
        return $this->render('main/contact.html.twig');
    }
}