#
# Copyright (C) 2020-2024 ADE-Scheduler.
#
# ADE-Scheduler is free software; you can redistribute it and/or modify it
# under the terms of the MIT License; see LICENSE file for more details.

"""Models for import module."""


class AutoImportStatus:
    """Class to define auto import status."""

    READY = "ready"
    ALREADY_IMPORTED = "already_imported"
    DONE = "done"
