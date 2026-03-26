# ──────────────────────────────────────────────────────────
# Dockerfile – Laravel Backend (PHP 8.2 FPM)
# Build context : racine du projet
# Structure : backend/ contient le Laravel
# ──────────────────────────────────────────────────────────
FROM php:8.2-fpm

ARG user=www
ARG uid=1000

# ── Dépendances système ────────────────────────────────────
RUN apt-get update && apt-get install -y \
    git \
    curl \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    libzip-dev \
    libpq-dev \
    zip \
    unzip \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# ── Extensions PHP ─────────────────────────────────────────
RUN docker-php-ext-install \
    pdo_mysql \
    mbstring \
    exif \
    pcntl \
    bcmath \
    gd \
    zip \
    opcache

# ── Composer ───────────────────────────────────────────────
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# ── Utilisateur non-root ───────────────────────────────────
RUN useradd -G www-data,root -u $uid -d /home/$user $user \
    && mkdir -p /home/$user/.composer \
    && chown -R $user:$user /home/$user

WORKDIR /var/www/html

# ── Étape 1 : composer.json/lock depuis backend/ ──────────
# (layer mis en cache si le code change mais pas les deps)
COPY --chown=$user:www-data backend/composer.json backend/composer.lock* ./

# ── Étape 2 : installer les dépendances PHP ───────────────
RUN composer install \
    --no-dev \
    --optimize-autoloader \
    --no-interaction \
    --no-scripts

# ── Étape 3 : copier tout le backend ──────────────────────
COPY --chown=$user:www-data backend/ .

# ── Étape 4 : exécuter les scripts post-install ───────────
RUN composer run-script post-autoload-dump 2>/dev/null || true

# ── Permissions Laravel ────────────────────────────────────
RUN chmod -R 755 storage bootstrap/cache \
    && chown -R $user:www-data storage bootstrap/cache

USER $user

EXPOSE 9000

CMD ["php-fpm"]
