hash() {
  echo $(echo "$1" | tr -d '\n' | base64)
}

export NAME="finance-env"
export NAMESPACE_RAW="dev-software"

export MONGODB_URI=$(hash "mongodb+srv://user:password@cluster.mongodb.net/finance?retryWrites=true&w=majority")
export NEXTAUTH_SECRET=$(hash "your-nextauth-secret")
export NEXTAUTH_URL=$(hash "https://finance.viendev.xyz")
export ENCRYPTION_SECRET=$(hash "your-encryption-secret")
export APP_URL=$(hash "https://finance.viendev.xyz")
export AUTH_TRUST_HOST=$(hash "true")

# gen
envsubst < ./secrets.template.yml > gen.secrets-${NAMESPACE_RAW}.yml