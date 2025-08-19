<?php

namespace App\Entity;

use App\Enum\Etat;
use App\Repository\SortieRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: SortieRepository::class)]
class Sortie
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 255)]
    private ?string $nom = null;

    #[ORM\Column]
    private ?\DateTimeImmutable $dateHeureDebut = null;

    #[ORM\Column]
    private ?int $duree = null;

    #[ORM\Column]
    private ?\DateTimeImmutable $dateLimiteInscription = null;

    #[ORM\Column(nullable: true)]
    private ?int $nbInscriptionMax = null;

    #[ORM\Column(nullable: true)]
    private ?int $nbInscriptionMin = null;

    #[ORM\Column]
    private ?int $nbInscrits = null;

    #[ORM\Column(type: Types::TEXT)]
    private ?string $infos = null;

    #[ORM\Column(length: 255, nullable: true)]
    private ?string $photo = null;

    #[ORM\ManyToOne(inversedBy: 'sorties')]
    #[ORM\JoinColumn(nullable: false)]
    private ?Campus $campus = null;

    #[ORM\ManyToOne(inversedBy: 'sorties')]
    private ?Interets $interets = null;

    #[ORM\ManyToOne(inversedBy: 'sorties')]
    #[ORM\JoinColumn(nullable: true, onDelete: 'SET NULL')]
    private ?User $organisateur = null;

    /**
     * @var Collection<int, User>
     */
    #[ORM\ManyToMany(targetEntity: User::class, inversedBy: 'sorties' )]
    private Collection $participants;

    // Lien avec l'enum Etat
    #[ORM\Column(enumType: Etat::class)]
    private ?Etat $etat = null;

    #[ORM\ManyToOne(inversedBy: 'sorties')]
    #[ORM\JoinColumn(nullable: false)]
    private ?Lieu $lieu = null;

    #[ORM\Column(type: 'datetime_immutable', nullable: false)]
    private ?\DateTimeImmutable $dateHeureFin = null;

    #[ORM\Column(type: 'boolean', options: ['default' => false])]
    private bool $archived = false;

    public function __construct()
    {
        $this->participants = new ArrayCollection();
        $this->nbInscrits = 1;
        $this->etat = Etat::CREEE;
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getNom(): ?string
    {
        return $this->nom;
    }

    public function setNom(string $nom): static
    {
        $this->nom = $nom;

        return $this;
    }

    public function getDateHeureDebut(): ?\DateTimeImmutable
    {
        return $this->dateHeureDebut;
    }

    public function setDateHeureDebut(\DateTimeImmutable $dateHeureDebut): static
    {
        $this->dateHeureDebut = $dateHeureDebut;
        $this->refreshDateHeureFin(); // garde dateHeureFin en phase
        return $this;
    }

    public function getDuree(): ?int
    {
        return $this->duree;
    }

    public function setDuree(int $duree): static
    {
        $this->duree = $duree;
        $this->refreshDateHeureFin(); // garde dateHeureFin en phase
        return $this;
    }

    public function getDateLimiteInscription(): ?\DateTimeImmutable
    {
        return $this->dateLimiteInscription;
    }

    public function setDateLimiteInscription(\DateTimeImmutable $dateLimiteInscription): static
    {
        $this->dateLimiteInscription = $dateLimiteInscription;

        return $this;
    }

    public function getNbInscriptionMax(): ?int
    {
        return $this->nbInscriptionMax;
    }

    public function setNbInscriptionMax(?int $nbInscriptionMax): static
    {
        $this->nbInscriptionMax = $nbInscriptionMax;

        return $this;
    }

    public function getNbInscriptionMin(): ?int
    {
        return $this->nbInscriptionMin;
    }

    public function setNbInscriptionMin(?int $nbInscriptionMin): static
    {
        $this->nbInscriptionMin = $nbInscriptionMin;

        return $this;
    }

    public function getNbInscrits(): ?int
    {
        return $this->nbInscrits;
    }

    public function setNbInscrits(int $nbInscrits): static
    {
        $this->nbInscrits = $nbInscrits;

        return $this;
    }

    public function getInfos(): ?string
    {
        return $this->infos;
    }

    public function setInfos(string $infos): static
    {
        $this->infos = $infos;

        return $this;
    }

    public function getPhoto(): ?string
    {
        return $this->photo;
    }

    public function setPhoto(?string $photo): static
    {
        $this->photo = $photo;

        return $this;
    }

    public function getCampus(): ?Campus
    {
        return $this->campus;
    }

    public function setCampus(?Campus $campus): static
    {
        $this->campus = $campus;

        return $this;
    }

    public function getInterets(): ?Interets
    {
        return $this->interets;
    }

    public function setInterets(?Interets $interets): static
    {
        $this->interets = $interets;

        return $this;
    }

    public function getOrganisateur(): ?User
    {
        return $this->organisateur;
    }

    public function setOrganisateur(?User $organisateur): static
    {
        $this->organisateur = $organisateur;

        return $this;
    }

    /**
     * @return Collection<int, User>
     */
    public function getParticipants(): Collection
    {
        return $this->participants;
    }

    public function addParticipant(User $participant): static
    {
        if (!$this->participants->contains($participant)) {
            $this->participants->add($participant);
        }

        return $this;
    }

    public function removeParticipant(User $participant): static
    {
        $this->participants->removeElement($participant);

        return $this;
    }

    // Getter et setter pour l'état
    public function getEtat(): ?Etat
    {
        return $this->etat;
    }

    public function setEtat(Etat $etat): static
    {
        $this->etat = $etat;
        return $this;
    }

    public function getLieu(): ?Lieu
    {
        return $this->lieu;
    }

    public function setLieu(?Lieu $lieu): static
    {
        $this->lieu = $lieu;

        return $this;
    }
    public function getDateHeureFin(): \DateTimeImmutable
    {
        // sécurité : si non encore calculé (ex. entité fraîche)
        if (!$this->dateHeureFin) { $this->refreshDateHeureFin(); }
        return $this->dateHeureFin;
    }

    public function isArchived(): bool { return $this->archived; }
    public function setArchived(bool $archived): static { $this->archived = $archived; return $this; }

    /**
     * Recalcule dateHeureFin depuis dateHeureDebut + duree (minutes).
     * Appelé depuis setters et lifecycle callbacks.
     */
    private function refreshDateHeureFin(): void
    {
        if ($this->dateHeureDebut && $this->duree !== null) {
            $this->dateHeureFin = $this->dateHeureDebut->modify('+' . (int)$this->duree . ' minutes');
        }
    }

    #[ORM\PrePersist]
    #[ORM\PreUpdate]
    public function onPersistOrUpdate(): void
    {
        $this->refreshDateHeureFin();
    }
}
