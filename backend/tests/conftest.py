import os

os.environ["DATABASE_URL"] = "sqlite:///:memory:"
os.environ["SECRET_KEY"] = "test-secret"

import pytest

from app import create_app
from app.extensions import db
from app.utils.auth import ADMIN_USER_ID


@pytest.fixture()
def app():
    test_app = create_app()
    test_app.config.update(TESTING=True)
    with test_app.app_context():
        db.create_all()
        yield test_app
        db.session.remove()
        db.drop_all()


@pytest.fixture()
def client(app):
    return app.test_client()


@pytest.fixture()
def authenticated_client(client):
    with client.session_transaction() as session:
        session["_user_id"] = ADMIN_USER_ID
        session["_fresh"] = True
    return client
