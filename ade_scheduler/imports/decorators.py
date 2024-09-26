#
# Copyright (C) 2020-2024 ADE-Scheduler.
#
# ADE-Scheduler is free software; you can redistribute it and/or modify it
# under the terms of the MIT License; see LICENSE file for more details.

"""Decorators for import module."""

from functools import wraps

from flask_login import current_user

from ade_scheduler.imports.models import AutoImportStatus
from ade_scheduler.imports.views import import_my_schedule


def import_default_schedule(function):
    """Import default schedule for the current user."""

    @wraps(function)
    def wrapper(*args, **kwargs):
        autoimport_status = AutoImportStatus.READY
        if current_user and current_user.is_authenticated:
            if getattr(current_user, "autoimport", False):
                autoimport_status = AutoImportStatus.ALREADY_IMPORTED
            elif import_my_schedule():
                autoimport_status = AutoImportStatus.DONE
                current_user.set_autoimport(True)
        return function(autoimport_status, *args, **kwargs)

    return wrapper
