# Crop/Vinasse System Dynamics Model

This folder contains a command-line reimplementation of the AnyLogic crop/ethanol/vinasse model.

## Files

- `crop_model.py`: pure Python implementation of the model equations.
- `run_model.py`: pure Python CLI runner that writes `Scenarios.xlsx`-style outputs.
- `crop_validation.mdl`: Vensim/PySD model file for the same dynamics.
- `run_pysd_model.py`: PySD CLI runner that reads `crop_validation.mdl` and writes an Excel workbook.
- `requirements.txt`: Python dependencies for a Linux server.

## Run on Linux

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

## Parameter note

`Scenarios.xlsx`/`Validation` is reproduced with `Ethanol Yield = 0.046`.
The current `Crop_v3.alp` file stores `0.05`; run the pure Python CLI with
`--alp-profile` if you want that literal value instead:

```bash
python model_py/run_model.py --alp-profile --output outputs/scenarios_alp_profile.xlsx
```
