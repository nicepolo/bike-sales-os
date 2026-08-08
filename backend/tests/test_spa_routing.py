import pytest


@pytest.fixture()
def spa_client(app, tmp_path):
    static_dir = tmp_path / "static"
    static_dir.mkdir()
    (static_dir / "index.html").write_text("<html>SPA shell</html>", encoding="utf-8")
    assets_dir = static_dir / "assets"
    assets_dir.mkdir()
    (assets_dir / "app.js").write_text("console.log('ok')", encoding="utf-8")
    app.static_folder = str(static_dir)
    return app.test_client()


@pytest.mark.parametrize("path", ["/", "/login", "/dashboard", "/customers"])
def test_spa_routes_return_index(spa_client, path):
    response = spa_client.get(path)

    assert response.status_code == 200
    assert response.get_data(as_text=True) == "<html>SPA shell</html>"


def test_spa_assets_are_still_served(spa_client):
    response = spa_client.get("/assets/app.js")

    assert response.status_code == 200
    assert response.get_data(as_text=True) == "console.log('ok')"


def test_unknown_api_route_is_not_handled_by_spa(spa_client):
    response = spa_client.get("/api/does-not-exist")

    assert response.status_code == 404
    assert response.is_json
    assert response.get_json() == {"error": "找不到 API 路由"}
