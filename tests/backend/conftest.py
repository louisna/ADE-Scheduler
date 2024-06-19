#
# Copyright (C) 2020-2024 ADE-Scheduler.
#
# ADE-Scheduler is free software; you can redistribute it and/or modify it
# under the terms of the MIT License; see LICENSE file for more details.

"""Configuration for tests."""

import os

import pytest

import backend.ade_api as ade
import backend.servers as srv
from app import app as ade_scheduler


@pytest.fixture(scope="session")
def app():
    """Get app instance."""
    return ade_scheduler


@pytest.fixture(scope="session")
def ade_client():
    """Get ADE client."""
    return ade.FakeClient(
        dict(
            url=os.environ["ADE_URL"],
            data=os.environ["ADE_DATA"],
            Authorization=os.environ["ADE_AUTHORIZATION"],
        )
    )


@pytest.fixture
def project_id(ade_client, app):
    """Get project id."""
    with app.app_context():
        resp = ade_client.get_project_ids()
    project_ids = ade.response_to_project_ids(resp)

    return project_ids.popitem()[1]


""" Until further notice, not used
@pytest.fixture
def resources(ade_client, project_id, app):
    with app.app_context():
        resp = ade_client.get_resources(project_id)

    return ade.response_to_resources(resp)
"""


@pytest.fixture
def resource_ids(ade_client, project_id, app):
    """Load resource ids fixture."""
    with app.app_context():
        resp = ade_client.get_resource_ids(project_id)

    return ade.response_to_resource_ids(resp)


@pytest.fixture
def classrooms(ade_client, project_id, app):
    """Load classrooms fixture."""
    with app.app_context():
        resp = ade_client.get_classrooms(project_id)

    return ade.response_to_classrooms(resp)


@pytest.fixture
def courses(ade_client, project_id, resource_ids, app):
    """Load courses fixture."""
    ids = [
        resource_ids[course]
        for course in ["LEPL1101", "LEPL1102", "LEPL1103", "LEPL1104"]
    ]

    with app.app_context():
        resp = ade_client.get_activities(ids, project_id)

    return ade.response_to_courses(resp)


@pytest.fixture
def server():
    """Get server fixture."""
    return srv.Server()
