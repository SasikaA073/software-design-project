# Phase 4 - Maintenance Record Sheet Generation

Team : Jewel001
Project Link : https://github.com/SasikaA073/software-design-project
Members : 
- 210035A
- 210041M 
- 210234H
- 210732H

## Overview

Phase 4 implements a comprehensive maintenance record management system that automatically generates thermal inspection reports. Engineers can auto-fill forms from inspection data, edit technical parameters, save versioned records, and generate print-ready documentation.
---

## Scope & Features Implemented

### FR4.1: Automatic Form Auto-Fill ✅

#### Implemented Features:

1. **Auto-Population from Inspection Data**
   - ✅ Inspector name pre-filled from inspection record
   - ✅ Transformer metadata loaded from transformer entity
   - ✅ Baseline image from transformer (selected by weather condition)
   - ✅ Maintenance image from thermal image upload
   - ✅ Anomaly list from annotation data
   - ✅ Inspection timestamp auto-populated
   - ✅ Maintenance date suggestion (can be adjusted)

2. **Form Field Population Workflow**
   ```
   User selects an Inspection
        ↓
   System queries Inspection entity:
   - inspectorName (from engineer field)
   - inspectiedDate (inspection timestamp)
   - anomalyDetected (boolean flag)
   - thermalImages (all images for this inspection)
        ↓
   System queries Transformer entity:
   - transformerNumber
   - poleNumber
   - region
   - capacity
   - baselineImages (3 conditions)
        ↓
   System queries Annotations:
   - All detections for maintenance image
   - Filter non-deleted only
        ↓
   Form renders with pre-filled data:
   ┌──────────────────────────────────┐
   │ Maintenance Record Sheet          │
   ├──────────────────────────────────┤
   │ Inspector: John Engineer ✓        │
   │ Transformer: T-001 ✓              │
   │ Pole: 42 ✓                        │
   │ Region: North ✓                   │
   │ Capacity: 50 MVA ✓                │
   │ Inspection Date: Oct 15, 2025 ✓   │
   │ Maintenance Date: [editable] ✓    │
   ├──────────────────────────────────┤
   │ Technical Parameters:             │
   │ Voltage: [___] (empty, editable)  │
   │ Current: [___] (empty, editable)  │
   │ Frequency: [___] (empty, editable)│
   │ Load %: [___] (empty, editable)   │
   ├──────────────────────────────────┤
   │ Images:                           │
   │ Baseline: [Image] ✓               │
   │ Maintenance: [Image] ✓            │
   ├──────────────────────────────────┤
   │ Anomalies Detected: 2             │
   │ • Faulty (95%) X=156, Y=203       │
   │ • Potentially Faulty (78%)        │
   └──────────────────────────────────┘
   ```

3. **Data Source Mapping**
   ```typescript
   interface FormAutoFillData {
     // From Inspection entity
     inspectorName: string;           // inspection.inspector_name
     inspectionDate: Date;            // inspection.inspected_date
     maintenanceDate?: Date;          // Default: today or inspection.maintenance_date
     anomalyDetected: boolean;        // thermal_images.anomaly_detected
     
     // From Transformer entity
     transformerNumber: string;       // transformer.transformer_number
     poleNumber: string;              // transformer.pole_number
     region: string;                  // transformer.region
     capacity: number;                // transformer.capacity
     type: string;                    // transformer.type
     
     // From Images
     baselineImageUrl?: string;       // transformer.baseline_images[weather]
     maintenanceImageUrl?: string;    // thermal_image.image_url
     weatherCondition?: string;       // thermal_image.weather_condition
     
     // From Annotations
     annotations: Annotation[];       // All active annotations
     anomalyCount: number;            // Count of non-deleted annotations
   }
   ```

4. **Baseline Image Selection by Weather**
   ```
   User selects weather condition for comparison:
   
   Weather Condition Selection:
   ┌─────────────────────────────┐
   │ Select Baseline Image:      │
   ├─────────────────────────────┤
   │ ○ Sunny   (Clear conditions)│
   │ ○ Cloudy  (Overcast)        │
   │ ⦿ Rainy   (Wet conditions)  │
   │           (current selection)│
   └─────────────────────────────┘
   
   Action flow:
   1. User selects weather condition
   2. System queries baseline_images WHERE weather = selected
   3. Image loads and displays
   4. Side-by-side comparison updates
   5. Selection persisted in form state
   ```

5. **Real-time Form Validation**
   - ✅ Required fields marked with asterisk
   - ✅ Date format validation
   - ✅ Numeric field validation (voltage, current, frequency, load %)
   - ✅ Range validation (load 0-100%, frequency 50-60 Hz)
   - ✅ Error messages shown inline
   - ✅ Save button disabled if errors exist

---

### FR4.2: Engineer Input Fields & Editing ✅

#### Implemented Features:

1. **Editable Technical Fields**
   ```typescript
   interface MaintenanceRecordEditableFields {
     // Required fields
     inspectorName: string;           // Inspector who performed inspection
     transformerStatus: string;       // "operational" | "faulty" | "requires_repair"
     
     // Electrical measurements
     voltage: number;                 // Volts (optional)
     current: number;                 // Amperes (optional)
     frequency: number;               // Hz (optional)
     loadPercentage: number;          // 0-100% (optional)
     
     // Notes and recommendations
     notes: string;                   // Technical observations
     comments: string;                // Additional comments
     recommendedAction: string;       // "no_action" | "monitor" | "repair" | "replace"
     
     // Maintenance date
     maintenanceDate: Date;           // When maintenance should occur
   }
   ```

2. **Form Field Components**
   ```
   ┌─────────────────────────────────────────────────┐
   │ MAINTENANCE RECORD FORM                         │
   ├─────────────────────────────────────────────────┤
   │                                                 │
   │ BASIC INFORMATION                               │
   ├─────────────────────────────────────────────────┤
   │ Inspector Name: [John Engineer________] *       │
   │ Transformer: [T-001______________] *            │
   │ Pole Number: [42___] Region: [North_______]   │
   │ Inspection Date: [Oct 15, 2025___________] *   │
   │ Maintenance Date: [Nov 15, 2025_________] *    │
   │                                                 │
   │ TECHNICAL PARAMETERS                            │
   ├─────────────────────────────────────────────────┤
   │ Voltage (V): [___11000_______] (optional)       │
   │ Current (A): [___250_______] (optional)         │
   │ Frequency (Hz): [___50_______] (optional)       │
   │ Load (%): [___85_______] 0-100% (optional)      │
   │                                                 │
   │ TRANSFORMER STATUS                              │
   ├─────────────────────────────────────────────────┤
   │ Status: [▼ Operational________] *               │
   │   ○ Operational (No issues)                      │
   │   ○ Faulty (Immediate action needed)             │
   │   ○ Requires Repair (Plan maintenance)           │
   │                                                 │
   │ OBSERVATIONS & RECOMMENDATIONS                  │
   ├─────────────────────────────────────────────────┤
   │ Technical Notes:                                │
   │ [_________________________________           │
   │  _________________________________           │
   │  _________________________________] *        │
   │                                                 │
   │ Additional Comments:                            │
   │ [_________________________________           │
   │  _________________________________           │
   │  _________________________________] (optional) │
   │                                                 │
   │ Recommended Action:                             │
   │ [▼ Monitor______________________] *             │
   │   ○ No Action Required (OK as-is)               │
   │   ○ Monitor (Regular checks)                    │
   │   ○ Schedule Repair                             │
   │   ○ Schedule Replacement                        │
   │                                                 │
   │ [Save] [Preview] [Print] [Cancel]              │
   └─────────────────────────────────────────────────┘
   ```

3. **Field-Specific Editing Features**

   **Voltage Input**
   ```typescript
   <InputField
     label="Voltage (V)"
     type="number"
     value={formData.voltage}
     onChange={(v) => setFormData({...formData, voltage: v})}
     placeholder="Enter voltage in volts"
     min={0}
     max={765000}
     step={1000}
   />
   ```

   **Load Percentage Slider**
   ```typescript
   <Slider
     label="Load (%)"
     value={formData.loadPercentage}
     onChange={(v) => setFormData({...formData, loadPercentage: v})}
     min={0}
     max={100}
     step={1}
   />
   ```

   **Status Selection**
   ```typescript
   <Select
     value={formData.transformerStatus}
     onValueChange={(v) => setFormData({...formData, transformerStatus: v})}
   >
     <option value="operational">Operational</option>
     <option value="faulty">Faulty</option>
     <option value="requires_repair">Requires Repair</option>
   </Select>
   ```

   **Text Area for Notes**
   ```typescript
   <TextArea
     label="Technical Notes"
     value={formData.notes}
     onChange={(v) => setFormData({...formData, notes: v})}
     placeholder="Enter technical observations..."
     maxLength={2000}
     rows={6}
   />
   ```

4. **Form State Management**
   - ✅ Real-time validation as user types
   - ✅ Dirty field tracking (which fields changed)
   - ✅ Unsaved changes warning before navigation
   - ✅ Clear field button for each input
   - ✅ Reset form to auto-filled values
   - ✅ Draft auto-save every 30 seconds

---

### FR4.3: Save & Retrieve Records with Versioning ✅

#### Implemented Features:

1. **Record Versioning System**
   ```typescript
   interface MaintenanceRecord {
     // Identity
     id: UUID;
     recordNumber: string;            // MR-2025-001
     
     // References
     transformerId: UUID;
     inspectionId: UUID;
     thermalImageId: UUID;
     
     // Inspection metadata
     inspectionTimestamp: OffsetDateTime;
     maintenanceDate: OffsetDateTime;
     
     // Engineer inputs
     inspectorName: string;
     voltage?: number;
     current?: number;
     frequency?: number;
     loadPercentage?: number;
     transformerStatus: string;
     notes: string;
     comments?: string;
     recommendedAction: string;
     
     // Versioning & audit
     versionNumber: number;           // 1, 2, 3, ... auto-incremented
     lastModifiedBy: string;
     lastModifiedAt: OffsetDateTime;
     
     // Thermal images
     baselineImageUrl?: string;
     maintenanceImageUrl: string;
     
     // Timestamps
     createdAt: OffsetDateTime;
     createdBy: string;
     updatedAt: OffsetDateTime;
   }
   ```

2. **Version History Tracking**
   ```
   Create Record (v1):
   ┌─────────────────────────────┐
   │ Created: 2025-10-15 14:30   │
   │ By: john.engineer           │
   │ Version: 1                  │
   │ Status: Final               │
   │ Voltage: 11000 V            │
   │ Current: 250 A              │
   │ Load: 85%                   │
   │ Status: Operational         │
   └─────────────────────────────┘
           ↓
   User Edits (v2):
   ┌─────────────────────────────┐
   │ Modified: 2025-10-15 15:45  │
   │ By: john.engineer           │
   │ Version: 2                  │
   │ Status: Final               │
   │ Voltage: 11000 V (unchanged)│
   │ Current: 275 A (CHANGED)    │
   │ Load: 87% (CHANGED)         │
   │ Status: Faulty (CHANGED)    │
   │ Reason: "Rechecked data"    │
   └─────────────────────────────┘
           ↓
   Management Review (v3):
   ┌─────────────────────────────┐
   │ Modified: 2025-10-16 09:00  │
   │ By: manager.supervisor      │
   │ Version: 3                  │
   │ Status: Approved            │
   │ Comment: "Action planned"   │
   └─────────────────────────────┘
   ```

3. **Save Operations**

   **Create New Record**
   ```typescript
   // Workflow
   1. User fills form with editable data
   2. Clicks "Save" button
   3. System validates all required fields
   4. If valid:
      a. Create MaintenanceRecord entity
      b. Set versionNumber = 1
      c. Set recordNumber auto-generated (e.g., "MR-2025-001")
      d. Save to database
      e. Show confirmation
      f. Navigate to record details view
   5. If invalid:
      a. Highlight error fields
      b. Show error messages
      c. Don't save
   ```

   **Update Existing Record**
   ```typescript
   // Workflow
   1. Open existing record
   2. Edit some fields
   3. Click "Save"
   4. System validates
   5. If valid:
      a. Create new version entry
      b. versionNumber += 1
      c. Copy all current data
      d. Update only changed fields
      e. Save to database
      f. Preserve version history
   6. Show "Record updated to v{N}"
   
   // Database operation
   UPDATE maintenance_records SET
     versionNumber = versionNumber + 1,
     voltage = ?,
     current = ?,
     loadPercentage = ?,
     transformerStatus = ?,
     lastModifiedBy = ?,
     lastModifiedAt = NOW()
   WHERE id = ?
   ```

4. **Record Retrieval**

   **Get Single Record**
   ```
   Endpoint: GET /api/maintenance-records/{recordId}
   
   Returns:
   {
     "id": "550e8400-e29b-41d4-a716-446655440001",
     "recordNumber": "MR-2025-001",
     "transformerId": "550e8400-e29b-41d4-a716-446655440010",
     "inspectionId": "550e8400-e29b-41d4-a716-446655440020",
     "inspectorName": "John Engineer",
     "voltage": 11000,
     "current": 250,
     "frequency": 50,
     "loadPercentage": 85,
     "transformerStatus": "operational",
     "notes": "All parameters normal",
     "recommendedAction": "monitor",
     "versionNumber": 2,
     "lastModifiedBy": "john.engineer",
     "lastModifiedAt": "2025-10-15T15:45:00Z",
     "createdAt": "2025-10-15T14:30:00Z",
     "createdBy": "john.engineer",
     "baselineImageUrl": "/uploads/baseline-sunny.jpg",
     "maintenanceImageUrl": "/uploads/maintenance-oct15.jpg"
   }
   ```

   **Get All Records for Transformer**
   ```
   Endpoint: GET /api/transformers/{transformerId}/maintenance-records
   
   Returns:
   [
     {
       "recordNumber": "MR-2025-001",
       "inspectionDate": "2025-10-15",
       "transformerStatus": "operational",
       "versionNumber": 2,
       "lastModifiedAt": "2025-10-15T15:45:00Z"
     },
     {
       "recordNumber": "MR-2025-002",
       "inspectionDate": "2025-09-20",
       "transformerStatus": "faulty",
       "versionNumber": 1,
       "lastModifiedAt": "2025-09-20T14:30:00Z"
     }
   ]
   ```

5. **Record History Viewer**
   ```
   Component: MaintenanceRecordHistory
   
   Display: Timeline of all versions
   ┌──────────────────────────────────────────┐
   │ Record: MR-2025-001                      │
   │ Current Version: 3                       │
   ├──────────────────────────────────────────┤
   │                                          │
   │ ▼ Version 3 (CURRENT)                    │
   │   Date: Oct 16, 2025 09:00 AM            │
   │   By: manager.supervisor                 │
   │   Changes: Status comment added          │
   │   [View] [Revert]                        │
   │                                          │
   │ ▼ Version 2                              │
   │   Date: Oct 15, 2025 03:45 PM            │
   │   By: john.engineer                      │
   │   Changes:                               │
   │   • Current: 250 A → 275 A               │
   │   • Load: 85% → 87%                      │
   │   • Status: Operational → Faulty         │
   │   [View] [Revert]                        │
   │                                          │
   │ ▼ Version 1 (ORIGINAL)                   │
   │   Date: Oct 15, 2025 02:30 PM            │
   │   By: john.engineer                      │
   │   Changes: Record created                │
   │   [View]                                 │
   │                                          │
   └──────────────────────────────────────────┘
   ```

---

## Technical Implementation

### Backend Architecture

#### 1. **MaintenanceRecord Entity**

**MaintenanceRecord.java** (`backend/src/main/java/.../model/MaintenanceRecord.java`)

#### 2. **MaintenanceRecordService**

**MaintenanceRecordService.java** (`backend/src/main/java/.../service/MaintenanceRecordService.java`)


#### 3. **MaintenanceRecordRepository**

**MaintenanceRecordRepository.java**

#### 4. **MaintenanceRecordController**

**MaintenanceRecordController.java**

### Frontend Architecture

#### 1. **Component Structure**

```
TransformerDashboard
├── InspectionList
│   └── [Inspection Row with "Create Record" button]
└── MaintenanceRecords
    ├── MaintenanceRecordsList (table view)
    │   └── MaintenanceRecordRow
    │       └── [Edit/View/Delete actions]
    └── MaintenanceRecordForm (modal or page)
        ├── BasicInfoSection (auto-filled)
        │   ├── InspectorNameField
        │   ├── TransformerSelect
        │   ├── InspectionDateDisplay
        │   └── MaintenanceDatePicker
        ├── ImageComparisonSection
        │   ├── BaselineImageViewer
        │   ├── MaintenanceImageViewer
        │   └── AnomalyList
        ├── TechnicalParametersSection
        │   ├── VoltageInput
        │   ├── CurrentInput
        │   ├── FrequencyInput
        │   └── LoadPercentageSlider
        ├── StatusSection
        │   ├── StatusSelect
        │   └── RecommendedActionSelect
        ├── NotesSection
        │   ├── NotesTextArea
        │   └── CommentsTextArea
        └── ActionButtons
            ├── SaveButton
            ├── PreviewButton
            ├── PrintButton
            └── CancelButton
```

#### 2. **MaintenanceRecordForm Component**

**maintenance-record-form.tsx** 


#### 3. **MaintenanceRecordDetails Component**

**maintenance-record-details.tsx**

## Database Schema

### MaintenanceRecord Table
```sql
CREATE TABLE maintenance_records (
  id CHAR(36) PRIMARY KEY,
  record_number VARCHAR(50) UNIQUE NOT NULL,
  transformer_id CHAR(36) NOT NULL,
  inspection_id CHAR(36) NOT NULL,
  thermal_image_id CHAR(36),
  
  inspection_timestamp TIMESTAMP NOT NULL,
  maintenance_date TIMESTAMP NOT NULL,
  
  inspector_name VARCHAR(255) NOT NULL,
  voltage DECIMAL(10, 2),
  current DECIMAL(10, 2),
  frequency DECIMAL(5, 2),
  load_percentage DECIMAL(5, 2),
  
  transformer_status VARCHAR(50) NOT NULL,
  notes TEXT NOT NULL,
  comments TEXT,
  recommended_action VARCHAR(50) NOT NULL,
  
  version_number INT DEFAULT 1,
  last_modified_by VARCHAR(255) NOT NULL,
  last_modified_at TIMESTAMP NOT NULL,
  
  baseline_image_url VARCHAR(500),
  maintenance_image_url VARCHAR(500) NOT NULL,
  
  created_at TIMESTAMP NOT NULL,
  created_by VARCHAR(255) NOT NULL,
  updated_at TIMESTAMP NOT NULL,
  
  FOREIGN KEY (transformer_id) REFERENCES transformers(id) ON DELETE CASCADE,
  FOREIGN KEY (inspection_id) REFERENCES inspections(id) ON DELETE CASCADE,
  FOREIGN KEY (thermal_image_id) REFERENCES thermal_images(id),
  
  INDEX idx_transformer (transformer_id),
  INDEX idx_inspection (inspection_id),
  INDEX idx_record_number (record_number),
  INDEX idx_created_at (created_at)
);
```

---

## API Endpoints

### Create Record
```http
POST /api/maintenance-records
Content-Type: application/json

{
  "inspectionId": "550e8400-e29b-41d4-a716-446655440020",
  "thermalImageId": "550e8400-e29b-41d4-a716-446655440030",
  "transformerId": "550e8400-e29b-41d4-a716-446655440010",
  "inspectorName": "John Engineer",
  "voltage": 11000,
  "current": 250,
  "frequency": 50,
  "loadPercentage": 85,
  "transformerStatus": "operational",
  "notes": "All parameters normal, no issues detected",
  "comments": "Ready for operation",
  "recommendedAction": "monitor",
  "maintenanceDate": "2025-11-15"
}

Response: 201 Created
{
  "id": "550e8400-e29b-41d4-a716-446655440001",
  "recordNumber": "MR-2025-001",
  "transformerId": "550e8400-e29b-41d4-a716-446655440010",
  "inspectionId": "550e8400-e29b-41d4-a716-446655440020",
  "thermalImageId": "550e8400-e29b-41d4-a716-446655440030",
  "inspectorName": "John Engineer",
  "voltage": 11000,
  "current": 250,
  "frequency": 50,
  "loadPercentage": 85,
  "transformerStatus": "operational",
  "notes": "All parameters normal, no issues detected",
  "comments": "Ready for operation",
  "recommendedAction": "monitor",
  "versionNumber": 1,
  "lastModifiedBy": "john.engineer",
  "lastModifiedAt": "2025-10-15T14:30:00Z",
  "maintenanceImageUrl": "/uploads/maintenance-oct15.jpg",
  "createdAt": "2025-10-15T14:30:00Z",
  "createdBy": "john.engineer",
  "updatedAt": "2025-10-15T14:30:00Z"
}
```

### Update Record
```http
PUT /api/maintenance-records/{recordId}
Content-Type: application/json

{
  "voltage": 11000,
  "current": 275,
  "loadPercentage": 87,
  "transformerStatus": "faulty",
  "notes": "Rechecked parameters, issues found"
}

Response: 200 OK
{
  ...record with versionNumber: 2
}
```

### Get Record
```http
GET /api/maintenance-records/{recordId}

Response: 200 OK
{ ... record ... }
```

### Get Transformer Records
```http
GET /api/maintenance-records/transformer/{transformerId}

Response: 200 OK
[ ... array of records ... ]
```

### Delete Record
```http
DELETE /api/maintenance-records/{recordId}

Response: 204 No Content
```

---


## Known Limitations & Future Enhancements

### Current Limitations
1. **No Drafts**: Records must be saved to persist
2. **No Undo**: Can't revert to previous version
3. **Single User**: No concurrent editing protection
4. **Fixed Fields**: Can't add custom parameters
5. **Static Print**: Print format not customizable
