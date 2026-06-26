# Barça Bot — FastAPI + Anthropic Claude.
# --trusted-host flags are needed because this network's TLS interception
# makes pip's HTTPS to PyPI fail certificate verification (same root cause as
# the Maven/football-data TLS issues).
FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir \
        --trusted-host pypi.org --trusted-host files.pythonhosted.org --trusted-host pypi.python.org \
        -r requirements.txt
COPY app.py .
EXPOSE 8000
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]
