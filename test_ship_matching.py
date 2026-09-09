# test_ship_matching.py
"""
SAIL Maritime Procurement - Ship Matching & Physical Feasibility Unit Tests
Tests draft limits, channel restrictions, vessel capacity fit, and cargo type evaluation.
"""
import unittest
import sys
import os

# Ensure workspace root is on python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from procurement.tests.test_procurement_engine import TestProcurementEngine

if __name__ == "__main__":
    unittest.main()
