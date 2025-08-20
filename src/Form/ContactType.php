<?php

namespace App\Form;

use App\Entity\Contact;
use Symfony\Component\Form\AbstractType;
use Symfony\Component\Form\Extension\Core\Type\SubmitType;
use Symfony\Component\Form\FormBuilderInterface;
use Symfony\Component\OptionsResolver\OptionsResolver;

class ContactType extends AbstractType
{
    public function buildForm(FormBuilderInterface $builder, array $options): void
    {
        $builder
            ->add('nom', null, [
                'label' => 'Votre nom',
                'attr' => [
                    'placeholder' => 'Votre nom',
                ],
                'data' => 'toto'
            ])
            ->add('email', null, [
                'label' => 'Votre email',
                'attr' => [
                    'placeholder' => 'Votre email',
                ],
                'data'=> 'toto.toto2025@camus-eni.fr'
            ])
            ->add('telephone', null, [
                'label'=> 'Téléphone (optionnel)',
                'attr' => [
                    'placeholder' => '0123456789',
                ],
                'data'=> '0123456789'
            ])
            ->add('sujet', null, [
                'label' => 'Sujet de votre visite',
                'attr' => [
                    'placeholder' => 'Sujet de votre visite',
                ],
            ])
            ->add('description', null, [
                'label' => 'Parlez-nous de ce qui vous amène',
                'attr' => [
                    'placeholder' => 'Votre description',
                ],
                'data' => 'Prise de contact'
            ])
            ->add('the', null, [
                'label' => 'Votre thé préféré (optionnel)',
                'attr' => [
                    'placeholder' => 'Earl Grey, thé vert, tisane...',
                ],
            ])
            ->add('envoyer', SubmitType::class, [
                'label' => 'Contactez nous',
            ])
        ;
    }

    public function configureOptions(OptionsResolver $resolver): void
    {
        $resolver->setDefaults([
            'data_class' => Contact::class,
        ]);
    }
}
