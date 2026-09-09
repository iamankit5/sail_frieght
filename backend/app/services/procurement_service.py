# backend/app/services/procurement_service.py
import sys
import os

# Include project root
ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

from procurement.procurement_engine import (
    evaluate_all_vessels,
    get_route_risk_profile,
    PORT_COORDINATES,
    ROUTES,
    VESSEL_SPECS,
    DATA_CITATIONS
)

class ProcurementService:
    @staticmethod
    def get_ports():
        return PORT_COORDINATES

    @staticmethod
    def get_routes():
        return ROUTES

    @staticmethod
    def get_vessel_specs():
        return VESSEL_SPECS

    @staticmethod
    def get_data_citations():
        return DATA_CITATIONS

    @staticmethod
    def evaluate(cargo_qty_mt, origin, destination, bunker_price, freight_multiplier=1.0, cargo_type="Coking Coal"):
        return evaluate_all_vessels(
            cargo_qty_mt=cargo_qty_mt,
            origin=origin,
            destination=destination,
            bunker_price=bunker_price,
            freight_multiplier=freight_multiplier,
            cargo_type=cargo_type
        )

    @staticmethod
    def get_risk(origin, destination):
        return get_route_risk_profile(origin, destination)
