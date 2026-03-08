import pytest


@pytest.fixture
def project_id(client, auth_headers):
    resp = client.post("/projects/", json={"title": "Projeto p/ Tarefas"}, headers=auth_headers)
    return resp.json()["id"]


@pytest.fixture
def task(client, auth_headers, project_id):
    resp = client.post(f"/projects/{project_id}/tasks", json={
        "title": "Tarefa Inicial",
        "description": "Descrição da tarefa",
        "priority": "high",
    }, headers=auth_headers)
    assert resp.status_code == 201
    return resp.json()


def test_create_task(client, auth_headers, project_id):
    resp = client.post(f"/projects/{project_id}/tasks", json={
        "title": "Nova Tarefa",
        "priority": "medium",
        "status": "todo",
    }, headers=auth_headers)
    assert resp.status_code == 201
    data = resp.json()
    assert data["title"] == "Nova Tarefa"
    assert data["status"] == "todo"
    assert data["project_id"] == project_id


def test_list_tasks(client, auth_headers, project_id, task):
    resp = client.get(f"/projects/{project_id}/tasks", headers=auth_headers)
    assert resp.status_code == 200
    ids = [t["id"] for t in resp.json()]
    assert task["id"] in ids


def test_list_tasks_filter_by_status(client, auth_headers, project_id, task):
    resp = client.get(f"/projects/{project_id}/tasks?status=todo", headers=auth_headers)
    assert resp.status_code == 200
    for t in resp.json():
        assert t["status"] == "todo"


def test_update_task_status(client, auth_headers, task):
    resp = client.put(f"/tasks/{task['id']}", json={"status": "in_progress"}, headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["status"] == "in_progress"


def test_update_task_done(client, auth_headers, task):
    resp = client.put(f"/tasks/{task['id']}", json={"status": "done", "priority": "low"}, headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "done"
    assert data["priority"] == "low"


def test_delete_task(client, auth_headers, project_id):
    resp = client.post(f"/projects/{project_id}/tasks", json={"title": "Para Deletar"}, headers=auth_headers)
    task_id = resp.json()["id"]

    del_resp = client.delete(f"/tasks/{task_id}", headers=auth_headers)
    assert del_resp.status_code == 204

    get_resp = client.get(f"/tasks/{task_id}", headers=auth_headers)
    assert get_resp.status_code == 404


def test_dashboard(client, auth_headers):
    resp = client.get("/dashboard", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert "projects" in data
    assert "tasks" in data
    assert "completion_rate" in data["tasks"]
