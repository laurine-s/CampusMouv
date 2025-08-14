<?php

namespace App\Command;

use App\Entity\Sortie;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;
use Symfony\Component\Console\Helper\ProgressBar;

#[AsCommand(
    name: 'app:backfill-sortie-datefin',
    description: 'Calcule et remplit dateHeureFin pour les sorties existantes (+ option pour archiver > 1 mois).'
)]
class BackfillSortieDateFinCommand extends Command
{
    private const BATCH_SIZE = 200;

    public function __construct(private readonly EntityManagerInterface $em)
    {
        parent::__construct();
    }

    protected function configure(): void
    {
        $this
            ->addOption(
                'also-archive',
                null,
                InputOption::VALUE_NONE,
                'En plus du backfill, bascule archived=true si dateHeureFin < (now - 1 mois)'
            )
        ;
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);

        $alsoArchive = (bool) $input->getOption('also-archive');
        $tz = new \DateTimeZone('Europe/Paris');
        $now = new \DateTimeImmutable('now', $tz);
        $threshold = $now->sub(new \DateInterval('P1M'));

        // Compte des lignes à traiter (dateHeureFin NULL)
        $countToBackfill = (int) $this->em->createQuery(
            'SELECT COUNT(s.id) FROM App\Entity\Sortie s WHERE s.dateHeureFin IS NULL'
        )->getSingleScalarResult();

        if ($countToBackfill === 0) {
            $io->writeln('Aucune sortie à backfiller (dateHeureFin déjà renseignée).');
        } else {
            $io->section(sprintf('Backfill de dateHeureFin pour %d sortie(s)...', $countToBackfill));
            $progress = new ProgressBar($output, $countToBackfill);
            $progress->start();

            // Parcours mémoire-friendly
            $q = $this->em->createQuery('SELECT s FROM App\Entity\Sortie s WHERE s.dateHeureFin IS NULL');
            foreach ($q->toIterable([], \Doctrine\ORM\AbstractQuery::HYDRATE_OBJECT) as $sortie) {
                /** @var Sortie $sortie */
                $debut = $sortie->getDateHeureDebut();
                $duree = $sortie->getDuree();

                if ($debut instanceof \DateTimeImmutable && $duree !== null) {
                    $fin = $debut->modify('+' . (int)$duree . ' minutes');
                    $sortie->setDateHeureFin($fin);

                    if ($alsoArchive && $fin < $threshold) {
                        $sortie->setArchived(true);
                    }
                } else {
                    // Cas données incomplètes : on ignore mais on log
                    $io->warning(sprintf('Sortie #%d incomplète (dateHeureDebut ou duree manquante).', $sortie->getId() ?? 0));
                }

                $progress->advance();

                // Flush/clear par batch pour éviter la surconsommation mémoire
                if (($progress->getProgress()) % self::BATCH_SIZE === 0) {
                    $this->em->flush();
                    $this->em->clear();
                }
            }
            // Dernier flush
            $this->em->flush();
            $this->em->clear();

            $progress->finish();
            $output->writeln(''); // newline
            $io->success('Backfill terminé.');
        }

        // Si on veut aussi archiver les sorties déjà OK (dateHeureFin non NULL) sans backfill
        if ($alsoArchive) {
            $io->section('Archivage des sorties avec dateHeureFin < now - 1 mois...');
            $updated = $this->em->createQuery(
                'UPDATE App\Entity\Sortie s
                 SET s.archived = true
                 WHERE s.archived = false AND s.dateHeureFin < :threshold'
            )->setParameter('threshold', $threshold)
                ->execute();

            $io->success(sprintf('Archivées : %d sortie(s).', $updated));
        }

        return Command::SUCCESS;
    }
}