<?php

namespace App\Form;

use App\Entity\Campus;
use App\Entity\Interets;
use App\Entity\Promo;
use App\Entity\User;
use Symfony\Bridge\Doctrine\Form\Type\EntityType;
use Symfony\Component\Form\AbstractType;
use Symfony\Component\Form\FormBuilderInterface;
use Symfony\Component\OptionsResolver\OptionsResolver;

class UserProfilType extends AbstractType
{
    public function buildForm(FormBuilderInterface $builder, array $options): void
    {
        $builder
            ->add('email', null, ['label' => 'Email :'])
            ->add('prenom', null, ['label' => 'Prénom :'])
            ->add('nom', null, ['label' => 'Nom :'])
            ->add('pseudo', null, ['label' => 'Pseudo :'])
            ->add('bio', null, ['label' => 'Bio :'])
            ->add('campus', EntityType::class, [
                'class' => Campus::class,
                'choice_label' => 'nom',
            ])
            ->add('interets', EntityType::class, [
                'class' => Interets::class,
                'choice_label' => 'nom',
                'multiple' => true,
            ])
            ->add('promo', EntityType::class, [
                'class' => Promo::class,
                'choice_label' => 'nom',
            ]);
    }

    public function configureOptions(OptionsResolver $resolver): void
    {
        $resolver->setDefaults([
            'data_class' => User::class,
            'csrf_protection' => true,            // activé par défaut
            'csrf_field_name' => '_token',
            'csrf_token_id'   => 'profile_item',  // identifiant unique pour ce formulaire
        ]);
    }
}
