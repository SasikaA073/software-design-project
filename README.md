# 🔌 Oversight - Transformer Management System

<div align="center">

![Oversight Logo](https://img.shields.io/badge/Oversight-Transformer%20Management-blue?style=for-the-badge)

**A comprehensive full-stack application for managing power transformer inspections with AI-powered thermal image analysis**

[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.3.0-brightgreen?logo=springboot)](https://spring.io/projects/spring-boot)
[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://www.typescriptlang.org/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-blue?logo=mysql)](https://www.mysql.com/)

[Features](#-features) • [Installation](#-installation) • [Usage](#-usage) • [API Documentation](#-api-documentation) • [Contributing](#-contributing)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Technology Stack](#-technology-stack)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Project Structure](#-project-structure)
- [Running the Application](#-running-the-application)
- [API Documentation](#-api-documentation)
- [Key Features Deep Dive](#-key-features-deep-dive)
- [Database Schema](#-database-schema)
- [Troubleshooting](#-troubleshooting)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🎯 Overview

Oversight is a modern, full-stack web application designed to streamline the thermal inspection and management of power transformers. The system integrates AI-powered anomaly detection, interactive image annotation, and comprehensive maintenance tracking to help utility companies maintain their transformer infrastructure efficiently.

### Key Capabilities

- **Transformer Fleet Management**: Track and manage multiple transformers across different regions
- **Intelligent Inspection System**: Schedule and conduct thermal inspections with automated anomaly detection
- **AI-Powered Analysis**: Automatic detection of thermal anomalies using deep learning models
- **Interactive Image Annotation**: Edit and refine detection bounding boxes with real-time coordinate tracking
- **Weather-Based Comparison**: Compare maintenance images against weather-specific baseline images
- **Complete CRUD Operations**: Full create, read, update, and delete functionality for all entities
- **Cascade Management**: Automatic cleanup of related data when deleting transformers or inspections

---

## ✨ Features

### 🏭 Transformer Management

- **Add New Transformers**: Register transformers with detailed specifications
  - Unique transformer number and pole number
  - Region and location details
  - Type (Distribution/Bulk) and capacity (kVA)
  - Number of feeders
  - Status tracking (Operational/Maintenance/Offline)
- **Update Transformer Details**: Modify transformer information as needed
- **Delete Transformers**: Remove transformers with automatic deletion of all associated inspections and images
- **Search and Filter**: Find transformers by number, region, or status
- **Baseline Image Management**: Upload weather-specific baseline thermal images (Sunny, Cloudy, Rainy)

### 🔍 Inspection Management

- **Create Inspections**: Schedule new inspections for transformers
  - Inspector assignment
  - Inspection date and time
  - Optional maintenance scheduling
  - Status tracking (Pending/In Progress/Completed)
- **Edit Inspections**: Update inspection details and status
- **Delete Inspections**: Remove inspections with automatic deletion of thermal images
- **Inspection Sorting**: Automatically sorted by creation date (newest first)
- **View Inspection History**: Complete timeline of all transformer inspections

### 🌡️ Thermal Image Analysis

- **Training Model and Hosting**:
  - Created the dataset using the images provided and manually annotated them using the Roboflow Platform
  - Trained Yolov11 model in roboflow and deployed it
  - Hosted it by creating a workflow in the Roboflow and connected it using a serverless API
    
- **Dual Image Upload System**:
  - **Baseline Images**: Weather-categorized reference images (Sunny, Cloudy, Rainy)
  - **Maintenance Images**: Inspection images with automatic AI analysis
- **AI-Powered Anomaly Detection**:
  - Automatic detection of thermal anomalies
  - Integration with Python-based detection service
  - Real-time analysis during image upload
- **Multi-Stage Progress Tracking**:
  - Upload progress (0-40%)
  - AI analysis progress (40-70%)
  - Results fetching (70-100%)
  - Visual feedback with color-coded stages

### 📊 Interactive Image Annotation

- **Canvas-Based Image Viewer**:
  - High-quality thermal image rendering
  - Zoom controls (buttons and mouse wheel)
  - Pan functionality (click and drag)
  - Reset to original view
- **Editable Bounding Boxes**:
  - Select detections by clicking
  - Move boxes by dragging
  - Resize using corner/edge handles
  - Real-time coordinate updates
- **Color-Coded Detections**:
  - **Red**: Faulty components
  - **Orange**: Potentially faulty areas
  - **Green**: Normal readings
- **Detection Metadata Display**:
  - Anomaly class and confidence score
  - Severity level (Critical/High/Medium/Low)
  - Pixel coordinates (center X, Y)
  - Dimensions (width × height)
  - Area calculation in pixels²
  - Real-time updates during editing

### 📈 Detection Summary

- **Individual Detection View**:
  - Detailed metrics for selected detection
  - Visual severity indicators
  - Edit mode with real-time feedback
- **Grid Overview**:
  - Compact cards for all detections
  - Quick confidence scores
  - Click to view details
  - Responsive layout (1-4 columns)

### 🔄 Advanced Data Management

- **Cascade Deletion**:
  - Delete transformer → removes all inspections → removes all thermal images
  - Delete inspection → removes all associated thermal images
  - Automatic database cleanup
- **Proper Error Handling**:
  - User-friendly error messages
  - Detailed backend logging
  - HTTP status code validation
- **Data Integrity**:
  - Unique constraint enforcement
  - Required field validation
  - Relationship consistency

---

## 🛠️ Technology Stack

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

## 📦 Prerequisites

Before running the project, ensure you have the following installed:

- **Java 17+** – [Download Java](https://adoptium.net/)
- **Maven 3.9+** – [Install Maven](https://maven.apache.org/install.html)
- **Node.js 18+** – [Download Node.js](https://nodejs.org/)
- **Docker & Docker Compose** – [Install Docker](https://docs.docker.com/get-docker/)
- **MySQL 8.0** (via Docker or local installation)

---

## 🚀 Installation

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

## 🏃 Running the Application

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

## 📁 Project Structure

```
transformer-management/
├── backend/
│   ├── src/
│   │   └── main/
│   │       ├── java/com/example/transformermanagement/
│   │       │   ├── config/              # Configuration classes
│   │       │   │   └── WebConfig.java
│   │       │   ├── controller/          # REST API controllers
│   │       │   │   ├── TransformerController.java
│   │       │   │   ├── InspectionController.java
│   │       │   │   └── ThermalImageController.java
│   │       │   ├── dto/                 # Data Transfer Objects
│   │       │   │   └── InspectionRequest.java
│   │       │   ├── model/               # JPA Entities
│   │       │   │   ├── Transformer.java
│   │       │   │   ├── Inspection.java
│   │       │   │   └── ThermalImage.java
│   │       │   ├── repository/          # JPA Repositories
│   │       │   │   ├── TransformerRepository.java
│   │       │   │   ├── InspectionRepository.java
│   │       │   │   └── ThermalImageRepository.java
│   │       │   ├── service/             # Business logic
│   │       │   │   ├── TransformerService.java
│   │       │   │   ├── InspectionService.java
│   │       │   │   ├── ThermalImageService.java
│   │       │   │   └── AnomalyDetectionService.java
│   │       │   └── TransformerManagementApplication.java
│   │       └── resources/
│   │           └── application.properties
│   ├── docker-compose.yml               # Database configuration
│   └── pom.xml                          # Maven dependencies
│
└── frontend/
    ├── app/                             # Next.js pages
    │   ├── page.tsx                     # Landing page
    │   ├── transformers/
    │   │   └── page.tsx                 # Transformers page
    │   ├── inspections/
    │   │   └── page.tsx                 # Inspections page
    │   ├── layout.tsx                   # Root layout
    │   └── globals.css                  # Global styles
    ├── components/
    │   ├── layout/                      # Layout components
    │   │   ├── sidebar.tsx
    │   │   └── header.tsx
    │   ├── transformers/                # Transformer components
    │   │   ├── transformer-list.tsx
    │   │   ├── transformer-details.tsx
    │   │   ├── add-transformer-dialog.tsx
    │   │   ├── edit-transformer-dialog.tsx
    │   │   └── baseline-image-card.tsx
    │   ├── inspections/                 # Inspection components
    │   │   ├── inspection-list.tsx
    │   │   ├── inspection-details.tsx
    │   │   ├── add-inspection-dialog.tsx
    │   │   ├── edit-inspection-dialog.tsx
    │   │   ├── thermal-image-upload.tsx
    │   │   └── thermal-image-canvas.tsx
    │   ├── ui/                          # UI components (shadcn/ui)
    │   │   ├── button.tsx
    │   │   ├── card.tsx
    │   │   ├── dialog.tsx
    │   │   ├── input.tsx
    │   │   ├── alert-dialog.tsx
    │   │   ├── confirm-dialog.tsx
    │   │   └── ... (other UI components)
    │   └── transformer-dashboard.tsx    # Main dashboard
    ├── lib/
    │   └── api.ts                       # API client & types
    ├── public/                          # Static assets
    ├── package.json                     # NPM dependencies
    ├── tsconfig.json                    # TypeScript configuration
    ├── tailwind.config.ts               # Tailwind CSS configuration
    └── next.config.mjs                  # Next.js configuration
```

---

## 📡 API Documentation

### Base URL

```
http://localhost:8080/api
```

### Transformers API

#### Get All Transformers
```http
GET /transformers
```

**Response:**
```json
[
  {
    "id": "uuid",
    "transformerNo": "AZ-1234",
    "poleNo": "EN-125-B",
    "region": "colombo",
    "type": "Distribution",
    "capacity": 100.0,
    "noOfFeeders": 4,
    "status": "Operational",
    "locationDetails": "Pitakotte",
    "sunnyBaselineImageUrl": "/uploads/...",
    "cloudyBaselineImageUrl": "/uploads/...",
    "rainyBaselineImageUrl": "/uploads/...",
    "createdAt": "2025-10-03T10:00:00Z",
    "updatedAt": "2025-10-03T10:00:00Z"
  }
]
```

#### Get Transformer by ID
```http
GET /transformers/{id}
```

#### Create Transformer
```http
POST /transformers
Content-Type: application/json

{
  "transformerNo": "AZ-1234",
  "poleNo": "EN-125-B",
  "region": "colombo",
  "type": "Distribution",
  "capacity": 100.0,
  "noOfFeeders": 4,
  "locationDetails": "Pitakotte",
  "status": "Operational"
}
```

#### Update Transformer
```http
PUT /transformers/{id}
Content-Type: application/json

{
  "status": "Maintenance",
  "capacity": 150.0
}
```

#### Delete Transformer
```http
DELETE /transformers/{id}
```

**Response:** 200 OK (deletes all associated inspections and images)

#### Upload Baseline Image
```http
POST /transformers/{id}/baseline-image
Content-Type: multipart/form-data

weatherCondition: Sunny | Cloudy | Rainy
file: [image file]
```

#### Get Baseline Image URL
```http
GET /transformers/{id}/baseline-image?weatherCondition=Sunny
```

**Response:**
```
/uploads/filename.jpg
```

---

### Inspections API

#### Get All Inspections
```http
GET /inspections
```

**Optional Query Parameter:**
```http
GET /inspections?transformerId=uuid
```

**Response:** (sorted by createdAt DESC)
```json
[
  {
    "id": "uuid",
    "inspectionNo": "INSP-1234567890",
    "transformer": { ... },
    "inspectedDate": "2025-10-03T10:00:00Z",
    "maintenanceDate": "2025-10-10T10:00:00Z",
    "status": "In Progress",
    "inspectedBy": "John Doe",
    "weatherCondition": "Sunny",
    "createdAt": "2025-10-03T09:00:00Z",
    "updatedAt": "2025-10-03T09:00:00Z",
    "transformerId": "uuid",
    "transformerNo": "AZ-1234"
  }
]
```

#### Get Inspection by ID
```http
GET /inspections/{id}
```

#### Create Inspection
```http
POST /inspections
Content-Type: application/json

{
  "inspectionNo": "INSP-1234567890",
  "transformerId": "uuid",
  "inspectedDate": "2025-10-03T10:00:00Z",
  "maintenanceDate": "2025-10-10T10:00:00Z",
  "status": "In Progress",
  "inspectedBy": "John Doe",
  "weatherCondition": "Sunny"
}
```

#### Update Inspection
```http
PUT /inspections/{id}
Content-Type: application/json

{
  "status": "Completed",
  "inspectedBy": "Jane Smith",
  "inspectedDate": "2025-10-03T11:00:00Z"
}
```

**Note:** Only provided fields will be updated; others remain unchanged.

#### Delete Inspection
```http
DELETE /inspections/{id}
```

**Response:** 200 OK (deletes all associated thermal images)

---

### Thermal Images API

#### Get Images for Inspection
```http
GET /thermal-images?inspectionId=uuid
```

**Response:**
```json
[
  {
    "id": "uuid",
    "inspection": { ... },
    "imageUrl": "/uploads/filename.jpg",
    "imageType": "Baseline | Maintenance",
    "weatherCondition": "Sunny",
    "anomalyDetected": true,
    "detectionData": "[{...}]",
    "uploadedAt": "2025-10-03T10:00:00Z"
  }
]
```

#### Upload Thermal Image
```http
POST /thermal-images/upload
Content-Type: multipart/form-data

inspectionId: uuid
file: [image file]
imageType: Baseline | Maintenance
weatherCondition: Sunny | Cloudy | Rainy (optional)
```

**Response:**
```json
{
  "id": "uuid",
  "imageUrl": "/uploads/filename.jpg",
  "detectionData": "[{detection_id, class, confidence, x, y, width, height}]",
  "anomalyDetected": true
}
```

#### Update Detection Data
```http
PUT /thermal-images/{id}/detections
Content-Type: application/json

[
  {
    "detection_id": "string",
    "class": "faulty",
    "confidence": 0.95,
    "x": 150,
    "y": 200,
    "width": 50,
    "height": 60
  }
]
```

**Response:** Updated ThermalImage object

---

## 🎨 Key Features Deep Dive

### 1. Interactive Bounding Box Editor

The thermal image canvas provides a professional annotation interface:

**Features:**
- **Selection**: Click any bounding box to select it
- **Movement**: Drag the box to reposition
- **Resizing**: Grab corners or edges to resize
- **Real-time Coordinates**: Watch X, Y, width, height update as you edit
- **Color Coding**: Each anomaly class has a unique color
- **Zoom & Pan**: Navigate large images easily

**Controls:**
- Zoom In/Out buttons
- Mouse wheel zoom
- Click and drag to pan
- Reset view button
- Edit/Save mode toggle

### 2. Multi-Stage Progress Bar

Visual feedback during image analysis:

1. **Upload Stage** (0-40%): Green progress bar
2. **AI Analysis** (40-70%): Blue progress with "AI analyzing..." message
3. **Fetching Results** (70-100%): Final stage
4. **Complete**: Green checkmark with success message

### 3. Detection Metadata Panel

Comprehensive anomaly information:

**Summary View:**
- Grid of all detections
- Quick stats for each anomaly
- Click to view details

**Detail View:**
- Anomaly class with color indicator
- Confidence score and severity
- Exact pixel coordinates
- Size dimensions and area
- Real-time updates in edit mode

### 4. Cascade Delete System

Maintains database integrity:

```
Delete Transformer
  └─ Deletes all Inspections
      └─ Deletes all Thermal Images
```

All operations are atomic - either everything succeeds or nothing changes.

### 5. Weather-Based Baseline Comparison

Smart image comparison:
- Stores 3 baseline images per transformer (Sunny, Cloudy, Rainy)
- Automatically selects matching weather baseline
- Side-by-side comparison view
- Highlights differences effectively

---

## 🗄️ Database Schema

### Transformers Table

```sql
CREATE TABLE transformers (
    id                          UUID PRIMARY KEY,
    transformer_no              VARCHAR(255) UNIQUE NOT NULL,
    pole_no                     VARCHAR(255) NOT NULL,
    region                      VARCHAR(255) NOT NULL,
    type                        VARCHAR(255) NOT NULL,
    location_details            TEXT,
    capacity                    DECIMAL(10,2),
    no_of_feeders               INT,
    status                      VARCHAR(50),
    last_inspected              TIMESTAMP,
    sunny_baseline_image_url    VARCHAR(500),
    cloudy_baseline_image_url   VARCHAR(500),
    rainy_baseline_image_url    VARCHAR(500),
    created_at                  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at                  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### Inspections Table

```sql
CREATE TABLE inspections (
    id                  UUID PRIMARY KEY,
    inspection_no       VARCHAR(255) UNIQUE NOT NULL,
    transformer_id      UUID NOT NULL,
    inspected_date      TIMESTAMP NOT NULL,
    maintenance_date    TIMESTAMP,
    status              VARCHAR(50),
    inspected_by        VARCHAR(255),
    weather_condition   VARCHAR(50),
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (transformer_id) REFERENCES transformers(id) ON DELETE CASCADE
);
```

### Thermal Images Table

```sql
CREATE TABLE thermal_images (
    id                  UUID PRIMARY KEY,
    inspection_id       UUID NOT NULL,
    image_url           VARCHAR(500) NOT NULL,
    image_type          VARCHAR(50) NOT NULL,
    weather_condition   VARCHAR(50),
    temperature_reading DECIMAL(5,2),
    anomaly_detected    BOOLEAN,
    detection_data      TEXT,
    uploaded_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (inspection_id) REFERENCES inspections(id) ON DELETE CASCADE
);
```

### Annotations Table
```sql
CREATE TABLE annotations (
    id UUID PRIMARY KEY,
    thermal_image_id UUID NOT NULL,
    detection_id VARCHAR(255) NOT NULL,
    annotation_type VARCHAR(50) NOT NULL,
    detection_class VARCHAR(100) NOT NULL,
    confidence DOUBLE NOT NULL,
    x DOUBLE NOT NULL,
    y DOUBLE NOT NULL,
    width DOUBLE NOT NULL,
    height DOUBLE NOT NULL,
    comments TEXT,
    created_by VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL,
    modified_by VARCHAR(255),
    modified_at TIMESTAMP,
    is_deleted BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (thermal_image_id) REFERENCES thermal_images(id)
);
```

```sql
CREATE TABLE maintenance_records (
    record_id            UUID PRIMARY KEY,                                  -- Unique record ID
    transformer_id       UUID NOT NULL,                                     -- FK linked to transformers.id
    timestamp            TIMESTAMP DEFAULT CURRENT_TIMESTAMP,               -- Inspection timestamp
    image_path           VARCHAR(500),                                      -- Path to thermal image (from Phase 3)
    anomalies            JSON,                                              -- Auto-detected anomaly details
    inspector_name       VARCHAR(255),                                      -- Engineer name
    transformer_status   VARCHAR(50) CHECK (transformer_status IN ('OK', 'Needs Maintenance', 'Urgent')),  -- Status dropdown
    voltage              DECIMAL(10,2),                                     -- Electrical reading
    current              DECIMAL(10,2),                                     -- Electrical reading
    corrective_action    TEXT,                                              -- Maintenance actions
    remarks              TEXT,                                              -- Additional notes
    version              INT DEFAULT 1,                                     -- Version control for edits
    last_updated         TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, -- Auto-update timestamp

    FOREIGN KEY (transformer_id) REFERENCES transformers (id) ON DELETE CASCADE ON UPDATE CASCADE
);
```

---
## Limitations

- Currently we have implemented a fixed threshold mechanism , adaptive threshold will be implemented in the next phase.

---

## 🤝 Contributing

We welcome contributions! Please follow these guidelines:

### Development Workflow

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Test thoroughly
5. Commit: `git commit -m 'Add amazing feature'`
6. Push: `git push origin feature/amazing-feature`
7. Open a Pull Request

### Code Style

**Backend (Java):**
- Follow Google Java Style Guide
- Use meaningful variable names
- Add JavaDoc for public methods
- Keep methods small and focused

**Frontend (TypeScript/React):**
- Use TypeScript strict mode
- Follow React best practices
- Use functional components with hooks
- Keep components small and reusable
- Use Tailwind CSS for styling

### Commit Messages

Follow conventional commits:
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes
- `refactor:` Code refactoring
- `test:` Test updates
- `chore:` Build/config changes

---

## 📄 License

This project is licensed under the **MIT License**. See [LICENSE](LICENSE) file for details.

---

<div align="center">

**⭐ Star this repo if you find it helpful!**

Made with ❤️ by the Oversight Team

</div>
