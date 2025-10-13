FROM python:3.10
WORKDIR /app

# Copy API and llm code
COPY ./api ./api
COPY ./llm ./llm
COPY ./certs ./certs

# Copy and install requirements
COPY requirements.txt .
RUN pip install --upgrade pip
RUN pip install --no-cache-dir -r requirements.txt

# Set environment variables for Flask
ENV PYTHONPATH=/app
ENV FLASK_APP=api.main

EXPOSE 80

CMD ["flask", "run", "--host=0.0.0.0", "--port=80"]