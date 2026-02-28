"""
Security test: Compiled .so license bypass via exposed symbols.

Proves that the Cython-compiled pilot module exposes all internal
constants, classes, and functions — enabling runtime monkey-patching
that defeats every license check without touching any file on disk.

Run: uv run --python 3.12 --no-project --with cryptography pytest launcher/tests/security/test_so_bypass.py -v
"""

import hmac
import hashlib
import json
import shutil
import subprocess
import sys
import textwrap
from pathlib import Path
from unittest.mock import patch

import pytest

PILOT_BIN = Path.home() / ".pilot" / "bin"
PILOT_SO = next(PILOT_BIN.glob("pilot.cpython-*.so"), None)
LICENSE_PATH = Path.home() / ".pilot" / ".license"


def _load_pilot():
    """Import the compiled pilot module, same as the wrapper script does."""
    if str(PILOT_BIN) not in sys.path:
        sys.path.insert(0, str(PILOT_BIN))
    # Remove any cached launcher/ path (mirrors the wrapper's sys.path filter)
    cwd = str(Path.cwd())
    sys.path = [
        p
        for p in sys.path
        if p
        and p != cwd
        and not (
            Path(p, "launcher").is_dir() and Path(p, "launcher", "__init__.py").is_file()
        )
    ]
    sys.path.insert(0, str(PILOT_BIN))
    import importlib

    if "pilot" in sys.modules:
        importlib.reload(sys.modules["pilot"])
    import pilot

    return pilot


# ---------------------------------------------------------------------------
# Skip everything if the .so isn't installed (CI, clean machines)
# ---------------------------------------------------------------------------
pytestmark = pytest.mark.skipif(
    PILOT_SO is None, reason="pilot .so not installed at ~/.pilot/bin"
)


# ===========================================================================
# 1. Secret Exposure — the .so leaks every constant needed to forge state
# ===========================================================================
class TestSecretExposure:
    """The .so must NOT expose secrets via normal Python attribute access."""

    def test_hmac_secret_is_readable(self):
        """HMAC_SECRET used to sign .license is directly accessible."""
        pilot = _load_pilot()
        assert hasattr(pilot, "HMAC_SECRET")
        assert isinstance(pilot.HMAC_SECRET, bytes)
        assert len(pilot.HMAC_SECRET) > 0
        # Attacker now has the signing key
        assert pilot.HMAC_SECRET == b"pilot-license-state-v1-2026"

    def test_rsa_public_key_is_readable(self):
        """RSA public key for trial signature verification is exposed."""
        pilot = _load_pilot()
        assert hasattr(pilot, "RSA_PUBLIC_KEY")
        assert isinstance(pilot.RSA_PUBLIC_KEY, str)
        assert pilot.RSA_PUBLIC_KEY.startswith("MIIBIj")  # RSA-2048 DER prefix
        assert len(pilot.RSA_PUBLIC_KEY) > 300

    def test_polar_org_and_benefit_ids_are_readable(self):
        """Polar.sh org and product benefit IDs are exposed — enables API probing."""
        pilot = _load_pilot()
        for attr in (
            "_POLAR_PROD_ORG_ID",
            "_POLAR_PROD_SOLO_BENEFIT_ID",
            "_POLAR_PROD_TEAM_BENEFIT_ID",
        ):
            val = getattr(pilot, attr, None)
            assert val is not None, f"{attr} missing"
            assert isinstance(val, str) and len(val) > 10, f"{attr} too short"

    def test_gumroad_product_id_is_readable(self):
        """Gumroad product ID is exposed."""
        pilot = _load_pilot()
        assert hasattr(pilot, "GUMROAD_PRODUCT_ID")
        assert len(pilot.GUMROAD_PRODUCT_ID) > 5

    def test_machine_fingerprint_callable(self):
        """get_machine_fingerprint() is callable — returns the hardware ID
        used to bind trial keys. Attacker can predict the expected fingerprint."""
        pilot = _load_pilot()
        fp = pilot.get_machine_fingerprint()
        assert isinstance(fp, str)
        assert len(fp) == 64  # sha256 hex digest

    def test_license_manager_fully_instantiable(self):
        """LicenseManager can be instantiated and all methods are callable."""
        pilot = _load_pilot()
        lm = pilot.LicenseManager()
        assert hasattr(lm, "validate")
        assert hasattr(lm, "get_state")
        assert hasattr(lm, "get_license_info")
        assert hasattr(lm, "_save_state")
        assert hasattr(lm, "_load_state")


# ===========================================================================
# 2. HMAC Signature Bypass — the state file has no integrity protection
# ===========================================================================
class TestHmacBypass:
    """The .license file HMAC signature must be verified on load.
    Currently it is not — any value (empty, wrong, correct) is accepted."""

    @pytest.fixture(autouse=True)
    def _backup_license(self):
        """Backup and restore .license around each test."""
        backup = LICENSE_PATH.with_suffix(".license.testbak")
        if LICENSE_PATH.exists():
            shutil.copy2(LICENSE_PATH, backup)
        yield
        if backup.exists():
            shutil.copy2(backup, LICENSE_PATH)
            backup.unlink()

    def test_empty_signature_accepted(self):
        """Empty string signature passes validation — HMAC not checked."""
        pilot = _load_pilot()
        data = json.loads(LICENSE_PATH.read_text())
        data["signature"] = ""
        LICENSE_PATH.write_text(json.dumps(data))

        lm = pilot.LicenseManager()
        valid, err = lm.validate()
        assert valid is True, f"Expected valid=True with empty sig, got err={err}"

    def test_garbage_signature_accepted(self):
        """Random garbage signature passes validation — HMAC not checked."""
        pilot = _load_pilot()
        data = json.loads(LICENSE_PATH.read_text())
        data["signature"] = "deadbeef" * 8
        LICENSE_PATH.write_text(json.dumps(data))

        lm = pilot.LicenseManager()
        valid, err = lm.validate()
        assert valid is True, f"Expected valid=True with garbage sig, got err={err}"

    def test_attacker_can_compute_correct_hmac(self):
        """With the leaked HMAC_SECRET, an attacker can produce a correct HMAC
        for any arbitrary state — the secret provides zero protection."""
        pilot = _load_pilot()
        data = json.loads(LICENSE_PATH.read_text())
        state_json = json.dumps(data["state"], sort_keys=True)
        forged = hmac.new(
            pilot.HMAC_SECRET, state_json.encode(), hashlib.sha256
        ).hexdigest()
        assert isinstance(forged, str) and len(forged) == 64


# ===========================================================================
# 3. Runtime Monkey-Patch Bypass — override validation at import time
# ===========================================================================
class TestRuntimeMonkeyPatch:
    """Because the .so exports all symbols, an attacker can replace
    _check_license_valid, LicenseManager.validate, or ClaudeWrapper._check_license
    at runtime to bypass every gate without modifying any file."""

    def test_patch_check_license_valid(self):
        """Replacing the module-level _check_license_valid makes the pilot
        binary report a valid license for any state."""
        pilot = _load_pilot()

        original = pilot._check_license_valid

        # Attacker's patch: always valid
        pilot._check_license_valid = lambda: (True, "")
        try:
            valid, err = pilot._check_license_valid()
            assert valid is True
            assert err == ""
        finally:
            pilot._check_license_valid = original

    def test_patch_license_manager_validate(self):
        """Replacing LicenseManager.validate bypasses online verification."""
        pilot = _load_pilot()

        original = pilot.LicenseManager.validate

        pilot.LicenseManager.validate = lambda self: (True, "")
        try:
            lm = pilot.LicenseManager()
            valid, err = lm.validate()
            assert valid is True
        finally:
            pilot.LicenseManager.validate = original

    def test_patch_license_manager_get_license_info(self):
        """Replacing get_license_info makes the pilot binary report
        any tier the attacker wants."""
        pilot = _load_pilot()

        original = pilot.LicenseManager.get_license_info

        pilot.LicenseManager.get_license_info = lambda self: {
            "tier": "team",
            "email": "attacker@example.com",
            "days_remaining": 99999,
            "is_expired": False,
        }
        try:
            lm = pilot.LicenseManager()
            info = lm.get_license_info()
            assert info["tier"] == "team"
            assert info["days_remaining"] == 99999
        finally:
            pilot.LicenseManager.get_license_info = original

    def test_patch_claude_wrapper_check_license(self):
        """Replacing ClaudeWrapper._check_license makes the license gate
        a no-op — the full pilot wrapper runs without any check."""
        pilot = _load_pilot()

        original = pilot.ClaudeWrapper._check_license

        # Attacker's patch: skip the license check entirely
        pilot.ClaudeWrapper._check_license = lambda self: None
        try:
            # Verify the patch sticks on the class
            assert pilot.ClaudeWrapper._check_license is not original
            # A new instance would use the patched method
            # (we don't call .run() to avoid actually starting claude)
        finally:
            pilot.ClaudeWrapper._check_license = original


# ===========================================================================
# 4. Wrapper Script Injection — the bash wrapper is trivially replaceable
# ===========================================================================
class TestWrapperScriptBypass:
    """The pilot bash wrapper at ~/.pilot/bin/pilot executes Python code
    via `python -c`. An attacker can replace it with a version that
    monkey-patches the module before calling app()."""

    def test_wrapper_is_writable_plain_text(self):
        """The wrapper script is a user-writable bash file, not a binary."""
        wrapper = PILOT_BIN / "pilot"
        assert wrapper.exists()
        assert wrapper.stat().st_mode & 0o200  # owner-writable
        content = wrapper.read_text()
        assert content.startswith("#!/bin/bash")
        assert "from pilot import app" in content

    def test_craft_bypass_wrapper(self, tmp_path):
        """Demonstrate a replacement wrapper that patches validation
        before calling app(). This is the complete end-to-end bypass."""
        bypass_script = tmp_path / "pilot-bypass"
        bypass_script.write_text(
            textwrap.dedent(f"""\
            #!/bin/bash
            SCRIPT_DIR="{PILOT_BIN}"
            exec uv run --python 3.12 --no-project --with cryptography python -c "
            import sys, os
            cwd = os.getcwd()
            sys.path = [p for p in sys.path if p and p != cwd and not (os.path.isdir(os.path.join(p, 'launcher')) and os.path.isfile(os.path.join(p, 'launcher', '__init__.py')))]
            sys.path.insert(0, '$SCRIPT_DIR')

            import pilot

            # --- BYPASS: neutralize all license checks ---
            pilot._check_license_valid = lambda: (True, '')
            pilot.LicenseManager.validate = lambda self: (True, '')
            pilot.ClaudeWrapper._check_license = lambda self: None
            pilot.ClaudeWrapper._handle_invalid_license = lambda self, *a, **kw: None
            pilot.ClaudeWrapper._handle_trial_expired = lambda self, *a, **kw: None
            # --- END BYPASS ---

            from pilot import app
            code = app()
            sys.stdout.flush()
            sys.stderr.flush()
            os._exit(code)
            " '\\"\\$@\\"'
            """)
        )
        bypass_script.chmod(0o755)

        content = bypass_script.read_text()
        # Verify the bypass wrapper is syntactically valid and contains patches
        assert "pilot._check_license_valid = lambda" in content
        assert "ClaudeWrapper._check_license = lambda" in content
        assert "_handle_trial_expired" in content

        # Verify it would use the real .so
        assert str(PILOT_BIN) in content

    def test_sitecustomize_injection_vector(self, tmp_path):
        """A sitecustomize.py in the right location can patch the pilot module
        before app() runs. The wrapper uses `uv run` which loads site packages."""
        payload = tmp_path / "sitecustomize.py"
        payload.write_text(
            textwrap.dedent("""\
            # Injected via sitecustomize.py — runs before any user code
            import importlib
            _original_import = __builtins__.__import__ if hasattr(__builtins__, '__import__') else __import__

            def _patched_import(name, *args, **kwargs):
                mod = _original_import(name, *args, **kwargs)
                if name == 'pilot' and hasattr(mod, '_check_license_valid'):
                    mod._check_license_valid = lambda: (True, '')
                return mod

            try:
                __builtins__.__import__ = _patched_import
            except AttributeError:
                pass
            """)
        )
        content = payload.read_text()
        assert "_check_license_valid" in content
        # The file exists and is valid Python
        compile(content, str(payload), "exec")


# ===========================================================================
# 5. End-to-End: Prove the bypass works against `pilot status`
# ===========================================================================
class TestEndToEndBypass:
    """Prove that monkey-patching via the .so symbols actually changes
    what `pilot status --json` reports."""

    def test_pilot_status_returns_trial(self):
        """Baseline: unmodified pilot reports the real trial state."""
        result = subprocess.run(
            [str(PILOT_BIN / "pilot"), "status", "--json"],
            capture_output=True,
            text=True,
            timeout=30,
        )
        data = json.loads(result.stdout.strip())
        assert data["success"] is True
        assert data["tier"] == "trial"

    def test_patched_module_reports_team_tier(self):
        """After monkey-patching get_license_info, the module reports
        team tier — proving the .so offers no protection against
        runtime modification."""
        pilot = _load_pilot()

        original = pilot.LicenseManager.get_license_info
        pilot.LicenseManager.get_license_info = lambda self: {
            "tier": "team",
            "email": "bypassed@attacker.com",
            "created_at": "2026-01-01T00:00:00+00:00",
            "expires_at": "2099-12-31T23:59:59+00:00",
            "days_remaining": 99999,
            "is_expired": False,
        }
        try:
            lm = pilot.LicenseManager()
            info = lm.get_license_info()
            assert info["tier"] == "team"
            assert info["email"] == "bypassed@attacker.com"
            assert info["days_remaining"] == 99999
            assert info["is_expired"] is False
        finally:
            pilot.LicenseManager.get_license_info = original
