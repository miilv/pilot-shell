#!/usr/bin/env python3
"""Build script for installer binary.

Merges all installer modules into a single file and compiles with Cython.
Source files are NOT modified - merging happens only in the build directory.

Usage:
    python -m installer.build              # CI/CD build with platform suffix
    python -m installer.build --local      # Local build, deploys to ~/.pilot/installer
    python -m installer.build --clean      # Clean build directory first
"""

from __future__ import annotations

import argparse
import platform
import re
import shutil
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

SRC_DIR = Path(__file__).parent
PROJECT_ROOT = SRC_DIR.parent
BUILD_DIR = SRC_DIR / "dist"
INSTALLER_DIR = Path.home() / ".pilot" / "installer"
INIT_FILE = SRC_DIR / "__init__.py"

MODULE_ORDER = [
    "__init__.py",
    "errors.py",
    "platform_utils.py",
    "ui.py",
    "context.py",
    "downloads.py",
    "steps/__init__.py",
    "steps/base.py",
    "steps/prerequisites.py",
    "steps/claude_files.py",
    "steps/config_files.py",
    "steps/dependencies.py",
    "steps/shell_config.py",
    "steps/vscode_extensions.py",
    "steps/finalize.py",
    "cli.py",
    "__main__.py",
]


def get_current_version() -> str:
    """Read the current version from __init__.py."""
    content = INIT_FILE.read_text()
    match = re.search(r'__version__\s*=\s*["\']([^"\']+)["\']', content)
    return match.group(1) if match else "0.0.0"


def get_platform_suffix() -> str:
    """Get platform-specific binary suffix."""
    system = platform.system().lower()
    machine = platform.machine().lower()

    if machine in ("x86_64", "amd64"):
        arch = "x86_64"
    elif machine in ("arm64", "aarch64"):
        arch = "arm64"
    else:
        arch = machine

    return f"{system}-{arch}"


def set_build_timestamp() -> tuple[str, str]:
    """Set build timestamp in __init__.py and return (version, timestamp)."""
    version = get_current_version()
    timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
    content = f'''"""Claude Pilot Installer - Step-based installation pipeline."""

__version__ = "{version}"
__build__ = "{timestamp}"
'''
    INIT_FILE.write_text(content)
    return version, timestamp


def reset_build_timestamp() -> None:
    """Reset __init__.py to dev mode, preserving version."""
    version = get_current_version()
    content = f'''"""Claude Pilot Installer - Step-based installation pipeline."""

__version__ = "{version}"
__build__ = "dev"
'''
    INIT_FILE.write_text(content)


def strip_installer_imports(code: str) -> str:
    """Remove internal installer imports from code (single and multi-line, including indented)."""
    code = re.sub(
        r"^[ \t]*from installer(?:\.[a-zA-Z_][a-zA-Z0-9_]*)* import \([^)]+\)\s*",
        "",
        code,
        flags=re.MULTILINE | re.DOTALL,
    )
    code = re.sub(
        r"^[ \t]*(?:from installer(?:\.[a-zA-Z_][a-zA-Z0-9_]*)* import [^\(\n]+|import installer(?:\.[a-zA-Z_][a-zA-Z0-9_]*)*)\s*$",
        "",
        code,
        flags=re.MULTILINE,
    )
    return code


def strip_type_checking_blocks(code: str) -> str:
    """Remove empty TYPE_CHECKING blocks left after import stripping."""
    code = re.sub(r"^if TYPE_CHECKING:\s*\n(?=\S|\Z)", "", code, flags=re.MULTILINE)
    code = re.sub(r"^from typing import TYPE_CHECKING(?:, )?", "from typing import ", code, flags=re.MULTILINE)
    code = re.sub(r"^from typing import \s*$", "", code, flags=re.MULTILINE)
    return code


def strip_relative_imports(code: str) -> str:
    """Remove relative imports (from . or from .module)."""
    code = re.sub(
        r"^[ \t]*from \.[a-zA-Z_][a-zA-Z0-9_.]* import [^\(\n]+\s*$",
        "",
        code,
        flags=re.MULTILINE,
    )
    return code


def strip_future_imports(code: str) -> str:
    """Remove __future__ imports (will be added once at top)."""
    return re.sub(r"^from __future__ import annotations\s*$", "", code, flags=re.MULTILINE)


def merge_modules(version: str, build_timestamp: str) -> str:
    """Merge all installer modules into a single Python file."""
    parts = [
        '"""Claude Pilot Installer - Merged module for Cython compilation."""',
        "",
        "from __future__ import annotations",
        "",
        f'__version__ = "{version}"',
        f'__build__ = "{build_timestamp}"',
        "",
    ]

    for module_path in MODULE_ORDER:
        src_file = SRC_DIR / module_path
        if not src_file.exists():
            print(f"  Warning: {module_path} not found, skipping")
            continue

        print(f"  Merging: {module_path}")
        code = src_file.read_text()

        if module_path == "__init__.py":
            continue

        code = strip_installer_imports(code)
        code = strip_relative_imports(code)
        code = strip_type_checking_blocks(code)
        code = strip_future_imports(code)

        code = re.sub(r'^"""[^"]*"""\s*', "", code, count=1)

        section_name = module_path.replace("/", ".").replace(".py", "")
        parts.append(f"\n# === {section_name} ===\n")
        parts.append(code.strip())
        parts.append("")

    parts.append("\n# === Entry point wrapper ===\n")
    parts.append("def app() -> int:")
    parts.append("    '''Entry point wrapper that calls main() and returns exit code.'''")
    parts.append("    return main()")
    parts.append("")

    return "\n".join(parts)


def compile_merged(build_dir: Path, merged_code: str) -> Path:
    """Compile merged module to .so with Cython."""
    cython_build = build_dir / "cython_build"
    if cython_build.exists():
        shutil.rmtree(cython_build)
    cython_build.mkdir(parents=True, exist_ok=True)

    pyx_file = cython_build / "pilot_installer.pyx"
    pyx_file.write_text(merged_code)
    print(f"  Merged code: {len(merged_code)} bytes")

    setup_content = """
from setuptools import setup, Extension
from Cython.Build import cythonize
from Cython.Compiler import Options
import sysconfig

Options.docstrings = False
Options.embed_pos_in_docstring = False

# Get Python include path
python_include = sysconfig.get_path('include')

ext = Extension(
    "pilot_installer",
    sources=["pilot_installer.pyx"],
    include_dirs=[python_include],
)

setup(
    ext_modules=cythonize(
        [ext],
        compiler_directives={
            "language_level": "3str",
            "boundscheck": False,
            "wraparound": True,
            "initializedcheck": False,
            "nonecheck": False,
            "cdivision": True,
        },
        annotate=False,
    ),
    script_args=["build_ext", "--inplace"],
)
"""
    setup_file = cython_build / "setup.py"
    setup_file.write_text(setup_content)

    print("\nCompiling with Cython...")
    cmd = [sys.executable, str(setup_file)]

    result = subprocess.run(cmd, capture_output=True, text=True, cwd=str(cython_build))
    if result.returncode != 0:
        print(f"Compilation failed: {result.stderr}")
        raise subprocess.CalledProcessError(result.returncode, cmd)

    so_files = list(cython_build.glob("pilot_installer*.so")) + list(cython_build.glob("pilot_installer*.pyd"))
    if not so_files:
        raise FileNotFoundError("Compiled .so file not found")

    compiled = so_files[0]

    try:
        subprocess.run(["strip", str(compiled)], capture_output=True)
    except (FileNotFoundError, OSError):
        pass

    if platform.system() == "Darwin":
        try:
            subprocess.run(["xattr", "-c", str(compiled)], capture_output=True)
            subprocess.run(["codesign", "-s", "-", str(compiled)], capture_output=True)
            print("  Applied macOS ad-hoc signing")
        except (FileNotFoundError, OSError):
            pass

    print(f"✓ Compiled: {compiled.name} ({compiled.stat().st_size / 1024:.1f} KB)")
    return compiled


def get_wrapper_content() -> str:
    """Get the wrapper script content."""
    return """#!/bin/bash
# Installer wrapper - runs the compiled installer module with uv-managed Python 3.12
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

exec uv run --python 3.12 --no-project --with rich python -c "
import sys
import os
cwd = os.getcwd()
sys.path = [p for p in sys.path if p and p != cwd and not (os.path.isdir(os.path.join(p, 'installer')) and os.path.isfile(os.path.join(p, 'installer', '__init__.py')))]
sys.path.insert(0, '$SCRIPT_DIR')

from pilot_installer import app
sys.exit(app())
" "$@"
"""


def deploy_to_installer_dir(compiled: Path) -> Path:
    """Deploy .so and wrapper to ~/.pilot/installer/."""
    INSTALLER_DIR.mkdir(parents=True, exist_ok=True)

    for old_file in INSTALLER_DIR.glob("*"):
        if old_file.is_dir():
            shutil.rmtree(old_file)
        else:
            old_file.unlink()

    dst_so = INSTALLER_DIR / compiled.name
    shutil.copy2(compiled, dst_so)
    dst_so.chmod(0o755)

    if platform.system() == "Darwin":
        try:
            subprocess.run(["xattr", "-c", str(dst_so)], capture_output=True)
            subprocess.run(["codesign", "-s", "-", str(dst_so)], capture_output=True)
        except Exception:
            pass

    print(f"Deployed: {dst_so}")

    wrapper = INSTALLER_DIR / "installer"
    wrapper.write_text(get_wrapper_content())
    wrapper.chmod(0o755)
    print(f"Deployed: {wrapper}")

    return wrapper


def package_for_release(compiled: Path, build_dir: Path) -> list[Path]:
    """Package build artifacts for GitHub release."""
    artifacts = []

    release_so = build_dir / f"installer-{get_platform_suffix()}.so"
    shutil.copy2(compiled, release_so)
    release_so.chmod(0o755)
    artifacts.append(release_so)
    print(f"Created: {release_so.name}")

    wrapper = build_dir / "installer"
    wrapper.write_text(get_wrapper_content())
    wrapper.chmod(0o755)
    artifacts.append(wrapper)
    print(f"Created: {wrapper.name}")

    return artifacts


def main() -> int:
    """Main entry point."""
    parser = argparse.ArgumentParser(description="Build installer binary with Cython")
    parser.add_argument("--local", action="store_true", help="Deploy to ~/.pilot/installer")
    parser.add_argument("--clean", action="store_true", help="Clean build directory first")
    parser.add_argument("--release", action="store_true", help="Create release artifacts")
    parser.add_argument("--version", type=str, help="Override version (e.g., for dev builds)")
    args = parser.parse_args()

    if args.clean and BUILD_DIR.exists():
        print(f"Cleaning {BUILD_DIR}...")
        shutil.rmtree(BUILD_DIR)

    BUILD_DIR.mkdir(parents=True, exist_ok=True)

    if args.local:
        version = args.version or get_current_version()
        build_ts = "dev"
        print(f"Version: {version} (local build)")
    else:
        if args.version:
            version = args.version
            build_ts = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
            print(f"Version: {version} (override)")
        else:
            version, build_ts = set_build_timestamp()
            print(f"Version: {version}")
        print(f"Build: {build_ts}")

    print(f"Platform: {get_platform_suffix()}\n")

    try:
        print("Merging modules...")
        merged = merge_modules(version, build_ts)

        compiled = compile_merged(BUILD_DIR, merged)

        if args.release:
            artifacts = package_for_release(compiled, BUILD_DIR)
            print(f"\n✓ Release artifacts:")
            for a in artifacts:
                print(f"  - {a.name} ({a.stat().st_size / 1024:.1f} KB)")
        elif args.local:
            deploy_to_installer_dir(compiled)

        return 0

    except (subprocess.CalledProcessError, FileNotFoundError) as e:
        print(f"\n✗ Build failed: {e}", file=sys.stderr)
        return 1

    finally:
        if not args.local:
            reset_build_timestamp()


if __name__ == "__main__":
    sys.exit(main())
