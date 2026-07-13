// 필터 칩, 업소 목록, 상세 카드, 바텀시트 렌더링

const el = (id) => document.getElementById(id);

function renderRegionChips(stores, state) {
  const counts = {};
  for (const s of stores) counts[s.region] = (counts[s.region] || 0) + 1;
  const regions = REGION_ORDER.filter((r) => counts[r]);

  const chips = [chipHtml("", `전체 ${stores.length}`, state.region === "", "region")];
  for (const r of regions) {
    chips.push(chipHtml(r, `${r} ${counts[r]}`, state.region === r, "region"));
  }
  el("region-chips").innerHTML = chips.join("");
}

function renderCatChips(stores, state) {
  const base = stores.filter((s) => !state.region || s.region === state.region);
  const counts = {};
  for (const s of base) for (const c of s.cats) counts[c] = (counts[c] || 0) + 1;

  const chips = [chipHtml("", "전체", state.cat === "", "cat")];
  for (const [code, def] of Object.entries(CATEGORIES)) {
    if (!counts[code]) continue;
    chips.push(chipHtml(code, `${def.emoji} ${def.label} ${counts[code]}`, state.cat === code, "cat"));
  }
  chips.push(chipHtml("sw", "🪖 사회복무요원", state.sw, "sw"));
  el("cat-chips").innerHTML = chips.join("");
}

function chipHtml(value, label, active, group) {
  return `<button class="chip${active ? " active" : ""}" data-group="${group}" data-value="${value}">${label}</button>`;
}

function renderList(stores, state) {
  el("panel-title").textContent = `업소 ${stores.length}개`;
  if (!stores.length) {
    el("store-list").innerHTML = `<p class="empty">조건에 맞는 업소가 없습니다.</p>`;
    return;
  }
  el("store-list").innerHTML = stores.map((s) => {
    const cat = CATEGORIES[s.cats[0]] || CATEGORIES.etc;
    const located = s.lat && s.lng;
    return `
    <button class="store-item${state.selectedId === s.id ? " active" : ""}" data-id="${s.id}">
      <span class="store-cat" style="background:${cat.color}">${cat.emoji}</span>
      <span class="store-info">
        <strong>${escapeHtml(s.name)}</strong>
        <small>${escapeHtml(s.region)} · ${escapeHtml(s.discount)}${s.socialWorker ? " · 🪖" : ""}${located ? "" : " · <em>위치 미확인</em>"}</small>
      </span>
    </button>`;
  }).join("");
}

// 할인현황과 세부내역이 (공백 무시) 같으면 중복으로 간주
function sameDiscount(s) {
  const norm = (v) => String(v || "").replace(/\s/g, "");
  return !s.detail || norm(s.detail) === norm(s.discount);
}

function renderDetail(s) {
  const cat = CATEGORIES[s.cats[0]] || CATEGORIES.etc;
  const name = encodeURIComponent(s.name);
  const addr = encodeURIComponent(s.addr);
  // 좌표가 있으면 길찾기(도착지 지정), 없으면 지도 검색으로 대체
  const kakaoLink = s.lat
    ? `https://map.kakao.com/link/to/${name},${s.lat},${s.lng}`
    : `https://map.kakao.com/link/search/${addr}`;
  const naverLink = s.lat
    ? `https://map.naver.com/p/directions/-/${s.lng},${s.lat},${name}/-/car`
    : `https://map.naver.com/p/search/${addr}`;
  el("detail-body").innerHTML = `
    <h2><span class="store-cat" style="background:${cat.color}">${cat.emoji}</span> ${escapeHtml(s.name)}</h2>
    <p class="detail-meta">${escapeHtml(s.region)} · ${escapeHtml(s.type)}${s.socialWorker ? " · 🪖 사회복무요원 적용" : ""}</p>
    <p class="detail-discount"><strong>${escapeHtml(s.discount)}</strong>${sameDiscount(s) ? "" : `<br>${escapeHtml(s.detail)}`}</p>
    <p class="detail-addr">📍 ${escapeHtml(s.addr)}</p>
    ${s.tel ? `<div class="detail-actions">
      <a class="btn" href="tel:${s.tel.replace(/[^0-9]/g, "")}">📞 ${escapeHtml(s.tel)}</a>
    </div>` : ""}
    <div class="detail-actions detail-maps">
      <a class="btn btn-kakao" href="${kakaoLink}" target="_blank" rel="noopener">🧭 카카오맵</a>
      <a class="btn btn-naver" href="${naverLink}" target="_blank" rel="noopener">🧭 네이버지도</a>
    </div>`;
  el("detail").hidden = false;
}

function closeDetail() {
  el("detail").hidden = true;
}

function setPanelOpen(open) {
  document.body.classList.toggle("panel-open", open);
  if (map) setTimeout(() => map.invalidateSize(), 250);
}

function updateGeoProgress(done, total) {
  const box = el("geo-progress");
  if (done >= total) { box.hidden = true; return; }
  box.hidden = false;
  el("geo-progress-bar").style.width = `${Math.round((done / total) * 100)}%`;
  el("geo-progress-text").textContent = `업소 위치 확인 중… ${done}/${total}`;
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (ch) => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]
  ));
}
