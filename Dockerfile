# Image unique avec Nginx + PHP-FPM (Symfony prod)
FROM php:8.3-fpm-alpine

# Paquets système utiles + Nginx + Supervisor
RUN apk add --no-cache \
    nginx supervisor bash git unzip icu-dev libzip-dev \
    libpng-dev libjpeg-turbo-dev libwebp-dev libxml2-dev oniguruma-dev

# Extensions PHP courantes pour Symfony
RUN docker-php-ext-configure gd --with-jpeg --with-webp \
 && docker-php-ext-install pdo pdo_mysql intl zip opcache gd

# Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# IMPORTANT: Définir l'environnement AVANT de copier le code
ENV APP_ENV=prod
ENV APP_DEBUG=false

# Code app
WORKDIR /var/www/html
COPY . /var/www/html

# Dépendances PHP SANS les scripts automatiques pour éviter les conflits
RUN composer install --no-dev --optimize-autoloader --no-interaction --prefer-dist --no-scripts

# Cache management avec les bonnes variables d'environnement
RUN php bin/console cache:clear --env=prod --no-debug \
 && php bin/console cache:warmup --env=prod --no-debug

# Assets installation (remplace une partie des post-install-cmd)
RUN php bin/console assets:install public --env=prod --no-debug || true

# Config Nginx + Supervisor
COPY .deploy/nginx.conf /etc/nginx/nginx.conf
COPY .deploy/symfony.conf /etc/nginx/conf.d/default.conf
COPY .deploy/supervisord.conf /etc/supervisord.conf

# Permissions (cache/logs/assets)
RUN chown -R www-data:www-data var public

EXPOSE 80
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisord.conf"]