<?php

namespace App\Repository;

use App\Entity\Sortie;
use App\Entity\User;
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

        if($filters['campus']){
            $queryBuilder->andWhere('s.campus = :campus')
                ->setParameter('campus', $filters['campus']);
        }

        if($filters['isParticipant']){
            $queryBuilder->andWhere(':user MEMBER OF s.participants')
                ->setParameter('user', $user);
        }

        if($filters['isOrganisateur']){
            $queryBuilder->andWhere('s.organisateur = :organisateur')
                ->setParameter('organisateur', $user);
        }

        return $queryBuilder->getQuery()->getResult();
    }


}

