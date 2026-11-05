import pytest
import os
import tempfile
from services.file_router import route_file_and_extract_text

def test_route_visual_files():
    for ext in ['.pdf', '.jpg', '.jpeg', '.png', '.webp']:
        mode, text = route_file_and_extract_text(f"/tmp/fake_invoice{ext}")
        assert mode == 'visual'
        assert text is None

def test_route_csv_file():
    with tempfile.NamedTemporaryFile(suffix=".csv", mode="w", delete=False) as f:
        f.write("Col1,Col2\nVal1,Val2\n")
        path = f.name
    try:
        mode, text = route_file_and_extract_text(path)
        assert mode == 'text'
        assert "Col1" in text
        assert "Val1" in text
    finally:
        os.remove(path)
