# Finance

Ung dung quan ly tai chinh ca nhan - Next.js, MongoDB, AI classification.

## Development

```bash
cp .env.local.example .env.local  # cau hinh env
npm install
npm run dev                        # http://localhost:3000
```

## Build & Run local bang Docker

```bash
docker build -t finance .
docker run -p 3000:3000 --env-file .env.local finance
```

## Deploy len K3s

### 1. Cau hinh server K3s

Tao namespace va secret:

```bash
# Tao namespace
kubectl create namespace finance

# Tao secret chua env vars
kubectl create secret generic finance-env \
  --from-literal=MONGODB_URI="mongodb://..." \
  --from-literal=NEXTAUTH_SECRET="your-secret" \
  --from-literal=NEXTAUTH_URL="https://your-domain.com" \
  --from-literal=ENCRYPTION_SECRET="your-encryption-secret" \
  --from-literal=AI_MODEL="nvidia/nemotron-3-nano-30b-a3b:free" \
  -n finance

# Tao secret de pull image tu GHCR
kubectl create secret docker-registry ghcr-secret \
  --docker-server=ghcr.io \
  --docker-username=YOUR_GITHUB_USERNAME \
  --docker-password=YOUR_GITHUB_PAT \
  -n finance
```

### 2. Cau hinh GitHub Secrets

Vao repo **Settings > Secrets and variables > Actions**, them:

| Secret | Mo ta |
|--------|-------|
| `KUBECONFIG` | Noi dung file kubeconfig cua K3s server |

Lay kubeconfig tu server:

```bash
ssh your-server "cat /etc/rancher/k3s/k3s.yaml" | sed 's/127.0.0.1/YOUR_SERVER_IP/'
```

### 3. Cai dat self-hosted runner

Tren server K3s, cai GitHub Actions runner:

```bash
mkdir actions-runner && cd actions-runner
curl -o actions-runner-linux-x64-2.321.0.tar.gz -L \
  https://github.com/actions/runner/releases/download/v2.321.0/actions-runner-linux-x64-2.321.0.tar.gz
tar xzf actions-runner-linux-x64-2.321.0.tar.gz
./config.sh --url https://github.com/tranvien98/finance --token YOUR_TOKEN
sudo ./svc.sh install && sudo ./svc.sh start
```

### 4. Deploy

Push code len branch `main` se tu dong trigger workflow:

```bash
git push origin main
```

Hoac chay thu cong tai **Actions > finance staging > Run workflow**.

### 5. Expose Service (neu chua co)

```bash
# NodePort
kubectl expose deployment finance --type=NodePort --port=3000 -n finance

# Hoac dung Ingress
cat <<EOF | kubectl apply -f -
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: finance
  namespace: finance
  annotations:
    traefik.ingress.kubernetes.io/router.entrypoints: websecure
    cert-manager.io/cluster-issuer: letsencrypt
spec:
  rules:
    - host: finance.your-domain.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: finance
                port:
                  number: 3000
  tls:
    - hosts:
        - finance.your-domain.com
      secretName: finance-tls
EOF
```

### Cac lenh huu ich

```bash
# Xem pod dang chay
kubectl get pods -n finance

# Xem logs
kubectl logs -f deployment/finance -n finance

# Restart deployment
kubectl rollout restart deployment/finance -n finance

# Xem trang thai rollout
kubectl rollout status deployment/finance -n finance

# Scale replicas
kubectl scale deployment/finance --replicas=2 -n finance

# Xem events
kubectl get events -n finance --sort-by='.lastTimestamp'

# Vao shell container
kubectl exec -it deployment/finance -n finance -- sh
```

## Project Structure

```
finance/
├── src/
│   ├── app/          # Next.js app router
│   ├── components/   # React components
│   ├── lib/          # Utilities, DB, AI
│   └── models/       # Mongoose models
├── k8s/              # Kubernetes manifests
├── .github/workflows # CI/CD pipeline
├── Dockerfile
└── .env.local        # Local environment variables
```
