"""Tests for installer build module."""

from __future__ import annotations

import sys
from unittest.mock import patch


class TestModuleOrder:
    """Tests for MODULE_ORDER configuration."""

    def test_module_order_includes_all_required_modules(self):
        """MODULE_ORDER should include all installer modules in dependency order."""
        from installer.build import MODULE_ORDER

        assert "__init__.py" in MODULE_ORDER
        assert "errors.py" in MODULE_ORDER
        assert "platform_utils.py" in MODULE_ORDER
        assert "ui.py" in MODULE_ORDER
        assert "context.py" in MODULE_ORDER
        assert "downloads.py" in MODULE_ORDER
        assert "cli.py" in MODULE_ORDER
        assert "__main__.py" in MODULE_ORDER

    def test_errors_comes_before_ui(self):
        """errors.py must be merged before ui.py (ui may import from errors)."""
        from installer.build import MODULE_ORDER

        errors_index = MODULE_ORDER.index("errors.py")
        ui_index = MODULE_ORDER.index("ui.py")
        assert errors_index < ui_index, "errors.py must come before ui.py"

    def test_context_comes_before_cli(self):
        """context.py must be merged before cli.py (cli imports InstallContext)."""
        from installer.build import MODULE_ORDER

        context_index = MODULE_ORDER.index("context.py")
        cli_index = MODULE_ORDER.index("cli.py")
        assert context_index < cli_index, "context.py must come before cli.py"

    def test_steps_base_comes_before_step_modules(self):
        """steps/base.py must come before individual step modules."""
        from installer.build import MODULE_ORDER

        base_index = MODULE_ORDER.index("steps/base.py")
        for module in MODULE_ORDER:
            if module.startswith("steps/") and module != "steps/__init__.py" and module != "steps/base.py":
                step_index = MODULE_ORDER.index(module)
                assert base_index < step_index, f"steps/base.py must come before {module}"


class TestImportStripping:
    """Tests for import stripping functions."""

    def test_strip_installer_imports_removes_internal_imports(self):
        """strip_installer_imports should remove all 'from installer.*' imports."""
        from installer.build import strip_installer_imports

        code = """from installer.context import InstallContext
from installer.ui import Console
import os

def my_function():
    return True
"""
        result = strip_installer_imports(code)
        assert "from installer.context" not in result
        assert "from installer.ui" not in result
        assert "import os" in result
        assert "def my_function" in result

    def test_strip_installer_imports_handles_multiline_imports(self):
        """strip_installer_imports should handle multiline imports."""
        from installer.build import strip_installer_imports

        code = """from installer.steps import (
    PrerequisitesStep,
    ClaudeFilesStep,
)
import sys
"""
        result = strip_installer_imports(code)
        assert "from installer.steps" not in result
        assert "PrerequisitesStep" not in result
        assert "import sys" in result

    def test_strip_installer_imports_handles_indented_imports(self):
        """strip_installer_imports should handle indented imports (inside functions)."""
        from installer.build import strip_installer_imports

        code = """def my_function():
    from installer.platform_utils import has_nvidia_gpu
    return has_nvidia_gpu()
"""
        result = strip_installer_imports(code)
        assert "from installer.platform_utils" not in result
        assert "def my_function" in result
        assert "return has_nvidia_gpu()" in result


class TestRelativeImportStripping:
    """Tests for relative import stripping."""

    def test_strip_relative_imports_removes_relative_imports(self):
        """strip_relative_imports should remove 'from .module import' patterns."""
        from installer.build import strip_relative_imports

        code = """from .base import Step
from .prerequisites import PrerequisitesStep
import os

def my_function():
    return True
"""
        result = strip_relative_imports(code)
        assert "from .base" not in result
        assert "from .prerequisites" not in result
        assert "import os" in result
        assert "def my_function" in result


class TestWrapperContent:
    """Tests for installer wrapper script content."""

    def test_wrapper_includes_rich_dependency(self):
        """Wrapper must include --with rich for UI rendering."""
        from installer.build import get_wrapper_content

        wrapper = get_wrapper_content()
        assert "--with rich" in wrapper

    def test_wrapper_uses_no_project_flag(self):
        """Wrapper must use --no-project to avoid picking up local pyproject.toml."""
        from installer.build import get_wrapper_content

        wrapper = get_wrapper_content()
        assert "--no-project" in wrapper

    def test_wrapper_imports_from_pilot_installer(self):
        """Wrapper must import app from pilot_installer module."""
        from installer.build import get_wrapper_content

        wrapper = get_wrapper_content()
        assert "from pilot_installer import app" in wrapper

    def test_wrapper_calls_sys_exit_with_app_result(self):
        """Wrapper must call sys.exit(app()) to propagate exit code."""
        from installer.build import get_wrapper_content

        wrapper = get_wrapper_content()
        assert "sys.exit(app())" in wrapper


class TestVersionOverride:
    """Tests for --version flag support."""

    @patch("installer.build.BUILD_DIR")
    @patch("installer.build.reset_build_timestamp")
    @patch("installer.build.compile_merged")
    @patch("installer.build.merge_modules")
    @patch("installer.build.get_current_version", return_value="6.5.8")
    def test_version_flag_overrides_default_version(
        self, _mock_ver, mock_merge, _mock_compile, _mock_reset, mock_build_dir
    ):
        """--version flag should override the default version from __init__.py."""
        from installer.build import main

        mock_build_dir.exists.return_value = False
        mock_build_dir.mkdir.return_value = None

        with patch.object(sys, "argv", ["build.py", "--version", "dev-abc1234-20260124"]):
            try:
                main()
            except SystemExit:
                pass

        mock_merge.assert_called_once()
        assert mock_merge.call_args[0][0] == "dev-abc1234-20260124"
