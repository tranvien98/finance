hash() {
  echo $(echo "$1" | tr -d '\n' | base64)
}

export NAME="finance-env"
export NAMESPACE_RAW="dev-software"

export MONGODB_URI=$(hash "mongodb+srv://user:password@cluster.mongodb.net/finance?retryWrites=true&w=majority")
export NEXTAUTH_SECRET=$(hash "Q33OobykZmBwzm7763liYkK47iRv3rvjuN16Uwz4j0c=")
export NEXTAUTH_URL=$(hash "https://finance.viendev.xyz")
export ENCRYPTION_SECRET=$(hash "O1yDLdQCar0dEE7TAmrbdOPMQ9aTkno8wpFWFAMEGMs=")
export APP_URL=$(hash "https://finance.viendev.xyz")

# gen
envsubst < ./secrets.template.yml > gen.secrets-${NAMESPACE_RAW}.yml