FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY alembic.ini .
COPY migrations ./migrations
COPY app ./app
COPY entrypoint.sh .
RUN chmod +x entrypoint.sh

EXPOSE 8000
ENTRYPOINT ["./entrypoint.sh"]
