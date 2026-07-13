// Leaflet 지도 + 브이월드 배경지도 + 마커 관리

let map;
let cluster;
const markersById = new Map();

function initMap() {
  map = L.map("map", {
    center: PAJU_CENTER,
    zoom: DEFAULT_ZOOM,
    zoomControl: false,
  });
  L.control.zoom({ position: "topright" }).addTo(map);

  const vworld = L.tileLayer(
    `https://api.vworld.kr/req/wmts/1.0.0/${VWORLD_KEY}/Base/{z}/{y}/{x}.png`,
    { maxZoom: 19, minZoom: 7, attribution: "© <a href='https://www.vworld.kr'>브이월드</a>" }
  ).addTo(map);

  // 브이월드 장애/차단 시 OSM으로 자동 전환 (성공 타일이 하나도 없을 때만)
  let anyLoaded = false, errors = 0;
  vworld.on("tileload", () => { anyLoaded = true; });
  vworld.on("tileerror", () => {
    if (anyLoaded || ++errors < 6) return;
    map.removeLayer(vworld);
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19, attribution: "© OpenStreetMap contributors",
    }).addTo(map);
  });

  cluster = L.markerClusterGroup({
    maxClusterRadius: 46,
    showCoverageOnHover: false,
    disableClusteringAtZoom: 16,
  });
  map.addLayer(cluster);
}

function makeIcon(store) {
  const cat = CATEGORIES[store.cats[0]] || CATEGORIES.etc;
  return L.divIcon({
    className: "store-marker",
    html: `<span style="background:${cat.color}">${cat.emoji}</span>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
}

function addMarker(store) {
  if (!store.lat || !store.lng || markersById.has(store.id)) return;
  const m = L.marker([store.lat, store.lng], { icon: makeIcon(store) });
  m.on("click", () => selectStore(store, { fromMap: true }));
  markersById.set(store.id, m);
}

// 필터 결과에 맞춰 표시 마커 갱신
function updateMarkers(stores) {
  cluster.clearLayers();
  const layers = [];
  for (const s of stores) {
    const m = markersById.get(s.id);
    if (m) layers.push(m);
  }
  cluster.addLayers(layers);
}

function fitToStores(stores) {
  const pts = stores.filter((s) => s.lat && s.lng).map((s) => [s.lat, s.lng]);
  if (!pts.length) return;
  map.fitBounds(L.latLngBounds(pts).pad(0.15), { maxZoom: 15 });
}

function panToStore(store) {
  if (!store.lat || !store.lng) return;
  map.setView([store.lat, store.lng], Math.max(map.getZoom(), 15));
}
