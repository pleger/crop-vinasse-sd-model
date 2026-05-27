from __future__ import annotations

import argparse
from pathlib import Path

import pandas as pd
import pysd


SCENARIOS = {
    "Biogas": {
        "Proportion Organic Acid": 0.0,
        "Proportion Biogas": 1.0,
        "Proportion Water": 0.0,
    },
    "Organic Acid": {
        "Proportion Organic Acid": 1.0,
        "Proportion Biogas": 0.0,
        "Proportion Water": 0.0,
    },
    "Water Recovery": {
        "Proportion Organic Acid": 0.0,
        "Proportion Biogas": 0.0,
        "Proportion Water": 1.0,
    },
    "Diversification": {
        "Proportion Organic Acid": 0.333,
        "Proportion Biogas": 0.333,
        "Proportion Water": 0.333,
    },
}


CROP_REAL = [
    257622,
    293051,
    320650,
    358940,
    386090,
    387345,
    425416,
    492382,
    569216,
    602193,
    615260,
    557954,
    589784,
    653211,
    633927,
    667116,
    651841,
    640935,
    621217,
    642529,
    657653,
    578054,
    607413,
    716336,
    None,
]


ETHANOL_REAL = [
    10593,
    11536,
    12623,
    14796,
    15417,
    15943,
    17710,
    22422,
    27526,
    25691,
    27170,
    22635,
    23263,
    27553,
    28480,
    30232,
    27254,
    27848,
    33124,
    35587,
    32525,
    29782,
    31193,
    35886,
    None,
]


def load_model():
    mdl = Path(__file__).with_name("crop_validation.mdl")
    return pysd.read_vensim(mdl)


def run_validation(model) -> pd.DataFrame:
    result = model.run(
        return_timestamps=list(range(25)),
        return_columns=["Crop", "Ethanol"],
        params={
            "Proportion Organic Acid": 0.0,
            "Proportion Biogas": 1.0,
            "Proportion Water": 0.0,
        },
    )
    return pd.DataFrame(
        {
            "Year": [2000 + int(t) for t in result.index],
            "Crop": result["Crop"].to_numpy(),
            "Ethanol": result["Ethanol"].to_numpy(),
            "Crop Real": CROP_REAL,
            "Ethanol Real": ETHANOL_REAL,
        }
    )


def run_scenario(model, params: dict[str, float]) -> pd.DataFrame:
    result = model.run(
        return_timestamps=list(range(31)),
        return_columns=["Total Revenue", "Total Cost"],
        params=params,
    )
    return pd.DataFrame(
        {
            "Year": [2000 + int(t) for t in result.index],
            "Revenue": result["Total Revenue"].to_numpy(),
            "Cost": result["Total Cost"].to_numpy(),
        }
    )


def write_workbook(path: Path) -> None:
    model = load_model()
    with pd.ExcelWriter(path, engine="openpyxl") as writer:
        run_validation(model).to_excel(writer, sheet_name="Validation", index=False)
        for name, params in SCENARIOS.items():
            run_scenario(model, params).to_excel(writer, sheet_name=name, index=False)


def main() -> None:
    parser = argparse.ArgumentParser(description="Run the vinasse/crop model through PySD.")
    parser.add_argument("--output", default="outputs/scenarios_pysd.xlsx", help="Output workbook path.")
    args = parser.parse_args()
    output = Path(args.output)
    output.parent.mkdir(parents=True, exist_ok=True)
    write_workbook(output)
    print(output)


if __name__ == "__main__":
    main()
