#!/bin/sh
# Runs at container start (nginx image's /docker-entrypoint.d/).
#
# With API_UPSTREAM set (the student site), nginx forwards /api/* to the API on
# the other server, so the browser only ever talks to this site's own domain -
# no CORS. /api/health is forwarded too, so calling it on this site checks the
# whole chain: this container -> the API's server -> the API -> its database.
# /api/portal-main-student/* (server-to-server, API key) is never forwarded.
# Without API_UPSTREAM (the staff site) nothing is proxied and the app calls
# its API directly.
#
#   API_UPSTREAM=https://office.eng.kps.ku.ac.th/kukps-eng-education-ssd-api
#   -> /api/x  =>  https://office.eng.kps.ku.ac.th/kukps-eng-education-ssd-api/api/x
set -e

conf=/etc/nginx/api-proxy/api.conf
map_conf=/etc/nginx/conf.d/api-health-map.conf
rm -f "$conf" "$map_conf"

[ -n "$API_UPSTREAM" ] || exit 0

upstream="${API_UPSTREAM%/}"

# When /api/health gets no usable answer from the API, say which hop failed,
# from the upstream timings ("-" = never happened; several values when the
# host has several addresses):
#   never connected            -> server A cannot reach the API's server
#   connected, no reply        -> the API (or its database) hangs
#   got a 502/504 back         -> the API's server is up but its api container is not
# A 503 is the API's own answer (e.g. database down) and passes through as is.
cat > "$map_conf" <<CONF
map "\$upstream_connect_time|\$upstream_header_time" \$api_health_failure {
    "~^[-,: ]*\\|"  unreachable;
    "~\\|[-,: ]*\$" no_reply;
    default        bad_gateway;
}

map \$api_health_failure \$api_health_message {
    unreachable  "web-public ทำงานปกติ แต่เชื่อมต่อไปยัง server ของ API ไม่ได้ - ตรวจสอบว่า server นี้ต่อถึง ${upstream} ได้ (DNS / firewall / server ปลายทางล่ม)";
    no_reply     "web-public เชื่อมต่อ server ของ API ได้ แต่ API ไม่ตอบภายในเวลาที่กำหนด - container api หรือฐานข้อมูลอาจค้างหรือช้าเกินไป";
    bad_gateway  "web-public เชื่อมต่อ server ของ API ได้ แต่ reverse proxy ที่นั่นตอบ \$upstream_status กลับมา - container api (kukps-eng-education-ssd-api) อาจหยุดทำงาน";
}
CONF

cat > "$conf" <<CONF
# Portal Main's server-to-server API - not for browsers.
location ^~ /api/portal-main-student {
    return 404;
}

location /api/ {
    proxy_pass ${upstream}/api/;
    proxy_ssl_server_name on;
    proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto \$scheme;
    proxy_connect_timeout 10s;
    proxy_read_timeout 60s;
    # Same limit as the API's PHP (Dockerfile.api).
    client_max_body_size 25m;
}

location = /api/health {
    proxy_pass ${upstream}/api/health;
    proxy_ssl_server_name on;
    proxy_connect_timeout 5s;
    proxy_read_timeout 10s;
    proxy_intercept_errors on;
    error_page 502 504 = @api_health_failed;
}

location @api_health_failed {
    default_type application/json;
    charset utf-8;
    charset_types application/json;
    return 502 '{"status":"error","service":"web-public","reason":"\$api_health_failure","message":"\$api_health_message","upstream":"${upstream}/api/health","upstream_status":"\$upstream_status"}\n';
}
CONF

echo "$0: proxying /api/ and /api/health to ${upstream}"
