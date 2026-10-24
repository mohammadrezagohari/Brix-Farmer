#!/bin/sh
set -eu
probe_file="$(mktemp)"
trap 'rm -f "$probe_file"' EXIT
sed 's|https\?://deb\.debian\.org|https://mirror.arvancloud.ir|g' \
    /etc/apt/sources.list.d/debian.sources > "$probe_file"
grep -Fx 'URIs: https://mirror.arvancloud.ir/debian' "$probe_file"
grep -Fx 'URIs: https://mirror.arvancloud.ir/debian-security' "$probe_file"
grep -Fx 'Suites: bookworm bookworm-updates' "$probe_file"
grep -Fx 'Suites: bookworm-security' "$probe_file"
grep -Fx 'Signed-By: /usr/share/keyrings/debian-archive-keyring.gpg' "$probe_file"
