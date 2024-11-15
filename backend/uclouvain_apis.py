import os

import requests
from flask import current_app


class API:
    BASE_URL = os.getenv("API_BASE_URL")
    ENDPOINT = ""
    OAUTH_BASE_URL = os.getenv("OAUTH_BASE_URL")

    # Combined @classmethod and @property requires Python >= 3.9
    @classmethod
    @property
    def url(cls):
        return os.path.join(cls.BASE_URL, cls.ENDPOINT)

    @classmethod
    def get(cls, url, **kwargs):
        url = os.path.join(cls.url, url)
        return requests.get(url=url, **kwargs)

    @classmethod
    @property
    def token(cls):
        return os.path.join(cls.OAUTH_BASE_URL, "token")

    TOKEN_URL = token

    @classmethod
    @property
    def authorize(cls):
        return os.path.join(cls.OAUTH_BASE_URL, "authorize")

    AUTHORIZE_URL = authorize


class ADE(API):
    ENDPOINT = "ade/v0"


class My(API):
    ENDPOINT = "my/v0"

    @classmethod
    def roles_url(cls):
        """Get role url.

        return: url
        """
        return f"{cls.ENDPOINT}/digit/roles"

    @classmethod
    def personal_data_url(cls, role):
        """Get data url for role.

        :param role: role of the user.
        return: url
        """
        return f"{cls.ENDPOINT}/{role}"


class MyADE(API):
    ENDPOINT = "myADE/v1"


class Students(API):
    ENDPOINT = "students/v0"

    @classmethod
    def inscription_url(cls, identifier, year):
        """Get inscriptions url.

        :param identifier: identifier of student.
        :param year: academic start year.
        return: url
        """
        return f"{identifier}/inscriptionsetoptions/{year}"

    @classmethod
    def activities_url(cls, identifier, year):
        """Get activities url.

        :param identifier: identifier of student.
        :param year: academic start year.
        return: url
        """
        return f"{identifier}/activities/{year}"

    @classmethod
    def get_inscriptions(cls, identifier, current_year):
        """Get inscriptions user for the given year."""
        manager = current_app.config["MANAGER"]
        headers = manager.client.get_headers()

        resp = cls.get(
            Students.inscription_url(identifier, current_year), headers=headers
        )

        inscriptions = (
            resp.json().get("lireInscriptionEtOptionAnacResponse") or {}
        )

        return [
            data
            for data in inscriptions.get("return", [])
            if data["anac"] == current_year
        ]
