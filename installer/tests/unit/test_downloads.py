"""Tests for downloads module."""

from __future__ import annotations

import tempfile
import urllib.error
from pathlib import Path


class TestDownloadConfig:
    """Test DownloadConfig class."""

    def test_download_config_stores_values(self):
        """DownloadConfig stores repository settings."""
        from installer.downloads import DownloadConfig

        config = DownloadConfig(
            repo_url="https://github.com/test/repo",
            repo_branch="main",
        )
        assert config.repo_url == "https://github.com/test/repo"
        assert config.repo_branch == "main"
        assert config.local_mode is False
        assert config.local_repo_dir is None

    def test_download_config_local_mode(self):
        """DownloadConfig supports local mode."""
        from installer.downloads import DownloadConfig

        config = DownloadConfig(
            repo_url="https://github.com/test/repo",
            repo_branch="main",
            local_mode=True,
            local_repo_dir=Path("/tmp/repo"),
        )
        assert config.local_mode is True
        assert config.local_repo_dir == Path("/tmp/repo")


class TestDownloadFile:
    """Test download_file function."""

    def test_download_file_creates_parent_dirs(self):
        """download_file creates parent directories."""
        from installer.downloads import DownloadConfig, download_file

        with tempfile.TemporaryDirectory() as tmpdir:
            dest = Path(tmpdir) / "subdir" / "file.txt"
            config = DownloadConfig(
                repo_url="https://github.com/test/repo",
                repo_branch="main",
                local_mode=True,
                local_repo_dir=Path(tmpdir),
            )

            source = Path(tmpdir) / "test.txt"
            source.write_text("test content")

            download_file("test.txt", dest, config)
            assert dest.parent.exists()

    def test_download_file_local_mode_copies(self):
        """download_file copies file in local mode."""
        from installer.downloads import DownloadConfig, download_file

        with tempfile.TemporaryDirectory() as tmpdir:
            source_dir = Path(tmpdir) / "source"
            source_dir.mkdir()
            source = source_dir / "test.txt"
            source.write_text("local content")

            dest = Path(tmpdir) / "dest" / "test.txt"
            config = DownloadConfig(
                repo_url="https://github.com/test/repo",
                repo_branch="main",
                local_mode=True,
                local_repo_dir=source_dir,
            )

            result = download_file("test.txt", dest, config)
            assert result is True
            assert dest.exists()
            assert dest.read_text() == "local content"

    def test_download_file_returns_false_on_missing_source(self):
        """download_file returns False if source doesn't exist."""
        from installer.downloads import DownloadConfig, download_file

        with tempfile.TemporaryDirectory() as tmpdir:
            dest = Path(tmpdir) / "dest" / "test.txt"
            config = DownloadConfig(
                repo_url="https://github.com/test/repo",
                repo_branch="main",
                local_mode=True,
                local_repo_dir=Path(tmpdir),
            )

            result = download_file("nonexistent.txt", dest, config)
            assert result is False


class TestGetRepoFiles:
    """Test get_repo_files function."""

    def test_get_repo_files_local_mode(self):
        """get_repo_files returns FileInfo objects in local mode."""
        from installer.downloads import DownloadConfig, get_repo_files

        with tempfile.TemporaryDirectory() as tmpdir:
            subdir = Path(tmpdir) / "mydir"
            subdir.mkdir()
            (subdir / "file1.txt").write_text("content1")
            (subdir / "file2.txt").write_text("content2")

            config = DownloadConfig(
                repo_url="https://github.com/test/repo",
                repo_branch="main",
                local_mode=True,
                local_repo_dir=Path(tmpdir),
            )

            file_infos = get_repo_files("mydir", config)
            assert len(file_infos) == 2
            paths = [f.path for f in file_infos]
            assert "mydir/file1.txt" in paths
            assert "mydir/file2.txt" in paths
            assert all(f.sha is None for f in file_infos)

    def test_get_repo_files_returns_empty_for_missing_dir(self):
        """get_repo_files returns empty list for missing directory."""
        from installer.downloads import DownloadConfig, get_repo_files

        with tempfile.TemporaryDirectory() as tmpdir:
            config = DownloadConfig(
                repo_url="https://github.com/test/repo",
                repo_branch="main",
                local_mode=True,
                local_repo_dir=Path(tmpdir),
            )

            files = get_repo_files("nonexistent", config)
            assert files == []


class TestTreeCaching:
    """Test ETag caching for tree API responses."""

    def test_get_cache_path_returns_path_in_pilot_dir(self):
        """get_cache_path returns path under ~/.pilot/cache."""
        from installer.downloads import get_cache_path

        cache_path = get_cache_path()
        assert cache_path.parent.name == "cache"
        assert cache_path.parent.parent.name == ".pilot"

    def test_load_tree_cache_returns_empty_when_no_cache(self):
        """load_tree_cache returns empty dict when cache file doesn't exist."""
        from installer.downloads import load_tree_cache

        with tempfile.TemporaryDirectory() as tmpdir:
            cache_path = Path(tmpdir) / "nonexistent.json"
            cache = load_tree_cache(cache_path)
            assert cache == {}

    def test_save_and_load_tree_cache(self):
        """save_tree_cache and load_tree_cache round-trip correctly."""
        from installer.downloads import load_tree_cache, save_tree_cache

        with tempfile.TemporaryDirectory() as tmpdir:
            cache_path = Path(tmpdir) / "cache.json"
            cache_data = {
                "main": {
                    "etag": '"abc123"',
                    "files": [{"path": "pilot/test.py", "sha": "def456"}],
                }
            }
            save_tree_cache(cache_path, cache_data)
            loaded = load_tree_cache(cache_path)
            assert loaded == cache_data

    def test_get_repo_files_uses_cached_response_on_304(self):
        """get_repo_files returns cached files when API returns 304."""
        from unittest.mock import MagicMock, patch

        from installer.downloads import DownloadConfig, FileInfo, get_repo_files

        config = DownloadConfig(
            repo_url="https://github.com/test/repo",
            repo_branch="main",
        )

        cached_files = [{"path": "pilot/test.py", "sha": "abc123"}]

        with tempfile.TemporaryDirectory() as tmpdir:
            cache_path = Path(tmpdir) / "cache.json"
            cache_data = {"main": {"etag": '"cached-etag"', "files": cached_files}}
            cache_path.parent.mkdir(parents=True, exist_ok=True)
            cache_path.write_text('{"main": {"etag": "\\"cached-etag\\"", "files": [{"path": "pilot/test.py", "sha": "abc123"}]}}')

            with patch("installer.downloads.get_cache_path", return_value=cache_path):
                error_304 = urllib.error.HTTPError(
                    url="test", code=304, msg="Not Modified", hdrs={}, fp=None
                )
                with patch("urllib.request.urlopen", side_effect=error_304):
                    files = get_repo_files("pilot", config)

        assert len(files) == 1
        assert files[0].path == "pilot/test.py"
        assert files[0].sha == "abc123"
