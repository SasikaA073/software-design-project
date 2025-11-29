# Phase 4 - Maintenance Record Sheet Generation

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
```java
@Entity
@Table(name = "maintenance_records")
public class MaintenanceRecord {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @Column(unique = true, nullable = false)
    private String recordNumber;  // MR-2025-001
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "transformer_id", nullable = false)
    private Transformer transformer;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "inspection_id", nullable = false)
    private Inspection inspection;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "thermal_image_id")
    private ThermalImage thermalImage;
    
    // Timestamps from inspection
    @Column(nullable = false)
    private OffsetDateTime inspectionTimestamp;
    
    @Column(nullable = false)
    private OffsetDateTime maintenanceDate;
    
    // Engineer inputs
    @Column(nullable = false)
    private String inspectorName;
    
    @Column
    private Double voltage;  // Volts
    
    @Column
    private Double current;  // Amperes
    
    @Column
    private Double frequency;  // Hz
    
    @Column
    private Double loadPercentage;  // 0-100
    
    @Column(nullable = false)
    private String transformerStatus;  // operational, faulty, requires_repair
    
    @Column(columnDefinition = "TEXT", nullable = false)
    private String notes;
    
    @Column(columnDefinition = "TEXT")
    private String comments;
    
    @Column(nullable = false)
    private String recommendedAction;  // no_action, monitor, repair, replace
    
    // Versioning
    @Column(nullable = false)
    private Integer versionNumber = 1;
    
    @Column(nullable = false)
    private String lastModifiedBy;
    
    @Column(nullable = false)
    private OffsetDateTime lastModifiedAt;
    
    // Image references
    @Column
    private String baselineImageUrl;
    
    @Column(nullable = false)
    private String maintenanceImageUrl;
    
    // Audit trail
    @Column(nullable = false)
    private OffsetDateTime createdAt;
    
    @Column(nullable = false)
    private String createdBy;
    
    @Column(nullable = false)
    private OffsetDateTime updatedAt;
    
    // Constructors, getters, setters...
}
```

#### 2. **MaintenanceRecordService**

**MaintenanceRecordService.java** (`backend/src/main/java/.../service/MaintenanceRecordService.java`)
```java
@Service
public class MaintenanceRecordService {
    @Autowired
    private MaintenanceRecordRepository recordRepository;
    
    @Autowired
    private TransformerRepository transformerRepository;
    
    @Autowired
    private InspectionRepository inspectionRepository;
    
    @Autowired
    private ThermalImageRepository thermalImageRepository;
    
    // Create new record
    public MaintenanceRecordResponse createMaintenanceRecord(
            CreateMaintenanceRecordRequest request,
            String createdBy) {
        
        // Fetch entities
        Transformer transformer = transformerRepository
            .findById(request.transformerId())
            .orElseThrow(() -> new ResourceNotFoundException("Transformer not found"));
        
        Inspection inspection = inspectionRepository
            .findById(request.inspectionId())
            .orElseThrow(() -> new ResourceNotFoundException("Inspection not found"));
        
        ThermalImage thermalImage = thermalImageRepository
            .findById(request.thermalImageId())
            .orElseThrow(() -> new ResourceNotFoundException("Thermal image not found"));
        
        // Create record
        MaintenanceRecord record = new MaintenanceRecord();
        record.setRecordNumber(generateRecordNumber());
        record.setTransformer(transformer);
        record.setInspection(inspection);
        record.setThermalImage(thermalImage);
        
        // Auto-filled fields
        record.setInspectionTimestamp(inspection.getInspectedDate());
        record.setMaintenanceDate(
            request.maintenanceDate() != null 
                ? request.maintenanceDate() 
                : OffsetDateTime.now().plusMonths(1)
        );
        record.setInspectorName(request.inspectorName());
        record.setMaintenanceImageUrl(thermalImage.getImageUrl());
        
        // Engineer inputs
        record.setVoltage(request.voltage());
        record.setCurrent(request.current());
        record.setFrequency(request.frequency());
        record.setLoadPercentage(request.loadPercentage());
        record.setTransformerStatus(request.transformerStatus());
        record.setNotes(request.notes());
        record.setComments(request.comments());
        record.setRecommendedAction(request.recommendedAction());
        
        // Versioning
        record.setVersionNumber(1);
        record.setLastModifiedBy(createdBy);
        record.setLastModifiedAt(OffsetDateTime.now());
        
        // Audit
        record.setCreatedAt(OffsetDateTime.now());
        record.setCreatedBy(createdBy);
        record.setUpdatedAt(OffsetDateTime.now());
        
        MaintenanceRecord saved = recordRepository.save(record);
        return convertToResponse(saved);
    }
    
    // Update record (creates new version)
    public MaintenanceRecordResponse updateMaintenanceRecord(
            UUID recordId,
            UpdateMaintenanceRecordRequest request,
            String modifiedBy) {
        
        MaintenanceRecord record = recordRepository.findById(recordId)
            .orElseThrow(() -> new ResourceNotFoundException("Record not found"));
        
        // Update fields if provided
        if (request.voltage() != null) record.setVoltage(request.voltage());
        if (request.current() != null) record.setCurrent(request.current());
        if (request.frequency() != null) record.setFrequency(request.frequency());
        if (request.loadPercentage() != null) record.setLoadPercentage(request.loadPercentage());
        if (request.transformerStatus() != null) record.setTransformerStatus(request.transformerStatus());
        if (request.notes() != null) record.setNotes(request.notes());
        if (request.comments() != null) record.setComments(request.comments());
        if (request.recommendedAction() != null) record.setRecommendedAction(request.recommendedAction());
        if (request.maintenanceDate() != null) record.setMaintenanceDate(request.maintenanceDate());
        if (request.inspectorName() != null) record.setInspectorName(request.inspectorName());
        
        // Increment version
        record.setVersionNumber(record.getVersionNumber() + 1);
        record.setLastModifiedBy(modifiedBy);
        record.setLastModifiedAt(OffsetDateTime.now());
        record.setUpdatedAt(OffsetDateTime.now());
        
        MaintenanceRecord updated = recordRepository.save(record);
        return convertToResponse(updated);
    }
    
    // Get record by ID
    public MaintenanceRecordResponse getMaintenanceRecordById(UUID recordId) {
        MaintenanceRecord record = recordRepository.findById(recordId)
            .orElseThrow(() -> new ResourceNotFoundException("Record not found"));
        return convertToResponse(record);
    }
    
    // Get all records
    public List<MaintenanceRecordResponse> getAllMaintenanceRecords() {
        return recordRepository.findAll().stream()
            .map(this::convertToResponse)
            .collect(Collectors.toList());
    }
    
    // Get records by transformer
    public List<MaintenanceRecordResponse> getTransformerMaintenanceRecords(UUID transformerId) {
        return recordRepository.findByTransformer_IdOrderByCreatedAtDesc(transformerId).stream()
            .map(this::convertToResponse)
            .collect(Collectors.toList());
    }
    
    // Get record history (all versions)
    public List<MaintenanceRecordResponse> getTransformerRecordHistory(UUID transformerId) {
        return recordRepository.findByTransformer_IdOrderByCreatedAtDesc(transformerId).stream()
            .map(this::convertToResponse)
            .collect(Collectors.toList());
    }
    
    // Delete record
    public void deleteMaintenanceRecord(UUID recordId) {
        if (!recordRepository.existsById(recordId)) {
            throw new ResourceNotFoundException("Record not found");
        }
        recordRepository.deleteById(recordId);
    }
    
    // Helper methods
    private String generateRecordNumber() {
        int count = (int) recordRepository.count() + 1;
        int year = LocalDate.now().getYear();
        return String.format("MR-%d-%03d", year, count);
    }
    
    private MaintenanceRecordResponse convertToResponse(MaintenanceRecord record) {
        return new MaintenanceRecordResponse(
            record.getId(),
            record.getRecordNumber(),
            record.getTransformer().getId(),
            record.getInspection().getId(),
            record.getThermalImage().getId(),
            record.getInspectionTimestamp(),
            record.getMaintenanceDate(),
            record.getInspectorName(),
            record.getVoltage(),
            record.getCurrent(),
            record.getFrequency(),
            record.getLoadPercentage(),
            record.getTransformerStatus(),
            record.getNotes(),
            record.getComments(),
            record.getRecommendedAction(),
            record.getVersionNumber(),
            record.getLastModifiedBy(),
            record.getLastModifiedAt(),
            record.getBaselineImageUrl(),
            record.getMaintenanceImageUrl(),
            record.getCreatedAt(),
            record.getCreatedBy(),
            record.getUpdatedAt()
        );
    }
}
```

#### 3. **MaintenanceRecordRepository**

**MaintenanceRecordRepository.java**
```java
@Repository
public interface MaintenanceRecordRepository extends JpaRepository<MaintenanceRecord, UUID> {
    
    // Find by transformer
    List<MaintenanceRecord> findByTransformer_Id(UUID transformerId);
    
    // Find with ordering
    List<MaintenanceRecord> findByTransformer_IdOrderByCreatedAtDesc(UUID transformerId);
    
    // Find by inspection
    Optional<MaintenanceRecord> findByInspection_Id(UUID inspectionId);
    
    // Find by record number
    Optional<MaintenanceRecord> findByRecordNumber(String recordNumber);
    
    // Find records for a transformer and inspection
    Optional<MaintenanceRecord> findByTransformer_IdAndInspection_Id(
        UUID transformerId, UUID inspectionId);
    
    // Check if record exists for inspection
    boolean existsByInspection_Id(UUID inspectionId);
}
```

#### 4. **MaintenanceRecordController**

**MaintenanceRecordController.java**
```java
@RestController
@RequestMapping("/api/maintenance-records")
public class MaintenanceRecordController {
    @Autowired
    private MaintenanceRecordService maintenanceRecordService;
    
    @PostMapping
    public ResponseEntity<MaintenanceRecordResponse> createRecord(
            @RequestBody CreateMaintenanceRecordRequest request,
            @AuthenticationPrincipal UserDetails user) {
        
        MaintenanceRecordResponse response = maintenanceRecordService
            .createMaintenanceRecord(request, user.getUsername());
        
        return ResponseEntity
            .status(HttpStatus.CREATED)
            .body(response);
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<MaintenanceRecordResponse> updateRecord(
            @PathVariable UUID id,
            @RequestBody UpdateMaintenanceRecordRequest request,
            @AuthenticationPrincipal UserDetails user) {
        
        MaintenanceRecordResponse response = maintenanceRecordService
            .updateMaintenanceRecord(id, request, user.getUsername());
        
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<MaintenanceRecordResponse> getRecord(@PathVariable UUID id) {
        MaintenanceRecordResponse response = maintenanceRecordService
            .getMaintenanceRecordById(id);
        return ResponseEntity.ok(response);
    }
    
    @GetMapping
    public ResponseEntity<List<MaintenanceRecordResponse>> getAllRecords() {
        List<MaintenanceRecordResponse> records = maintenanceRecordService
            .getAllMaintenanceRecords();
        return ResponseEntity.ok(records);
    }
    
    @GetMapping("/transformer/{transformerId}")
    public ResponseEntity<List<MaintenanceRecordResponse>> getTransformerRecords(
            @PathVariable UUID transformerId) {
        
        List<MaintenanceRecordResponse> records = maintenanceRecordService
            .getTransformerMaintenanceRecords(transformerId);
        
        return ResponseEntity.ok(records);
    }
    
    @GetMapping("/history/{transformerId}")
    public ResponseEntity<List<MaintenanceRecordResponse>> getRecordHistory(
            @PathVariable UUID transformerId) {
        
        List<MaintenanceRecordResponse> history = maintenanceRecordService
            .getTransformerRecordHistory(transformerId);
        
        return ResponseEntity.ok(history);
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteRecord(@PathVariable UUID id) {
        maintenanceRecordService.deleteMaintenanceRecord(id);
        return ResponseEntity.noContent().build();
    }
}
```

---

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

**maintenance-record-form.tsx** (~1,000 lines):

```typescript
interface MaintenanceRecordFormProps {
  inspectionId?: UUID;
  recordId?: UUID;
  transformerId?: UUID;
  onSuccess?: () => void;
}

export function MaintenanceRecordForm({
  inspectionId,
  recordId,
  transformerId,
  onSuccess
}: MaintenanceRecordFormProps) {
  // State
  const [formData, setFormData] = useState<MaintenanceRecordData>({
    inspectorName: '',
    transformerId: transformerId || '',
    voltage: undefined,
    current: undefined,
    frequency: undefined,
    loadPercentage: undefined,
    transformerStatus: 'operational',
    notes: '',
    comments: '',
    recommendedAction: 'monitor',
    maintenanceDate: addDays(new Date(), 30)
  });
  
  const [transformer, setTransformer] = useState<TransformerData | null>(null);
  const [inspection, setInspection] = useState<InspectionData | null>(null);
  const [thermalImage, setThermalImage] = useState<ThermalImageData | null>(null);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [baselineImage, setBaselineImage] = useState<string | null>(null);
  const [selectedWeather, setSelectedWeather] = useState<'Sunny' | 'Cloudy' | 'Rainy'>('Sunny');
  
  const [isLoading, setIsLoading] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [dirtyFields, setDirtyFields] = useState<Set<string>>(new Set());
  
  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        
        // Load inspection
        if (inspectionId) {
          const insp = await api.getInspection(inspectionId);
          setInspection(insp);
          setFormData(f => ({ ...f, inspectorName: insp.inspector_name }));
          
          // Load transformer
          const trans = await api.getTransformer(insp.transformer_id);
          setTransformer(trans);
          setFormData(f => ({ ...f, transformerId: trans.id }));
          
          // Load thermal image
          const images = await api.getThermalImages(inspectionId);
          const mainImg = images.find((i: any) => i.imageType === 'Maintenance');
          if (mainImg) {
            setThermalImage(mainImg);
            
            // Load annotations
            const annots = await api.getAnnotations(mainImg.id);
            setAnnotations(annots.filter((a: any) => !a.isDeleted));
          }
        }
        
        // Load baseline image
        if (transformer) {
          const baseUrl = getBaselineImageUrl(transformer, selectedWeather);
          setBaselineImage(baseUrl);
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading form data:', error);
        setErrors({ load: 'Failed to load inspection data' });
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [inspectionId, recordId, selectedWeather]);
  
  // Handle field changes
  const handleFieldChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setDirtyFields(prev => new Set(prev).add(field));
    
    // Re-validate field
    const error = validateField(field, value);
    if (error) {
      setErrors(prev => ({ ...prev, [field]: error }));
    } else {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };
  
  // Validation
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.inspectorName.trim()) {
      newErrors.inspectorName = 'Inspector name is required';
    }
    
    if (!formData.transformerStatus) {
      newErrors.transformerStatus = 'Transformer status is required';
    }
    
    if (!formData.maintenanceDate) {
      newErrors.maintenanceDate = 'Maintenance date is required';
    }
    
    if (formData.frequency && (formData.frequency < 40 || formData.frequency > 60)) {
      newErrors.frequency = 'Frequency must be between 40-60 Hz';
    }
    
    if (formData.loadPercentage && (formData.loadPercentage < 0 || formData.loadPercentage > 100)) {
      newErrors.loadPercentage = 'Load must be between 0-100%';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Save record
  const handleSave = async () => {
    if (!validateForm()) return;
    
    try {
      setIsSaving(true);
      
      if (recordId) {
        // Update existing record
        await api.updateMaintenanceRecord(recordId, {
          ...formData,
          inspectionId,
          thermalImageId: thermalImage?.id
        });
      } else {
        // Create new record
        await api.createMaintenanceRecord({
          ...formData,
          inspectionId,
          thermalImageId: thermalImage?.id
        });
      }
      
      onSuccess?.();
      setDirtyFields(new Set());
    } catch (error) {
      console.error('Error saving record:', error);
      setErrors({ save: 'Failed to save record' });
    } finally {
      setIsSaving(false);
    }
  };
  
  if (isLoading) {
    return <div>Loading...</div>;
  }
  
  return (
    <div className="space-y-6">
      {/* Basic Information */}
      <Section title="Basic Information">
        <InputField
          label="Inspector Name"
          value={formData.inspectorName}
          onChange={(v) => handleFieldChange('inspectorName', v)}
          error={errors.inspectorName}
          required
        />
        
        {transformer && (
          <div className="grid grid-cols-2 gap-4">
            <InfoDisplay label="Transformer" value={transformer.transformer_number} />
            <InfoDisplay label="Pole" value={transformer.pole_number} />
            <InfoDisplay label="Region" value={transformer.region} />
            <InfoDisplay label="Capacity" value={`${transformer.capacity} MVA`} />
          </div>
        )}
        
        <DatePicker
          label="Maintenance Date"
          value={formData.maintenanceDate}
          onChange={(v) => handleFieldChange('maintenanceDate', v)}
          error={errors.maintenanceDate}
          required
        />
      </Section>
      
      {/* Image Comparison */}
      <Section title="Thermal Image Comparison">
        <div className="flex gap-4">
          <div className="flex-1">
            <h4 className="font-medium mb-2">Baseline Image</h4>
            <Select value={selectedWeather} onValueChange={setSelectedWeather}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Sunny">Sunny</SelectItem>
                <SelectItem value="Cloudy">Cloudy</SelectItem>
                <SelectItem value="Rainy">Rainy</SelectItem>
              </SelectContent>
            </Select>
            {baselineImage && (
              <img src={baselineImage} alt="Baseline" className="mt-4 rounded" />
            )}
          </div>
          
          <div className="flex-1">
            <h4 className="font-medium mb-2">Maintenance Image</h4>
            {thermalImage && (
              <img src={thermalImage.imageUrl} alt="Maintenance" className="mt-8 rounded" />
            )}
          </div>
        </div>
        
        {annotations.length > 0 && (
          <div className="mt-4">
            <h4 className="font-medium mb-2">Detected Anomalies ({annotations.length})</h4>
            <div className="space-y-2">
              {annotations.map((annot) => (
                <div key={annot.id} className="p-2 bg-gray-100 rounded">
                  <span className="font-medium">{annot.classType}</span>
                  <span className="ml-2 text-sm text-gray-600">
                    {(annot.confidence * 100).toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </Section>
      
      {/* Technical Parameters */}
      <Section title="Technical Parameters">
        <div className="grid grid-cols-2 gap-4">
          <InputField
            label="Voltage (V)"
            type="number"
            value={formData.voltage || ''}
            onChange={(v) => handleFieldChange('voltage', v ? parseFloat(v) : undefined)}
            placeholder="e.g., 11000"
          />
          
          <InputField
            label="Current (A)"
            type="number"
            value={formData.current || ''}
            onChange={(v) => handleFieldChange('current', v ? parseFloat(v) : undefined)}
            placeholder="e.g., 250"
          />
          
          <InputField
            label="Frequency (Hz)"
            type="number"
            value={formData.frequency || ''}
            onChange={(v) => handleFieldChange('frequency', v ? parseFloat(v) : undefined)}
            error={errors.frequency}
            placeholder="e.g., 50"
          />
          
          <div>
            <Label>Load (%): {formData.loadPercentage}%</Label>
            <Slider
              value={[formData.loadPercentage || 0]}
              onValueChange={([v]) => handleFieldChange('loadPercentage', v)}
              min={0}
              max={100}
              step={1}
            />
          </div>
        </div>
      </Section>
      
      {/* Status & Recommendations */}
      <Section title="Status & Recommendations">
        <Select
          value={formData.transformerStatus}
          onValueChange={(v) => handleFieldChange('transformerStatus', v)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="operational">Operational</SelectItem>
            <SelectItem value="faulty">Faulty</SelectItem>
            <SelectItem value="requires_repair">Requires Repair</SelectItem>
          </SelectContent>
        </Select>
        
        <Select
          value={formData.recommendedAction}
          onValueChange={(v) => handleFieldChange('recommendedAction', v)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="no_action">No Action Required</SelectItem>
            <SelectItem value="monitor">Monitor</SelectItem>
            <SelectItem value="repair">Schedule Repair</SelectItem>
            <SelectItem value="replace">Schedule Replacement</SelectItem>
          </SelectContent>
        </Select>
      </Section>
      
      {/* Notes */}
      <Section title="Notes & Comments">
        <TextArea
          label="Technical Notes"
          value={formData.notes}
          onChange={(v) => handleFieldChange('notes', v)}
          placeholder="Enter technical observations..."
          rows={6}
          required
        />
        
        <TextArea
          label="Comments"
          value={formData.comments}
          onChange={(v) => handleFieldChange('comments', v)}
          placeholder="Additional comments..."
          rows={4}
        />
      </Section>
      
      {/* Actions */}
      <div className="flex gap-2 justify-end">
        <Button variant="outline">Cancel</Button>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save Record'}
        </Button>
        <Button variant="secondary">Preview</Button>
        <Button variant="secondary">Print</Button>
      </div>
    </div>
  );
}
```

#### 3. **MaintenanceRecordDetails Component**

**maintenance-record-details.tsx** (~600 lines):

```typescript
export function MaintenanceRecordDetails({ recordId }: Props) {
  const [record, setRecord] = useState<MaintenanceRecord | null>(null);
  const [history, setHistory] = useState<MaintenanceRecord[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  
  useEffect(() => {
    const loadRecord = async () => {
      const rec = await api.getMaintenanceRecord(recordId);
      setRecord(rec);
      
      // Load history
      if (rec.transformer_id) {
        const hist = await api.getMaintenanceRecordHistory(rec.transformer_id);
        setHistory(hist);
      }
    };
    
    loadRecord();
  }, [recordId]);
  
  if (!record) return <div>Loading...</div>;
  
  return (
    <div className="space-y-6">
      {/* Record Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">{record.recordNumber}</h2>
        <div className="space-x-2">
          <Button>Edit</Button>
          <Button>Print</Button>
          <Button variant="destructive">Delete</Button>
        </div>
      </div>
      
      {/* Record Info */}
      <Card>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <InfoField label="Transformer" value={record.transformer_id} />
            <InfoField label="Inspector" value={record.inspectorName} />
            <InfoField label="Inspection Date" value={format(record.inspectionTimestamp, 'PPP')} />
            <InfoField label="Maintenance Date" value={format(record.maintenanceDate, 'PPP')} />
            <InfoField label="Status" value={record.transformerStatus} />
            <InfoField label="Version" value={`v${record.versionNumber}`} />
          </div>
        </CardContent>
      </Card>
      
      {/* Image Comparison */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h3 className="font-medium mb-2">Baseline Image</h3>
          {record.baselineImageUrl && (
            <img src={record.baselineImageUrl} alt="Baseline" className="rounded" />
          )}
        </div>
        <div>
          <h3 className="font-medium mb-2">Maintenance Image</h3>
          <img src={record.maintenanceImageUrl} alt="Maintenance" className="rounded" />
        </div>
      </div>
      
      {/* Technical Data */}
      <Card>
        <CardHeader>
          <CardTitle>Technical Parameters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <InfoField label="Voltage" value={`${record.voltage} V`} />
            <InfoField label="Current" value={`${record.current} A`} />
            <InfoField label="Frequency" value={`${record.frequency} Hz`} />
            <InfoField label="Load" value={`${record.loadPercentage}%`} />
          </div>
        </CardContent>
      </Card>
      
      {/* Version History */}
      <Card>
        <CardHeader>
          <CardTitle
            className="flex justify-between cursor-pointer"
            onClick={() => setShowHistory(!showHistory)}
          >
            Version History
            <ChevronDown className={showHistory ? 'rotate-180' : ''} />
          </CardTitle>
        </CardHeader>
        {showHistory && (
          <CardContent>
            <Timeline>
              {history.map((v) => (
                <TimelineItem key={v.id}>
                  <TimelineContent>
                    <p className="font-medium">Version {v.versionNumber}</p>
                    <p className="text-sm text-gray-600">
                      {format(v.lastModifiedAt, 'PPpp')} by {v.lastModifiedBy}
                    </p>
                  </TimelineContent>
                </TimelineItem>
              ))}
            </Timeline>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
```

---

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
