from .settings import *  # noqa: F401,F403

# Schema generation workaround:
# DjangoFilterBackend in this environment lacks DRF's schema hook method.
# Keep runtime settings unchanged; this module is only for `generateschema`.
REST_FRAMEWORK = dict(REST_FRAMEWORK)  # type: ignore[name-defined]
REST_FRAMEWORK["DEFAULT_FILTER_BACKENDS"] = []
