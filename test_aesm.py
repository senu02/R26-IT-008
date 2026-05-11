import sys
import os

# Adjust path so we can import puretalk_backend modules
sys.path.append(os.path.abspath('puretalk_backend'))

from adptiveShelding.engine import aesm_engine, get_toxicity

text1 = "oya maha ponnaya"
text2 = "what a fucking idiot"

print("--- Test 1 ---")
print("Text:", text1)
print("Raw Toxicity:", get_toxicity(text1))
print("Engine Result:", aesm_engine(text1))

print("\n--- Test 2 ---")
print("Text:", text2)
print("Raw Toxicity:", get_toxicity(text2))
print("Engine Result:", aesm_engine(text2))
