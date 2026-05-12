# Django API + Gunicorn (Railway). Large uploads use private S3-compatible storage + multipart APIs.
FROM python:3.12-slim-bookworm

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

ENV DJANGO_SETTINGS_MODULE=syndicate_backend.settings

EXPOSE 8080

CMD ["sh", "railway_start.sh"]
