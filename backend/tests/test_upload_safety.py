import pytest
import os
import io
import zipfile

def test_zip_slip_path_traversal_detection():
    # Build an in-memory zip file with a path traversal payload
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w") as zf:
        zf.writestr("../../etc/passwd", "root:x:0:0:::")
    buf.seek(0)

    extract_path = "/tmp/test_extract_dir"
    os.makedirs(extract_path, exist_ok=True)
    real_extract_dir = os.path.realpath(extract_path)

    traversal_detected = False
    with zipfile.ZipFile(buf, "r") as zf:
        for member in zf.namelist():
            member_real_path = os.path.realpath(os.path.join(real_extract_dir, member))
            if not member_real_path.startswith(real_extract_dir + os.sep) and member_real_path != real_extract_dir:
                traversal_detected = True
                break

    assert traversal_detected is True, "Zip Slip path traversal should have been caught!"
