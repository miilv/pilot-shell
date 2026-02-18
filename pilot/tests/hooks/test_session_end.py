"""Tests for session_end hook — worker stop and notification behavior."""

from __future__ import annotations

import json
import os
from unittest.mock import MagicMock, patch

import pytest

import session_end


@pytest.mark.unit
def test_returns_early_without_plugin_root():
    """Should return 0 when CLAUDE_PLUGIN_ROOT is not set."""
    with patch.dict(os.environ, {}, clear=True):
        os.environ.pop("CLAUDE_PLUGIN_ROOT", None)
        result = session_end.main()

    assert result == 0


@pytest.mark.unit
def test_skips_stop_when_other_sessions_active():
    """Should skip worker stop when other Pilot sessions are running."""
    with (
        patch.dict(os.environ, {"CLAUDE_PLUGIN_ROOT": "/fake/plugin"}),
        patch("session_end._get_active_session_count", return_value=2),
        patch("session_end.subprocess.run") as mock_run,
    ):
        result = session_end.main()

    assert result == 0
    mock_run.assert_not_called()


@pytest.mark.unit
def test_stops_worker_when_no_other_sessions(tmp_path):
    """Should stop worker when this is the only active session."""
    session_dir = tmp_path / "sessions" / "test-session"
    session_dir.mkdir(parents=True)

    with (
        patch.dict(os.environ, {"CLAUDE_PLUGIN_ROOT": "/fake/plugin", "PILOT_SESSION_ID": "test-session"}),
        patch("session_end._get_active_session_count", return_value=1),
        patch("session_end._sessions_base", return_value=tmp_path / "sessions"),
        patch("session_end.subprocess.run", return_value=MagicMock(returncode=0)) as mock_run,
        patch("session_end.send_dashboard_notification"),
    ):
        result = session_end.main()

    assert result == 0
    mock_run.assert_called_once()
    assert "stop" in str(mock_run.call_args)


@pytest.mark.unit
def test_returns_0_when_zero_sessions(tmp_path):
    """Should stop worker and return 0 when no sessions active."""
    session_dir = tmp_path / "sessions" / "test-session"
    session_dir.mkdir(parents=True)

    with (
        patch.dict(os.environ, {"CLAUDE_PLUGIN_ROOT": "/fake/plugin", "PILOT_SESSION_ID": "test-session"}),
        patch("session_end._get_active_session_count", return_value=0),
        patch("session_end._sessions_base", return_value=tmp_path / "sessions"),
        patch("session_end.subprocess.run", return_value=MagicMock(returncode=0)),
        patch("session_end.send_dashboard_notification"),
    ):
        result = session_end.main()

    assert result == 0


@pytest.mark.unit
def test_returns_0_when_plan_pending(tmp_path):
    """Should return 0 when plan is PENDING (not verified)."""
    session_dir = tmp_path / "sessions" / "test-session"
    session_dir.mkdir(parents=True)
    plan_data = {"plan_path": "/fake/plan.md", "status": "PENDING"}
    (session_dir / "active_plan.json").write_text(json.dumps(plan_data))

    with (
        patch.dict(os.environ, {"CLAUDE_PLUGIN_ROOT": "/fake/plugin", "PILOT_SESSION_ID": "test-session"}),
        patch("session_end._get_active_session_count", return_value=0),
        patch("session_end._sessions_base", return_value=tmp_path / "sessions"),
        patch("session_end.subprocess.run", return_value=MagicMock(returncode=0)),
        patch("session_end.send_dashboard_notification") as mock_notify,
    ):
        result = session_end.main()

    assert result == 0
    mock_notify.assert_called_once_with("attention_needed", "Session Ended", "Claude session ended")
