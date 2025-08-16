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

# --- Utilisateur non-root ---
# Groupe + user (UID/GID stables pour les volumes)
RUN addgroup -g 10001 web \
 && adduser -D -G web -u 10001 webapp

# Dossiers runtime + logs (crés au build, mais on refera au démarrage)
RUN mkdir -p /run/nginx /run/php-fpm /var/log/nginx /var/log/php-fpm /var/log/supervisor /var/lib/nginx \
 && chown -R webapp:web /run /var/log/nginx /var/log/php-fpm /var/log/supervisor /var/lib/nginx

# Code app
WORKDIR /var/www/html
COPY . /var/www/html

# Dépendances PHP + cache warmup (sans faire échouer le build si pas de DB)
ENV APP_ENV=prod APP_DEBUG=0 COMPOSER_ALLOW_SUPERUSER=1
RUN composer install --no-dev --optimize-autoloader --no-interaction --prefer-dist \
 && php bin/console cache:clear --env=prod  \
 && php bin/console cache:warmup --env=prod

# Config Nginx + Supervisor
COPY .deploy/nginx.conf /etc/nginx/nginx.conf
COPY .deploy/symfony.conf /etc/nginx/conf.d/default.conf
COPY .deploy/supervisord.conf /etc/supervisord.conf

# --- PHP-FPM pool non-root + socket unix ---
# Le fichier pool Alpine/official est /usr/local/etc/php-fpm.d/www.conf
RUN sed -ri 's/^user = .*/user = webapp/' /usr/local/etc/php-fpm.d/www.conf \
 && sed -ri 's/^group = .*/group = web/' /usr/local/etc/php-fpm.d/www.conf \
 && sed -ri 's|^listen = .*|listen = /run/php-fpm/php-fpm.sock|' /usr/local/etc/php-fpm.d/www.conf \
 && awk 'BEGIN{print "listen.owner = webapp\nlisten.group = web\nlisten.mode = 0660"}' >> /usr/local/etc/php-fpm.d/www.conf

# --- Port d'écoute Nginx en 8080 (non-root) ---
# Adapte la conf vhost si besoin (remplace listen 80 par 8080)
RUN sed -ri 's/\blisten\s+80\b/listen 8080/g' /etc/nginx/conf.d/default.conf || true

# --- Script de démarrage : prépare /run/* puis lance supervisord ---
COPY .deploy/start.sh /usr/local/bin/start.sh
RUN chmod +x /usr/local/bin/start.sh
CMD ["/usr/local/bin/start.sh"]

# Permissions app (cache/logs/assets)
RUN chown -R webapp:web /var/www/html/var /var/www/html/public || true

EXPOSE 8080
CMD ["/usr/local/bin/start.sh"]
