#!/usr/bin/env python3
"""엑셀(군 장병 할인업소 현황) → data/stores.json 변환 스크립트.

사용법:
    python3 scripts/convert.py [엑셀파일경로]

좌표(lat/lng)는 여기서 채우지 않는다. 브이월드 지오코더가 해외 IP를
차단하므로, 좌표는 tools/geocode.html(브라우저에서 실행)로 일괄 변환해
data/stores.json을 갱신하거나, 앱이 첫 로딩 시 자동으로 채운다.
기존 stores.json에 좌표가 있으면 (연번 기준) 보존한다.
"""
import glob
import json
import os
import re
import sys

import openpyxl

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_PATH = os.path.join(ROOT, "data", "stores.json")

# 업종 → 카테고리 코드 (복합 업종은 쉼표로 나뉘어 모두 부여됨)
CATEGORY_MAP = {
    "일반음식점": "food",
    "휴게음식점": "cafe",
    "미용업": "beauty",
    "목욕장업": "bath",
    "숙박업": "stay",
}


def find_excel() -> str:
    candidates = glob.glob(os.path.join(ROOT, "*.xlsx"))
    if not candidates:
        sys.exit("엑셀 파일(*.xlsx)을 찾을 수 없습니다.")
    return candidates[0]


def clean(value) -> str:
    if value is None:
        return ""
    return re.sub(r"\s+", " ", str(value)).strip()


def categories(raw: str) -> list[str]:
    cats = []
    for part in raw.replace("·", ",").split(","):
        code = CATEGORY_MAP.get(part.strip())
        if code and code not in cats:
            cats.append(code)
    return cats or ["etc"]


def main() -> None:
    excel_path = sys.argv[1] if len(sys.argv) > 1 else find_excel()

    # 기존 좌표 보존용
    old_coords = {}
    if os.path.exists(OUT_PATH):
        with open(OUT_PATH, encoding="utf-8") as f:
            for s in json.load(f)["stores"]:
                if s.get("lat") and s.get("lng"):
                    old_coords[s["id"]] = (s["lat"], s["lng"])

    wb = openpyxl.load_workbook(excel_path, data_only=True)
    ws = wb.active

    stores = []
    for row in ws.iter_rows(min_row=3, values_only=True):
        if row[0] is None or not clean(row[3]):
            continue
        sid = int(row[0])
        store = {
            "id": sid,
            "region": clean(row[1]),
            "cats": categories(clean(row[2])),
            "type": clean(row[2]),
            "name": clean(row[3]),
            "tel": clean(row[5]),
            "addr": clean(row[6]),
            "discount": clean(row[7]),
            "detail": clean(row[8]),
            "socialWorker": bool(clean(row[9])),
            "lat": None,
            "lng": None,
        }
        if sid in old_coords:
            store["lat"], store["lng"] = old_coords[sid]
        stores.append(store)

    os.makedirs(os.path.dirname(OUT_PATH), exist_ok=True)
    data = {
        "source": os.path.basename(excel_path),
        "count": len(stores),
        "stores": stores,
    }
    with open(OUT_PATH, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=1)

    geocoded = sum(1 for s in stores if s["lat"])
    print(f"{len(stores)}개 업소 변환 완료 (좌표 보유 {geocoded}개) → {OUT_PATH}")


if __name__ == "__main__":
    main()
