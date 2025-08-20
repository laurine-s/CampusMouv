<?php

namespace App\Service;

    use Symfony\Component\Mailer\MailerInterface;
    use Symfony\Component\Mime\Email;

class MailService
{
    public function __construct(private MailerInterface $mailer)
    {
    }

    public function sendInscriptionMail(string $to, string $sortieNom): void
    {
        $sentAt = new \DateTimeImmutable('now', new \DateTimeZone('Europe/Paris'));
        $formattedDate = $sentAt->format('d/m/Y H:i:s');

        $email = (new Email())
            ->from('noreply@campus-eni.fr')
            ->to($to)
            ->subject('Votre inscription est confirmée')
            ->text("Vous êtes bien inscrit à la sortie : $sortieNom")
            ->html("<p>Bonjour,</p><p>Votre inscription à la sortie <strong>$sortieNom</strong> est bien confirmée le <strong>{$formattedDate}</strong> </p> <br>
            <p>L'équipe du BDE </p>");

        $this->mailer->send($email);
    }

    public function sendDesinscriptionMail(string $to, string $sortieNom): void

    {
        $sentAt = new \DateTimeImmutable('now', new \DateTimeZone('Europe/Paris'));
        $formattedDate = $sentAt->format('d/m/Y H:i:s');

        $email = (new Email())
            ->from('noreply@campus-eni.fr')
            ->to($to)
            ->subject('votre désinscription est confirmée')
            ->text("Vous êtes bien désinscrit de la sortie : $sortieNom")
            ->html("<p>Bonjour,</p><p>Votre désinscription de la sortie <strong>$sortieNom</strong> a bien été prise en compte le <strong>{$formattedDate}</strong> </p> <br>
            <p>L'équipe du BDE </p>");

        $this->mailer->send($email);
    }
}
