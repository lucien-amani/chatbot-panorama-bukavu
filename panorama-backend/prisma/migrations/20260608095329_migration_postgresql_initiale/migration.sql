-- CreateTable
CREATE TABLE "Utilisateur" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "nom_affiche" TEXT NOT NULL,
    "url_avatar" TEXT,
    "est_admin" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Utilisateur_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Profil" (
    "id" TEXT NOT NULL,
    "utilisateur_id" TEXT NOT NULL,
    "telephone" TEXT NOT NULL,
    "type_document_identite" TEXT NOT NULL,
    "numero_document_identite" TEXT NOT NULL,
    "nationalite" TEXT NOT NULL,
    "pays_residence" TEXT NOT NULL,

    CONSTRAINT "Profil_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TypeChambre" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "description" TEXT,
    "prix_base_nuit" DOUBLE PRECISION NOT NULL,
    "capacite_adultes" INTEGER NOT NULL,
    "capacite_enfants" INTEGER NOT NULL,
    "equipements" TEXT,

    CONSTRAINT "TypeChambre_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Chambre" (
    "id" TEXT NOT NULL,
    "numero_chambre" TEXT NOT NULL,
    "type_chambre_id" TEXT NOT NULL,
    "etage" INTEGER,
    "statut" TEXT NOT NULL,
    "notes" TEXT,

    CONSTRAINT "Chambre_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reservation" (
    "id" TEXT NOT NULL,
    "utilisateur_id" TEXT NOT NULL,
    "statut" TEXT NOT NULL,
    "montant_total" DOUBLE PRECISION,
    "date_arrivee" TIMESTAMP(3) NOT NULL,
    "date_depart" TIMESTAMP(3) NOT NULL,
    "nombre_voyageurs" INTEGER,
    "demandes_speciales" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Reservation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LigneReservation" (
    "id" TEXT NOT NULL,
    "reservation_id" TEXT NOT NULL,
    "chambre_id" TEXT NOT NULL,
    "prix_par_nuit" DOUBLE PRECISION NOT NULL,
    "lit_supplementaire" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "LigneReservation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Plat" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "description" TEXT,
    "categorie" TEXT NOT NULL,
    "prix" DOUBLE PRECISION NOT NULL,
    "disponible" BOOLEAN NOT NULL DEFAULT true,
    "url_image" TEXT,

    CONSTRAINT "Plat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Commande" (
    "id" TEXT NOT NULL,
    "utilisateur_id" TEXT NOT NULL,
    "reservation_id" TEXT,
    "chambre_id" TEXT,
    "type_commande" TEXT NOT NULL,
    "statut" TEXT NOT NULL,
    "montant_total" DOUBLE PRECISION,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Commande_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LigneCommande" (
    "id" TEXT NOT NULL,
    "commande_id" TEXT NOT NULL,
    "type_article" TEXT NOT NULL,
    "plat_id" TEXT,
    "nom_article" TEXT NOT NULL,
    "quantite" INTEGER NOT NULL,
    "prix_unitaire" DOUBLE PRECISION NOT NULL,
    "instructions_speciales" TEXT,

    CONSTRAINT "LigneCommande_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JournalChat" (
    "id" TEXT NOT NULL,
    "utilisateur_id" TEXT,
    "session_id" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "contenu" TEXT NOT NULL,
    "nom_fonction" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JournalChat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "commande_id" TEXT,
    "reservation_id" TEXT,
    "type" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "est_lue" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Utilisateur_email_key" ON "Utilisateur"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Profil_utilisateur_id_key" ON "Profil"("utilisateur_id");

-- CreateIndex
CREATE UNIQUE INDEX "TypeChambre_nom_key" ON "TypeChambre"("nom");

-- CreateIndex
CREATE UNIQUE INDEX "Chambre_numero_chambre_key" ON "Chambre"("numero_chambre");

-- CreateIndex
CREATE INDEX "Chambre_statut_idx" ON "Chambre"("statut");

-- CreateIndex
CREATE INDEX "Chambre_type_chambre_id_idx" ON "Chambre"("type_chambre_id");

-- CreateIndex
CREATE INDEX "Reservation_utilisateur_id_idx" ON "Reservation"("utilisateur_id");

-- CreateIndex
CREATE INDEX "Reservation_statut_idx" ON "Reservation"("statut");

-- CreateIndex
CREATE INDEX "Reservation_date_arrivee_date_depart_idx" ON "Reservation"("date_arrivee", "date_depart");

-- CreateIndex
CREATE INDEX "LigneReservation_reservation_id_idx" ON "LigneReservation"("reservation_id");

-- CreateIndex
CREATE INDEX "LigneReservation_chambre_id_idx" ON "LigneReservation"("chambre_id");

-- CreateIndex
CREATE UNIQUE INDEX "Plat_nom_key" ON "Plat"("nom");

-- CreateIndex
CREATE INDEX "Plat_categorie_idx" ON "Plat"("categorie");

-- CreateIndex
CREATE INDEX "Plat_disponible_idx" ON "Plat"("disponible");

-- CreateIndex
CREATE INDEX "Commande_utilisateur_id_idx" ON "Commande"("utilisateur_id");

-- CreateIndex
CREATE INDEX "Commande_reservation_id_idx" ON "Commande"("reservation_id");

-- CreateIndex
CREATE INDEX "Commande_statut_idx" ON "Commande"("statut");

-- CreateIndex
CREATE INDEX "Commande_type_commande_idx" ON "Commande"("type_commande");

-- CreateIndex
CREATE INDEX "LigneCommande_commande_id_idx" ON "LigneCommande"("commande_id");

-- CreateIndex
CREATE INDEX "LigneCommande_plat_id_idx" ON "LigneCommande"("plat_id");

-- CreateIndex
CREATE INDEX "JournalChat_session_id_idx" ON "JournalChat"("session_id");

-- CreateIndex
CREATE INDEX "JournalChat_utilisateur_id_idx" ON "JournalChat"("utilisateur_id");

-- CreateIndex
CREATE INDEX "Notification_type_idx" ON "Notification"("type");

-- CreateIndex
CREATE INDEX "Notification_est_lue_idx" ON "Notification"("est_lue");

-- AddForeignKey
ALTER TABLE "Profil" ADD CONSTRAINT "Profil_utilisateur_id_fkey" FOREIGN KEY ("utilisateur_id") REFERENCES "Utilisateur"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Chambre" ADD CONSTRAINT "Chambre_type_chambre_id_fkey" FOREIGN KEY ("type_chambre_id") REFERENCES "TypeChambre"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_utilisateur_id_fkey" FOREIGN KEY ("utilisateur_id") REFERENCES "Utilisateur"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LigneReservation" ADD CONSTRAINT "LigneReservation_reservation_id_fkey" FOREIGN KEY ("reservation_id") REFERENCES "Reservation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LigneReservation" ADD CONSTRAINT "LigneReservation_chambre_id_fkey" FOREIGN KEY ("chambre_id") REFERENCES "Chambre"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Commande" ADD CONSTRAINT "Commande_utilisateur_id_fkey" FOREIGN KEY ("utilisateur_id") REFERENCES "Utilisateur"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Commande" ADD CONSTRAINT "Commande_reservation_id_fkey" FOREIGN KEY ("reservation_id") REFERENCES "Reservation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Commande" ADD CONSTRAINT "Commande_chambre_id_fkey" FOREIGN KEY ("chambre_id") REFERENCES "Chambre"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LigneCommande" ADD CONSTRAINT "LigneCommande_commande_id_fkey" FOREIGN KEY ("commande_id") REFERENCES "Commande"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LigneCommande" ADD CONSTRAINT "LigneCommande_plat_id_fkey" FOREIGN KEY ("plat_id") REFERENCES "Plat"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JournalChat" ADD CONSTRAINT "JournalChat_utilisateur_id_fkey" FOREIGN KEY ("utilisateur_id") REFERENCES "Utilisateur"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_commande_id_fkey" FOREIGN KEY ("commande_id") REFERENCES "Commande"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_reservation_id_fkey" FOREIGN KEY ("reservation_id") REFERENCES "Reservation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
