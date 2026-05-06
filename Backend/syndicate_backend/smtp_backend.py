from __future__ import annotations

import socket
from dataclasses import dataclass
from typing import Callable

from django.conf import settings
from django.core.mail.backends.smtp import EmailBackend as DjangoSMTPEmailBackend


class RailwaySMTPEmailBackend(DjangoSMTPEmailBackend):
    """
    SMTP backend with optional IPv4-only retry for environments where IPv6 egress
    is unavailable (common on some container networks).
    """

    @dataclass(frozen=True)
    class Attempt:
        host: str
        port: int
        use_ssl: bool
        use_tls: bool

    def open(self) -> bool:
        if self.connection:
            return False

        force_ipv4 = bool(getattr(settings, "EMAIL_FORCE_IPV4", False))
        attempts = self._smtp_attempts()
        last_error: Exception | None = None
        for attempt in attempts:
            try:
                return self._open_single_attempt(attempt, force_ipv4=force_ipv4)
            except (OSError, TimeoutError) as exc:
                last_error = exc
                continue
        if last_error is not None:
            raise last_error
        return False

    def _smtp_attempts(self) -> list[Attempt]:
        primary_host = str(self.host or "").strip()
        primary_port = int(self.port or 0)
        primary_ssl = bool(self.use_ssl)
        primary_tls = bool(self.use_tls)
        attempts: list[RailwaySMTPEmailBackend.Attempt] = []
        if primary_host and primary_port > 0:
            attempts.append(self.Attempt(primary_host, primary_port, primary_ssl, primary_tls))

        fallback_hosts_raw = str(getattr(settings, "EMAIL_FALLBACK_HOSTS", "") or "").strip()
        fallback_hosts = [h.strip() for h in fallback_hosts_raw.split(",") if h.strip()]
        fallback_ports_raw = str(getattr(settings, "EMAIL_FALLBACK_PORTS", "") or "").strip()
        fallback_ports = []
        for p in fallback_ports_raw.split(","):
            p = p.strip()
            if not p:
                continue
            try:
                fallback_ports.append(int(p))
            except ValueError:
                continue

        # Sensible SMTP combos: SMTPS 465 and STARTTLS 587.
        combos = [
            (465, True, False),
            (587, False, True),
        ]
        for host in fallback_hosts:
            for port, use_ssl, use_tls in combos:
                if fallback_ports and port not in fallback_ports:
                    continue
                attempt = self.Attempt(host, port, use_ssl, use_tls)
                if attempt not in attempts:
                    attempts.append(attempt)
        return attempts

    def _open_single_attempt(self, attempt: Attempt, *, force_ipv4: bool) -> bool:
        original_host, original_port = self.host, self.port
        original_ssl, original_tls = self.use_ssl, self.use_tls
        self.host, self.port = attempt.host, attempt.port
        self.use_ssl, self.use_tls = attempt.use_ssl, attempt.use_tls
        try:
            if force_ipv4:
                return self._open_with_ipv4_only()
            try:
                return super().open()
            except OSError as exc:
                # Retry this specific attempt with IPv4 when network path is unreachable.
                if getattr(exc, "errno", None) != 101:
                    raise
                return self._open_with_ipv4_only()
        finally:
            self.host, self.port = original_host, original_port
            self.use_ssl, self.use_tls = original_ssl, original_tls

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

