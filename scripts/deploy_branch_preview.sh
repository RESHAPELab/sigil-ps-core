#!/usr/bin/env bash

set -euo pipefail

require_env() {
  local name="$1"
  if [[ -z "${!name:-}" ]]; then
    echo "Missing required environment variable: $name" >&2
    exit 1
  fi
}

slugify() {
  local value="$1"
  value="$(printf '%s' "$value" | tr '[:upper:]' '[:lower:]')"
  value="$(printf '%s' "$value" | sed -E 's/[^a-z0-9]+/-/g; s/^-+//; s/-+$//; s/-{2,}/-/g')"
  printf '%s' "$value"
}

BRANCH_NAME="${BRANCH_NAME:-$(git branch --show-current)}"
BRANCH_SLUG="$(slugify "$BRANCH_NAME")"
SHORT_SHA="${SHORT_SHA:-$(git rev-parse --short HEAD)}"

RESOURCE_GROUP="${RESOURCE_GROUP:-reshapelab}"
CONTAINERAPPS_ENVIRONMENT="${CONTAINERAPPS_ENVIRONMENT:-Test}"
ACR_NAME="${ACR_NAME:-reshapelab}"
IMAGE_REPOSITORY="${IMAGE_REPOSITORY:-sigil-api}"
CONTAINER_APP_PREFIX="${CONTAINER_APP_PREFIX:-sigil-api}"
MAX_HISTORY="${MAX_HISTORY:-10}"

APP_NAME="${APP_NAME:-${CONTAINER_APP_PREFIX}-${BRANCH_SLUG}}"
APP_NAME="$(printf '%.32s' "$APP_NAME" | sed -E 's/-+$//')"
IMAGE_TAG="${IMAGE_TAG:-${BRANCH_SLUG}-${SHORT_SHA}}"

require_env OPENAI_API_KEY
require_env MYSQL_HOST
require_env MYSQL_DATABASE
require_env MYSQL_USER
require_env MYSQL_PASSWORD

az account show >/dev/null

ACR_LOGIN_SERVER="$(az acr show --name "$ACR_NAME" --query loginServer -o tsv)"
ACR_USERNAME="$(az acr credential show --name "$ACR_NAME" --query username -o tsv)"
ACR_PASSWORD="$(az acr credential show --name "$ACR_NAME" --query 'passwords[0].value' -o tsv)"
IMAGE_NAME="${ACR_LOGIN_SERVER}/${IMAGE_REPOSITORY}:${IMAGE_TAG}"

echo "Building image ${IMAGE_NAME} in ACR..."
az acr build \
  --registry "$ACR_NAME" \
  --image "${IMAGE_REPOSITORY}:${IMAGE_TAG}" \
  --file Dockerfile \
  .

if az containerapp show --name "$APP_NAME" --resource-group "$RESOURCE_GROUP" >/dev/null 2>&1; then
  echo "Updating existing Container App ${APP_NAME}..."
  az containerapp secret set \
    --name "$APP_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --secrets \
      openai-api-key="$OPENAI_API_KEY" \
      mysql-user="$MYSQL_USER" \
      mysql-password="$MYSQL_PASSWORD"

  az containerapp update \
    --name "$APP_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --image "$IMAGE_NAME" \
    --set-env-vars \
      OPENAI_API_KEY=secretref:openai-api-key \
      MYSQL_HOST="$MYSQL_HOST" \
      MYSQL_DATABASE="$MYSQL_DATABASE" \
      MYSQL_USER=secretref:mysql-user \
      MYSQL_PASSWORD=secretref:mysql-password \
      MAX_HISTORY="$MAX_HISTORY"
else
  echo "Creating new Container App ${APP_NAME}..."
  az containerapp create \
    --name "$APP_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --environment "$CONTAINERAPPS_ENVIRONMENT" \
    --image "$IMAGE_NAME" \
    --ingress external \
    --target-port 80 \
    --registry-server "$ACR_LOGIN_SERVER" \
    --registry-username "$ACR_USERNAME" \
    --registry-password "$ACR_PASSWORD" \
    --secrets \
      openai-api-key="$OPENAI_API_KEY" \
      mysql-user="$MYSQL_USER" \
      mysql-password="$MYSQL_PASSWORD" \
    --env-vars \
      OPENAI_API_KEY=secretref:openai-api-key \
      MYSQL_HOST="$MYSQL_HOST" \
      MYSQL_DATABASE="$MYSQL_DATABASE" \
      MYSQL_USER=secretref:mysql-user \
      MYSQL_PASSWORD=secretref:mysql-password \
      MAX_HISTORY="$MAX_HISTORY"
fi

FQDN="$(az containerapp show --name "$APP_NAME" --resource-group "$RESOURCE_GROUP" --query properties.configuration.ingress.fqdn -o tsv)"

echo
echo "Preview app: ${APP_NAME}"
echo "Image: ${IMAGE_NAME}"
echo "URL: https://${FQDN}"
