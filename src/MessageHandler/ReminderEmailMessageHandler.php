<?php
//namespace App\MessageHandler;
//
//use App\Message\ReminderEmailMessage;
//use App\Repository\SortieRepository;
//use App\Repository\UserRepository;
//use App\Service\MailService;
//use Symfony\Component\Messenger\Attribute\AsMessageHandler;
//
//#[AsMessageHandler]
//final class ReminderEmailMessageHandler
//{
//    public function __construct(
//        private SortieRepository $sortieRepo,
//        private UserRepository $userRepo,
//        private MailService $mail
//    ) { }
//
//    public function __invoke(ReminderEmailMessage $msg): void
//    {
//        $sortie = $this->sortieRepo->find($msg->sortieId);
//        $user   = $this->userRepo->find($msg->userId);
//        if (!$sortie || !$user) { return; }
//
//        $this->mail->sendRappelEmail48H(
//            $user->getEmail(),
//            $sortie->getNom(),
//            $sortie->getCampus()?->getNom() ?? 'Lieu à préciser',
//            $sortie->getDateHeureDebut()
//        );
//    }
//}
