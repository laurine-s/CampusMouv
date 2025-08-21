<?php

namespace App\Form;

use App\Entity\Campus;
use App\Entity\Interets;
use App\Entity\Lieu;
use App\Entity\Sortie;
use App\Entity\User;
use Symfony\Bridge\Doctrine\Form\Type\EntityType;
use Symfony\Component\Form\AbstractType;
use Symfony\Component\Form\Extension\Core\Type\FileType;
use Symfony\Component\Form\Extension\Core\Type\ResetType;
use Symfony\Component\Form\Extension\Core\Type\SubmitType;
use Symfony\Component\Form\Extension\Core\Type\TextType;
use Symfony\Component\Form\FormBuilderInterface;
use Symfony\Component\OptionsResolver\OptionsResolver;
use Symfony\Component\Validator\Constraints\File;

class SortieEditType extends AbstractType
{
    public function buildForm(FormBuilderInterface $builder, array $options): void
    {
        $builder
            ->add('photo', FileType::class, [
                'label' => 'Photo de l\'activité : ',
                //car on ne stocke pas directement le fichier dans l’entité, on l’envoie à Cloudinary
                'mapped' => false,
                'required' => false,
                'constraints' => [
                    new File([
                        'maxSize' => '2M',
                        'maxSizeMessage' => 'Votre photo doit faire moins de 2M.',
                        'mimeTypes' => [
                            'image/jpeg',
                            'image/png',
                        ],
                        'mimeTypesMessage' => 'Merci de télécharger un fichier JPEG ou PNG valide',
                    ])
                ],
                'attr' => [
                    'accept' => 'image/jpeg,image/png'
                ]
            ])
            ->add('nom', null, [
                'label' => 'Nom de la sortie : ',
            ])
            ->add('dateHeureDebut', null, [
                'widget' => 'single_text',
                'label' => 'Date et heure de début : ',
            ])
            ->add('duree', null, [
                'label' => 'Durée (en minutes) : ',
            ])
            ->add('dateLimiteInscription', null, [
                'widget' => 'single_text',
                'label' => 'Date limite d\'inscription : ',

            ])
            ->add('nbInscriptionMax', null, [
                'label' => 'Nombre maximum de participants : ',
            ])
            ->add('nbInscriptionMin', null, [
                'label' => 'Nombre minimum de participants : ',
            ])
            ->add('infos', null, [
                'label' => 'Description de l\'activité : ',
            ])
            ->add('campus', EntityType::class, [
                'class' => Campus::class,
                'choice_label' => 'nom', // Adapte selon ton entité Campus
                'label' => 'Campus : ',
                'placeholder' => 'Choisissez un campus',
                'required' => true,

            ])
            ->add('interets', EntityType::class, [
                'class' => Interets::class,
                'choice_label' => 'nom',
                'label' => 'Centre d\'intérêt : ',
                'placeholder' => 'Choisissez une catégorie',
                'required' => false,

            ])
            ->add('lieu', EntityType::class, [
                'class' => Lieu::class,
                'choice_label' => 'nom',
                'label' => 'Lieu : ',
                'placeholder' => 'Choisissez un lieu existant',

            ]);
    }

    public function configureOptions(OptionsResolver $resolver): void
    {
        $resolver->setDefaults([
            'data_class' => Sortie::class,

        ]);

    }
}
