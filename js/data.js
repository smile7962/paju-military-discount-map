// 업소 데이터 로딩 + 브이월드 지오코딩(좌표 없는 업소만, 브라우저에서 실행)

const GEO_CACHE_KEY = "paju_geo_cache_v1";

async function loadStores() {
  const res = await fetch("data/stores.json");
  if (!res.ok) throw new Error("data/stores.json 로딩 실패: " + res.status);
  const data = await res.json();
  return data.stores;
}

// 지오코딩용 주소 정제: "경기도 파주시 광탄면 혜음로 1117-1, 1층" → 쉼표 뒤/괄호 제거
function cleanAddress(addr) {
  return addr.split(",")[0].replace(/\(.*?\)/g, "").trim();
}

// 브이월드 REST API는 CORS를 허용하지 않으므로 JSONP로 호출한다.
function vworldJsonp(params) {
  return new Promise((resolve, reject) => {
    const cb = "vw_cb_" + Math.random().toString(36).slice(2);
    const timer = setTimeout(() => { cleanup(); reject(new Error("timeout")); }, 8000);
    function cleanup() {
      clearTimeout(timer);
      delete window[cb];
      script.remove();
    }
    window[cb] = (json) => { cleanup(); resolve(json); };
    const qs = new URLSearchParams({ ...params, key: VWORLD_KEY, format: "json", callback: cb });
    const script = document.createElement("script");
    script.src = "https://api.vworld.kr/req/address?" + qs;
    script.onerror = () => { cleanup(); reject(new Error("network")); };
    document.head.appendChild(script);
  });
}

async function geocodeOne(addr) {
  const address = cleanAddress(addr);
  for (const type of ["road", "parcel"]) {
    try {
      const json = await vworldJsonp({
        service: "address", request: "getcoord", version: "2.0",
        crs: "epsg:4326", type, address,
      });
      const point = json?.response?.result?.point;
      if (json?.response?.status === "OK" && point) {
        return { lat: parseFloat(point.y), lng: parseFloat(point.x) };
      }
    } catch (e) { /* 다음 타입/실패 처리로 진행 */ }
  }
  return null;
}

function loadGeoCache() {
  try { return JSON.parse(localStorage.getItem(GEO_CACHE_KEY)) || {}; }
  catch { return {}; }
}

function saveGeoCache(cache) {
  try { localStorage.setItem(GEO_CACHE_KEY, JSON.stringify(cache)); } catch { /* 저장 불가 시 무시 */ }
}

// 좌표 없는 업소를 병렬(5개)로 지오코딩. onProgress(완료수, 대상수), onFound(store) 콜백.
async function geocodeMissing(stores, onProgress, onFound) {
  const cache = loadGeoCache();
  const targets = stores.filter((s) => !s.lat || !s.lng);

  // 캐시 적중분 먼저 반영
  const remaining = [];
  for (const s of targets) {
    const hit = cache[s.addr];
    if (hit) {
      s.lat = hit[0]; s.lng = hit[1];
      onFound(s);
    } else {
      remaining.push(s);
    }
  }
  if (!remaining.length) { onProgress(targets.length, targets.length); return; }

  let done = targets.length - remaining.length;
  onProgress(done, targets.length);

  const queue = remaining.slice();
  async function worker() {
    while (queue.length) {
      const s = queue.shift();
      const pos = await geocodeOne(s.addr);
      if (pos) {
        s.lat = pos.lat; s.lng = pos.lng;
        cache[s.addr] = [pos.lat, pos.lng];
        onFound(s);
      }
      onProgress(++done, targets.length);
    }
  }
  await Promise.all(Array.from({ length: 5 }, worker));
  saveGeoCache(cache);
}
