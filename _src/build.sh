#!/usr/bin/env bash
# Assemble Casa Jenna pages: _head + <page>.body + _foot, then fill placeholders.
# Also writes sitemap.xml and robots.txt for the domain in ../CNAME.
set -e
B="$(cd "$(dirname "$0")" && pwd)"
OUT="$B/.."
SITE="https://$(tr -d '[:space:]' < "$OUT/CNAME")"
TODAY="$(date +%F)"

export EMBLEM='<svg class="cj-mark" viewBox="612 700 712 245" fill="none" stroke="currentColor" stroke-width="13" aria-hidden="true"><path d="M750 790L922 715M1012 715L1183 790M788 778V917M895 724V917M1045 724V917M1150 778V917M895 760H1045M788 832H1150"/><rect x="620" y="917" width="695" height="20" fill="currentColor" stroke="none"/></svg>'
export ARROW='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>'
export ARROW_L='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 12H5M11 6l-6 6 6 6"/></svg>'

# page | title | description | body class | active key | share image (images/og/) | share image alt | breadcrumb name
pages=(
  "index|Casa Jenna — Private Resort in Mexico, Pampanga|Private resort in Mexico, Pampanga with a modern industrial villa, air-conditioned function hall and swimming pool — exclusive use for up to 40 guests.|home|HOME|home|Casa Jenna villa and swimming pool in Mexico, Pampanga|Home"
  "villa|The Villa — Casa Jenna Private Resort|Stay in the Casa Jenna villa: double-height living room with karaoke, equipped kitchen, dining area and a private pool in Mexico, Pampanga.|page-villa|VILLA|villa|Living room of the Casa Jenna villa|The villa"
  "function-hall|Function Hall — Casa Jenna Private Resort|Air-conditioned function hall by the pool for birthdays, reunions and company events of up to 40 guests in Mexico, Pampanga.|page-hall|HALL|function-hall|Casa Jenna function hall set up for an event|Function hall"
  "gallery|Gallery — Casa Jenna Private Resort|Photos of the villa, function hall, garden and swimming pool at Casa Jenna private resort in Mexico, Pampanga.|page-gallery|GALLERY|gallery|Swimming pool at Casa Jenna private resort|Gallery"
  "contact|Book &amp; Contact — Casa Jenna Private Resort|Book Casa Jenna private resort: call or text 0917 542 6468. Sitio Caingin, Laug, Mexico, Pampanga 2021, Philippines.|page-contact|CONTACT|contact|Garden at Casa Jenna private resort|Book & contact"
)

# Structured data: the resort itself (schema.org/Resort is a LodgingBusiness).
RESORT_JSON=$(cat <<JSON
{
  "@type": "Resort",
  "@id": "$SITE/#resort",
  "name": "Casa Jenna Private Resort",
  "alternateName": "Casa Jenna",
  "description": "Modern industrial private resort with a villa, air-conditioned function hall and swimming pool, booked for exclusive use by groups of up to 40 guests.",
  "url": "$SITE/",
  "telephone": "+63-917-542-6468",
  "image": [
    "$SITE/images/casa-jenna/banner.jpg",
    "$SITE/images/casa-jenna/pool-area.jpg",
    "$SITE/images/casa-jenna/function-hall.jpg",
    "$SITE/images/casa-jenna/living-room.jpg"
  ],
  "logo": "$SITE/icon-512.png",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "Sitio Caingin, Laug",
    "addressLocality": "Mexico",
    "addressRegion": "Pampanga",
    "postalCode": "2021",
    "addressCountry": "PH"
  },
  "geo": { "@type": "GeoCoordinates", "latitude": 15.0471827, "longitude": 120.767952 },
  "hasMap": "https://maps.app.goo.gl/NkSsiBD7RwmSyhVX7",
  "sameAs": [
    "https://www.facebook.com/profile.php?id=61583969881417",
    "https://www.instagram.com/casajennamexicopamp"
  ],
  "maximumAttendeeCapacity": 40,
  "amenityFeature": [
    { "@type": "LocationFeatureSpecification", "name": "Private swimming pool", "value": true },
    { "@type": "LocationFeatureSpecification", "name": "Air-conditioned function hall", "value": true },
    { "@type": "LocationFeatureSpecification", "name": "Karaoke", "value": true },
    { "@type": "LocationFeatureSpecification", "name": "Equipped kitchen", "value": true },
    { "@type": "LocationFeatureSpecification", "name": "Garden", "value": true }
  ]
}
JSON
)

for row in "${pages[@]}"; do
  IFS='|' read -r name title desc bodyclass active image imagealt crumb <<< "$row"
  [ -f "$B/$name.body.html" ] || { echo "skip $name (no body yet)"; continue; }

  if [ "$name" = index ]; then url="$SITE/"; else url="$SITE/$name"; fi

  # Home and contact carry the full business entity; every other page gets breadcrumbs.
  graph=""
  case "$name" in
    index)
      graph="$RESORT_JSON,
  { \"@type\": \"WebSite\", \"@id\": \"$SITE/#website\", \"url\": \"$SITE/\", \"name\": \"Casa Jenna Private Resort\", \"inLanguage\": \"en-PH\", \"publisher\": { \"@id\": \"$SITE/#resort\" } }" ;;
    contact)
      graph="$RESORT_JSON," ;;
  esac
  if [ "$name" != index ]; then
    graph="$graph
  { \"@type\": \"BreadcrumbList\", \"itemListElement\": [
    { \"@type\": \"ListItem\", \"position\": 1, \"name\": \"Home\", \"item\": \"$SITE/\" },
    { \"@type\": \"ListItem\", \"position\": 2, \"name\": \"$crumb\", \"item\": \"$url\" }
  ] }"
  fi
  jsonld="    <script type=\"application/ld+json\">
{ \"@context\": \"https://schema.org\", \"@graph\": [
$graph
] }
    </script>"

  export TITLE="$title" DESC="$desc" BODYCLASS="$bodyclass" ACTIVE="$active" \
         URL="$url" IMAGE="$SITE/images/og/$image.jpg" IMAGE_ALT="$imagealt" JSONLD="$jsonld"
  cat "$B/_head.html" "$B/$name.body.html" "$B/_foot.html" | perl -pe '
    s/\{\{TITLE\}\}/$ENV{TITLE}/g; s/\{\{DESC\}\}/$ENV{DESC}/g; s/\{\{BODYCLASS\}\}/$ENV{BODYCLASS}/g;
    s/\{\{URL\}\}/$ENV{URL}/g; s/\{\{IMAGE\}\}/$ENV{IMAGE}/g; s/\{\{IMAGE_ALT\}\}/$ENV{IMAGE_ALT}/g;
    s/\{\{JSONLD\}\}/$ENV{JSONLD}/g;
    s/\{\{EMBLEM\}\}/$ENV{EMBLEM}/g; s/\{\{ARROW_L\}\}/$ENV{ARROW_L}/g; s/\{\{ARROW\}\}/$ENV{ARROW}/g;
    s/\{\{A_$ENV{ACTIVE}\}\}/current-menu-item page_item current_page_item/g; s/\{\{A_[A-Z]+\}\}//g;
  ' > "$OUT/$name.html"
  echo "built $name.html"
done

# sitemap.xml
{
  echo '<?xml version="1.0" encoding="UTF-8"?>'
  echo '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
  for row in "${pages[@]}"; do
    name="${row%%|*}"
    if [ "$name" = index ]; then loc="$SITE/"; pri="1.0"; else loc="$SITE/$name"; pri="0.8"; fi
    printf '  <url><loc>%s</loc><lastmod>%s</lastmod><priority>%s</priority></url>\n' "$loc" "$TODAY" "$pri"
  done
  echo '</urlset>'
} > "$OUT/sitemap.xml"
echo "built sitemap.xml"

# robots.txt
printf 'User-agent: *\nAllow: /\nDisallow: /_src/\n\nSitemap: %s/sitemap.xml\n' "$SITE" > "$OUT/robots.txt"
echo "built robots.txt"

grep -l '{{' "$OUT"/*.html && echo "WARNING: unreplaced placeholders" || true
