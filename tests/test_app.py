import copy
from fastapi.testclient import TestClient
import src.app as appmodule

client = TestClient(appmodule.app)

ORIGINAL = copy.deepcopy(appmodule.activities)

import pytest


@pytest.fixture(autouse=True)
def reset_activities():
    # restore original activities before each test
    appmodule.activities = copy.deepcopy(ORIGINAL)
    yield


def test_get_activities():
    res = client.get("/activities")
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, dict)
    assert "Chess Club" in data
    assert "participants" in data["Chess Club"]


def test_signup_success():
    email = "tester@example.com"
    activity = "Chess Club"
    res = client.post(f"/activities/{activity}/signup?email={email}")
    assert res.status_code == 200
    assert email in appmodule.activities[activity]["participants"]


def test_signup_duplicate():
    activity = "Chess Club"
    existing = appmodule.activities[activity]["participants"][0]
    # try to sign up same email with different case
    res = client.post(f"/activities/{activity}/signup?email={existing.upper()}")
    assert res.status_code == 400


def test_unregister_success():
    activity = "Chess Club"
    # unregister an existing participant
    existing = appmodule.activities[activity]["participants"][0]
    res = client.post(f"/activities/{activity}/unregister?email={existing}")
    assert res.status_code == 200
    assert existing not in appmodule.activities[activity]["participants"]

    # add and unregister a new participant
    new_email = "tempuser@example.com"
    client.post(f"/activities/{activity}/signup?email={new_email}")
    assert new_email in appmodule.activities[activity]["participants"]
    res = client.post(f"/activities/{activity}/unregister?email={new_email}")
    assert res.status_code == 200
    assert new_email not in appmodule.activities[activity]["participants"]


def test_unregister_activity_not_found():
    res = client.post(f"/activities/NoSuchActivity/unregister?email=a@b.com")
    assert res.status_code == 404


def test_unregister_participant_not_found():
    activity = "Chess Club"
    res = client.post(f"/activities/{activity}/unregister?email=nonexistent@example.com")
    assert res.status_code == 404
