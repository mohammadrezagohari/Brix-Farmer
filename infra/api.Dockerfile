FROM php:8.3-cli
RUN apt-get update && apt-get install -y libpq-dev libzip-dev unzip git && docker-php-ext-install pdo_pgsql bcmath zip
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer
WORKDIR /app
COPY apps/api/composer.json apps/api/composer.lock ./
RUN --mount=type=cache,target=/root/.cache/composer composer install --no-interaction --prefer-dist --no-scripts
COPY apps/api/ .
RUN composer dump-autoload --optimize --no-interaction
CMD ["php", "artisan", "serve", "--host=0.0.0.0", "--port=8000"]
