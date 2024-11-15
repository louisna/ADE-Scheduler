#
# Copyright (C) 2020-2024 ADE-Scheduler.
#
# ADE-Scheduler is free software; you can redistribute it and/or modify it
# under the terms of the MIT License; see LICENSE file for more details.

"""Utilities function for import module."""

import re

from flask import current_app


def get_admin_uuid():
    """Get identifier list."""
    # TODO: use User Role to retrieve data or implements permissions system
    return [
        "dev",
        "00080807",  # Mordant Pascale
        "00083552",  # Lefèvre Julie
        "00246591",  # Dubois Laurent
    ]


def get_codes_from_inscriptions(inscriptions) -> list[str]:
    """
    Get codes from inscriptions.

    :param inscriptions: List of inscriptions for a student.
    :return: list of string
    """
    codes = []
    try:
        for inscription in inscriptions:
            minors = extract_minor(inscription.get("infoMineure", []))
            course = inscription.get("sigleOffreCompletN")
            codes.extend(list(get_codes(course, minors)))
    except Exception as err:
        current_app.logger(err, exc_info=True)
    return codes


def extract_minor(data) -> list[str]:
    """Extract minor codes from data."""
    if isinstance(data, dict):
        data = [data]
    return [
        value["intituleAbregeMineure"]
        for value in data
        if value.get("intituleAbregeMineure")
    ]


def get_minor_codes(minor: str, master=False) -> list[str]:
    """Compute minor codes."""
    if minor.upper() == "MINANTI":
        return [f"{minor}11", f"{minor}12"]

    if master:
        minor = minor.replace("/", "")
        return [f"{minor}21", f"{minor}22"]

    return [minor]


def get_codes(course: str, minors: list[str]) -> list[str]:
    """
    Get computed code from course and minors.

    WARNING: Keep the order of case exactly the same.
    """
    # CASE #1 bis
    # un étudiant inscrit à INGE11BA sera inscrit par défaut à INGE11BA
    if course.endswith("11BA"):
        minor_codes = [
            data
            for minor in minors
            for data in get_minor_codes(minor)
            if minors and data
        ]
        return [course, *minor_codes]

    # CASE #1
    # ECGE1BA sera inscrit par défaut à ECGE12BA, ECGE13BA
    if course.endswith("1BA"):
        prefix = course[:4]
        minor_codes = [
            data
            for minor in minors
            for data in get_minor_codes(minor)
            if minors and data
        ]
        return [f"{prefix}12BA", f"{prefix}13BA", *minor_codes]

    # CASE #4
    pattern = "MS/"
    match = re.search(pattern, course)
    if course[-2:] in ["MA", "MD", "M4"] or match:
        code = course[-2:]
        prefix = course[:-2]
        suffix = ""
        if match:
            indexes = match.span()
            prefix = course[: indexes[0]]
            code = "MS"
            suffix = course[indexes[1] :]

        minor_codes = [
            data
            for minor in minors
            for data in get_minor_codes(minor, master=True)
            if minors and data
        ]
        return [
            f"{prefix}1{code}{suffix}",
            f"{prefix}1MTC",
            f"{prefix}2{code}{suffix}",
            f"{prefix}2MTC",
            f"{prefix}3{code}{suffix}",
            f"{prefix}3MTC",
            *minor_codes,
        ]

    # CASE #2
    # GEST2M1 sera inscrit par défaut à GEST2M1
    # COMU2A sera inscrit par défaut au groupe COMU2A
    if course[-2:] in ["M1", "M5"] or course.endswith("A"):
        minor_codes = [
            data
            for minor in minors
            for data in get_minor_codes(minor, master=True)
            if minors and data
        ]
        return [course, *minor_codes]

    # CASE #3
    # HUMA2MC  sera inscrit par défaut à HUMA2MC + HUMA2MTC
    if course.endswith("MC"):
        prefix = course[:-2]
        minor_codes = [
            data
            for minor in minors
            for data in get_minor_codes(minor, master=True)
            if minors and data
        ]
        return [f"{prefix}MC", f"{prefix}MTC", *minor_codes]
    minor_codes = [
        data
        for minor in minors
        for data in get_minor_codes(minor, master=True)
        if minors and data
    ]
    return [course, *minor_codes]
