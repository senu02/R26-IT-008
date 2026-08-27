"""
AESM Rewrite Verification Script
==================================
Standalone test -- runs WITHOUT the ML model (get_toxicity is mocked to 0.35).
Shows before -> after for highly toxic English and Singlish words.

Run:
    cd puretalk_backend
    python test_rewrite.py
"""

import sys
import os
import re
from unittest.mock import patch

# Force UTF-8 output on Windows (avoids cp1252 codec errors with emoji)
sys.stdout.reconfigure(encoding="utf-8", errors="replace")

# ── Django setup ───────────────────────────────────────────────────
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "puretalk_backend.settings")
import django
django.setup()

# ── Import AESM functions ─────────────────────────────────────────
from adptiveShelding.engine import (
    rewrite_text,
    blur_text,
    aesm_engine,
)

DIVIDER = "-" * 70

def header(title: str) -> None:
    print("\n" + "=" * 70)
    print("  " + title)
    print("=" * 70)

def show(label: str, original: str, result: dict) -> None:
    strategy = result["strategy"]
    output   = result["output"]
    print(f"\n  [{label}]")
    print(f"    Input    : {original}")
    print(f"    Strategy : {strategy}")
    print(f"    Output   : {output}")
    print(f"    Score    : toxicity={result['toxicity']:.3f}  "
          f"final={result['final_score']:.3f}")
    print("  " + DIVIDER)


# ─────────────────────────────────────────────────────────────────
# Test cases
# ─────────────────────────────────────────────────────────────────
ENGLISH_CASES = [
    ("EN-01", "You are such an idiot, I hate you!"),
    ("EN-02", "What a stupid asshole you are."),
    ("EN-03", "Go fuck yourself, you useless bitch."),
    ("EN-04", "This is absolute shit work."),
    ("EN-05", "You are a fucking bastard."),
    ("EN-06", "That was the worst performance ever, you dumb cunt."),
    ("EN-07", "I want to kill this motherfucker."),
    ("EN-08", "You ugly piece of shit, get out!"),
    ("EN-09", "What a dick move, you slut."),
    ("EN-10", "You are bad and useless and I hate everything about you."),
]

SINGLISH_CASES = [
    ("SL-01", "Huththo palayan!"),
    ("SL-02", "Oya modaya, pakaya!"),
    ("SL-03", "Balla wesiyek!"),
    ("SL-04", "Api maranawa pakku!"),
    ("SL-05", "Kari ponnaya, palyan!"),
    ("SL-06", "Moda pissu gonwa!"),
    ("SL-07", "Wesige hora yakka!"),
    ("SL-08", "Narakaya, gahanawa!"),
    ("SL-09", "Mama oya maranawa, huththo!"),
    ("SL-10", "Pakaya naraka durjanaya palayan!"),
]

MIXED_CASES = [
    ("MX-01", "You stupid pakaya, I hate you so much!"),
    ("MX-02", "Get out you fucking modaya!"),
    ("MX-03", "What an idiot huththo!"),
    ("MX-04", "You are a bitch, wesige!"),
    ("MX-05", "Palyan you dumb pissu!"),
]


# ─────────────────────────────────────────────────────────────────
# Run
# ─────────────────────────────────────────────────────────────────
def run_all():
    # Mock get_toxicity at 0.35 -- low enough that only needs_rewrite
    # (toxic word presence) drives the Rewriting strategy.
    # This means the ML model is NOT loaded at all.
    with patch("adptiveShelding.engine.get_toxicity", return_value=0.35):

        header("ENGLISH -- Highly Toxic Words  (auto-rewrite test)")
        for label, text in ENGLISH_CASES:
            result = aesm_engine(text, user_history=[], language="english")
            show(label, text, result)

        header("SINGLISH -- Highly Toxic Words  (auto-rewrite test)")
        for label, text in SINGLISH_CASES:
            result = aesm_engine(text, user_history=[], language="singlish")
            show(label, text, result)

        header("MIXED -- English + Singlish  (auto-rewrite test)")
        for label, text in MIXED_CASES:
            result = aesm_engine(text, user_history=[], language="singlish")
            show(label, text, result)

    # ── rewrite_text() standalone preview ─────────────────────────
    header("rewrite_text() -- word-level replacement preview")
    samples = [
        "I hate you, you stupid idiot!",
        "Huththo pakaya, palyan!",
        "You fucking bastard, I want to kill you.",
        "Moda pissu wesiyek!",
        "This shit is the worst, you dumb asshole.",
        "Pakaya modaya, maranawa!",
    ]
    for s in samples:
        out = rewrite_text(s)
        print(f"\n  Before: {s}")
        print(f"  After : {out}")
    print()


if __name__ == "__main__":
    run_all()
    print("\n[OK] Rewrite verification complete.\n")
