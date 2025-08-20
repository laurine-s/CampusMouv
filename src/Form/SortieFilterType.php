<?php

namespace App\Form;

use App\Entity\Campus;
use App\Entity\Interets;
use App\Entity\Lieu;
use App\Entity\Sortie;
use App\Entity\User;
use Symfony\Bridge\Doctrine\Form\Type\EntityType;
use Symfony\Component\Form\AbstractType;
use Symfony\Component\Form\Extension\Core\Type\CheckboxType;
use Symfony\Component\Form\FormBuilderInterface;
use Symfony\Component\OptionsResolver\OptionsResolver;

class SortieFilterType extends AbstractType
{
    public function buildForm(FormBuilderInterface $builder, array $options): void
    {
        $builder
            ->add('campus', EntityType::class, [
                'class' => Campus::class,
                'choice_label' => 'nom',
                'required' => false,
                'placeholder' => 'Tous les campus',
                'label' => 'Campus',
            ])
            ->add('isCreee', CheckboxType::class, [
                'label' => 'Mes brouillons d\'événement',
                'required' => false,
                'mapped' => false,
                'data' => $options['isCreee'] ?? false,
            ])
            ->add('isOrganisateur', CheckboxType::class, [
                'label' => 'Mes événements publiés',
                'required' => false,
                'mapped' => false,
                'data' => $options['isOrganisateur'] ?? false,
            ])
            ->add('isAnnulee', CheckboxType::class, [
                'label' => 'Mes événements annulés',
                'required' => false,
                'mapped' => false,
                'data' => $options['isAnnulee'] ?? false,
            ])
            ->add('isParticipant', CheckboxType::class, [
                'label' => 'Les événements auxquels je participe',
                'required' => false,
                'mapped' => false,
                'data' => $options['isParticipant'] ?? false,
            ]);
    }

    public function configureOptions(OptionsResolver $resolver): void
    {
        $resolver->setDefaults([
            'data_class' => Sortie::class,
            'isParticipant' => false,
            'isOrganisateur' => false,
            'isCreee' => false,
            'isAnnulee' => false,
        ]);
    }
}
