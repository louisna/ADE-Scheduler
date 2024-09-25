import os

import requests


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
