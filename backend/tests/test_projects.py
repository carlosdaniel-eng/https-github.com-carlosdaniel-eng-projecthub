import pytest


PROJECT_PAYLOAD = {
    "title": "Projeto Teste",
    "description": "Descrição do projeto de teste",
    "github_repo": "octocat/Hello-World",
}


@pytest.fixture
def project(client, auth_headers):
    resp = client.post("/projects/", json=PROJECT_PAYLOAD, headers=auth_headers)
    assert resp.status_code == 201
    return resp.json()


def test_create_project(client, auth_headers):
    resp = client.post("/projects/", json=PROJECT_PAYLOAD, headers=auth_headers)
    assert resp.status_code == 201
    data = resp.json()
    assert data["title"] == PROJECT_PAYLOAD["title"]
    assert data["status"] == "active"
    assert "owner" in data
    assert len(data["members"]) == 1  # owner auto-added


def test_create_project_unauthenticated(client):
    resp = client.post("/projects/", json=PROJECT_PAYLOAD)
    assert resp.status_code == 401


def test_list_projects(client, auth_headers, project):
    resp = client.get("/projects/", headers=auth_headers)
    assert resp.status_code == 200
    ids = [p["id"] for p in resp.json()]
    assert project["id"] in ids


def test_get_project(client, auth_headers, project):
    resp = client.get(f"/projects/{project['id']}", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["id"] == project["id"]


def test_get_project_not_found(client, auth_headers):
    resp = client.get("/projects/999999", headers=auth_headers)
    assert resp.status_code == 404


def test_update_project(client, auth_headers, project):
    resp = client.put(
        f"/projects/{project['id']}",
        json={"title": "Título Atualizado", "status": "completed"},
        headers=auth_headers,
    )
    assert resp.status_code == 200
    assert resp.json()["title"] == "Título Atualizado"
    assert resp.json()["status"] == "completed"


def test_delete_project(client, auth_headers):
    resp = client.post("/projects/", json={
        "title": "Para Deletar", "description": "Temp"
    }, headers=auth_headers)
    project_id = resp.json()["id"]

    del_resp = client.delete(f"/projects/{project_id}", headers=auth_headers)
    assert del_resp.status_code == 204

    get_resp = client.get(f"/projects/{project_id}", headers=auth_headers)
    assert get_resp.status_code == 404


def test_health_endpoint(client):
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.json()["status"] == "ok"
