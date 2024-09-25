#
# Copyright (C) 2020-2024 ADE-Scheduler.
#
# ADE-Scheduler is free software; you can redistribute it and/or modify it
# under the terms of the MIT License; see LICENSE file for more details.

"""WSGI Application."""

import os
import sys

import dotenv

env_prefix = "MYSCHEDULER"


def instance_path():
    """
    Instance path for ADE-Scheduler.

    Defaults to ``<env_prefix>_INSTANCE_PATH`` or if environment
    variable is not set ``<sys.prefix>/var/instance``.
    """
    return os.getenv(f"{env_prefix}_INSTANCE_PATH") or os.path.join(
        sys.prefix, "var", "instance"
    )


# TODO: use flask app factory
if dotenv.load_dotenv(f"{instance_path()}/myscheduler.cfg"):
    from app import app

    application = app
