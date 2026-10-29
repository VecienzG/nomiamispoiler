#!/usr/bin/env bash
# Crea dist/no-miami-spoiler-chrome-X.zip e dist/no-miami-spoiler-firefox-X.zip
set -euo pipefail
cd "$(dirname "$0")/.."

VERSION=$(python3 -c "import json;print(json.load(open('extension/manifest.json'))['version'])")
rm -rf dist && mkdir -p dist/firefox

# Chrome: tutto così com'è
(cd extension && zip -qr -X "../dist/no-miami-spoiler-chrome-$VERSION.zip" . -x '.*')

# Firefox: niente service worker né offscreen (l'AI di Chrome lì non esiste)
cp -R extension/. dist/firefox/
python3 - <<'EOF'
import json
p = 'dist/firefox/manifest.json'
m = json.load(open(p))
m['background'].pop('service_worker', None)
m['permissions'] = [x for x in m['permissions'] if x != 'offscreen']
json.dump(m, open(p, 'w'), indent=2, ensure_ascii=False)
EOF
rm dist/firefox/src/offscreen.*
(cd dist/firefox && zip -qr -X "../no-miami-spoiler-firefox-$VERSION.zip" . -x '.*')
rm -rf dist/firefox

ls -lh dist
