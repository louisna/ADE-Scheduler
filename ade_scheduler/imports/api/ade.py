#
# Copyright (C) 2020-2024 ADE-Scheduler.
#
# ADE-Scheduler is free software; you can redistribute it and/or modify it
# under the terms of the MIT License; see LICENSE file for more details.

"""Import from ADE."""

from flask import current_app

from backend.uclouvain_apis import Students

from ..utils import extract_minor, get_codes
from .base import Import


class AdeImport(Import):
    """Import class for ADE."""

    name = "ADE Import"

    def format_response(self, data):
        """Format response."""
        course = data["sigleOffreCompletN"]
        minors = extract_minor(data.get("infoMineure", []))

        return {
            "cycle": data["cycle"],
            "program": data["intitOffreComplet"],
            "programAcronym": data["sigleOffreCompletN"],
            "minors": minors,
            "generated_codes": get_codes(course, minors),
        }

    def request(self, identifier, current_year):
        """Request ADE."""
        inscriptions_url = Students.inscription_url(identifier, current_year)
        manager = current_app.config["MANAGER"]
        headers = manager.client.get_headers()
        resp = Students.get(inscriptions_url, headers=headers)

        inscriptions = (
            resp.json().get("lireInscriptionEtOptionAnacResponse") or {}
        )

        current_inscriptions = self._process_inscriptions(
            inscriptions, current_year
        )

        return {
            "inscriptions": current_inscriptions,
        }

    def _process_inscriptions(self, inscriptions, year):
        """."""
        return [
            self.format_response(data)
            for data in inscriptions.get("return", [])
            if data["anac"] == year
        ]
