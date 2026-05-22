"""
S3-compatible client (R2, Railway buckets, AWS S3) shared by uploads and signed GET URLs.
"""

from __future__ import annotations

import boto3
from botocore.config import Config as BotoConfig
from django.conf import settings


def s3_client():
    if not getattr(settings, "USE_S3_OBJECT_STORAGE", False):
        return None
    endpoint = (getattr(settings, "AWS_S3_ENDPOINT_URL", None) or "").strip() or None
    region = (getattr(settings, "AWS_S3_REGION_NAME", None) or "auto").strip()
    return boto3.client(
        "s3",
        endpoint_url=endpoint,
        region_name=region,
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
        config=BotoConfig(retries={"max_attempts": 8, "mode": "adaptive"}),
    )


def bucket_object_exists(object_key: str) -> bool:
    """Return True if the object key exists in the configured private bucket."""
    key = (object_key or "").strip().lstrip("/")
    if not key:
        return False
    if not getattr(settings, "USE_S3_OBJECT_STORAGE", False):
        return True
    bucket = (getattr(settings, "AWS_STORAGE_BUCKET_NAME", None) or "").strip()
    client = s3_client()
    if not bucket or client is None:
        return True
    try:
        client.head_object(Bucket=bucket, Key=key)
        return True
    except Exception:
        return False
