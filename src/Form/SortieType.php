<?php

namespace App\Form;

use App\Entity\Campus;
use App\Entity\Interets;
use App\Entity\Sortie;
use App\Entity\User;
use Symfony\Bridge\Doctrine\Form\Type\EntityType;
use Symfony\Component\Form\AbstractType;
use Symfony\Component\Form\Extension\Core\Type\SubmitType;
use Symfony\Component\Form\FormBuilderInterface;
use Symfony\Component\OptionsResolver\OptionsResolver;

class SortieType extends AbstractType
{
    public function buildForm(FormBuilderInterface $builder, array $options): void
    {
        $builder
            ->add('nom', null, [
                'label' => 'Nom de la sortie'
            ])
            ->add('dateHeureDebut', null, [
                'widget' => 'single_text',
                'label' => 'Date et heure de début'
            ])
            ->add('duree', null, [
                'label' => 'Durée (en minutes)'
            ])
            ->add('dateLimiteInscription', null, [
                'widget' => 'single_text',
                'label' => 'Date limite d\'inscription'
            ])
            ->add('nbInscriptionMax', null, [
                'label' => 'Nombre maximum de participants'
            ])
            ->add('nbInscriptionMin', null, [
                'label' => 'Nombre minimum de participants'
            ])
//            ->add('nbInscrits', null, [
//                'label' => 'Nombre d\'inscrits actuels'
//            ])
            ->add('infos', null, [
                'label' => 'Description de l\'activité'
            ])
            ->add('photo', null, [
                'label' => 'Photo de l\'activité'
            ])
            ->add('campus', EntityType::class, [
                'class' => Campus::class,
                'choice_label' => 'nom',
                'label' => 'Campus organisateur',
                'placeholder' => 'Sélectionnez un campus'
            ])
            ->add('interets', EntityType::class, [
                'class' => Interets::class,
                'choice_label' => 'nom',
                'label' => 'Catégorie d\'intérêt',
                'placeholder' => 'Choisissez une catégorie'
            ])
//            ->add('organisateur', EntityType::class, [
//                'class' => User::class,
//                'choice_label' => 'nom',
//                'label' => 'Organisateur de la sortie',
//                'placeholder' => 'Sélectionnez un organisateur'
//            ])
//            ->add('participants', EntityType::class, [
//                'class' => User::class,
//                'choice_label' => 'nom',
//                'multiple' => true,
//                'label' => 'Participants inscrits',
//                'required' => false,
//                'help' => 'Maintenez Ctrl (Cmd sur Mac) pour sélectionner plusieurs participants'
//            ])
            ->add('create', SubmitType::class, [
                'label' => 'Enregistrer',
                'attr'  => ['class' => 'uk-button '],
            ])
            ->add('cancel', SubmitType::class, [
                'label' => 'Annuler',
                'attr'  => ['class' => 'uk-button '],
            ])
        ;
    }

    public function configureOptions(OptionsResolver $resolver): void
    {
        $resolver->setDefaults([
            'data_class' => Sortie::class,
        ]);
    }
}
