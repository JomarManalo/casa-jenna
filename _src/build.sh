#!/usr/bin/env bash
# Assemble Casa Jenna pages: _head + <page>.body + _foot, then fill placeholders.
set -e
B="$(cd "$(dirname "$0")" && pwd)"
OUT="$B/.."

export EMBLEM='<svg class="cj-mark" viewBox="612 700 712 245" fill="none" stroke="currentColor" stroke-width="13" aria-hidden="true"><path d="M750 790L922 715M1012 715L1183 790M788 778V917M895 724V917M1045 724V917M1150 778V917M895 760H1045M788 832H1150"/><rect x="620" y="917" width="695" height="20" fill="currentColor" stroke="none"/></svg>'
export ARROW='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>'
export ARROW_L='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 12H5M11 6l-6 6 6 6"/></svg>'

# page | title | description | body class | active key
pages=(
  "index|Casa Jenna — Private Resort in Mexico, Pampanga|Modern industrial private resort in Sitio Caingin, Laug, Mexico, Pampanga with a villa, function hall and swimming pool for up to 40 guests.|home|HOME"
  "villa|The Villa — Casa Jenna Private Resort|Living room with karaoke, equipped kitchen, dining area and private pool at Casa Jenna, Mexico, Pampanga.|page-villa|VILLA"
  "function-hall|Function Hall — Casa Jenna Private Resort|Air-conditioned function hall by the pool for events of up to 40 guests in Mexico, Pampanga.|page-hall|HALL"
  "gallery|Gallery — Casa Jenna Private Resort|Photos of the villa, function hall and swimming pool at Casa Jenna.|page-gallery|GALLERY"
  "contact|Book & Contact — Casa Jenna Private Resort|Book Casa Jenna: call or text 0917 542 6468. Sitio Caingin, Laug, Mexico, Pampanga.|page-contact|CONTACT"
)

for row in "${pages[@]}"; do
  IFS='|' read -r name title desc bodyclass active <<< "$row"
  [ -f "$B/$name.body.html" ] || { echo "skip $name (no body yet)"; continue; }
  export TITLE="$title" DESC="$desc" BODYCLASS="$bodyclass" ACTIVE="$active"
  cat "$B/_head.html" "$B/$name.body.html" "$B/_foot.html" | perl -pe '
    s/\{\{TITLE\}\}/$ENV{TITLE}/g; s/\{\{DESC\}\}/$ENV{DESC}/g; s/\{\{BODYCLASS\}\}/$ENV{BODYCLASS}/g;
    s/\{\{EMBLEM\}\}/$ENV{EMBLEM}/g; s/\{\{ARROW_L\}\}/$ENV{ARROW_L}/g; s/\{\{ARROW\}\}/$ENV{ARROW}/g;
    s/\{\{A_$ENV{ACTIVE}\}\}/current-menu-item page_item current_page_item/g; s/\{\{A_[A-Z]+\}\}//g;
  ' > "$OUT/$name.html"
  echo "built $name.html"
done
grep -l '{{' "$OUT"/*.html && echo "WARNING: unreplaced placeholders" || true
