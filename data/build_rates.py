#!/usr/bin/env python3
"""Parse the official IFTA Q2 2026 CSV -> rates.json (US diesel only)."""
import csv, json, sys, re

SRC_URL = "https://www.iftach.org/taxmatrix/charts/2Q2026.csv"
FETCHED = "2026-07-10"
CSV_PATH = sys.argv[1]
OUT_PATH = sys.argv[2]

# full jurisdiction name -> USPS code (48 IFTA US member states; AK/HI/DC are NOT IFTA)
NAME2CODE = {
    "ALABAMA":"AL","ARIZONA":"AZ","ARKANSAS":"AR","CALIFORNIA":"CA","COLORADO":"CO",
    "CONNECTICUT":"CT","DELAWARE":"DE","FLORIDA":"FL","GEORGIA":"GA","IDAHO":"ID",
    "ILLINOIS":"IL","INDIANA":"IN","IOWA":"IA","KANSAS":"KS","KENTUCKY":"KY",
    "LOUISIANA":"LA","MAINE":"ME","MARYLAND":"MD","MASSACHUSETTS":"MA","MICHIGAN":"MI",
    "MINNESOTA":"MN","MISSISSIPPI":"MS","MISSOURI":"MO","MONTANA":"MT","NEBRASKA":"NE",
    "NEVADA":"NV","NEW HAMPSHIRE":"NH","NEW JERSEY":"NJ","NEW MEXICO":"NM","NEW YORK":"NY",
    "NORTH CAROLINA":"NC","NORTH DAKOTA":"ND","OHIO":"OH","OKLAHOMA":"OK","OREGON":"OR",
    "PENNSYLVANIA":"PA","RHODE ISLAND":"RI","SOUTH CAROLINA":"SC","SOUTH DAKOTA":"SD",
    "TENNESSEE":"TN","TEXAS":"TX","UTAH":"UT","VERMONT":"VT","VIRGINIA":"VA",
    "WASHINGTON":"WA","WEST VIRGINIA":"WV","WISCONSIN":"WI","WYOMING":"WY",
}
CODE2NAME = {v:k.title() for k,v in NAME2CODE.items()}

DIESEL_COL = 3  # 0=name, 1=currency, 2=Gasoline, 3=Special Diesel

def money(cell):
    """'$ 0.5240 ' -> 0.524 ; '$-' or '' -> None"""
    s = cell.strip()
    if s in ("$-", "$ -", "-", "", "$"):
        return None
    m = re.search(r"-?\d+\.?\d*", s.replace("$", "").replace(",", ""))
    return round(float(m.group()), 4) if m else None

rows = list(csv.reader(open(CSV_PATH, newline="", encoding="utf-8-sig")))

# clean a jurisdiction label: strip '#NN', 'SurChg', trailing spaces
def base_name(raw):
    n = re.sub(r"#\s*\d+", "", raw)
    n = re.sub(r"\bSurChg\b", "", n, flags=re.I)
    return n.strip().upper()

diesel = {}     # code -> rate
surch  = {}     # code -> surcharge rate
for r in rows:
    if len(r) <= DIESEL_COL: continue
    name_raw = r[0].strip()
    if not name_raw: continue
    if r[1].strip() != "U.S.": continue  # only the U.S.-dollar row
    is_sur = bool(re.search(r"SurChg", name_raw, re.I))
    nm = base_name(name_raw)
    code = NAME2CODE.get(nm)
    if not code: continue  # skip Canadian provinces / non-members
    val = money(r[DIESEL_COL])
    if is_sur:
        surch[code] = val if val is not None else 0.0
    else:
        diesel[code] = val if val is not None else 0.0  # Oregon -> 0.0

jur = {}
for code in sorted(diesel):
    jur[code] = {
        "name": CODE2NAME[code],
        "rate": diesel[code],
        "surcharge": round(surch.get(code, 0.0), 4),
    }

out = {
    "quarter": "Q2 2026",
    "period": "April 1 - June 30, 2026",
    "return_due": "2026-07-31",
    "fuel_type": "Special Diesel",
    "source": SRC_URL,
    "source_page": "https://www.iftach.org/taxmatrix4/TaxDownload.php",
    "fetched": FETCHED,
    "currency": "USD",
    "notes": [
        "Rates are the official IFTA, Inc. 'Special Diesel' rates for US member jurisdictions, Q2 2026.",
        "Oregon (OR) has a $0.0000 IFTA diesel rate; Oregon taxes heavy vehicles via a separate weight-mile tax.",
        "Indiana (IN) diesel surcharge is $0.0000 for Q2 2026: the former surcharge was folded into the base rate ($0.6300).",
        "Kentucky (KY) and Virginia (VA) impose a separate diesel surcharge with NO credit for fuel purchased.",
        "Alaska, Hawaii, and the District of Columbia are not IFTA member jurisdictions and are excluded.",
    ],
    "jurisdictions": jur,
}

json.dump(out, open(OUT_PATH, "w"), indent=2)
print(f"Wrote {len(jur)} US jurisdictions to {OUT_PATH}")
print("Surcharge jurisdictions:", {c: jur[c]["surcharge"] for c in jur if jur[c]["surcharge"]})
print("Zero-rate jurisdictions:", [c for c in jur if jur[c]["rate"] == 0.0])
print("Spot check MI/OH/CA/IN/KY/VA:",
      {c: (jur[c]["rate"], jur[c]["surcharge"]) for c in ["MI","OH","CA","IN","KY","VA"]})
