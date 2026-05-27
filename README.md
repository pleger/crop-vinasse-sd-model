# Crop/Vinasse System Dynamics Model

Command-line reimplementation of a crop, ethanol, and vinasse valorization system
dynamics model.

## Model Overview

The model represents a sugarcane-ethanol production system connected to circular
economy pathways for vinasse valorization. It was derived from an AnyLogic system
dynamics model and reimplemented so that the simulation can be run from the command
line in a Linux pipeline.

The core structure has four linked parts:

- **Consumer demand**: Brazilian population is represented with a lookup table, and
  ethanol demand is estimated from per-capita ethanol use.
- **Crop production**: young crop and harvest-ready crop are modeled as stocks, with
  planting, maturation delay, and discard flows.
- **Ethanol production and inventory**: crop availability drives ethanol production,
  while imports and sales balance demand against available ethanol inventory.
- **Vinasse valorization**: ethanol production generates vinasse, which can be
  allocated to biogas, organic acid, water recovery, or an equal-weight
  diversification portfolio.

The included scenario runners produce validation data and financial trajectories for
the main valorization alternatives:

- `Biogas`
- `Organic Acid`
- `Water Recovery`
- `Diversification`

The PySD/Vensim version is intended for reproducible server-side execution. The pure
Python version mirrors the same equations and is useful for debugging, quick
experiments, and environments where installing PySD is not convenient.

The project contains:

- A pure Python implementation of the model equations.
- A PySD/Vensim implementation for command-line execution on Linux servers.
- A browser-based dashboard for GitHub Pages.
- Scripts that generate a `Scenarios.xlsx`-style workbook with validation and scenario sheets.
- Sample generated outputs under `outputs/`.

## Online Interface

The static web app in `docs/` runs the model directly in the browser. It is designed
for GitHub Pages and does not require a server, database, or build step.

Expected site URL once GitHub Pages is enabled:

```text
https://pleger.github.io/crop-vinasse-sd-model/
```

Note: GitHub Pages availability for private repositories depends on the GitHub
account/organization plan. If Pages is unavailable for this private repository, make
the repository public or deploy the `docs/` folder to another static host.

Local preview:

```bash
python -m http.server 8000 --directory docs
```

Then open:

```text
http://127.0.0.1:8000
```

The dashboard supports scenario selection, custom vinasse allocation, selected model
parameter edits, charts, validation MAPE readouts, yearly results, and CSV export.

To publish it with GitHub Pages, configure the repository Pages source to:

```text
Branch: master
Folder: /docs
```

## Quick Start

```bash
python -m venv .venv
. .venv/bin/activate
pip install -r model_py/requirements.txt
python model_py/run_pysd_model.py --output outputs/scenarios_pysd.xlsx
```

The generated workbook includes:

- `Validation`
- `Biogas`
- `Organic Acid`
- `Water Recovery`
- `Diversification`

## Command-Line Interfaces

The project provides two command-line runners.

### PySD runner

Use this runner when you want to execute the Vensim/PySD version of the model:

```bash
python model_py/run_pysd_model.py --output outputs/scenarios_pysd.xlsx
```

This creates an Excel workbook with the validation sheet and all scenario sheets.

### Pure Python runner

Use this runner when you want to execute the model equations directly in Python,
without translating through PySD:

```bash
python model_py/run_model.py --output outputs/scenarios_pysd_python.xlsx
```

The pure Python CLI can also write targeted CSV outputs for pipeline steps:

```bash
# Validation trajectory only
python model_py/run_model.py \
  --sheet validation \
  --output outputs/validation.csv

# One scenario only
python model_py/run_model.py \
  --sheet scenario \
  --scenario "Biogas" \
  --output outputs/biogas.csv
```

By default, the pure Python runner uses `Ethanol Yield = 0.046`, which reproduces
the provided `Scenarios.xlsx` validation sheet. To run with the literal value stored
in the reviewed AnyLogic file (`0.05`), use:

```bash
python model_py/run_model.py \
  --alp-profile \
  --output outputs/scenarios_alp_profile.xlsx
```

Available pure Python CLI options:

```text
--output PATH              Output .xlsx or .csv path.
--sheet all|validation|scenario
                           Write all workbook sheets, only validation, or one scenario CSV.
--scenario NAME            Scenario for --sheet scenario.
--ethanol-yield VALUE      Override ethanol yield.
--alp-profile              Use Ethanol Yield = 0.05.
```

## Validation

The generated `Validation` sheet was checked against the provided
`Scenarios.xlsx` workbook. The reproduced Crop and Ethanol trajectories match with
zero mismatches at tolerance `1e-6`.

The validation workbook uses `Ethanol Yield = 0.046`. The current AnyLogic model
file reviewed during development stored `0.05`, so this parameter is explicit and
configurable in the Python implementation.

## Files

- `model_py/crop_model.py`: pure Python implementation.
- `model_py/run_model.py`: pure Python CLI runner.
- `model_py/crop_validation.mdl`: Vensim/PySD model.
- `model_py/run_pysd_model.py`: PySD CLI runner.
- `model_py/requirements.txt`: Linux/server dependencies.
- `outputs/scenarios_pysd.xlsx`: sample PySD-generated workbook.
- `outputs/scenarios_pysd_python.xlsx`: sample pure-Python-generated workbook.

## License

This project is released under the MIT License. See [LICENSE](LICENSE).
