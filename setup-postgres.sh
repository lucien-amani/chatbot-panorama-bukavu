#!/bin/bash
# ============================================================
#  setup-postgres.sh — Configuration PostgreSQL
#  Hôtel Panorama Bukavu
#  Exécuter: bash setup-postgres.sh
# ============================================================

set -e
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║  🏨  Setup PostgreSQL — Panorama Bukavu      ║"
echo "╚══════════════════════════════════════════════╝"
echo ""

# Variables
DB_NAME="panorama_bukavu"
DB_USER="panorama_user"
DB_PASS="panorama2026"

echo -e "${YELLOW}► Étape 1/4 : Création de la base de données et de l'utilisateur...${NC}"

sudo -u postgres psql <<EOF
-- Créer l'utilisateur si inexistant
DO \$\$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = '${DB_USER}') THEN
    CREATE USER ${DB_USER} WITH PASSWORD '${DB_PASS}';
    RAISE NOTICE 'Utilisateur ${DB_USER} créé.';
  ELSE
    ALTER USER ${DB_USER} WITH PASSWORD '${DB_PASS}';
    RAISE NOTICE 'Mot de passe ${DB_USER} mis à jour.';
  END IF;
END
\$\$;

-- Créer la base de données si inexistante
SELECT 'CREATE DATABASE ${DB_NAME} OWNER ${DB_USER}'
  WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '${DB_NAME}')
\gexec

-- Accorder tous les privilèges
GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER};
GRANT ALL ON SCHEMA public TO ${DB_USER};
EOF

echo -e "${GREEN}   ✅ Base de données '${DB_NAME}' et utilisateur '${DB_USER}' prêts.${NC}"
echo ""

echo -e "${YELLOW}► Étape 2/4 : Installation des dépendances backend...${NC}"
cd "$(dirname "$0")/panorama-backend"
npm install
echo -e "${GREEN}   ✅ Dépendances installées.${NC}"
echo ""

echo -e "${YELLOW}► Étape 3/4 : Migration Prisma (SQLite → PostgreSQL)...${NC}"
npx prisma migrate dev --name "migration_postgresql_initiale" --schema=./prisma/schema.prisma
echo -e "${GREEN}   ✅ Migration appliquée.${NC}"
echo ""

echo -e "${YELLOW}► Étape 4/4 : Insertion des données initiales (seed)...${NC}"
node prisma/seed.js
echo -e "${GREEN}   ✅ Seed terminé.${NC}"
echo ""

echo "╔══════════════════════════════════════════════╗"
echo "║  ✅  Setup terminé avec succès !             ║"
echo "╠══════════════════════════════════════════════╣"
echo "║  🐘  DB      : panorama_bukavu               ║"
echo "║  👤  User    : panorama_user                 ║"
echo "║  🔑  Pass    : panorama2026                  ║"
echo "╠══════════════════════════════════════════════╣"
echo "║  Démarrer le backend :                       ║"
echo "║  cd panorama-backend && npm run dev          ║"
echo "╚══════════════════════════════════════════════╝"
echo ""
