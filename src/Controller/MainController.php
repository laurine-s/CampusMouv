<?php

namespace App\Controller;

use App\Entity\Contact;
use App\Form\ContactType;
use App\Repository\CampusRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
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

    #[Route('/contact', name: 'main_contact', methods: ['GET', 'POST'])]
    public function contact(Request $request, EntityManagerInterface $em): Response
    {
        $contact = new Contact();
        $formContact = $this->createForm(ContactType::class);
        $formContact->handleRequest($request);
        if ($formContact->isSubmitted() && $formContact->isValid()) {
            if ($formContact->get('envoyer')->isClicked()) {
                $em->persist($contact);
                $em->flush();

                $this->addFlash('success', 'Message envoyé a notre équipe !');

                return $this->redirectToRoute('main_home');
            }
        }

        return $this->render('main/contact.html.twig', [
            'formContact' => $formContact->createView()
        ] );
    }
}