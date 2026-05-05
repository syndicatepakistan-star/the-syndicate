from __future__ import annotations

import socket
from typing import Callable

from django.conf import settings
from django.core.mail.backends.smtp import EmailBackend as DjangoSMTPEmailBackend


class RailwaySMTPEmailBackend(DjangoSMTPEmailBackend):
    """
    SMTP backend with optional IPv4-only retry for environments where IPv6 egress
    is unavailable (common on some container networks).
    """

    def open(self) -> bool:
        if self.connection:
            return False

        force_ipv4 = bool(getattr(settings, "EMAIL_FORCE_IPV4", False))
        if force_ipv4:
            return self._open_with_ipv4_only()

        try:
            return super().open()
        except OSError as exc:
            # Retry once with IPv4 when socket connect reports unreachable network.
            if getattr(exc, "errno", None) != 101:
                raise
            return self._open_with_ipv4_only()

    def _open_with_ipv4_only(self) -> bool:
        original_getaddrinfo: Callable[..., object] = socket.getaddrinfo

        def ipv4_only_getaddrinfo(host, port, family=0, type=0, proto=0, flags=0):
            selected_family = socket.AF_INET if family in (0, socket.AF_UNSPEC) else family
            return original_getaddrinfo(host, port, selected_family, type, proto, flags)

        socket.getaddrinfo = ipv4_only_getaddrinfo
        try:
            return super().open()
        finally:
            socket.getaddrinfo = original_getaddrinfo

