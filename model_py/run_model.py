from __future__ import annotations

import argparse
import csv
from pathlib import Path
from typing import Dict, Iterable, List

from openpyxl import Workbook

from crop_model import Parameters, SCENARIOS, Scenario, scenario_rows, validation_rows


def _write_rows_csv(path: Path, rows: Iterable[Dict[str, float]]) -> None:
    rows = list(rows)
    if not rows:
        raise ValueError("no rows to write")
    with path.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=list(rows[0].keys()))
        writer.writeheader()
        writer.writerows(rows)


def write_workbook(path: Path, params: Parameters) -> None:
    wb = Workbook()
    ws = wb.active
    ws.title = "Validation"
    validation = validation_rows(params)
    _append_table(ws, validation)

    for scenario in SCENARIOS:
        ws = wb.create_sheet(scenario.name)
        _append_table(ws, scenario_rows(scenario, params))

    for sheet in wb.worksheets:
        sheet.freeze_panes = "A2"
        for col_cells in sheet.columns:
            width = max(len(str(cell.value)) if cell.value is not None else 0 for cell in col_cells)
            sheet.column_dimensions[col_cells[0].column_letter].width = min(max(width + 2, 10), 18)

    wb.save(path)


def _append_table(ws, rows: List[Dict[str, float]]) -> None:
    headers = list(rows[0].keys())
    ws.append(headers)
    for row in rows:
        ws.append([row[h] for h in headers])


def scenario_by_name(name: str) -> Scenario:
    normalized = name.lower().replace("_", " ").replace("-", " ").strip()
    for scenario in SCENARIOS:
        if scenario.name.lower() == normalized:
            return scenario
    valid = ", ".join(s.name for s in SCENARIOS)
    raise argparse.ArgumentTypeError(f"unknown scenario {name!r}; valid values: {valid}")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run the sugarcane/ethanol/vinasse system dynamics model.")
    parser.add_argument("--output", default="outputs/scenarios_pysd_python.xlsx", help="Output .xlsx or .csv path.")
    parser.add_argument(
        "--sheet",
        choices=["all", "validation", "scenario"],
        default="all",
        help="Write all workbook sheets, only validation, or one scenario CSV.",
    )
    parser.add_argument("--scenario", type=scenario_by_name, default=SCENARIOS[0], help="Scenario for --sheet scenario.")
    parser.add_argument(
        "--ethanol-yield",
        type=float,
        default=0.046,
        help="Ethanol yield. Use 0.046 to reproduce Scenarios.xlsx/Validation; Crop_v3.alp currently stores 0.05.",
    )
    parser.add_argument(
        "--alp-profile",
        action="store_true",
        help="Shortcut for the literal Crop_v3.alp ethanol yield value of 0.05.",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    ethanol_yield = 0.05 if args.alp_profile else args.ethanol_yield
    params = Parameters(ethanol_yield=ethanol_yield)
    output = Path(args.output)
    output.parent.mkdir(parents=True, exist_ok=True)

    if args.sheet == "all":
        if output.suffix.lower() != ".xlsx":
            raise SystemExit("--sheet all requires an .xlsx output")
        write_workbook(output, params)
    elif args.sheet == "validation":
        _write_rows_csv(output, validation_rows(params))
    else:
        _write_rows_csv(output, scenario_rows(args.scenario, params))

    print(output)


if __name__ == "__main__":
    main()
