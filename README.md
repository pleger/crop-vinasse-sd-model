# Crop/Vinasse System Dynamics Model

Command-line reimplementation of a crop, ethanol, and vinasse valorization system
dynamics model.

The project contains:

- A pure Python implementation of the model equations.
- A PySD/Vensim implementation for command-line execution on Linux servers.
- Scripts that generate a `Scenarios.xlsx`-style workbook with validation and scenario sheets.
- Sample generated outputs under `outputs/`.

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

