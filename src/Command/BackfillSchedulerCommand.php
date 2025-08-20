<?php

namespace App\Command;

use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;
use Symfony\Component\Process\Process;

#[AsCommand(
    name: 'app:hourly-scheduler',
    description: 'Lance un lot de commandes toutes les heures. À chaque nouveau cycle, stoppe les instances précédentes.'
)]
class BackfillSchedulerCommand extends Command
{
    /** @var Process[] */
    private array $lastProcesses = [];

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);
        $io->success('Scheduler démarré (CTRL+C pour arrêter).');

        // 🔧 Liste des commandes à lancer à chaque cycle (ajoute/retire ce que tu veux)
        $commands = [
            [PHP_BINARY, 'bin/console', 'app:backfill-sortie-datefin', '--also-archive'],
//            [PHP_BINARY, 'bin/console', 'app:ma-deuxieme-commande'], // ← remplace par ta 2e commande
        ];

        while (true) {
            // 1) Stopper proprement les instances précédentes encore actives
            if (!empty($this->lastProcesses)) {
                $io->section('Arrêt des instances du cycle précédent…');
                foreach ($this->lastProcesses as $idx => $proc) {
                    if ($proc->isRunning()) {
                        // stop(timeout) : essaie un SIGTERM/équivalent, puis SIGKILL passés X secondes
                        $proc->stop(5);
                    }
                }
                $this->lastProcesses = [];
            }

            // 2) Démarrer une nouvelle instance de CHAQUE commande (asynchrone)
            $io->section('Démarrage d’un nouveau cycle…');
            foreach ($commands as $cmd) {
                $pretty = implode(' ', $cmd);
                $io->writeln("→ Lancement : $pretty");

                $p = new Process($cmd);
                // Se placer à la racine du projet pour que bin/console soit trouvé
                $p->setWorkingDirectory(getcwd());

                // Optionnel : limite de durée individuelle (par sécurité)
                // $p->setTimeout(3600); // 1h max par commande

                $p->start(); // asynchrone : on n’attend pas la fin
                $this->lastProcesses[] = $p;
            }

            // 3) Attendre 1 heure avant le prochain cycle
            $io->writeln('⏳ Prochain cycle dans 1 heure…');
            for ($i = 0; $i < 60; $i++) {
                sleep(1);

                // Optionnel : si tu veux sortir si toutes les commandes se terminent avant l’heure
                // if ($this->allStopped()) { break; }
            }
        }

        // Jamais atteint en pratique (CTRL+C), mais requis par l’interface
        // return Command::SUCCESS;
    }

    private function allStopped(): bool
    {
        foreach ($this->lastProcesses as $p) {
            if ($p->isRunning()) {
                return false;
            }
        }
        return true;
    }
}
