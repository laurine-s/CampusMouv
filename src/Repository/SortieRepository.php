<?php

namespace App\Repository;

use App\Entity\Sortie;
use App\Entity\User;
use App\Enum\Etat;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Sortie>
 */
class SortieRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Sortie::class);
    }

    public function sortieParId(int $id): Sortie
    {
        return $this->createQueryBuilder('s')
            ->leftJoin('s.participants', 'p')->addSelect('p')
            ->leftJoin('s.organisateur', 'o')->addSelect('o')
            ->Where('s.id = :id')
            ->setParameter('id', $id)
            ->getQuery()
            ->getOneOrNullResult();

    }

    public function filterSorties(array $filters, User $user): array
    {
        $queryBuilder = $this->createQueryBuilder('s')
            ->leftJoin('s.campus', 'campus')->addSelect('campus')
            ->leftJoin('s.participants', 'part')->addSelect('part');

        if ($filters['campus']) {
            $queryBuilder->andWhere('s.campus = :campus')
                ->setParameter('campus', $filters['campus']);
        }

        // Filtres liés à l'utilisateur
        // États "visibles" pour participants ou organisateur
        $visibleEtats = [Etat::OUVERTE, Etat::CLOTUREE, Etat::ACTIVITE_EN_COURS, Etat::PASSEE];

        if (!empty($filters['isParticipant'])) {
            $conditions[] = ':user MEMBER OF s.participants AND s.etat IN (:visibleEtats)';
            $queryBuilder->setParameter('user', $user)
                ->setParameter('visibleEtats', $visibleEtats);
        }

        if (!empty($filters['isOrganisateur'])) {
            $conditions[] = 's.organisateur = :organisateur AND s.etat IN (:visibleEtats)';
            $queryBuilder->setParameter('organisateur', $user)
                ->setParameter('visibleEtats', $visibleEtats);
        }

        if (!empty($filters['isCreee'])) {
            $conditions[] = 's.organisateur = :userCreee AND s.etat = :etatCreee';
            $queryBuilder->setParameter('userCreee', $user)
                ->setParameter('etatCreee', Etat::CREEE);
        }

        if (!empty($filters['isAnnulee'])) {
            $conditions[] = 's.etat = :etatAnnulee';
            $queryBuilder->setParameter('etatAnnulee', Etat::ANNULEE);
        }

        if (!empty($conditions)) {
            $queryBuilder->andWhere(implode(' OR ', $conditions));
        }

        return $queryBuilder->getQuery()->getResult();
    }

    // Ajout d'un findAll par ordre alphabétique pour les administrateurs
    public function findEventsOrderedByNom(): array
    {
        return $this->createQueryBuilder('u')
            ->orderBy('u.nom', 'ASC')
            ->getQuery()
            ->getResult();
    }


}

