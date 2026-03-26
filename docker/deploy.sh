#!/bin/bash
# ═══════════════════════════════════════════════════════════
# deploy.sh – Script de déploiement Parc Informatique Docker
# IP : 192.168.1.45 | Backend : :8002 | Frontend : :5173
# Usage : cd docker && bash deploy.sh
# ═══════════════════════════════════════════════════════════

set -e  # Arrêter en cas d'erreur

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log()    { echo -e "${BLUE}[INFO]${NC}  $1"; }
success(){ echo -e "${GREEN}[OK]${NC}    $1"; }
warn()   { echo -e "${YELLOW}[WARN]${NC}  $1"; }
error()  { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

echo ""
echo -e "${BLUE}╔══════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║      Parc Informatique – Déploiement Docker  ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════╝${NC}"
echo ""

# ── Vérification : s'assurer qu'on est dans /docker ───────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"
log "Répertoire de travail : $SCRIPT_DIR"

# ── Vérification Docker ────────────────────────────────────
command -v docker >/dev/null 2>&1 || error "Docker n'est pas installé."

COMPOSE_CMD="docker compose"
docker compose version >/dev/null 2>&1 || COMPOSE_CMD="docker-compose"
docker-compose version >/dev/null 2>&1 2>&1 || true
$COMPOSE_CMD version >/dev/null 2>&1 || error "Docker Compose n'est pas installé."
success "Docker Compose détecté : $COMPOSE_CMD"

# ── Copier le .env si absent ──────────────────────────────
if [ ! -f "../.env" ]; then
    warn ".env introuvable, copie depuis .env.example..."
    cp ../.env.example ../.env 2>/dev/null || warn "Pas de .env.example trouvé."
else
    success ".env trouvé."
fi

# ── Arrêter les anciens conteneurs ────────────────────────
log "Arrêt des conteneurs existants..."
$COMPOSE_CMD down --remove-orphans 2>/dev/null || true
success "Conteneurs arrêtés."

# ── Construction des images ────────────────────────────────
log "Construction des images Docker (--no-cache)..."
$COMPOSE_CMD build --no-cache
success "Images construites."

# ── Démarrage des services ─────────────────────────────────
log "Démarrage des services..."
$COMPOSE_CMD up -d
success "Services démarrés."

# ── Attente MySQL ──────────────────────────────────────────
log "Attente de MySQL..."
attempt=0
max_attempts=30
until $COMPOSE_CMD exec -T db mysqladmin ping -h"localhost" -u"root" -proot --silent 2>/dev/null; do
    attempt=$((attempt + 1))
    if [ $attempt -ge $max_attempts ]; then
        error "MySQL n'a pas démarré après ${max_attempts} tentatives."
    fi
    echo -n "."
    sleep 2
done
echo ""
success "MySQL est prêt."

# ── Clé d'application ─────────────────────────────────────
log "Génération de la clé d'application..."
$COMPOSE_CMD exec -T app php artisan key:generate --force
success "Clé générée."

# ── Migrations Laravel ─────────────────────────────────────
log "Exécution des migrations..."
$COMPOSE_CMD exec -T app php artisan migrate --force
success "Migrations terminées."

# ── Cache de configuration ─────────────────────────────────
log "Mise en cache de la configuration..."
$COMPOSE_CMD exec -T app php artisan config:cache
$COMPOSE_CMD exec -T app php artisan route:cache
$COMPOSE_CMD exec -T app php artisan view:cache
success "Cache créé."

# ── Permissions storage ────────────────────────────────────
log "Application des permissions..."
$COMPOSE_CMD exec -T app chmod -R 775 storage bootstrap/cache
$COMPOSE_CMD exec -T app chown -R www:www-data storage bootstrap/cache
success "Permissions appliquées."

# ── Vérification des conteneurs ────────────────────────────
log "État des conteneurs :"
$COMPOSE_CMD ps

echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║           Déploiement terminé avec succès !       ║${NC}"
echo -e "${GREEN}╠══════════════════════════════════════════════════╣${NC}"
echo -e "${GREEN}║  🌐 Frontend  : http://192.168.1.45:5173          ║${NC}"
echo -e "${GREEN}║  🔧 Backend   : http://192.168.1.45:8002          ║${NC}"
echo -e "${GREEN}║  📡 API       : http://192.168.1.45:8002/api      ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════╝${NC}"
echo ""
