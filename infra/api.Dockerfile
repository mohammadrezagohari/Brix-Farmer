FROM php:8.3-cli-bookworm
# Do not continue with incomplete package indexes after a mirror/network failure.
RUN set -eux; \
    sed -i 's|http://deb.debian.org|https://deb.debian.org|g' /etc/apt/sources.list.d/debian.sources; \
    apt-get -o Acquire::Retries=3 \
        -o Acquire::http::Timeout=30 -o Acquire::https::Timeout=30 \
        -o APT::Update::Error-Mode=any update; \
    apt-get -o Acquire::Retries=3 \
        -o Acquire::http::Timeout=30 -o Acquire::https::Timeout=30 \
        install -y --no-install-recommends libpq-dev libzip-dev unzip git; \
    docker-php-ext-install -j"$(nproc)" pdo_pgsql bcmath zip; \
    rm -rf /var/lib/apt/lists/*
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer
WORKDIR /app
COPY apps/api/composer.json apps/api/composer.lock ./
RUN --mount=type=cache,target=/root/.cache/composer composer install --no-interaction --prefer-dist --no-scripts
COPY apps/api/ .
RUN composer dump-autoload --optimize --no-interaction
CMD ["php", "artisan", "serve", "--host=0.0.0.0", "--port=8000"]
