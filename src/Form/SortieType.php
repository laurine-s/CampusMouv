<?php

namespace App\Form;

use App\Entity\Campus;
use App\Entity\Interets;
use App\Entity\Lieu;
use App\Entity\Sortie;
use App\Entity\User;
use Symfony\Bridge\Doctrine\Form\Type\EntityType;
use Symfony\Component\Form\AbstractType;
use Symfony\Component\Form\Extension\Core\Type\SubmitType;
use Symfony\Component\Form\Extension\Core\Type\TextType;
use Symfony\Component\Form\FormBuilderInterface;
use Symfony\Component\OptionsResolver\OptionsResolver;

class SortieType extends AbstractType
{
    public function buildForm(FormBuilderInterface $builder, array $options): void
    {
        $builder
            ->add('nom', null, [
                'label' => 'Nom de la sortie',
                'data' => 'Poufsouffle Party'
            ])
            ->add('dateHeureDebut', null, [
                'widget' => 'single_text',
                'label' => 'Date et heure de début',
                'data' => new \DateTimeImmutable('now')
            ])
            ->add('duree', null, [
                'label' => 'Durée (en minutes)',
                'data' => 120
            ])
            ->add('dateLimiteInscription', null, [
                'widget' => 'single_text',
                'label' => 'Date limite d\'inscription',
                'data' => (new \DateTimeImmutable('now'))->modify('+3 days')

            ])
            ->add('nbInscriptionMax', null, [
                'label' => 'Nombre maximum de participants',
                'data' => 10
            ])
            ->add('nbInscriptionMin', null, [
                'label' => 'Nombre minimum de participants',
                'data' => 2
            ])

            ->add('infos', null, [
                'label' => 'Description de l\'activité',
                'data' => "À l’approche de la fin du trimestre, la Salle Commune de Poufsouffle se transforme en un véritable repaire festif.
Les tentures jaunes et noires brillent d’un éclat chaleureux, et de délicieuses odeurs de tarte à la citrouille et de pain d’épices flottent déjà dans l’air.
Les élèves préparent une soirée conviviale autour d’un grand banquet improvisé, avec des jeux magiques, des devinettes sorcières et un concours amical de sorts lumineux.
Les rires résonneront sous les arches en pierre, et même le vieux tonneau d’entrée, d’ordinaire silencieux, semblera sourire aux invités.
Une fête fidèle à l’esprit Poufsouffle : généreuse, joyeuse et ouverte à tous, où chacun repartira le cœur aussi chaud qu’une tasse de Bièraubeurre."
            ])
            ->add('photo', null, [
                'label' => 'Photo de l\'activité'
            ])
            ->add('campus', EntityType::class, [
                'class' => Campus::class,
                'choice_label' => 'nom',
                'label' => 'Campus organisateur',
                'placeholder' => 'Sélectionnez un campus',

            ])
            ->add('interets', EntityType::class, [
                'class' => Interets::class,
                'choice_label' => 'nom',
                'label' => 'Catégorie d\'intérêt',
                'placeholder' => 'Choisissez une catégorie',

            ])
            ->add('lieu', EntityType::class, [
                'class' => Lieu::class,
                'choice_label' => 'nom',
                'label' => 'Catégorie de lieux',
                'placeholder' => 'Choisissez un lieu existant',


                'choice_attr' => function (Lieu $lieu) {
                    return [
                        'data-adresse'     => $lieu->getRue(),
                        'data-ville'       => $lieu->getVille()->getNom(),
                        'data-code-postal' => $lieu->getVille()->getCp(),
                    ];
                },

                // Hook Stimulus
                'attr' => [
                    'data-action' => 'change->lieu#onChange',
                    'data-lieu-target' => 'select',
                ],
            ])


            ->add('adresse', TextType::class, [
                'required' => false,
                'mapped' => false,
                'attr' => [
                    'readonly' => 'readonly',
                    'data-lieu-target' => 'adresse',
                ],
            ])
            ->add('ville', TextType::class, [
                'mapped' => false,
                'required' => false,
                'attr' => [
                    'readonly' => 'readonly',
                    'data-lieu-target' => 'ville',
                ],
            ])
            ->add('codePostal', TextType::class, [
                'mapped' => false,
                'required' => false,
                'attr' => [
                    'readonly' => 'readonly',
                    'data-lieu-target' => 'codePostal',
                ],
            ])

            ->add('create', SubmitType::class, [
                'label' => 'Enregistrer',
                'attr' => ['class' => 'cm-background-persian-green cm-text-charcoal'],
            ])
            ->add('cancel', SubmitType::class, [
                'label' => 'Annuler',
                'attr' => ['class' => ' uk-button-default cm-text-charcoal uk-margin-small-right'],
            ]);
    }

    public function configureOptions(OptionsResolver $resolver): void
    {
        $resolver->setDefaults([
            'data_class' => Sortie::class,

        ]);

    }
}
