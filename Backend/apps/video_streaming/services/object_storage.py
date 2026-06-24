"""
S3-compatible client (R2, Railway buckets, AWS S3) shared by uploads and signed GET URLs.
"""

from __future__ import annotations

import os
import logging

import boto3
from botocore.config import Config as BotoConfig
from botocore.exceptions import ClientError
from django.conf import settings


logger = logging.getLogger(__name__)

_s3_client_instance = None


def s3_client():
    """Re-use one boto3 client per process (connection pool for parallel segment GETs)."""
    global _s3_client_instance
    if not getattr(settings, "USE_S3_OBJECT_STORAGE", False):
        return None
    if _s3_client_instance is not None:
        return _s3_client_instance
    endpoint = (getattr(settings, "AWS_S3_ENDPOINT_URL", None) or "").strip() or None
    region = (getattr(settings, "AWS_S3_REGION_NAME", None) or "auto").strip()
    try:
        pool = int(getattr(settings, "STREAM_S3_MAX_POOL_CONNECTIONS", 32))
    except (TypeError, ValueError):
        pool = 32
    pool = max(8, min(pool, 64))
    _s3_client_instance = boto3.client(
        "s3",
        endpoint_url=endpoint,
        region_name=region,
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
        config=BotoConfig(
            retries={"max_attempts": 8, "mode": "adaptive"},
            max_pool_connections=pool,
        ),
    )
    return _s3_client_instance


def bucket_object_exists(object_key: str) -> bool:
    """
    Return True if the object key exists in the configured private bucket.
    On auth/network errors, returns True so admin save is not blocked (link is validated at playback).
    """
    key = (object_key or "").strip().lstrip("/")
    if not key:
        return False
    if not getattr(settings, "USE_S3_OBJECT_STORAGE", False):
        return True
    skip = (os.environ.get("STREAM_ADMIN_SKIP_BUCKET_HEAD_CHECK") or "").strip().lower() in (
        "1",
        "true",
        "yes",
    )
    if skip:
        return True
    bucket = (getattr(settings, "AWS_STORAGE_BUCKET_NAME", None) or "").strip()
    client = s3_client()
    if not bucket or client is None:
        return True
    try:
        from botocore.exceptions import ClientError

        client.head_object(Bucket=bucket, Key=key)
        return True
    except ClientError as exc:
        code = (exc.response.get("Error") or {}).get("Code") or ""
        if code in ("404", "NoSuchKey", "NotFound"):
            return False
        return True
    except Exception:
        return True


def get_s3_object_text(*, bucket: str, key: str, max_bytes: int = 2 * 1024 * 1024) -> str | None:
    """Read a small text object (e.g. m3u8 manifest) from the bucket."""
    client = s3_client()
    if client is None or not bucket or not key:
        return None
    try:
        obj = client.get_object(Bucket=bucket, Key=key)
        body = obj.get("Body")
        if body is None:
            return None
        raw = body.read(max_bytes + 1)
        if len(raw) > max_bytes:
            logger.warning("S3 object %s exceeds max_bytes=%s", key, max_bytes)
        return raw.decode("utf-8", errors="replace")
    except ClientError as exc:
        code = (exc.response.get("Error") or {}).get("Code", "")
        logger.warning("get_s3_object_text ClientError key=%s code=%s", key, code)
        return None
    except Exception:
        logger.exception("get_s3_object_text failed key=%s", key)
        return None
