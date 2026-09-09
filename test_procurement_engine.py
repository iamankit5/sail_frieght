# test_procurement_engine.py (Root shim pointing to procurement/tests/test_procurement_engine.py)
import unittest
from procurement.tests.test_procurement_engine import TestProcurementEngine

if __name__ == "__main__":
    print("=" * 60)
    print(" Running Procurement Engine Sanity & Boundary Tests... ")
    print("=" * 60)
    unittest.main()
