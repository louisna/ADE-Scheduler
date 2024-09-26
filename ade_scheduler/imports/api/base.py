#
# Copyright (C) 2020-2024 ADE-Scheduler.
#
# ADE-Scheduler is free software; you can redistribute it and/or modify it
# under the terms of the MIT License; see LICENSE file for more details.

"""Import from extern resources."""


class Import:
    """Import class."""

    name = ""
    url = ""
    url_api = ""

    def __init__(self):
        """Init Import class."""
        assert self.name
        # assert self.url
        # assert self.url_api
        # self.cache = Redis.from_url(current_app.config.get(
        #     'IMPORT_CACHE'
        # ))
        # self.cache_expire = current_app.config.get('IMPORT_CACHE_EXPIRE')

    def get_api_url(self, identifier, year):
        """
        Get direct link to record.

        :param identifier: identifier to use for the link
        :param year: year to use for the link
        :return: url
        """
        url_api = self.url_api.format(
            url=self.url,
            identifier=identifier,
            year=year,
        )
        return url_api
