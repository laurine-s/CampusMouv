<?php

namespace App\Form;

use App\Entity\Campus;
use App\Entity\Lieu;
use App\Entity\Ville;
use Symfony\Bridge\Doctrine\Form\Type\EntityType;
use Symfony\Component\Form\AbstractType;
use Symfony\Component\Form\Extension\Core\Type\ResetType;
use Symfony\Component\Form\Extension\Core\Type\SubmitType;
use Symfony\Component\Form\FormBuilderInterface;
use Symfony\Component\OptionsResolver\OptionsResolver;

class LieuType extends AbstractType
{
    public function buildForm(FormBuilderInterface $builder, array $options): void
    {
        $builder
            ->add('nom', null, [
                'label' => 'Nom du lieu',
            ])
            ->add('rue', null, [
                'label' => 'N° et rue du lieu',
            ])
            ->add('ville', EntityType::class, [
                'label' => 'Ville',
                'class' => Ville::class,
                'choice_label' => 'nom',
            ])
            ->add('campus', EntityType::class, [
                'class' => Campus::class,
                'choice_label' => 'nom', // Adapte selon ton entité Campus
                'label' => 'Campus',
                'placeholder' => 'Choisissez un campus',
                'required' => true,

            ])
            ->add('createLieu', SubmitType::class, [
                'label' => 'Enregistrer',
                'attr' => ['class' => 'cm-background-persian-green cm-text-charcoal',
                    'id' => 'submit-lieu',]
            ])
            ->add('cancel', ResetType::class, [
                'label' => 'Annuler',
                'attr' => ['class' => ' uk-button-default cm-text-charcoal uk-margin-small-right'],
            ]);

    }

    public function configureOptions(OptionsResolver $resolver): void
    {
        $resolver->setDefaults([
            'data_class' => Lieu::class,
        ]);
    }
}
