# Stage 1: Build React app
FROM node:18 AS ui-build
WORKDIR /app/ui

ENV VITE_API_BASE=http://localhost/api

COPY ./ui/package*.json ./
RUN npm install
COPY ./ui ./
RUN npm run build

# Stage 2: Build Flask API
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

# Copy React build from previous stage
COPY --from=ui-build /app/ui/dist ./ui/dist
COPY --from=ui-build /app/ui/public ./ui/public

# Set environment variables for Flask
ENV PYTHONPATH=/app
ENV FLASK_APP=api.main

EXPOSE 80

CMD ["flask", "run", "--host=0.0.0.0", "--port=80"]