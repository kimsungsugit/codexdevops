from __future__ import annotations

from scripts.generate_periodic_reports import infer_change_facets, infer_work_type, is_frontend_path


def test_is_frontend_path_accepts_active_frontend_v2():
    assert is_frontend_path("frontend-v2/src/App.jsx") is True


def test_is_frontend_path_rejects_legacy_frontend():
    assert is_frontend_path("frontend/src/App.jsx") is False


def test_infer_work_type_treats_frontend_v2_changes_as_feature():
    changed_files = [
        "frontend-v2/src/App.jsx",
        "frontend-v2/src/views/Dashboard.jsx",
        "frontend-v2/src/components/StatusBadge.jsx",
        "backend/routers/health.py",
    ]

    result = infer_work_type(changed_files, commits=[], profile_name="general_software")

    assert result == "feature"


def test_infer_change_facets_includes_ui_for_frontend_v2_changes():
    changed_files = ["frontend-v2/src/App.jsx", "backend/routers/health.py"]
    facets = infer_change_facets(changed_files, commits=[], diff_summary={"top_files": []})

    facet_names = {item["name"] for item in facets}
    assert "UI" in facet_names
    assert "API" in facet_names
