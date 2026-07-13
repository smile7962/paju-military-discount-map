// 앱 상태 관리 및 초기화

let allStores = [];
const state = { region: "", cat: "", sw: false, q: "", selectedId: null };

function filteredStores() {
  const q = state.q.trim().toLowerCase();
  return allStores.filter((s) =>
    (!state.region || s.region === state.region) &&
    (!state.cat || s.cats.includes(state.cat)) &&
    (!state.sw || s.socialWorker) &&
    (!q || s.name.toLowerCase().includes(q))
  );
}

function applyFilters({ fit = false } = {}) {
  const stores = filteredStores();
  renderRegionChips(allStores, state);
  renderCatChips(allStores, state);
  renderList(stores, state);
  updateMarkers(stores);
  if (fit) fitToStores(stores);
  writeHash();
}

function selectStore(store, { fromMap = false } = {}) {
  state.selectedId = store.id;
  renderList(filteredStores(), state);
  renderDetail(store);
  if (!fromMap) panToStore(store);
  if (window.innerWidth < 768) setPanelOpen(false);
}

// ---- URL 해시 동기화 (#r=문산&c=food&sw=1&q=국밥) ----

function writeHash() {
  const p = new URLSearchParams();
  if (state.region) p.set("r", state.region);
  if (state.cat) p.set("c", state.cat);
  if (state.sw) p.set("sw", "1");
  if (state.q) p.set("q", state.q);
  const hash = p.toString();
  history.replaceState(null, "", hash ? "#" + hash : location.pathname);
}

function readHash() {
  const p = new URLSearchParams(location.hash.slice(1));
  state.region = p.get("r") || "";
  state.cat = p.get("c") || "";
  state.sw = p.get("sw") === "1";
  state.q = p.get("q") || "";
}

// ---- 이벤트 바인딩 ----

function bindEvents() {
  document.querySelector(".filters").addEventListener("click", (e) => {
    const chip = e.target.closest(".chip");
    if (!chip) return;
    const { group, value } = chip.dataset;
    if (group === "region") {
      state.region = value;
      state.cat = "";
      applyFilters({ fit: true });
    } else if (group === "cat") {
      state.cat = value;
      applyFilters({ fit: true });
    } else if (group === "sw") {
      state.sw = !state.sw;
      applyFilters();
    }
  });

  el("store-list").addEventListener("click", (e) => {
    const item = e.target.closest(".store-item");
    if (!item) return;
    const store = allStores.find((s) => s.id === Number(item.dataset.id));
    if (store) selectStore(store);
  });

  el("panel-handle").addEventListener("click", () => {
    setPanelOpen(!document.body.classList.contains("panel-open"));
  });

  el("detail-close").addEventListener("click", closeDetail);

  el("btn-search").addEventListener("click", () => {
    el("search-bar").hidden = false;
    el("search-input").focus();
  });
  el("search-close").addEventListener("click", () => {
    el("search-bar").hidden = true;
    state.q = "";
    el("search-input").value = "";
    applyFilters();
  });
  el("search-input").addEventListener("input", (e) => {
    state.q = e.target.value;
    applyFilters();
  });

  el("btn-locate").addEventListener("click", () => {
    navigator.geolocation?.getCurrentPosition(
      (pos) => map.setView([pos.coords.latitude, pos.coords.longitude], 14),
      () => alert("현재 위치를 가져올 수 없습니다.")
    );
  });
}

// ---- 초기화 ----

async function init() {
  initMap();
  readHash();
  bindEvents();

  try {
    allStores = await loadStores();
  } catch (err) {
    el("store-list").innerHTML = `<p class="empty">데이터를 불러오지 못했습니다.<br>${escapeHtml(err.message)}</p>`;
    return;
  }

  for (const s of allStores) addMarker(s);
  applyFilters({ fit: true });

  // 좌표 없는 업소는 백그라운드에서 지오코딩 후 지도에 추가
  let pending = 0;
  geocodeMissing(
    allStores,
    (done, total) => updateGeoProgress(done, total),
    (store) => {
      addMarker(store);
      if (++pending % 20 === 0) applyFilters();
    }
  ).then(() => applyFilters({ fit: true }));
}

init();
