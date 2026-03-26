# ──────────────────────────────────────────────────────────
# Dockerfile – Laravel Backend (PHP 8.2 FPM)
# Build context : racine du projet
# ──────────────────────────────────────────────────────────
FROM php:8.2-fpm

# Arguments
ARG user=www
ARG uid=1000

# Dépendances système
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

# Extensions PHP
RUN docker-php-ext-install \
    pdo_mysql \
    mbstring \
    exif \
    pcntl \
    bcmath \
    gd \
    zip \
    opcache

# Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Utilisateur non-root
RUN useradd -G www-data,root -u $uid -d /home/$user $user
RUN mkdir -p /home/$user/.composer && chown -R $user:$user /home/$user

# Répertoire de travail
WORKDIR /var/www/html

# Copier les fichiers du projet (sans frontend/)
COPY --chown=$user:www-data . .

# Installer les dépendances PHP
RUN composer install --no-dev --optimize-autoloader --no-interaction

# Permissions Laravel
RUN chown -R $user:www-data /var/www/html \
    && chmod -R 755 /var/www/html/storage \
    && chmod -R 755 /var/www/html/bootstrap/cache

USER $user

EXPOSE 9000

CMD ["php-fpm"]
