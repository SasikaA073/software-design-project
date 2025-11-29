# Phase 1 - Transformer and Baseline Image Management

## Overview

Phase 1 establishes the foundation of the Oversight system by implementing essential transformer record management and baseline thermal image storage. This phase creates a structured repository of transformers and their reference thermal images categorized by environmental conditions.
---

## Scope & Features Implemented

### FR1.1: Admin Interface for Transformer Management ✅

#### Implemented Features:

1. **Transformer CRUD Operations**
   - ✅ Add new transformer records with complete metadata
   - ✅ View all transformers in an organized table interface
   - ✅ Edit existing transformer records
   - ✅ Delete transformer entries (with cascade deletion)
   - ✅ Search and filter transformers by:
     - Transformer number
     - Region
     - Status
     - Pole number

2. **Transformer Data Model**
   ```typescript
   interface TransformerData {
     id?: string
     transformerNo: string        // Unique identifier (e.g., "AZ-1234")
     poleNo: string               // Associated pole number
     region: string               // Geographic region
     type: "Distribution" | "Bulk" // Transformer type
     capacity: number             // Capacity in kVA
     noOfFeeders: number         // Number of feeders
     locationDetails: string      // Detailed location description
     status: "Operational" | "Maintenance" | "Offline"
     lastInspected?: string       // Last inspection date
   }
   ```

3. **Admin Dashboard**
   - Responsive table view with sorting
   - Quick actions (Edit/View/Delete)
   - Status badges with color coding
   - Add transformer dialog with form validation
   - Edit transformer dialog for modifications

4. **User Interface Components**
   - **TransformerList**: Table display of all transformers
   - **TransformerDetails**: Detailed view with full metadata
   - **AddTransformerDialog**: Form for creating new records
   - **EditTransformerDialog**: Form for editing existing records
   - **BaselineImageCard**: Display and manage baseline images

---

### FR1.2: Thermal Image Upload and Tagging ✅

#### Implemented Features:

1. **Dual Image Upload System**
   - ✅ Baseline images: Reference thermal images for comparison
   - ✅ Maintenance images: New inspection images for analysis
   - ✅ Image tagging with type classification
   - ✅ Metadata capture during upload:
     - Upload date/time (automatic)
     - Image type (Baseline/Maintenance)
     - Uploader ID/name (system-tracked)
     - Weather condition (for baseline images)

2. **Thermal Image Upload Component**
   - Multi-stage progress tracking:
     - **Stage 0-40%**: File upload in progress
     - **Stage 40-70%**: AI analysis processing
     - **Stage 70-100%**: Results compilation
   - Progress color indicators:
     - Green: Upload stage
     - Blue: AI analysis stage
     - Cyan: Final processing
   - Success/error messaging

3. **Image Management Features**
   - Associate images with specific transformer entries
   - Tag with upload date/time automatically
   - Track uploader information
   - Support multiple images per inspection
   - Delete images individually or with inspection

4. **File Storage & Retrieval**
   - Local file system storage: `/uploads/`
   - Unique filename generation to prevent conflicts
   - Direct URL access to uploaded images
   - Efficient image serving

---

### FR1.3: Categorization by Environmental Conditions ✅

#### Implemented Features:

1. **Environmental Condition Tagging**
   - ✅ Sunny: Clear sky conditions
   - ✅ Cloudy: Overcast conditions
   - ✅ Rainy: Wet conditions
   - ✅ Dropdown selector during baseline image upload
   - ✅ Multiple baseline images per transformer (one per condition)

2. **Smart Baseline Storage**
   ```typescript
   interface TransformerData {
     sunnyBaselineImageUrl?: string    // Reference for sunny conditions
     cloudyBaselineImageUrl?: string   // Reference for cloudy conditions
     rainyBaselineImageUrl?: string    // Reference for rainy conditions
   }
   ```

3. **Condition-Based Comparison**
   - Automatically selects matching weather baseline
   - Priority fallback: Sunny → Cloudy → Rainy
   - Enables accurate anomaly detection across different weather

4. **Upload Interface**
   - Weather condition dropdown on baseline image upload
   - Validation to prevent duplicate condition uploads
   - Replace existing condition image if re-uploading

---

## Technical Implementation

### Backend Architecture

#### 1. **Data Models**

**Transformer Entity** (`backend/src/main/java/.../model/Transformer.java`)
```java
@Entity
@Table(name = "transformers")
public class Transformer {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;
    
    @Column(unique = true, nullable = false)
    private String transformerNo;
    
    private String poleNo;
    private String region;
    private String type;              // Distribution or Bulk
    private BigDecimal capacity;      // kVA
    private Integer noOfFeeders;
    private String locationDetails;
    private String status;
    private OffsetDateTime lastInspected;
    
    // Baseline image URLs for different weather conditions
    private String sunnyBaselineImageUrl;
    private String cloudyBaselineImageUrl;
    private String rainyBaselineImageUrl;
    
    @OneToMany(mappedBy = "transformer", cascade = CascadeType.ALL)
    private List<Inspection> inspections;
    
    @CreationTimestamp
    private OffsetDateTime createdAt;
    
    @UpdateTimestamp
    private OffsetDateTime updatedAt;
}
```

**Inspection Entity** (`backend/src/main/java/.../model/Inspection.java`)
```java
@Entity
@Table(name = "inspections")
public class Inspection {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;
    
    @Column(unique = true, nullable = false)
    private String inspectionNo;
    
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "transformer_id", nullable = false)
    private Transformer transformer;
    
    private OffsetDateTime inspectedDate;
    private OffsetDateTime maintenanceDate;
    private String status;
    private String inspectedBy;
    private String weatherCondition;  // Sunny, Cloudy, Rainy
    
    @OneToMany(mappedBy = "inspection", cascade = CascadeType.ALL)
    private List<ThermalImage> thermalImages;
    
    @CreationTimestamp
    private OffsetDateTime createdAt;
    
    @UpdateTimestamp
    private OffsetDateTime updatedAt;
}
```

**ThermalImage Entity** (`backend/src/main/java/.../model/ThermalImage.java`)
```java
@Entity
@Table(name = "thermal_images")
public class ThermalImage {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;
    
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "inspection_id", nullable = false)
    private Inspection inspection;
    
    private String imageUrl;
    private String imageType;         // Baseline or Maintenance
    private String weatherCondition;  // Sunny, Cloudy, Rainy (for baseline)
    private BigDecimal temperatureReading;
    private Boolean anomalyDetected;
    private String detectionData;     // JSON string of detections
    
    @CreationTimestamp
    private OffsetDateTime uploadedAt;
}
```

#### 2. **Repository Layer**

**TransformerRepository** (`backend/src/main/java/.../repository/TransformerRepository.java`)
```java
@Repository
public interface TransformerRepository extends JpaRepository<Transformer, UUID> {
    List<Transformer> findAll();
    Optional<Transformer> findById(UUID id);
    Optional<Transformer> findByTransformerNo(String transformerNo);
    List<Transformer> findByRegion(String region);
    List<Transformer> findByStatus(String status);
}
```

**InspectionRepository** (`backend/src/main/java/.../repository/InspectionRepository.java`)
```java
@Repository
public interface InspectionRepository extends JpaRepository<Inspection, UUID> {
    List<Inspection> findByTransformer_IdOrderByCreatedAtDesc(UUID transformerId);
    Optional<Inspection> findByInspectionNo(String inspectionNo);
    List<Inspection> findByStatus(String status);
}
```

**ThermalImageRepository** (`backend/src/main/java/.../repository/ThermalImageRepository.java`)
```java
@Repository
public interface ThermalImageRepository extends JpaRepository<ThermalImage, UUID> {
    List<ThermalImage> findByInspection_Id(UUID inspectionId);
    Optional<ThermalImage> findByInspection_IdAndImageType(UUID inspectionId, String imageType);
}
```

#### 3. **Service Layer**

**TransformerService** (`backend/src/main/java/.../service/TransformerService.java`)
- `getAllTransformers()`: Fetch all transformer records
- `getTransformerById(UUID id)`: Get single transformer details
- `getTransformerByNumber(String no)`: Find by transformer number
- `createTransformer(TransformerData)`: Add new transformer
- `updateTransformer(UUID, TransformerData)`: Modify existing
- `deleteTransformer(UUID)`: Delete with cascade
- `uploadBaselineImage(UUID, String weather, File)`: Store baseline image
- `getBaselineImageUrl(UUID, String weather)`: Retrieve baseline URL

**InspectionService** (`backend/src/main/java/.../service/InspectionService.java`)
- `getAllInspections()`: Fetch all inspections
- `getInspectionsByTransformer(UUID)`: Get transformer's history
- `createInspection(InspectionRequest)`: Create new inspection
- `updateInspection(UUID, InspectionRequest)`: Modify inspection
- `deleteInspection(UUID)`: Delete with cascade

**ThermalImageService** (`backend/src/main/java/.../service/ThermalImageService.java`)
- `uploadThermalImage(UUID, File, String type)`: Store thermal image
- `getThermalImagesByInspection(UUID)`: Get inspection images
- `detectAnomalies(UUID)`: Call AI detection (Phase 2)

#### 4. **Controller Layer**

**TransformerController** (`backend/src/main/java/.../controller/TransformerController.java`)
```
GET    /api/transformers              - Get all transformers
GET    /api/transformers/{id}         - Get transformer details
POST   /api/transformers              - Create transformer
PUT    /api/transformers/{id}         - Update transformer
DELETE /api/transformers/{id}         - Delete transformer
POST   /api/transformers/{id}/baseline-image - Upload baseline image
GET    /api/transformers/{id}/baseline-image - Get baseline image URL
```

**InspectionController** (`backend/src/main/java/.../controller/InspectionController.java`)
```
GET    /api/inspections               - Get all inspections
GET    /api/inspections/{id}          - Get inspection details
POST   /api/inspections               - Create inspection
PUT    /api/inspections/{id}          - Update inspection
DELETE /api/inspections/{id}          - Delete inspection
```

**ThermalImageController** (`backend/src/main/java/.../controller/ThermalImageController.java`)
```
GET    /api/thermal-images?inspectionId={id} - Get images for inspection
POST   /api/thermal-images/upload     - Upload thermal image
PUT    /api/thermal-images/{id}       - Update image metadata
```

---

### Frontend Architecture

#### 1. **API Client** (`frontend/lib/api.ts`)

```typescript
class ApiService {
  // Transformer methods
  async getTransformers(): Promise<ApiResponse<TransformerData[]>>
  async getTransformer(id: string): Promise<ApiResponse<TransformerData>>
  async addTransformer(transformer: TransformerData): Promise<ApiResponse<TransformerData>>
  async updateTransformer(id: string, transformer: Partial<TransformerData>): Promise<ApiResponse<TransformerData>>
  async deleteTransformer(id: string): Promise<ApiResponse<null>>
  async uploadBaselineImage(transformerId: string, weatherCondition: string, file: File): Promise<ApiResponse<TransformerData>>
  async getBaselineImageUrl(transformerId: string, weatherCondition: string): Promise<ApiResponse<string>>
  
  // Inspection methods
  async getInspections(transformerId?: string): Promise<ApiResponse<InspectionData[]>>
  async getInspection(id: string): Promise<ApiResponse<InspectionData>>
  async addInspection(inspection: Omit<InspectionData, "id">): Promise<ApiResponse<InspectionData>>
  async updateInspection(id: string, inspection: Partial<InspectionData>): Promise<ApiResponse<InspectionData>>
  async deleteInspection(id: string): Promise<ApiResponse<null>>
  
  // Thermal image methods
  async uploadThermalImage(inspectionId: string, file: File, imageType: string): Promise<ApiResponse<ThermalImageData>>
  async getThermalImages(inspectionId: string): Promise<ApiResponse<ThermalImageData[]>>
  async updateThermalImageDetections(imageId: string, detections: Detection[]): Promise<ApiResponse<ThermalImageData>>
}
```

#### 2. **React Components**

**TransformerDashboard** (`frontend/components/transformer-dashboard.tsx`)
- Main component orchestrating transformer management
- Routes between different views
- Handles state management

**TransformerList** (`frontend/components/transformers/transformer-list.tsx`)
- Table display of all transformers
- Columns: Number, Type, Capacity, Region, Status, Actions
- Sorting and filtering capabilities
- Quick action buttons

**TransformerDetails** (`frontend/components/transformers/transformer-details.tsx`)
- Full transformer information display
- Current baseline images for each weather condition
- Inspection history
- Edit and delete buttons

**AddTransformerDialog** (`frontend/components/transformers/add-transformer-dialog.tsx`)
- Form for creating new transformer
- Fields: transformer number, pole number, region, type, capacity, feeders, location, status
- Input validation
- Error handling

**EditTransformerDialog** (`frontend/components/transformers/edit-transformer-dialog.tsx`)
- Pre-populated form for editing existing transformer
- Same fields as add dialog
- Update validation

**BaselineImageCard** (`frontend/components/transformers/baseline-image-card.tsx`)
- Display baseline image for specific weather condition
- Upload/replace button for each weather type
- Shows upload date and uploader info
- Image preview with zoom capability

**InspectionList** (`frontend/components/inspections/inspection-list.tsx`)
- Table of inspections for selected transformer
- Columns: Number, Date, Status, Inspector, Weather, Actions
- Sorted by date (newest first)

**ThermalImageUpload** (`frontend/components/inspections/thermal-image-upload.tsx`)
- Multi-stage upload interface
- Progress tracking with visual indicators
- Image type selector (Baseline/Maintenance)
- Weather condition dropdown for baseline images
- Success/error messaging

#### 3. **UI Components** (using shadcn/ui)
- Button: Standard action buttons
- Card: Container for information groups
- Dialog: Modal forms for CRUD operations
- Table: Data display with sorting
- Badge: Status indicators
- Input: Text field inputs
- Select: Dropdown selections
- Alert: Error/success messages

#### 4. **Pages**

**Transformers Page** (`frontend/app/transformers/page.tsx`)
- Main transformer management interface
- List view with transformer table
- Add transformer button
- Search/filter options
- Click row to view details

**Inspections Page** (`frontend/app/inspections/page.tsx`)
- Inspection management interface
- List view with inspection table
- Add inspection button
- Link to create maintenance records (Phase 4)

---

## Database Schema

### Transformers Table
```sql
CREATE TABLE transformers (
    id UUID PRIMARY KEY,
    transformer_no VARCHAR(255) UNIQUE NOT NULL,
    pole_no VARCHAR(255) NOT NULL,
    region VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    capacity DECIMAL(10,2),
    no_of_feeders INT,
    location_details TEXT,
    status VARCHAR(50),
    last_inspected TIMESTAMP,
    sunny_baseline_image_url VARCHAR(500),
    cloudy_baseline_image_url VARCHAR(500),
    rainy_baseline_image_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### Inspections Table
```sql
CREATE TABLE inspections (
    id UUID PRIMARY KEY,
    inspection_no VARCHAR(255) UNIQUE NOT NULL,
    transformer_id UUID NOT NULL,
    inspected_date TIMESTAMP NOT NULL,
    maintenance_date TIMESTAMP,
    status VARCHAR(50),
    inspected_by VARCHAR(255),
    weather_condition VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (transformer_id) REFERENCES transformers(id) ON DELETE CASCADE
);
```

### Thermal Images Table
```sql
CREATE TABLE thermal_images (
    id UUID PRIMARY KEY,
    inspection_id UUID NOT NULL,
    image_url VARCHAR(500) NOT NULL,
    image_type VARCHAR(50) NOT NULL,
    weather_condition VARCHAR(50),
    temperature_reading DECIMAL(5,2),
    anomaly_detected BOOLEAN,
    detection_data TEXT,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (inspection_id) REFERENCES inspections(id) ON DELETE CASCADE
);
```

---

## API Documentation

### Transformers

#### Get All Transformers
```http
GET /api/transformers

Response: 200 OK
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "transformerNo": "AZ-1234",
    "poleNo": "EN-125-B",
    "region": "colombo",
    "type": "Distribution",
    "capacity": 100.0,
    "noOfFeeders": 4,
    "locationDetails": "Pitakotte",
    "status": "Operational",
    "sunnyBaselineImageUrl": "/uploads/transformer-1-sunny.jpg",
    "cloudyBaselineImageUrl": "/uploads/transformer-1-cloudy.jpg",
    "rainyBaselineImageUrl": "/uploads/transformer-1-rainy.jpg",
    "createdAt": "2025-10-03T10:00:00Z",
    "updatedAt": "2025-10-03T10:00:00Z"
  }
]
```

#### Create Transformer
```http
POST /api/transformers
Content-Type: application/json

{
  "transformerNo": "AZ-5678",
  "poleNo": "EN-200-C",
  "region": "galle",
  "type": "Bulk",
  "capacity": 200.0,
  "noOfFeeders": 6,
  "locationDetails": "Unawatuna",
  "status": "Operational"
}

Response: 201 Created
{
  "id": "550e8400-e29b-41d4-a716-446655440001",
  "transformerNo": "AZ-5678",
  ...
}
```

#### Upload Baseline Image
```http
POST /api/transformers/{id}/baseline-image
Content-Type: multipart/form-data

weatherCondition: Sunny
file: [thermal_image.jpg]

Response: 200 OK
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "sunnyBaselineImageUrl": "/uploads/transformer-1-sunny-abc123.jpg",
  ...
}
```

#### Get Baseline Image URL
```http
GET /api/transformers/{id}/baseline-image?weatherCondition=Sunny

Response: 200 OK
/uploads/transformer-1-sunny-abc123.jpg
```

### Inspections

#### Create Inspection
```http
POST /api/inspections
Content-Type: application/json

{
  "inspectionNo": "INSP-1234567890",
  "transformerId": "550e8400-e29b-41d4-a716-446655440000",
  "inspectedDate": "2025-10-03T10:00:00Z",
  "maintenanceDate": "2025-10-10T10:00:00Z",
  "status": "In Progress",
  "inspectedBy": "John Doe",
  "weatherCondition": "Sunny"
}

Response: 201 Created
{
  "id": "550e8400-e29b-41d4-a716-446655440002",
  "inspectionNo": "INSP-1234567890",
  ...
}
```

#### Get Inspections for Transformer
```http
GET /api/inspections?transformerId=550e8400-e29b-41d4-a716-446655440000

Response: 200 OK
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440002",
    "inspectionNo": "INSP-1234567890",
    "inspectedDate": "2025-10-03T10:00:00Z",
    "status": "Completed",
    "inspectedBy": "John Doe",
    "weatherCondition": "Sunny"
  }
]
```

### Thermal Images

#### Upload Thermal Image
```http
POST /api/thermal-images/upload
Content-Type: multipart/form-data

inspectionId: 550e8400-e29b-41d4-a716-446655440002
file: [thermal_image.jpg]
imageType: Maintenance
weatherCondition: Sunny (optional)

Response: 201 Created
{
  "id": "550e8400-e29b-41d4-a716-446655440003",
  "imageUrl": "/uploads/thermal-image-abc123.jpg",
  "imageType": "Maintenance",
  "uploadedAt": "2025-10-03T10:30:00Z"
}
```

---

## Setup Instructions

### Prerequisites
- Java 17+
- Node.js 18+
- MySQL 8.0
- Docker & Docker Compose

### Backend Setup

1. **Start Database**
```bash
cd backend
docker-compose up -d
```

2. **Install Dependencies & Build**
```bash
mvn clean install
```

3. **Run Server**
```bash
mvn spring-boot:run
```
Server available at `http://localhost:8080`

### Frontend Setup

1. **Install Dependencies**
```bash
cd frontend
npm install
```

2. **Run Development Server**
```bash
npm run dev
```
Application available at `http://localhost:3000`

---

## File Structure

```
transformer-management/
├── backend/
│   ├── src/main/java/.../
│   │   ├── controller/
│   │   │   ├── TransformerController.java
│   │   │   ├── InspectionController.java
│   │   │   └── ThermalImageController.java
│   │   ├── service/
│   │   │   ├── TransformerService.java
│   │   │   ├── InspectionService.java
│   │   │   └── ThermalImageService.java
│   │   ├── repository/
│   │   │   ├── TransformerRepository.java
│   │   │   ├── InspectionRepository.java
│   │   │   └── ThermalImageRepository.java
│   │   └── model/
│   │       ├── Transformer.java
│   │       ├── Inspection.java
│   │       └── ThermalImage.java
│   └── docker-compose.yml
│
└── frontend/
    ├── app/
    │   ├── transformers/page.tsx
    │   └── inspections/page.tsx
    ├── components/
    │   ├── transformers/
    │   │   ├── transformer-list.tsx
    │   │   ├── transformer-details.tsx
    │   │   ├── add-transformer-dialog.tsx
    │   │   └── baseline-image-card.tsx
    │   └── inspections/
    │       ├── inspection-list.tsx
    │       └── thermal-image-upload.tsx
    └── lib/
        └── api.ts
```

---

## Known Limitations & Future Enhancements

### Current Limitations
1. No user authentication implemented
2. Local file storage only (no cloud backup)
---

## Dependencies

### Backend
- Spring Boot 3.3.0
- Spring Data JPA 3.3.0
- Hibernate 6.5.2
- MySQL Connector 8.0.33
- Jackson 2.17.1
- Maven 3.9.x

### Frontend
- Next.js 14.x
- React 18.x
- TypeScript 5.x
- Tailwind CSS 3.x
- shadcn/ui (latest)
- Lucide Icons (latest)

---




