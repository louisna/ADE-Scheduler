#
# Copyright (C) 2020-2024 ADE-Scheduler.
#
# ADE-Scheduler is free software; you can redistribute it and/or modify it
# under the terms of the MIT License; see LICENSE file for more details.

"""ADE-Scheduler views."""

from flask import Blueprint, current_app, jsonify, session
from flask_babel import gettext
from flask_login import current_user, login_required

from ade_scheduler.imports.api.ade import AdeImport
from ade_scheduler.imports.utils import (
    get_admin_uuid,
    get_codes_from_inscriptions,
)
from backend.schedules import DEFAULT_IMPORT_SCHEDULE_NAME, Schedule
from backend.uclouvain_apis import Students

api_blueprint = Blueprint("import", __name__, url_prefix="/import")


@login_required
def import_my_schedule():
    """Import new schedule based on the user's inscription."""
    identifier = current_user.fgs

    if identifier in get_admin_uuid() and current_user.masquerade:
        identifier = current_user.masquerade

    mng = current_app.config["MANAGER"]
    inscriptions = Students.get_inscriptions(
        identifier, mng.get_default_project_year()
    )

    try:
        if codes_to_import := get_codes_from_inscriptions(inscriptions):
            mng = current_app.config["MANAGER"]
            schedule = Schedule(
                mng.get_default_project_id(), label=DEFAULT_IMPORT_SCHEDULE_NAME
            )

            for code in codes_to_import:
                code = code.upper()
                if mng.code_exists(code, project_id=schedule.project_id):
                    schedule.add_course(code)

            if schedule.codes:
                session["current_schedule"] = schedule
                session["current_schedule_modified"] = True
                session["current_schedule"] = mng.save_schedule(
                    current_user,
                    session["current_schedule"],
                    session.get("uuid"),
                )
                # reset status
                session["current_schedule_modified"] = False

                return True
    except Exception as err:
        current_app.logger(err, exc_info=True)


@api_blueprint.route("/activities", methods=["GET"])
@login_required
def activities():
    """Import calendar."""
    identifier = current_user.fgs
    mng = current_app.config["MANAGER"]
    # TODO: Use user role in future
    if identifier in get_admin_uuid() and current_user.masquerade:
        identifier = current_user.masquerade
    return jsonify(
        AdeImport().request(identifier, mng.get_default_project_year())
    )


@api_blueprint.route("/", methods=["POST"])
@login_required
def import_schedule():
    """Import schedule."""
    if import_my_schedule():
        schedule = session["current_schedule"]
        return jsonify(
            {
                "current_schedule": {
                    "id": schedule.id,
                    "label": gettext(schedule.label),
                    "color_palette": schedule.color_palette,
                },
                "current_project_id": schedule.project_id,
            }
        ), 201
    return (gettext("There is no event to import for your course")), 202
