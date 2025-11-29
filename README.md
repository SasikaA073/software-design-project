# 🔌 Oversight - Transformer Management System

<div align="center">

![Oversight Logo](https://img.shields.io/badge/Oversight-Transformer%20Management-blue?style=for-the-badge)

**A comprehensive full-stack application for managing power transformer inspections with AI-powered thermal image analysis**

[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.3.0-brightgreen?logo=springboot)](https://spring.io/projects/spring-boot)
[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://www.typescriptlang.org/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-blue?logo=mysql)](https://www.mysql.com/)


</div>

---

## Overview

Oversight is a modern, full-stack web application designed to streamline the thermal inspection and management of power transformers. The system integrates AI-powered anomaly detection, interactive image annotation, and comprehensive maintenance tracking to help utility companies maintain their transformer infrastructure efficiently.


## Technology Stack

### Backend

| Technology | Version | Purpose |
|------------|---------|---------|
| Java | 17 | Core programming language |
| Spring Boot | 3.3.0 | Application framework |
| Spring Data JPA | 3.3.0 | Database ORM |
| Hibernate | 6.5.2 | JPA implementation |
| MySQL | 8.0 | Relational database |
| Maven | 3.9.x | Build tool and dependency management |
| Docker | Latest | Database containerization |
| Jackson | 2.17.1 | JSON serialization |

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 14.x | React framework |
| React | 18.x | UI library |
| TypeScript | 5.x | Type-safe JavaScript |
| Tailwind CSS | 3.x | Utility-first CSS |
| shadcn/ui | Latest | Component library |
| Lucide React | Latest | Icon library |

### External Services

| Service | Purpose |
|---------|---------|
| Python AI Service | Thermal anomaly detection (YOLOv11/similar) |
| Docker Compose | Service orchestration |

---

## Prerequisites

Before running the project, ensure you have the following installed:

- **Java 17+** – [Download Java](https://adoptium.net/)
- **Maven 3.9+** – [Install Maven](https://maven.apache.org/install.html)
- **Node.js 18+** – [Download Node.js](https://nodejs.org/)
- **Docker & Docker Compose** – [Install Docker](https://docs.docker.com/get-docker/)
- **MySQL 8.0** (via Docker or local installation)

---

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/transformer-management.git
cd transformer-management
```

### 2. Backend Setup

#### Start Database (Docker)

```bash
cd backend
docker-compose up -d
```

This will start:
- MySQL database on port `3306`
- phpMyAdmin (optional) on port `8081`

#### Install Dependencies & Build

```bash
mvn clean install
```

### 3. Frontend Setup

   ```bash
cd frontend
npm install
   ```
---

## Running the Application

### Start Backend Server

```bash
cd backend
mvn spring-boot:run
```

The backend API will be available at `http://localhost:8080`

**For GitHub Codespaces:**
```bash
export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64
export PATH=$JAVA_HOME/bin:$PATH
mvn spring-boot:run
```

### Start Frontend Server

   ```bash
cd frontend
   npm run dev
   ```

The frontend will be available at `http://localhost:3000`

---

