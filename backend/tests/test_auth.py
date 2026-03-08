import pytest


def test_register_success(client):
    resp = client.post("/auth/register", json={
        "name": "Novo Usuário",
        "email": "novo@example.com",
        "password": "senha5678",
    })
    assert resp.status_code == 201
    data = resp.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["user"]["email"] == "novo@example.com"
    assert data["user"]["role"] == "user"


def test_register_duplicate_email(client):
    payload = {"name": "Dup", "email": "dup@example.com", "password": "senha1234"}
    client.post("/auth/register", json=payload)
    resp = client.post("/auth/register", json=payload)
    assert resp.status_code == 400
    assert "cadastrado" in resp.json()["detail"].lower()


def test_register_weak_password(client):
    resp = client.post("/auth/register", json={
        "name": "Fraco",
        "email": "fraco@example.com",
        "password": "123",
    })
    assert resp.status_code == 422


def test_login_success(client, registered_user):
    resp = client.post("/auth/login", json={
        "email": "carlos@test.com",
        "password": "senha1234",
    })
    assert resp.status_code == 200
    assert "access_token" in resp.json()


def test_login_wrong_password(client):
    resp = client.post("/auth/login", json={
        "email": "carlos@test.com",
        "password": "errada999",
    })
    assert resp.status_code == 401


def test_login_unknown_email(client):
    resp = client.post("/auth/login", json={
        "email": "naoexiste@test.com",
        "password": "qualquer",
    })
    assert resp.status_code == 401


def test_me_authenticated(client, auth_headers):
    resp = client.get("/auth/me", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["email"] == "carlos@test.com"


def test_me_unauthenticated(client):
    resp = client.get("/auth/me")
    assert resp.status_code == 401


def test_refresh_token(client, registered_user):
    resp = client.post("/auth/refresh", json={
        "refresh_token": registered_user["refresh_token"]
    })
    assert resp.status_code == 200
    assert "access_token" in resp.json()


def test_refresh_with_access_token_fails(client, registered_user):
    resp = client.post("/auth/refresh", json={
        "refresh_token": registered_user["access_token"]  # wrong type
    })
    assert resp.status_code == 401
