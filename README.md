# basic-app

Minimal app for deployment sanity checks and failure rendering.

## Run

```bash
npm start
```

Defaults:
- Host: `0.0.0.0`
- Port: `3000` (override with `PORT`)

Open: `http://localhost:3000`

## Endpoints

- `GET /health` -> 200 health payload
- `GET /api/success` -> 200 success payload
- `GET /api/error?code=500` -> configurable intentional 4xx/5xx
- `GET /api/slow?ms=5000` -> delayed success response
- `GET /api/crash` -> disabled by default (enable with `ENABLE_CRASH=true`)

## Purpose

Use the UI to generate clear success/failure states while testing deploy behavior and error visibility.

## Relay Setup

This repo includes:
- `Dockerfile` for Relay image builds
- `relay.yaml` with:
  - `prod` deploy (`basic-app.hostbo.cx`)
  - `fail-health` deploy for intentional worker/manager error logging

### Register Project

```bash
relay project add basic-app https://github.com/<your-user>/<your-repo>.git --branch main --poll
```

### Apply Deploy (manager API via signed client)

```bash
python3 -c 'from relay.api import client as http_client; from relay.shared import config; cfg=config.read_config(); c=http_client.Client(config.cfg_get(cfg,"manager.url"), config.cfg_get(cfg,"auth.key_path") or config.default_key_path()); print(c.post("/v1/deploys/apply", {"deploy":"basic-app.prod","force":False,"branch":"main"}))'
```

### Trigger Intentional Deploy Failure (for UI log testing)

```bash
python3 -c 'from relay.api import client as http_client; from relay.shared import config; cfg=config.read_config(); c=http_client.Client(config.cfg_get(cfg,"manager.url"), config.cfg_get(cfg,"auth.key_path") or config.default_key_path()); print(c.post("/v1/deploys/apply", {"deploy":"basic-app.fail-health","force":True,"branch":"main"}))'
```

`fail-health` uses a bad health endpoint so worker health checks fail and the manager records a failed deploy.
