# Phase 3: Interactive Annotation System & Feedback Integration

## 📋 Table of Contents

- [Overview](#-overview)
- [Features Implemented](#-features-implemented)
- [System Architecture](#-system-architecture)
- [Backend Implementation](#-backend-implementation)
- [Frontend Implementation](#-frontend-implementation)
- [Feedback Log System](#-feedback-log-system)
- [API Endpoints](#-api-endpoints)
- [Database Schema](#-database-schema)
- [Known Bugs and Limitations](#-known-bugs-and-limitations)
- [Future Enhancements](#-future-enhancements)

---

## 🎯 Overview

Phase 3 extends the Oversight Transformer Management System with advanced interactive annotation capabilities and a comprehensive feedback integration system for AI model improvement. This phase enables users to refine AI-generated anomaly detections and provides a robust feedback loop for continuous model enhancement.

### Key Objectives Achieved

1. **FR3.1**: Interactive annotation tools for editing, adding, and deleting anomaly markers
2. **FR3.2**: Complete metadata and annotation persistence with automatic reload functionality
3. **FR3.3**: Feedback integration system for AI model improvement with JSON/CSV export capabilities

---

## ✨ Features Implemented

### FR3.1: Interactive Annotation Tools

The system provides a full-featured interactive canvas for manipulating thermal image annotations:

#### 🖱️ Core Annotation Operations

1. **Adjust Existing Anomaly Markers**
   - **Resize**: Click and drag any of the 8 resize handles (corners and edges)
   - **Reposition**: Click and drag boxes to move them across the image
   - **Real-time Feedback**: Visual highlights show selected and hovered boxes

2. **Delete Incorrectly Detected Anomalies**
   - Soft delete (default): Marks annotations as deleted while preserving database relationships
   - Hard delete (optional): Permanently removes annotation records
   - Confirmation dialog prevents accidental deletions
   - Supports both single and batch deletion operations

3. **Add New Anomaly Markers**
   - **Interactive Drawing**: Click and drag to create new bounding boxes
   - **Multiple Shape Support**: Currently implements rectangular bounding boxes (polygonal regions architecture-ready)
   - **Custom Classification**: Assign detection class (Faulty, Potentially Faulty, Normal)
   - **Confidence Setting**: Set confidence scores for user-added annotations

#### 📝 Annotation Metadata (Automatically Captured)

Every annotation includes comprehensive metadata:

- **Annotation Type**: 
  - `ai_detected` - Original AI-generated detections
  - `user_added` - Manually added by users
  - `user_edited` - Modified from original AI detections
  - `user_deleted` - Soft-deleted annotations
  
- **Optional Fields**:
  - Comments/notes for additional context
  - Detection class and confidence score
  
- **Automatic Timestamps**:
  - `createdAt` - Initial creation timestamp (ISO 8601 format)
  - `modifiedAt` - Last modification timestamp
  
- **User Tracking**:
  - `createdBy` - User ID who created the annotation
  - `modifiedBy` - User ID who last modified the annotation

#### 🎨 Visual Features

- **Color-Coded Detection Classes**:
  - 🔴 Faulty (Red: #ff0000)
  - 🟠 Potentially Faulty (Orange: #ff9800)
  - 🟢 Normal (Green: #00ff00)
  - 🔵 Default (Cyan: #00bcd4)

- **Interactive Canvas Controls**:
  - Zoom in/out for detailed inspection
  - Pan across large images
  - Reset view to original position
  - Edit mode toggle for annotation modifications

- **Real-time Visual Feedback**:
  - Hover effects on bounding boxes
  - Selection highlights with opacity overlays
  - Resize handles appear on selected boxes
  - Dotted preview for new box drawing

---

### FR3.2: Metadata and Annotation Persistence

Complete lifecycle management for annotations with robust persistence mechanisms:

#### 💾 Backend Persistence Architecture

**Entity Structure**:
```
Annotation Entity
├── id (UUID, Primary Key)
├── thermalImage (ManyToOne relationship)
├── transformerId (UUID, for efficient querying)
├── detectionId (String, unique identifier)
├── annotationType (String, enum-like)
├── detectionClass (String)
├── confidence (Double, 0.0-1.0)
├── Coordinates (x, y, width, height as Double)
├── comments (Text, optional)
├── createdBy (String, User ID)
├── createdAt (OffsetDateTime)
├── modifiedBy (String, User ID)
├── modifiedAt (OffsetDateTime)
└── isDeleted (Boolean, soft delete flag)
```

**Persistence Layers**:

1. **Repository Layer** (`AnnotationRepository`)
   - JPA Repository extending Spring Data JPA
   - Custom queries for thermal image filtering
   - Support for soft-deleted record queries
   - Efficient batch operations

2. **Service Layer** (`AnnotationService`)
   - Business logic encapsulation
   - Transaction management with `@Transactional`
   - Coordinate transformation logic
   - Validation and error handling
   - Integration with FeedbackLogService

3. **Controller Layer** (`AnnotationController`)
   - RESTful API endpoints
   - Request/response mapping
   - User ID extraction from headers
   - Exception handling and status codes

#### 🔄 Automatic Reload Functionality

**Load Sequence**:
1. User navigates to inspection details page
2. System detects maintenance image selection
3. `loadAnnotations()` function triggers automatically
4. Fetches annotations from backend via `/api/annotations/thermal-image/{id}`
5. Converts backend Annotation entities to frontend Detection format
6. Updates canvas state and re-renders bounding boxes

**Sync Mechanism**:
- Debounced save operations prevent excessive API calls
- Optimistic UI updates for immediate user feedback
- Background sync ensures data consistency
- Error handling with rollback on failure

#### 🔐 Data Integrity Features

- **Foreign Key Relationships**: Annotations linked to thermal images
- **Cascade Prevention**: Soft delete instead of hard delete to preserve feedback log integrity
- **Transaction Safety**: ACID compliance for multi-step operations
- **Audit Trail**: Complete history of creation and modification

---

### FR3.3: Feedback Integration for Model Improvement

Comprehensive feedback logging system captures the AI training feedback loop:

#### 📊 Feedback Log Architecture

**Purpose**: Bridge the gap between AI predictions and human corrections to enable continuous model improvement

**Data Structure**:
```
FeedbackLog Entity
├── id (UUID, Primary Key)
├── thermalImage (ManyToOne relationship)
├── annotation (ManyToOne, nullable)
├── aiPrediction (JSON String)
│   └── Contains: detection_id, class, confidence, bbox coordinates
├── finalAnnotation (JSON String)
│   └── Contains: modified/added detection data
├── feedbackType (String)
│   ├── "correction" - AI detection was modified
│   ├── "addition" - New detection added by user
│   ├── "deletion" - AI detection was removed
│   └── "no_change" - AI detection accepted as-is
├── Annotator Metadata
│   ├── annotatorId (String)
│   ├── annotatorName (String)
│   ├── annotatorRole (String)
│   └── timestamp (OffsetDateTime)
├── createdAt (OffsetDateTime)
├── exportedAt (OffsetDateTime, nullable)
├── usedForTraining (Boolean)
└── comments (Text, optional)
```

#### 🔄 Automatic Feedback Generation

**Trigger Points**:
1. When user syncs annotations via `/api/annotations/thermal-image/{id}/sync`
2. `createFeedbackLogsFromSync()` automatically analyzes changes
3. Compares AI detections vs. user-modified annotations
4. Generates feedback log entries for each modification

**Comparison Logic**:
```java
1. Retrieve all annotations for thermal image
2. Separate by type:
   - AI-detected annotations (annotationType = "ai_detected")
   - User-modified annotations (annotationType IN ["user_added", "user_edited", "user_deleted"])
3. Match user annotations to original AI detections by detection_id
4. Create feedback log for each user modification:
   - If match found: Include original AI prediction
   - If no match: Log as pure user addition
   - Record feedback type based on annotation type
```

#### 📤 Export Capabilities

**JSON Export** (`/api/feedback-logs/export/json`):
```json
[
  {
    "imageId": "uuid",
    "imageUrl": "https://...",
    "imageType": "Maintenance",
    "modelPredictedAnomalies": {
      "detection_id": "det_123",
      "class": "faulty",
      "confidence": 0.87,
      "x": 512, "y": 384,
      "width": 120, "height": 90
    },
    "finalAcceptedAnnotations": {
      "detection_id": "det_123",
      "class": "potentially_faulty",
      "confidence": 0.75,
      "x": 508, "y": 380,
      "width": 125, "height": 95
    },
    "feedbackType": "correction",
    "annotatorMetadata": {
      "annotatorId": "user_001",
      "annotatorName": "John Inspector",
      "annotatorRole": "inspector",
      "timestamp": "2025-10-22T10:30:00Z"
    },
    "comments": "Adjusted bbox to better fit anomaly area",
    "usedForTraining": false
  }
]
```

**CSV Export** (`/api/feedback-logs/export/csv`):
- Flattened structure for spreadsheet analysis
- Includes all critical fields in tabular format
- Separate columns for AI vs. final annotation coordinates
- Timestamp and metadata columns for filtering

**Export Features**:
- Export all logs or only unused logs (not yet used for training)
- Automatic file download via browser
- Filename includes date timestamp
- Marks records as exported with `exportedAt` timestamp

#### 🎓 Model Improvement Workflow

1. **Data Collection**: Feedback logs accumulate as users refine detections
2. **Export Training Data**: Download JSON/CSV with AI predictions + corrections
3. **Model Retraining**: Use feedback data to improve detection accuracy
4. **Mark as Used**: Flag logs as `usedForTraining = true` to prevent duplication
5. **Continuous Improvement**: Repeat cycle with new inspection data

---

## 🏗️ System Architecture

### Backend Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Frontend (Next.js)                   │
│  ┌──────────────────────────────────────────────────┐  │
│  │       Interactive Canvas Component                │  │
│  │  - Drawing tools, resize/move handlers           │  │
│  │  - Real-time coordinate tracking                 │  │
│  └──────────────────────────────────────────────────┘  │
└────────────────────┬────────────────────────────────────┘
                     │ REST API Calls
                     ▼
┌─────────────────────────────────────────────────────────┐
│              Spring Boot Backend                         │
│  ┌────────────────────────────────────────────────┐    │
│  │           Controller Layer                      │    │
│  │  - AnnotationController                        │    │
│  │  - FeedbackLogController                       │    │
│  └────────────────┬───────────────────────────────┘    │
│                   │                                      │
│  ┌────────────────▼───────────────────────────────┐    │
│  │            Service Layer                        │    │
│  │  - AnnotationService                           │    │
│  │  - FeedbackLogService                          │    │
│  │  - Coordinate transformation logic             │    │
│  │  - Transaction management                      │    │
│  └────────────────┬───────────────────────────────┘    │
│                   │                                      │
│  ┌────────────────▼───────────────────────────────┐    │
│  │          Repository Layer (JPA)                 │    │
│  │  - AnnotationRepository                        │    │
│  │  - FeedbackLogRepository                       │    │
│  └────────────────┬───────────────────────────────┘    │
└───────────────────┼──────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────┐
│                  MySQL Database                          │
│  - annotations table                                     │
│  - feedback_logs table                                   │
│  - thermal_images table (FK parent)                      │
└─────────────────────────────────────────────────────────┘
```

### Data Flow Diagram

```
User Action (Frontend)
      │
      ├─► Draw New Box ──► POST /api/annotations/thermal-image/{id}
      │                    └─► Create Annotation Entity
      │                        └─► Save to DB
      │
      ├─► Edit Box ──────► PUT /api/annotations/{id}
      │                    └─► Update Annotation Entity
      │                        └─► Update modifiedAt, modifiedBy
      │                            └─► Save to DB
      │
      ├─► Delete Box ────► DELETE /api/annotations/{id}
      │                    └─► Soft Delete (isDeleted = true)
      │                        └─► Update annotationType to "user_deleted"
      │
      └─► Save All ──────► POST /api/annotations/thermal-image/{id}/sync
                           └─► Sync All Annotations
                               ├─► Update existing annotations
                               ├─► Create new annotations
                               └─► Trigger Feedback Log Creation
                                   └─► Compare AI vs User Detections
                                       └─► Generate Feedback Logs
                                           └─► Save to feedback_logs table
```

---

## 🔧 Backend Implementation

### Core Components

#### 1. Annotation Model (`Annotation.java`)

**Location**: `backend/src/main/java/com/example/transformermanagement/model/Annotation.java`

**Key Features**:
- JPA Entity with UUID primary key
- ManyToOne relationship with ThermalImage
- Soft delete support with `isDeleted` flag
- Automatic timestamp management via `@PrePersist` and `@PreUpdate`
- Coordinate storage for bounding boxes (center point + dimensions)

**Coordinate System**:
- `x, y`: Center point of bounding box in image pixel coordinates
- `width, height`: Dimensions of bounding box in pixels
- Frontend handles conversion between screen and image coordinates

#### 2. Annotation Repository (`AnnotationRepository.java`)

**Location**: `backend/src/main/java/com/example/transformermanagement/repository/AnnotationRepository.java`

**Custom Queries**:
```java
// Find all annotations for a thermal image
List<Annotation> findByThermalImageId(UUID thermalImageId);

// Find only non-deleted annotations
@Query("SELECT a FROM Annotation a WHERE a.thermalImage.id = :thermalImageId AND a.isDeleted = false")
List<Annotation> findByThermalImageIdAndNotDeleted(@Param("thermalImageId") UUID thermalImageId);
```

#### 3. Annotation Service (`AnnotationService.java`)

**Location**: `backend/src/main/java/com/example/transformermanagement/service/AnnotationService.java`

**Key Methods**:

1. **Create Annotation**
```java
@Transactional
public Annotation createAnnotation(UUID thermalImageId, Annotation annotation, String userId)
```
- Validates thermal image exists
- Sets user tracking fields (createdBy, modifiedBy)
- Stores transformer ID for efficient querying (FR3.2)
- Returns saved annotation with generated ID

2. **Update Annotation**
```java
@Transactional
public Annotation updateAnnotation(UUID annotationId, Annotation updatedAnnotation, String userId)
```
- Fetches existing annotation
- Updates coordinates, class, confidence, comments
- Changes annotationType to "user_edited"
- Updates modifiedBy and modifiedAt timestamps

3. **Delete Annotation**
```java
@Transactional
public void deleteAnnotation(UUID annotationId, String userId, boolean hardDelete)
```
- Soft delete (default): Sets isDeleted = true, annotationType = "user_deleted"
- Hard delete (optional): Permanently removes from database
- Soft delete prevents foreign key constraint violations

4. **Sync Annotations from DTO**
```java
@Transactional
public List<Annotation> syncAnnotationsFromDTO(UUID thermalImageId, List<DetectionDTO> detectionDTOs, String userId)
```
- Converts frontend Detection DTOs to Annotation entities
- Preserves existing annotations to maintain feedback log integrity
- Updates existing or creates new annotations based on detection_id
- Marks removed annotations as soft-deleted
- Automatically triggers feedback log creation

#### 4. Annotation Controller (`AnnotationController.java`)

**Location**: `backend/src/main/java/com/example/transformermanagement/controller/AnnotationController.java`

**REST Endpoints**:

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/annotations/thermal-image/{thermalImageId}` | Get all annotations for an image |
| POST | `/api/annotations/thermal-image/{thermalImageId}` | Create new annotation |
| PUT | `/api/annotations/{annotationId}` | Update existing annotation |
| DELETE | `/api/annotations/{annotationId}` | Delete annotation (soft or hard) |
| POST | `/api/annotations/thermal-image/{thermalImageId}/sync` | Sync all annotations at once |

**Query Parameters**:
- `includeDeleted` (GET): Include soft-deleted annotations (default: false)
- `hardDelete` (DELETE): Permanently delete annotation (default: false)

**Headers**:
- `X-User-Id`: User identifier for tracking (default: "system")

#### 5. Feedback Log Model (`FeedbackLog.java`)

**Location**: `backend/src/main/java/com/example/transformermanagement/model/FeedbackLog.java`

**Relationships**:
- ManyToOne with ThermalImage (required)
- ManyToOne with Annotation (optional, nullable for user additions)

**JSON Storage**:
- `aiPrediction`: Stores original AI detection as JSON string
- `finalAnnotation`: Stores user-modified detection as JSON string
- Enables flexible schema for detection data

#### 6. Feedback Log Service (`FeedbackLogService.java`)

**Location**: `backend/src/main/java/com/example/transformermanagement/service/FeedbackLogService.java`

**Key Methods**:

1. **Create Feedback Log**
```java
@Transactional
public FeedbackLog createFeedbackLog(
    ThermalImage thermalImage,
    UUID annotationId,
    Map<String, Object> aiPrediction,
    Map<String, Object> finalAnnotation,
    String feedbackType,
    String annotatorId,
    String annotatorName,
    String comments
)
```
- Creates individual feedback log entry
- Serializes prediction maps to JSON strings
- Sets annotator metadata
- Returns saved feedback log

2. **Auto-create from Sync**
```java
@Transactional
public void createFeedbackLogsFromSync(UUID thermalImageId, String userId)
```
- Called automatically after annotation sync
- Separates AI-detected vs. user-modified annotations
- Matches user modifications to original AI detections by detection_id
- Generates feedback logs for each user action (add/edit/delete)
- Determines feedback type based on annotation type

3. **Export as JSON**
```java
public String exportFeedbackLogsAsJSON(List<FeedbackLog> feedbackLogs) throws IOException
```
- Converts feedback logs to structured JSON format
- Deserializes stored JSON strings to objects
- Includes all metadata and annotator information
- Marks logs as exported with timestamp
- Returns pretty-printed JSON string

4. **Export as CSV**
```java
public String exportFeedbackLogsAsCSV(List<FeedbackLog> feedbackLogs) throws IOException
```
- Flattens feedback logs to CSV format
- Separate columns for AI vs final coordinates
- Handles missing data gracefully
- CSV-escapes special characters
- Returns CSV string with headers

#### 7. Feedback Log Controller (`FeedbackLogController.java`)

**Location**: `backend/src/main/java/com/example/transformermanagement/controller/FeedbackLogController.java`

**REST Endpoints**:

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/feedback-logs` | Get all feedback logs |
| GET | `/api/feedback-logs/thermal-image/{id}` | Get feedback logs for specific image |
| GET | `/api/feedback-logs/unused` | Get logs not yet used for training |
| GET | `/api/feedback-logs/export/json` | Export all logs as JSON file |
| GET | `/api/feedback-logs/export/json/unused` | Export unused logs as JSON |
| GET | `/api/feedback-logs/export/csv` | Export all logs as CSV file |
| GET | `/api/feedback-logs/export/csv/unused` | Export unused logs as CSV |
| GET | `/api/feedback-logs/stats` | Get statistics about feedback logs |
| POST | `/api/feedback-logs/mark-used` | Mark logs as used for training |

**Response Headers for Export**:
- `Content-Type`: application/json or text/csv
- `Content-Disposition`: attachment with timestamped filename

---

## 💻 Frontend Implementation

### Core Components

#### 1. Thermal Image Canvas (`thermal-image-canvas.tsx`)

**Location**: `frontend/components/inspections/thermal-image-canvas.tsx`

**Component Architecture**:
```typescript
interface ThermalImageCanvasProps {
  imageUrl: string
  detections?: Detection[]
  alt?: string
  className?: string
  onDetectionsChange?: (detections: Detection[]) => void
  highlightedBoxIndex?: number | null
  onHighlightDetection?: (index: number | null) => void
}
```

**State Management**:
- Image loading and rendering state
- Detection array state (synchronized with backend)
- Edit mode flag
- Selected/hovered/highlighted box indices
- Transform state (zoom, pan, offset)
- Drag/resize state for interactive editing
- New box drawing state

**Core Functionality**:

1. **Coordinate Transformation**
```typescript
// Convert screen coordinates to canvas coordinates
screenToCanvas(screenX: number, screenY: number): { x: number, y: number }

// Convert canvas coordinates to image pixel coordinates
canvasToImageCoords(canvasX: number, canvasY: number): { x: number, y: number } | null

// Get box screen coordinates for rendering
getBoxScreenCoords(detection: Detection): { boxX, boxY, boxWidth, boxHeight } | null
```

2. **Box Interaction Detection**
```typescript
// Check if point is inside a bounding box
isPointInBox(x: number, y: number, detection: Detection): boolean

// Get resize handle at specific point
getResizeHandleAtPoint(x: number, y: number, detection: Detection): ResizeHandle
```

3. **Canvas Rendering**
- Draws thermal image with aspect ratio preservation
- Renders bounding boxes with class-specific colors
- Shows labels with confidence percentages
- Highlights selected/hovered boxes with overlays
- Displays resize handles on selected boxes
- Renders preview for new box being drawn

4. **Mouse Event Handlers**
```typescript
handleMouseDown(): Initiates drag/resize/draw operations
handleMouseMove(): Updates box position/size during interaction
handleMouseUp(): Finalizes changes and triggers save
```

5. **Edit Mode Actions**
```typescript
toggleEditMode(): Enable/disable annotation editing
handleSaveChanges(): Sync changes to backend
handleCancelChanges(): Revert to original state
handleDeleteBox(): Show confirmation and delete annotation
handleAddNewBox(): Initiate new box drawing mode
```

**Visual Features**:
- 8-handle resize (4 corners + 4 edges)
- Smooth drag and drop
- Real-time coordinate updates
- Zoom in/out with center preservation
- Pan with mouse drag
- Reset view button

#### 2. Inspection Details (`inspection-details.tsx`)

**Location**: `frontend/components/inspections/inspection-details.tsx`

**Integration Points**:
- Renders ThermalImageCanvas component
- Manages detection state at parent level
- Handles annotation sync with backend
- Displays detection summary panel
- Coordinates with feedback log export

**Annotation Loading**:
```typescript
const loadAnnotations = async () => {
  setLoadingAnnotations(true)
  try {
    // Try to load from Annotation API (FR3.2)
    const annotationRes = await api.getAnnotations(maintenanceImage.id, false)
    if (annotationRes.success && annotationRes.data.length > 0) {
      // Convert Annotation entities to Detection format
      const loadedDetections = annotationRes.data.map((annotation) => ({
        detection_id: annotation.detectionId,
        class: annotation.detectionClass,
        confidence: annotation.confidence,
        x: annotation.x,
        y: annotation.y,
        width: annotation.width,
        height: annotation.height,
        annotationType: annotation.annotationType,
        comments: annotation.comments,
        createdAt: annotation.createdAt,
        createdBy: annotation.createdBy,
        modifiedAt: annotation.modifiedAt,
        modifiedBy: annotation.modifiedBy,
      }))
      setDetections(loadedDetections)
    } else {
      // Fallback to legacy detection data from thermal image
      // ...
    }
  } catch (error) {
    console.error("Failed to load annotations:", error)
  } finally {
    setLoadingAnnotations(false)
  }
}
```

**Annotation Syncing**:
```typescript
const handleSyncAnnotations = async (updatedDetections: Detection[]) => {
  try {
    const result = await api.syncAnnotations(
      maintenanceImage.id,
      updatedDetections,
      "user_001" // User ID from context/auth
    )
    if (result.success) {
      toast.success("Annotations saved successfully")
      // Reload to get server-processed data
      loadAnnotations()
    }
  } catch (error) {
    toast.error("Failed to save annotations")
  }
}
```

#### 3. Feedback Log Export Component

**Location**: `frontend/components/inspections/feedback-log-export.tsx`

**Features**:
- Statistics dashboard showing total logs, unused logs, feedback type distribution
- Export buttons for JSON and CSV formats
- Filter toggle for unused logs only
- Automatic file download with timestamped filenames
- Loading states and error handling

**Export Functions**:
```typescript
const handleExportJSON = async (unusedOnly: boolean = false) => {
  try {
    await api.exportFeedbackLogsJSON(unusedOnly)
    toast.success("Feedback logs exported successfully")
  } catch (error) {
    toast.error("Failed to export feedback logs")
  }
}

const handleExportCSV = async (unusedOnly: boolean = false) => {
  try {
    await api.exportFeedbackLogsCSV(unusedOnly)
    toast.success("Feedback logs exported successfully")
  } catch (error) {
    toast.error("Failed to export feedback logs")
  }
}
```

#### 4. API Service Layer (`api.ts`)

**Location**: `frontend/lib/api.ts`

**Annotation API Methods**:
```typescript
class ApiService {
  // Get annotations for a thermal image
  async getAnnotations(thermalImageId: string, includeDeleted: boolean): Promise<ApiResponse<Annotation[]>>
  
  // Create new annotation
  async createAnnotation(thermalImageId: string, annotation: Detection, userId: string): Promise<ApiResponse<Detection>>
  
  // Update existing annotation
  async updateAnnotation(annotationId: string, annotation: Detection, userId: string): Promise<ApiResponse<Detection>>
  
  // Delete annotation
  async deleteAnnotation(annotationId: string, hardDelete: boolean, userId: string): Promise<ApiResponse<void>>
  
  // Sync all annotations at once
  async syncAnnotations(thermalImageId: string, annotations: Detection[], userId: string): Promise<ApiResponse<Detection[]>>
}
```

**Feedback Log API Methods**:
```typescript
class ApiService {
  // Get all feedback logs
  async getFeedbackLogs(): Promise<ApiResponse<FeedbackLogData[]>>
  
  // Get feedback logs for specific image
  async getFeedbackLogsByImage(thermalImageId: string): Promise<ApiResponse<FeedbackLogData[]>>
  
  // Get unused feedback logs
  async getUnusedFeedbackLogs(): Promise<ApiResponse<FeedbackLogData[]>>
  
  // Export as JSON
  async exportFeedbackLogsJSON(unused: boolean): Promise<void>
  
  // Export as CSV
  async exportFeedbackLogsCSV(unused: boolean): Promise<void>
  
  // Get statistics
  async getFeedbackLogStats(): Promise<ApiResponse<FeedbackLogStats>>
  
  // Mark as used for training
  async markFeedbackLogsAsUsed(feedbackLogIds: string[]): Promise<ApiResponse<any>>
}
```

---

## 📚 API Endpoints

### Annotation Endpoints

#### GET `/api/annotations/thermal-image/{thermalImageId}`
Get all annotations for a thermal image.

**Query Parameters**:
- `includeDeleted` (boolean, default: false): Include soft-deleted annotations

**Response**: Array of Annotation objects
```json
[
  {
    "id": "uuid",
    "detectionId": "det_123",
    "annotationType": "user_edited",
    "detectionClass": "faulty",
    "confidence": 0.85,
    "x": 512,
    "y": 384,
    "width": 120,
    "height": 90,
    "comments": "Adjusted position",
    "createdBy": "user_001",
    "createdAt": "2025-10-22T10:30:00Z",
    "modifiedBy": "user_001",
    "modifiedAt": "2025-10-22T11:15:00Z",
    "isDeleted": false
  }
]
```

#### POST `/api/annotations/thermal-image/{thermalImageId}`
Create a new annotation for a thermal image.

**Headers**:
- `X-User-Id`: User identifier (default: "system")
- `Content-Type`: application/json

**Request Body**:
```json
{
  "detectionId": "det_new_001",
  "annotationType": "user_added",
  "detectionClass": "potentially_faulty",
  "confidence": 0.95,
  "x": 600,
  "y": 400,
  "width": 100,
  "height": 80,
  "comments": "New anomaly detected by inspector"
}
```

**Response**: Created Annotation object

#### PUT `/api/annotations/{annotationId}`
Update an existing annotation.

**Headers**:
- `X-User-Id`: User identifier
- `Content-Type`: application/json

**Request Body**: Partial Annotation object (only fields to update)

**Response**: Updated Annotation object

#### DELETE `/api/annotations/{annotationId}`
Delete an annotation (soft delete by default).

**Headers**:
- `X-User-Id`: User identifier

**Query Parameters**:
- `hardDelete` (boolean, default: false): Permanently delete annotation

**Response**: 200 OK (no body)

#### POST `/api/annotations/thermal-image/{thermalImageId}/sync`
Sync all annotations at once (bulk operation).

**Headers**:
- `X-User-Id`: User identifier
- `Content-Type`: application/json

**Request Body**: Array of Detection DTOs
```json
[
  {
    "detectionId": "det_123",
    "class": "faulty",
    "confidence": 0.87,
    "x": 512,
    "y": 384,
    "width": 120,
    "height": 90,
    "annotationType": "ai_detected"
  },
  {
    "detectionId": "det_124",
    "class": "normal",
    "confidence": 0.92,
    "x": 300,
    "y": 200,
    "width": 80,
    "height": 60,
    "annotationType": "user_added",
    "comments": "Added by inspector"
  }
]
```

**Response**: Array of synced Detection DTOs

**Side Effects**: Automatically creates feedback logs for changes

---

### Feedback Log Endpoints

#### GET `/api/feedback-logs`
Get all feedback logs.

**Response**: Array of FeedbackLog objects (simplified view)

#### GET `/api/feedback-logs/thermal-image/{thermalImageId}`
Get feedback logs for a specific thermal image.

**Response**: Array of FeedbackLog objects

#### GET `/api/feedback-logs/unused`
Get feedback logs not yet used for training.

**Response**: Array of FeedbackLog objects where `usedForTraining = false`

#### GET `/api/feedback-logs/export/json`
Export all feedback logs as JSON file.

**Response**: JSON file download with detailed format (see FR3.3 section)

**Headers**:
- `Content-Type`: application/json
- `Content-Disposition`: attachment; filename="feedback_logs_YYYY-MM-DD.json"

#### GET `/api/feedback-logs/export/json/unused`
Export unused feedback logs as JSON file.

#### GET `/api/feedback-logs/export/csv`
Export all feedback logs as CSV file.

**Response**: CSV file download

**Headers**:
- `Content-Type`: text/csv
- `Content-Disposition`: attachment; filename="feedback_logs_YYYY-MM-DD.csv"

#### GET `/api/feedback-logs/export/csv/unused`
Export unused feedback logs as CSV file.

#### GET `/api/feedback-logs/stats`
Get statistics about feedback logs.

**Response**:
```json
{
  "totalLogs": 150,
  "unusedLogs": 75,
  "feedbackTypeCounts": {
    "correction": 60,
    "addition": 40,
    "deletion": 30,
    "no_change": 20
  }
}
```

#### POST `/api/feedback-logs/mark-used`
Mark feedback logs as used for training.

**Request Body**: Array of feedback log UUIDs
```json
["uuid1", "uuid2", "uuid3"]
```

**Response**: Success message

---

## 🗄️ Database Schema

### Annotations Table

```sql
CREATE TABLE annotations (
    id BINARY(16) PRIMARY KEY,                    -- UUID
    thermal_image_id BINARY(16) NOT NULL,         -- FK to thermal_images
    transformer_id BINARY(16),                    -- Denormalized for performance
    detection_id VARCHAR(255) NOT NULL,           -- Unique detection identifier
    annotation_type VARCHAR(50) NOT NULL,         -- ai_detected, user_added, etc.
    detection_class VARCHAR(50) NOT NULL,         -- Faulty, Potentially Faulty, Normal
    confidence DOUBLE NOT NULL,                   -- 0.0 to 1.0
    x DOUBLE NOT NULL,                            -- Center X coordinate
    y DOUBLE NOT NULL,                            -- Center Y coordinate
    width DOUBLE NOT NULL,                        -- Bounding box width
    height DOUBLE NOT NULL,                       -- Bounding box height
    comments TEXT,                                -- Optional user notes
    created_by VARCHAR(255) NOT NULL,             -- User ID
    created_at TIMESTAMP NOT NULL,                -- Creation timestamp
    modified_by VARCHAR(255),                     -- Last modifier user ID
    modified_at TIMESTAMP,                        -- Last modification timestamp
    is_deleted BOOLEAN DEFAULT FALSE,             -- Soft delete flag
    
    FOREIGN KEY (thermal_image_id) REFERENCES thermal_images(id) ON DELETE CASCADE,
    INDEX idx_thermal_image (thermal_image_id),
    INDEX idx_transformer (transformer_id),
    INDEX idx_detection_id (detection_id),
    INDEX idx_annotation_type (annotation_type),
    INDEX idx_is_deleted (is_deleted)
);
```

### Feedback Logs Table

```sql
CREATE TABLE feedback_logs (
    id BINARY(16) PRIMARY KEY,                    -- UUID
    thermal_image_id BINARY(16) NOT NULL,         -- FK to thermal_images
    annotation_id BINARY(16),                     -- FK to annotations (nullable)
    ai_prediction TEXT,                           -- JSON string of AI detection
    final_annotation TEXT,                        -- JSON string of final annotation
    feedback_type VARCHAR(50) NOT NULL,           -- correction, addition, deletion, no_change
    annotator_id VARCHAR(255),                    -- User ID
    annotator_name VARCHAR(255),                  -- User display name
    annotator_role VARCHAR(100),                  -- User role (inspector, etc.)
    created_at TIMESTAMP NOT NULL,                -- Creation timestamp
    exported_at TIMESTAMP,                        -- Export timestamp
    used_for_training BOOLEAN DEFAULT FALSE,      -- Training usage flag
    comments TEXT,                                -- Optional context
    
    FOREIGN KEY (thermal_image_id) REFERENCES thermal_images(id) ON DELETE CASCADE,
    FOREIGN KEY (annotation_id) REFERENCES annotations(id) ON DELETE SET NULL,
    INDEX idx_thermal_image (thermal_image_id),
    INDEX idx_annotation (annotation_id),
    INDEX idx_feedback_type (feedback_type),
    INDEX idx_used_for_training (used_for_training),
    INDEX idx_created_at (created_at)
);
```

### Relationships

```
thermal_images (1) ──────< (N) annotations
                   └──────< (N) feedback_logs
                   
annotations (1) ──────< (N) feedback_logs
                       (via annotation_id, nullable)
```

**Cascade Behavior**:
- Deleting a thermal_image → Cascades to both annotations and feedback_logs
- Deleting an annotation → Sets feedback_logs.annotation_id to NULL (preserves feedback log)
- This prevents data loss in feedback logs while maintaining referential integrity

---

## ⚠️ Known Bugs and Limitations

### Current Limitations

#### 1. **Version History Not Implemented**
- **Description**: Saving previous versions of annotated images and switching between them is explicitly out of scope for Phase 3
- **Impact**: Users cannot view historical annotation states or revert to previous versions
- **Workaround**: Export feedback logs regularly to maintain external audit trail
- **Future Enhancement**: Could implement versioning system with snapshot storage

#### 2. **Single User Context**
- **Description**: User authentication system not fully implemented; uses default "system" or hardcoded user IDs
- **Impact**: All annotations attributed to generic user accounts
- **Workaround**: Manual user ID injection via headers (X-User-Id)
- **Future Enhancement**: Integrate with proper authentication/authorization system (JWT, OAuth, etc.)

#### 3. **Polygon Annotation Architecture-Ready but Not Implemented**
- **Description**: System architecture supports polygonal regions, but UI only implements rectangular bounding boxes
- **Impact**: Cannot annotate irregular-shaped anomalies precisely
- **Workaround**: Use rectangular boxes with comments describing actual shape
- **Future Enhancement**: Add polygon drawing tool with point-by-point creation

#### 4. **Canvas Performance with Large Images**
- **Description**: Canvas re-rendering can be slow with very large thermal images (>4000x4000px) or many detections (>100 boxes)
- **Impact**: Slight lag when interacting with heavily annotated images
- **Workaround**: Use zoom to focus on specific regions; consider image compression before upload
- **Future Enhancement**: Implement canvas virtualization or WebGL rendering

#### 5. **Mobile/Touch Support Limited**
- **Description**: Interactive annotation tools designed primarily for mouse/trackpad interaction
- **Impact**: Touch gestures on tablets/mobile devices may not work intuitively
- **Workaround**: Use desktop browsers for annotation tasks
- **Future Enhancement**: Add touch event handlers for mobile devices

#### 6. **Soft Delete Accumulation**
- **Description**: Soft-deleted annotations remain in database indefinitely
- **Impact**: Potential database bloat over time
- **Workaround**: Periodic cleanup queries to remove old soft-deleted records
- **Future Enhancement**: Implement automated archival/purge process with retention policies

#### 7. **No Undo/Redo Functionality**
- **Description**: Cannot undo individual annotation changes after saving
- **Impact**: Must manually revert incorrect edits
- **Workaround**: Cancel edit mode to discard all unsaved changes
- **Future Enhancement**: Implement command pattern with undo/redo stack

#### 8. **Concurrent Editing Conflicts**
- **Description**: No real-time conflict resolution if multiple users edit same image simultaneously
- **Impact**: Last save wins, potentially overwriting other user's changes
- **Workaround**: Coordinate annotation tasks among team members
- **Future Enhancement**: Implement optimistic locking or real-time collaboration with WebSockets

#### 9. **Export Size Limitations**
- **Description**: Large exports (thousands of feedback logs) may timeout or consume excessive memory
- **Impact**: Cannot export entire dataset in single operation for very large systems
- **Workaround**: Use filters to export in batches (by date range, transformer, etc.)
- **Future Enhancement**: Implement paginated export with streaming or async processing

### Known Minor Issues

1. **Zoom Reset After Edit**: Zoom level resets to 1.0 when exiting edit mode
   - **Impact**: User must re-zoom after saving changes
   - **Status**: Cosmetic issue, low priority

2. **Label Overflow**: Long detection class names may overflow label background
   - **Impact**: Visual only, doesn't affect functionality
   - **Status**: Minor CSS fix needed

3. **CSV Special Characters**: Some special characters in comments field may break CSV parsing in certain spreadsheet apps
   - **Impact**: Comments may display incorrectly in some tools
   - **Status**: Improved escaping needed

4. **Timestamp Timezone**: All timestamps stored in UTC, may need client-side conversion for local display
   - **Impact**: Confusion about actual local time
   - **Status**: Frontend timezone conversion pending

---

## 🚀 Future Enhancements

### Short-term Improvements

1. **Bulk Annotation Operations**
   - Select multiple boxes at once
   - Batch delete, batch class change
   - Copy/paste boxes between images

2. **Annotation Templates**
   - Save common annotation patterns
   - Quick-apply to new images
   - Template library management

3. **Keyboard Shortcuts**
   - Arrow keys for precise box movement
   - Delete key for quick removal
   - Hotkeys for class assignment (F for Faulty, N for Normal, etc.)

4. **Enhanced Feedback**
   - Toast notifications for all operations
   - Progress bars for sync operations
   - Validation error messages with specific guidance

5. **Search and Filter**
   - Filter annotations by type, class, confidence
   - Search by comments
   - Date range filtering

### Medium-term Enhancements

1. **Annotation Analytics Dashboard**
   - Charts showing detection accuracy over time
   - Inspector performance metrics
   - Anomaly trend analysis

2. **Automated Suggestions**
   - AI-powered annotation refinement suggestions
   - Confidence-based highlighting of uncertain detections
   - Similar anomaly detection across images

3. **Collaborative Features**
   - Real-time multi-user editing
   - Annotation comments and discussions
   - Approval workflow for annotations

4. **Advanced Export Options**
   - COCO format for model training
   - YOLO format annotations
   - Custom export templates
   - Scheduled automatic exports

5. **Audit Log Enhancements**
   - Detailed change history per annotation
   - User activity tracking
   - Compliance reporting

### Long-term Vision

1. **Integrated Training Pipeline**
   - One-click model retraining from feedback logs
   - A/B testing of model versions
   - Automated accuracy monitoring

2. **Mobile App**
   - Native iOS/Android apps
   - Offline annotation capability
   - Sync when back online

3. **Advanced AI Features**
   - Active learning: AI suggests which images need annotation
   - Anomaly prediction confidence scores
   - Temporal anomaly tracking (hotspot evolution)

4. **Integration Ecosystem**
   - Third-party ML platform integrations (TensorFlow, PyTorch, etc.)
   - SCADA system integration
   - GIS mapping for transformer locations

---

## 📊 Testing Recommendations

### Unit Testing

**Backend**:
- Service layer methods (AnnotationService, FeedbackLogService)
- Coordinate transformation logic
- JSON serialization/deserialization
- Repository custom queries

**Frontend**:
- Coordinate conversion functions
- Box collision detection
- API service methods
- State management logic

### Integration Testing

- End-to-end annotation workflow (create → edit → delete → sync)
- Feedback log generation from annotation changes
- Export functionality (JSON/CSV)
- Database cascade behavior

### User Acceptance Testing

- Annotation accuracy with various image sizes
- Edit mode responsiveness
- Export file integrity
- Cross-browser compatibility (Chrome, Firefox, Safari, Edge)

---

## 📝 Summary

Phase 3 successfully implements a comprehensive interactive annotation system with robust feedback integration capabilities. The implementation provides:

✅ **FR3.1**: Fully functional interactive annotation tools with resize, reposition, delete, and add capabilities

✅ **FR3.2**: Complete metadata persistence with automatic reload and comprehensive tracking (user, timestamp, comments)

✅ **FR3.3**: Feedback log system with automatic generation, JSON/CSV export, and model improvement workflow support

The system is production-ready with known limitations documented and future enhancement paths identified. The architecture is modular, maintainable, and extensible for future improvements.

---

## 📚 Additional Resources

- [Main README](README.md) - Complete project documentation
- [API Documentation](backend/README.md) - Backend API details
- [Database Schema](docs/database-schema.md) - Detailed database structure
- Feedback Log Samples: See `/Feedback/` directory for example exports

---

**Last Updated**: October 22, 2025  
**Phase**: 3  
