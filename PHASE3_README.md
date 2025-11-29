# Phase 3 - Interactive Annotation & Feedback

## Overview

Phase 3 extends the anomaly detection system with a complete interactive annotation framework. Engineers can validate, modify, and add annotations to thermal images, with all changes tracked for model retraining feedback.

---

## Scope & Features Implemented

### FR3.1: Interactive Annotation Editor 

#### Implemented Features:

1. **Annotation Management System**
   - ✅ Edit existing bounding boxes (move, resize, delete)
   - ✅ Add new annotations manually
   - ✅ View annotation metadata
   - ✅ Color-coded by class (faulty/potentially_faulty/normal)
   - ✅ Persistent storage with versioning
   - ✅ Soft-delete mechanism (not permanently removed)

2. **Bounding Box Editing Operations**

   **Move/Drag Annotation**
   ```
   1. User clicks inside bounding box
   2. System detects drag start (mouse down)
   3. Calculate offset from click point
   4. Track mouse movement (mouse move)
   5. Update box center coordinates in real-time
   6. Mouse up saves new position
   7. Position persisted to database
   
   Implementation:
   - Canvas coordinates → image coordinates (scaled)
   - Boundary checking (prevent moving outside image)
   - Smooth dragging with visual feedback
   - Real-time coordinate display
   ```

   **Resize Annotation**
   ```
   Corner handles for resizing (8 directions):
   
   NW  ╔═════╗  NE
       ║     ║
   W   ║ BOX ║  E
       ║     ║
   SW  ╚═════╝  SE
   
   User actions:
   1. Hover over handle → cursor changes (resize cursor)
   2. Drag handle → dimension changes
   3. Opposite corner stays fixed (anchor point)
   4. Minimum size enforced (20×20 px)
   5. Maximum size = image dimensions
   6. Real-time preview
   7. Mouse up saves new dimensions
   ```

   **Delete Annotation**
   ```
   Delete operation:
   1. User clicks delete button on annotation card
   2. System sets isDeleted = true (soft delete)
   3. Box hidden from view immediately
   4. Database record preserved
   5. Annotation type changed to "user_deleted"
   6. Timestamp recorded
   7. Can be recovered/undone (future enhancement)
   ```

3. **Add New Annotations**
   ```
   Workflow:
   
   1. User selects "Add Annotation" button
   2. Mode switches to "draw new box"
   3. User clicks two points on image:
      - First click: top-left corner
      - Drag: width and height shown in real-time
      - Second click: bottom-right corner
   4. Dialog appears to select:
      - Class (faulty / potentially_faulty / normal)
      - Confidence (0-100%)
      - Comments
   5. System creates Annotation record with:
      - annotationType: "user_added"
      - createdBy: engineer username
      - createdAt: current timestamp
   6. Persisted to database immediately
   7. Displayed on canvas with other annotations
   ```

4. **Annotation Metadata**
   ```typescript
   interface Annotation {
     id: UUID;
     thermalImageId: UUID;
     detectionId: string;           // Maps to Detection
     
     // Spatial data
     classType: string;              // "faulty" | "potentially_faulty" | "normal"
     confidence: number;             // 0-1
     x: number;                      // Center X (pixels)
     y: number;                      // Center Y (pixels)
     width: number;                  // Box width (pixels)
     height: number;                 // Box height (pixels)
     
     // Annotation tracking
     annotationType: string;         // "ai_detected" | "user_added" | "user_edited" | "user_deleted"
     comments: string;               // User notes
     
     // Audit trail
     createdBy: string;              // Username/system
     createdAt: Timestamp;           // ISO 8601
     modifiedBy: string;             // Who last modified
     modifiedAt: Timestamp;          // When last modified
     
     // Soft delete
     isDeleted: boolean;             // True if deleted by user
   }
   ```

5. **Annotation Lifecycle State Machine**
   ```
   [AI_DETECTED]
   (system-created)
       ↓
   [AI_DETECTED] ──edit──→ [USER_EDITED] ──edit──→ [USER_EDITED]
       ↓                       ↓
    [delete]              [delete]
       ↓                       ↓
   [USER_DELETED]      [USER_DELETED]
   (isDeleted=true)    (isDeleted=true)
   
   [NO_ANNOTATION]
       ↓
    [draw]
       ↓
   [USER_ADDED] ──edit──→ [USER_EDITED]
       ↓                       ↓
    [delete]              [delete]
       ↓                       ↓
   [USER_DELETED]      [USER_DELETED]
   ```

---

### FR3.2: Compliance Report Generation ✅

#### Implemented Features:

1. **Feedback Log System**
   - ✅ Track all annotation changes
   - ✅ Record user actions (add/edit/delete)
   - ✅ Timestamp every modification
   - ✅ Store original vs final values

2. **Feedback Data Structure**
   ```typescript
   interface AnnotationFeedback {
     id: UUID;
     annotationId: UUID;
     thermalImageId: UUID;
     
     // Action tracking
     actionType: string;            // "CREATED" | "MODIFIED" | "DELETED"
     fieldChanged: string;          // "coordinates" | "class" | "confidence" | "comments"
     
     // Before & After values
     previousValue: any;
     currentValue: any;
     
     // Context
     performedBy: string;           // Engineer username
     performedAt: Timestamp;        // When
     
     // Phase 4 integration
     linkedMaintenanceRecord: UUID; // Reference to maintenance record
   }
   ```

### FR3.3: Annotation Feedback for Model Improvement ✅

#### Implemented Features:

1. **Feedback Collection**
   - ✅ All user modifications tracked
   - ✅ Timestamps for every change
   - ✅ User attribution for audit trail
   - ✅ Comments/reasoning stored
   - ✅ Confidence adjustments logged
   - ✅ New annotations recorded

2. **Feedback Export for Retraining**
   ```
   Feedback → Model Retraining Pipeline
   
   System:
   1. Collect feedback from annotations
   2. Export in Roboflow-compatible format
   3. Prepare dataset with:
      - Original images
      - AI predictions
      - User corrections
      - New annotations
   4. Upload to Roboflow
   5. Trigger model retraining
   6. Deploy updated model
   
   Export Format (COCO JSON):
   {
     "images": [
       {
         "id": 1,
         "file_name": "thermal_001.jpg",
         "height": 480,
         "width": 640,
         "date_captured": "2025-10-15T14:15:00Z"
       }
     ],
     "annotations": [
       {
         "id": 1,
         "image_id": 1,
         "category_id": 1,
         "bbox": [100, 150, 45, 52],
         "area": 2340,
         "is_crowd": 0,
         "segmentation": [],
         "feedback": {
           "original_confidence": 0.95,
           "verified_confidence": 0.97,
           "user_correction": true,
           "comment": "Hotspot verified"
         }
       }
     ],
     "categories": [
       { "id": 1, "name": "faulty" },
       { "id": 2, "name": "potentially_faulty" },
       { "id": 3, "name": "normal" }
     ]
   }
   ```

3. **Model Retraining Integration**
   - ✅ Feedback collected automatically
   - ✅ Export to Roboflow format
   - ✅ Trigger retraining workflow
   - ✅ Track model version updates
   - ✅ Monitor accuracy improvements
   - ✅ Rollback capability for bad models

4. **Feedback Statistics**
   ```typescript
   interface FeedbackStats {
     totalAnnotations: number;
     aiDetected: number;
     userAdded: number;
     userModified: number;
     userDeleted: number;
     
     confidenceAdjustments: {
       increased: number;
       decreased: number;
       avgChange: number;
     };
     
     correctionRate: number;          // % of AI annotations that were modified
     falsePositiveRate: number;       // % of AI detections that were deleted
     missingDetectionRate: number;    // % of images needing manual annotations
     
     qualityScore: number;            // 0-100 based on above metrics
   }
   ```

---

## Technical Implementation

### Backend Architecture

#### 1. **Annotation Entity & Repository**

**Annotation.java** (`backend/src/main/java/.../model/Annotation.java`)

**AnnotationRepository.java**

#### 2. **Annotation Service**

**AnnotationService.java** (`backend/src/main/java/.../service/AnnotationService.java`)

**AnnotationFeedback.java** (for compliance tracking)

#### 3. **Compliance Report Service**

**ComplianceReportService.java**

#### 4. **Feedback Collection for Model Retraining**

**ModelFeedbackService.java**

### Frontend Architecture

#### 1. **Annotation Component Hierarchy**

```
ThermalImageCanvas
├── Canvas Element (Drawing Layer)
├── Controls Section
│   ├── Zoom In/Out
│   ├── Pan Controls
│   ├── Reset Button
│   └── Draw New Button (Mode Toggle)
├── Annotation List (Right Panel)
│   └── Annotation Cards (for each detection)
│       ├── Selection Indicator
│       ├── Class Badge
│       ├── Confidence Display
│       ├── Coordinates
│       ├── Edit Controls
│       └── Delete Button
└── Annotation Editor Dialog
    ├── Class Selector
    ├── Confidence Input
    ├── Comments Input
    ├── Save Button
    └── Cancel Button
```

#### 2. **Enhanced ThermalImageCanvas**

**Canvas Drawing & Interaction** 
#### 3. **Annotation Editor Dialog**

**AnnotationDialog Component**:

## Database Schema Updates

### New Tables for Phase 3

```sql
CREATE TABLE annotations (
    id UUID PRIMARY KEY,
    thermal_image_id UUID NOT NULL,          -- Image ID
    transformer_id UUID,                     -- Transformer ID (FR3.2)
    detection_id VARCHAR(255) NOT NULL,
    annotation_type VARCHAR(50) NOT NULL,    -- Action taken
    detection_class VARCHAR(100) NOT NULL,
    confidence DOUBLE NOT NULL,
    x DOUBLE NOT NULL,
    y DOUBLE NOT NULL,
    width DOUBLE NOT NULL,
    height DOUBLE NOT NULL,
    comments TEXT,
    created_by VARCHAR(255) NOT NULL,        -- User ID
    created_at TIMESTAMP NOT NULL,           -- Timestamp
    modified_by VARCHAR(255),                -- User ID
    modified_at TIMESTAMP,                   -- Timestamp
    is_deleted BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (thermal_image_id) REFERENCES thermal_images(id)
);
```

---

## API Endpoints

### Annotations

```http
# Get all annotations for a thermal image
GET /api/annotations/thermal-image/{thermalImageId}

Response: 200 OK
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "thermalImageId": "550e8400-e29b-41d4-a716-446655440002",
    "detectionId": "det_001",
    "classType": "faulty",
    "confidence": 0.95,
    "x": 156,
    "y": 203,
    "width": 45,
    "height": 52,
    "annotationType": "ai_detected",
    "comments": null,
    "createdBy": "ai_system",
    "createdAt": "2025-10-15T10:30:00Z",
    "modifiedBy": "ai_system",
    "modifiedAt": "2025-10-15T10:30:00Z",
    "isDeleted": false
  }
]
```

```http
# Create new annotation
POST /api/annotations
Content-Type: application/json

{
  "thermalImageId": "550e8400-e29b-41d4-a716-446655440002",
  "classType": "faulty",
  "confidence": 0.95,
  "x": 156,
  "y": 203,
  "width": 45,
  "height": 52,
  "comments": "Manual inspection found defect"
}

Response: 201 Created
{
  "id": "550e8400-e29b-41d4-a716-446655440001",
  "thermalImageId": "550e8400-e29b-41d4-a716-446655440002",
  "classType": "faulty",
  ...
}
```

```http
# Update annotation
PUT /api/annotations/{annotationId}
Content-Type: application/json

{
  "classType": "potentially_faulty",
  "confidence": 0.85,
  "comments": "Adjusted after review"
}

Response: 200 OK
{ ... updated annotation ... }
```

```http
# Delete annotation
DELETE /api/annotations/{annotationId}

Response: 204 No Content
```

### Compliance Reports

```http
# Generate report
GET /api/compliance-reports/thermal-image/{thermalImageId}

Response: 200 OK
{
  "reportId": "RPT-1729006200000",
  "generatedAt": "2025-10-15T14:30:00Z",
  "totalAnnotations": 5,
  "aiDetected": 4,
  "userAdded": 1,
  "userModified": 2,
  "userDeleted": 0,
  "criticalCount": 2,
  "highCount": 2,
  "lowCount": 1,
  "qualityScore": 95.5
}
```

```http
# Export report as PDF
GET /api/compliance-reports/{reportId}/export?format=pdf

Response: 200 OK (PDF binary)
Content-Type: application/pdf
```

### Model Feedback

```http
# Get feedback statistics
GET /api/model-feedback/statistics?startDate=2025-10-01&endDate=2025-10-31

Response: 200 OK
{
  "totalAnnotations": 150,
  "aiDetected": 120,
  "userAdded": 20,
  "userModified": 35,
  "userDeleted": 5,
  "correctionRate": 0.292,
  "falsePositiveRate": 0.042,
  "qualityScore": 92.3
}
```

```http
# Export feedback for retraining
GET /api/model-feedback/export?format=coco&startDate=2025-10-01&endDate=2025-10-31

Response: 200 OK
Content-Type: application/json
{ COCO dataset JSON ... }
```

---

## Known Limitations & Future Enhancements

### Current Limitations
1. **Canvas Size**: Fixed 640×480 resolution
2. **Batch Operations**: Can't edit multiple annotations at once
3. **Undo/Redo**: Not implemented
4. **Comments Length**: Limited to 1000 characters
5. **Resolution**: Doesn't handle high-res images well
---
