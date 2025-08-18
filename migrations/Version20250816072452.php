<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20250816072452 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE promo (id INT AUTO_INCREMENT NOT NULL, nom VARCHAR(255) NOT NULL, annee INT NOT NULL, cursus VARCHAR(255) NOT NULL, PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci`');
        $this->addSql('ALTER TABLE interets_user DROP FOREIGN KEY `FK_FB1F58F375621B20`');
        $this->addSql('ALTER TABLE interets_user ADD CONSTRAINT FK_FB1F58F375621B20 FOREIGN KEY (interets_id) REFERENCES interets (id)');
        $this->addSql('ALTER TABLE sortie ADD etat VARCHAR(255) NOT NULL, ADD date_heure_fin DATETIME NOT NULL, ADD archived TINYINT(1) DEFAULT 0 NOT NULL, ADD lieu_id INT NOT NULL');
        $this->addSql('ALTER TABLE sortie ADD CONSTRAINT FK_3C3FD3F26AB213CC FOREIGN KEY (lieu_id) REFERENCES lieu (id)');
        $this->addSql('CREATE INDEX IDX_3C3FD3F26AB213CC ON sortie (lieu_id)');
        $this->addSql('ALTER TABLE user ADD pseudo VARCHAR(180) DEFAULT NULL, ADD promo_id INT DEFAULT NULL, CHANGE photo photo VARCHAR(255) DEFAULT NULL, CHANGE campus_id campus_id INT DEFAULT NULL');
        $this->addSql('ALTER TABLE user ADD CONSTRAINT FK_8D93D649D0C07AFF FOREIGN KEY (promo_id) REFERENCES promo (id)');
        $this->addSql('CREATE INDEX IDX_8D93D649D0C07AFF ON user (promo_id)');
        $this->addSql('CREATE UNIQUE INDEX UNIQ_IDENTIFIER_PSEUDO ON user (pseudo)');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('DROP TABLE promo');
        $this->addSql('ALTER TABLE interets_user DROP FOREIGN KEY FK_FB1F58F375621B20');
        $this->addSql('ALTER TABLE interets_user ADD CONSTRAINT `FK_FB1F58F375621B20` FOREIGN KEY (interets_id) REFERENCES interets (id) ON UPDATE NO ACTION ON DELETE CASCADE');
        $this->addSql('ALTER TABLE sortie DROP FOREIGN KEY FK_3C3FD3F26AB213CC');
        $this->addSql('DROP INDEX IDX_3C3FD3F26AB213CC ON sortie');
        $this->addSql('ALTER TABLE sortie DROP etat, DROP date_heure_fin, DROP archived, DROP lieu_id');
        $this->addSql('ALTER TABLE `user` DROP FOREIGN KEY FK_8D93D649D0C07AFF');
        $this->addSql('DROP INDEX IDX_8D93D649D0C07AFF ON `user`');
        $this->addSql('DROP INDEX UNIQ_IDENTIFIER_PSEUDO ON `user`');
        $this->addSql('ALTER TABLE `user` DROP pseudo, DROP promo_id, CHANGE photo photo VARCHAR(255) NOT NULL, CHANGE campus_id campus_id INT NOT NULL');
    }
}
