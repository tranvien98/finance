#!/usr/bin/env bash
# Run this script (don't source it) to avoid polluting your shell with base64 env vars.
# Usage: bash create-dev-software.sh

hash() {
  echo -n "$1" | base64
}

export NAME="finance-env"
export NAMESPACE_RAW="dev-software"

export MONGODB_URI=$(hash "mongodb://dev:aiCx9dbi2zG1C20qev%2FPKkDJ%2BHTpCHhDpZh%2Bn16IWdU%3D@147.93.157.61:30017/financial_management")
export NEXTAUTH_SECRET=$(hash "Q33OobykZmBwzm7763liYkK47iRv3rvjuN16Uwz4j0c=")
export NEXTAUTH_URL=$(hash "https://finance.viendev.xyz")
export ENCRYPTION_SECRET=$(hash "O1yDLdQCar0dEE7TAmrbdOPMQ9aTkno8wpFWFAMEGMs=")
export APP_URL=$(hash "https://finance.viendev.xyz")

# gen
envsubst < ./secrets.template.yml > gen.secrets-${NAMESPACE_RAW}.yml