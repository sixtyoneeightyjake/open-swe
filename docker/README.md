Open SWE Docker Deployment
==========================

This setup builds two containers:
- `agent`: LangGraph server that powers the autonomous agent.
- `web`: Next.js UI that talks to the agent over the internal network.

Prerequisites
-------------
- Docker Engine 24+ and Compose Plugin 2.20+ on the target Linux host.
- Git repo cloned on the machine that performs the build (local or remote).
- Valid credentials for all secrets referenced in the sample env files.

Configuration
-------------
1. Copy the env templates and populate every value:
   ```bash
   cp docker/agent.env.example docker/agent.env
   cp docker/web.env.example docker/web.env
   ```
   Keep the files out of version control (already ignored) and store real secrets only in `docker/*.env`.

2. When building the web image you must export the public values so they reach the build args:
   ```bash
   set -a
   source docker/web.env
   docker compose build web
   set +a
   ```
   The agent image reads secrets only at runtime, so no extra step is required before `docker compose build agent`.

3. If you need different external ports, set `AGENT_PORT` and `WEB_PORT` before running Compose:
   ```bash
   export AGENT_PORT=2024
   export WEB_PORT=3000
   ```

Building Images
---------------
Build both images once the env files are populated:
```bash
docker compose build
```
For remote deployments you can either run the build directly on the server or push the images to a registry:
```bash
docker tag open-swe11-web:latest <registry>/open-swe/web:latest
docker push <registry>/open-swe/web:latest
```
You can repeat the process for the agent image (`open-swe11-agent`).

Running on the Server
---------------------
1. Ensure `docker/agent.env` and `docker/web.env` exist on the server with the filled values.
2. Copy (or pull) the workspace to the server and run:
   ```bash
   docker compose up -d
   ```
   The agent listens on port 2024 and the web app on port 3000 by default.

3. Check container health:
   ```bash
   docker compose ps
   docker compose logs agent
   docker compose logs web
   ```

Updating
--------
1. Pull the latest git changes.
2. Rebuild the images (`docker compose build`).
3. Restart the stack with zero downtime using Compose rolling restart:
   ```bash
   docker compose up -d --remove-orphans
   ```

Notes
-----
- `docker/agent.env` is mounted into the container at the path required by `langgraph.json`, so no extra copies are needed.
- `docker/web.env` powers both the build arguments (`NEXT_PUBLIC_*`) and the runtime secrets. Rebuild the `web` service whenever those values change.
- The Compose file is ready for production hardening (TLS proxy, external database) but assumes Docker’s default bridge network for simplicity.
