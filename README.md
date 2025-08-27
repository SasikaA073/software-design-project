# Transformer Management Web Application by Jewel001
This full-stack web application streamlines the thermal inspection of power transformers. It's a central hub for managing transformer data, automatically analyzing thermal images for issues, and creating digital maintenance reports.

## Overview
This project consists of a **backend** (Spring Boot + Docker) and a **frontend** (Node.js/React). The backend exposes APIs, and the frontend consumes them to provide a user interface.

## Features for Phase 1 🎯
This initial phase focuses on establishing the foundational data management capabilities of the system.

### Transformer Management (FR1.1):

An interface for managing transformer records.
Each transformer is defined by a unique ID, physical location, and power capacity.

### Thermal Image Management (FR1.2):

Ability to upload thermal images and associate them with specific transformer records.
Images are tagged as either Baseline (a reference image under normal conditions) or Maintenance (a new image from a routine inspection).
Image metadata (upload timestamp, uploader info) is automatically recorded.

### Environmental Tagging (FR1.3):

Baseline images must be categorized by the environmental conditions at the time of capture: Sunny, Cloudy, or Rainy. This is crucial for accurate comparisons in later phases.


---

## Prerequisites
Before running the project, ensure the following software is installed on your machine:

- **Docker** – [Install Docker](https://docs.docker.com/get-docker/)
- **Java 17** – [Install Java 17](https://adoptium.net/)
- **Maven** – [Install Maven](https://maven.apache.org/install.html)
- **Node.js & npm** – [Install Node.js](https://nodejs.org/)

> **Alternative:** You can use **GitHub Codespaces**, which comes pre-configured with most dependencies.

---

## Setup and Running Instructions

### 1. Backend (Docker Services)

1. Open a terminal and navigate to the **backend** folder.
2. Start Docker services:
   ```bash
   docker-compose up
   ```
   Docker will build and start all necessary containers (databases, APIs, etc.).

### 2. Backend (Spring Boot Application)

In a new terminal, still inside the **backend** folder:

```bash
mvn spring-boot:run
```

The backend API should now be running at `http://localhost:8080` (or the configured port).

### 3. Frontend

1. Open a terminal and navigate to the **frontend** folder.
2. Install dependencies:
   ```bash
   npm install 
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

The frontend should now be accessible at `http://localhost:3000` (or the configured port).

---

## Stopping the Services

- **To stop Docker services:**
  ```bash
  docker-compose down
  ```
- **To stop the Spring Boot server:** Press `Ctrl+C` in the terminal where it is running.
- **To stop the frontend server:** Press `Ctrl+C` in the terminal where it is running.

---

## Troubleshooting

### Docker
- Make sure **Docker Desktop** is running.
- If you get permission errors, try running commands with `sudo` (Linux/macOS).

### Maven
- Ensure `JAVA_HOME` points to Java 17.
- If `mvn` is not recognized, check that Maven is installed and added to your system `PATH`.

### Node.js / npm
- If you encounter dependency conflicts, try using `npm install --legacy-peer-deps`.
- For permission issues on macOS/Linux, consider using a Node version manager like [nvm](https://github.com/nvm-sh/nvm).
- Clear npm cache if installation fails: `npm cache clean --force`
- Ensure you're using a compatible Node.js version (check `package.json` for engine requirements).

---

## Project Structure

```
project-root/
├── backend/
│   ├── src/main
│   ├── target
│   ├── uploads
│   └── docker-compose.yml
│   ├── pom.xml
├── frontend/
    ├── app
    ├── components
    ├──hooks
    ├── lib
    ├── public
    ├── styles
    ├── components.json
    ├── next.config.mjs
    ├── package-lock.json
    ├── package.json
    ├── pnpm-lock.yaml
    ├── postcss.config.mjs
    ├── tsconfig.json
```

---

## License

This project is licensed under the [MIT License](LICENSE) - see the LICENSE file for details.
Use Node.js v18+ for best compatibility.
