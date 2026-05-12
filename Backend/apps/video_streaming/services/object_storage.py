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
