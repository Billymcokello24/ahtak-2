from typing import Callable


class SanitizeHostMiddleware:
    """Ensure headers like HTTP_HOST and X-Forwarded-* don't contain comma-separated
    duplicate values forwarded by proxies. Some proxy setups append headers and
    Django will treat multiple header lines as a single comma-separated value,
    which can trigger DisallowedHost. This middleware keeps the first value.

    This is a conservative, short-term mitigation — the real fix is to make the
    proxy send single-valued headers. Keep this middleware while you adjust
    nginx to stop sending duplicate headers.
    """

    def __init__(self, get_response: Callable):
        self.get_response = get_response

    def __call__(self, request):
        # Normalize Host header
        host = request.META.get('HTTP_HOST')
        if host and ',' in host:
            request.META['HTTP_HOST'] = host.split(',')[0].strip()

        # Normalize common forwarded headers
        for hdr in ('HTTP_X_FORWARDED_FOR', 'HTTP_X_FORWARDED_PROTO', 'HTTP_X_REAL_IP'):
            val = request.META.get(hdr)
            if val and ',' in val:
                request.META[hdr] = val.split(',')[0].strip()

        return self.get_response(request)
