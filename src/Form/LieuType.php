<?php

namespace App\Form;

use App\Entity\Campus;
use App\Entity\Lieu;
use App\Entity\Ville;
use Symfony\Bridge\Doctrine\Form\Type\EntityType;
use Symfony\Component\Form\AbstractType;
use Symfony\Component\Form\Extension\Core\Type\ButtonType;
use Symfony\Component\Form\Extension\Core\Type\NumberType;
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
            ->add('latitude', NumberType::class, [
                'label' => 'Latitude',
                'required' => false,
                'scale' => 8,  // Précision décimale
                'attr' => [
                    'step' => 'any'  // Permet n'importe quelle précision
                ]
            ])
            ->add('longitude', NumberType::class, [
                'label' => 'Longitude',
                'required' => false,
                'scale' => 8,
                'attr' => [
                    'step' => 'any'
                ]
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
                'attr' => ['class' => 'uk-button-primary',
                    'id' => 'submit-lieu',]
            ])
            ->add('cancel', ButtonType::class, [
                'label' => 'Annuler',
                'attr' => ['class' => ' uk-button-default cm-text-charcoal uk-margin-small-right',
                    'uk-toggle' => 'target: #mon-modal'],
            ]);

    }

    public function configureOptions(OptionsResolver $resolver): void
    {
        $resolver->setDefaults([
            'data_class' => Lieu::class,
        ]);
    }
}
