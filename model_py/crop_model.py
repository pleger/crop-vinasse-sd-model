from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, Iterable, List, Mapping, Tuple


POPULATION_LOOKUP: Tuple[Tuple[float, float], ...] = (
    (0.0, 1.74018282e8),
    (1.0, 1.76301203e8),
    (2.0, 1.78503484e8),
    (3.0, 1.80622688e8),
    (4.0, 1.82675143e8),
    (5.0, 1.84688101e8),
    (6.0, 1.86653106e8),
    (7.0, 1.88552320e8),
    (8.0, 1.90367302e8),
    (9.0, 1.92079951e8),
    (10.0, 1.93701929e8),
    (11.0, 1.95284734e8),
    (12.0, 1.96876111e8),
    (13.0, 1.98478299e8),
    (14.0, 2.00085127e8),
    (15.0, 2.01675532e8),
    (16.0, 2.03218114e8),
    (17.0, 2.04703445e8),
    (18.0, 2.06107261e8),
    (19.0, 2.07455459e8),
    (20.0, 2.08660842e8),
    (21.0, 2.09550294e8),
    (22.0, 2.10306415e8),
    (23.0, 2.11140729e8),
    (24.0, 2.11998573e8),
    (25.0, 2.12812405e8),
    (26.0, 2.13600000e8),
    (27.0, 2.14400000e8),
    (28.0, 2.15200000e8),
    (29.0, 2.16000000e8),
    (30.0, 2.16800000e8),
)


CROP_REAL: Tuple[float, ...] = (
    257622.017,
    293050.543,
    320650.076,
    358939.690,
    386090.118,
    387345.224,
    425415.606,
    492381.586,
    569215.975,
    602193.192,
    615260.213,
    557953.809,
    589784.413,
    653210.558,
    633927.436,
    667116.425,
    651840.683,
    640934.722,
    621217.310,
    642529.058,
    657653.300,
    578054.029,
    607413.483,
    716336.023,
)


ETHANOL_REAL: Tuple[float, ...] = (
    10593.0,
    11536.0,
    12623.0,
    14796.0,
    15417.0,
    15943.0,
    17710.0,
    22422.0,
    27526.0,
    25691.0,
    27170.0,
    22635.0,
    23263.0,
    27553.0,
    28480.0,
    30232.0,
    27254.0,
    27848.0,
    33124.0,
    35587.0,
    32525.0,
    29782.0,
    31193.0,
    35886.0,
)


@dataclass(frozen=True)
class Parameters:
    adjust_time_young_crop: float = 1.59
    growth_delay_time: float = 1.095
    adjust_time_crop: float = 3.59
    average_discard_time: float = 5.319
    vol_conversion_factor: float = 1000.0
    ethanol_usage: float = 0.15
    ethanol_to_crop: float = 13.1
    # Scenarios.xlsx/Validation is generated with 0.046. Crop_v3.alp currently
    # stores 0.05, so keep this explicit and overrideable from the CLI.
    ethanol_yield: float = 0.046
    vinasse_yield: float = 10.0
    organic_acid_factor: float = 10.6
    biogas_factor: float = 12.115
    water_recovery_factor: float = 0.7
    processing_time: float = 1.0
    sales_time: float = 1.0
    cost_per_planting: float = 15200.0
    cost_per_unit_ethanol: float = 423000.0
    cost_per_unit_import: float = 414680.0
    price_per_unit_ethanol: float = 545455.0
    price_per_unit_biogas: float = 500.0
    price_per_unit_organic_acid: float = 2890.0
    tariff_import: float = 0.18
    cost_per_unit_organic_acid: float = 2750.0
    cost_per_unit_biogas: float = 75.0
    water_cost: float = 2810.0
    policy_water: float = 0.0
    water_cost_treat: float = 1030.0


@dataclass(frozen=True)
class Scenario:
    name: str
    proportion_organic_acid: float
    proportion_biogas: float
    proportion_water: float


SCENARIOS: Tuple[Scenario, ...] = (
    Scenario("Biogas", 0.0, 1.0, 0.0),
    Scenario("Organic Acid", 1.0, 0.0, 0.0),
    Scenario("Water Recovery", 0.0, 0.0, 1.0),
    Scenario("Diversification", 0.333, 0.333, 0.333),
)


def lookup_linear(table: Tuple[Tuple[float, float], ...], x: float) -> float:
    if x <= table[0][0]:
        return table[0][1]
    if x >= table[-1][0]:
        return table[-1][1]
    for (x0, y0), (x1, y1) in zip(table, table[1:]):
        if x0 <= x <= x1:
            frac = (x - x0) / (x1 - x0)
            return y0 + frac * (y1 - y0)
    raise ValueError(f"x={x} outside lookup table")


def _auxiliaries(state: Mapping[str, float], delay_out: float, p: Parameters, s: Scenario) -> Dict[str, float]:
    population = lookup_linear(POPULATION_LOOKUP, state["time"])
    demand_volume = population * p.ethanol_usage / p.vol_conversion_factor
    crop_demand = demand_volume * p.ethanol_to_crop
    desired_crop = crop_demand
    adjust_crop = (desired_crop - state["Crop"]) / p.adjust_time_crop
    expected_loss_rate = state["Crop"] / p.average_discard_time
    desired_growth_rate = max(0.0, expected_loss_rate + adjust_crop)
    desired_young_crop = desired_growth_rate * p.growth_delay_time
    adjust_young_crop = (desired_young_crop - state["YoungCrop"]) / p.adjust_time_young_crop
    indicated_planting = adjust_young_crop + desired_growth_rate
    planting_rate = max(0.0, indicated_planting)
    growth_rate = delay_out
    discard_rate = state["Crop"] / p.average_discard_time
    ethanol_production = (state["Crop"] / p.processing_time) * p.ethanol_yield
    sales_capacity = state["Ethanol"] / p.sales_time
    sales = min(sales_capacity, demand_volume)
    shortage = max(0.0, demand_volume - sales_capacity)
    imports = shortage
    vinasse_production = ethanol_production * p.vinasse_yield
    biogas_production = vinasse_production * s.proportion_biogas * p.biogas_factor
    organic_acid_production = vinasse_production * s.proportion_organic_acid * p.organic_acid_factor
    water_recovery = vinasse_production * s.proportion_water * p.water_recovery_factor
    planting_cost = p.cost_per_planting * planting_rate
    production_cost = p.cost_per_unit_ethanol * ethanol_production
    import_cost = imports * p.cost_per_unit_import * (1.0 + p.tariff_import)
    organic_acid_cost = p.cost_per_unit_organic_acid * organic_acid_production
    biogas_cost = biogas_production * p.cost_per_unit_biogas
    water_cost = p.water_cost_treat * water_recovery
    total_cost = import_cost + planting_cost + production_cost + organic_acid_cost + biogas_cost + water_cost
    sales_revenue = p.price_per_unit_ethanol * sales
    organic_acid_revenue = p.price_per_unit_organic_acid * organic_acid_production
    biogas_revenue = biogas_production * p.price_per_unit_biogas
    by_product_revenue = biogas_revenue + organic_acid_revenue
    water_recovery_credits = (p.water_cost + p.policy_water * p.water_cost_treat) * water_recovery
    total_revenue = sales_revenue + by_product_revenue + water_recovery_credits
    net_profit = total_revenue - total_cost
    return {
        "population": population,
        "demandVolume": demand_volume,
        "cropDemand": crop_demand,
        "desiredCrop": desired_crop,
        "adjustCrop": adjust_crop,
        "expectedLossRate": expected_loss_rate,
        "desiredGrowthRate": desired_growth_rate,
        "desiredYoungCrop": desired_young_crop,
        "adjustYoungCrop": adjust_young_crop,
        "indicatedPlanting": indicated_planting,
        "PlantingRate": planting_rate,
        "GrowthRate": growth_rate,
        "DiscardRate": discard_rate,
        "EthanolProduction": ethanol_production,
        "Sales": sales,
        "shortage": shortage,
        "Imports": imports,
        "VinasseProduction": vinasse_production,
        "BiogasProduction": biogas_production,
        "OrganicAcidProduction": organic_acid_production,
        "WaterRecovery": water_recovery,
        "totalCost": total_cost,
        "totalRevenue": total_revenue,
        "NetProfit": net_profit,
    }


def simulate(
    scenario: Scenario,
    params: Parameters = Parameters(),
    final_time: float = 30.0,
    dt: float = 0.001,
    record_times: Iterable[float] | None = None,
) -> List[Dict[str, float]]:
    if record_times is None:
        record_times = [float(i) for i in range(int(final_time) + 1)]
    targets = list(record_times)
    target_index = 0
    state = {
        "time": 0.0,
        "YoungCrop": 0.0,
        "Crop": 0.0,
        "Ethanol": 0.0,
        "CumulativeProfit": 0.0,
        "OrganicAcid": 0.0,
        "Biogas": 0.0,
        "Water": 0.0,
        "_delay1": 0.0,
        "_delay2": 0.0,
        "_delay3": 0.0,
    }
    initial_aux = _auxiliaries(state, 0.0, params, scenario)
    state["_delay1"] = initial_aux["PlantingRate"]
    state["_delay2"] = initial_aux["PlantingRate"]
    state["_delay3"] = initial_aux["PlantingRate"]
    records: List[Dict[str, float]] = []

    def snapshot() -> None:
        aux = _auxiliaries(state, state["_delay3"], params, scenario)
        records.append({"time": state["time"], **state, **aux})

    while target_index < len(targets) and abs(targets[target_index] - state["time"]) < dt / 2:
        snapshot()
        target_index += 1

    steps = int(round(final_time / dt))
    tau = params.growth_delay_time / 3.0
    for _ in range(steps):
        aux = _auxiliaries(state, state["_delay3"], params, scenario)
        delay1_dot = (aux["PlantingRate"] - state["_delay1"]) / tau
        delay2_dot = (state["_delay1"] - state["_delay2"]) / tau
        delay3_dot = (state["_delay2"] - state["_delay3"]) / tau

        state["YoungCrop"] += (aux["PlantingRate"] - aux["GrowthRate"]) * dt
        state["Crop"] += (aux["GrowthRate"] - aux["DiscardRate"]) * dt
        state["Ethanol"] += (aux["EthanolProduction"] + aux["Imports"] - aux["Sales"]) * dt
        state["CumulativeProfit"] += aux["NetProfit"] * dt
        state["OrganicAcid"] += aux["OrganicAcidProduction"] * dt
        state["Biogas"] += aux["BiogasProduction"] * dt
        state["Water"] += aux["WaterRecovery"] * dt
        state["_delay1"] += delay1_dot * dt
        state["_delay2"] += delay2_dot * dt
        state["_delay3"] += delay3_dot * dt
        state["time"] += dt

        while target_index < len(targets) and state["time"] + dt / 2 >= targets[target_index]:
            state["time"] = targets[target_index]
            snapshot()
            target_index += 1

    return records


def validation_rows(params: Parameters = Parameters()) -> List[Dict[str, float | None]]:
    records = simulate(SCENARIOS[0], params=params, final_time=24.0, record_times=range(25))
    rows: List[Dict[str, float]] = []
    for i, rec in enumerate(records):
        rows.append(
            {
                "Year": 2000 + i,
                "Crop": rec["Crop"],
                "Ethanol": rec["Ethanol"],
                "Crop Real": round(CROP_REAL[i]) if i < len(CROP_REAL) else None,
                "Ethanol Real": round(ETHANOL_REAL[i]) if i < len(ETHANOL_REAL) else None,
            }
        )
    return rows


def scenario_rows(scenario: Scenario, params: Parameters = Parameters()) -> List[Dict[str, float]]:
    return [
        {
            "Year": 2000 + int(round(rec["time"])),
            "Revenue": rec["totalRevenue"],
            "Cost": rec["totalCost"],
        }
        for rec in simulate(scenario, params=params, final_time=30.0, record_times=range(31))
    ]
