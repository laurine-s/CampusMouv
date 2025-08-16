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

# Code app
WORKDIR /var/www/html
COPY . /var/www/html

# Dépendances PHP + cache warmup (sans faire échouer le build si pas de DB)
RUN composer install --no-dev --optimize-autoloader --no-interaction --prefer-dist \
 && php bin/console cache:clear --env=prod || true \
 && php bin/console cache:warmup --env=prod || true

RUN composer run-script post-install-cmd

# Config Nginx + Supervisor
COPY .deploy/nginx.conf /etc/nginx/nginx.conf
COPY .deploy/symfony.conf /etc/nginx/conf.d/default.conf
COPY .deploy/supervisord.conf /etc/supervisord.conf

# Permissions (cache/logs/assets)
RUN chown -R www-data:www-data var public

EXPOSE 80
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisord.conf"]
