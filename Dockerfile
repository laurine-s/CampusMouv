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

# Variables d'environnement pour la production
ENV APP_ENV=prod
ENV APP_DEBUG=false

# Code app
WORKDIR /var/www/html
COPY . /var/www/html

# Dépendances PHP SANS les scripts automatiques pour éviter les conflits
RUN composer install --no-dev --optimize-autoloader --no-interaction --prefer-dist --no-scripts

# Créer les dossiers et permissions AVANT le cache (très important)
RUN mkdir -p /var/www/html/var/log /var/www/html/var/cache/prod/asset_mapper \
 && chown -R www-data:www-data /var/www/html/var/ \
 && chmod -R 775 /var/www/html/var/

# Cache management avec les bonnes variables d'environnement
RUN php bin/console cache:clear --env=prod --no-debug \
 && php bin/console cache:warmup --env=prod --no-debug

# Assets installation
RUN php bin/console assets:install public --env=prod --no-debug || true

# Config Nginx + Supervisor
COPY .deploy/nginx.conf /etc/nginx/nginx.conf
COPY .deploy/symfony.conf /etc/nginx/conf.d/default.conf
COPY .deploy/supervisord.conf /etc/supervisord.conf

# Permissions finales
RUN chown -R www-data:www-data /var/www/html/var/ /var/www/html/public/

# Étapes d'optimisation à ajouter dans votre Dockerfile

# Créer le fichier CSS manquant
RUN touch /var/www/html/assets/styles/app.css

# Compilation des assets AVANT le cache clear
RUN php bin/console asset-map:compile --env=prod || true

# Création des répertoires nécessaires avec permissions
RUN mkdir -p /var/www/html/var/log \
             /var/www/html/var/cache/prod \
             /var/www/html/var/sessions/prod \
             /var/www/html/public/assets \
    && chown -R www-data:www-data /var/www/html/var/ /var/www/html/public/ \
    && chmod -R 775 /var/www/html/var/ /var/www/html/public/

# Cache et warmup avec gestion d'erreur
RUN php bin/console cache:clear --env=prod --no-debug || true \
    && php bin/console cache:warmup --env=prod --no-debug || true

# Assets install avec gestion d'erreur
RUN php bin/console assets:install public --env=prod --no-debug || true

EXPOSE 80
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisord.conf"]