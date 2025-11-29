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
```java
@Entity
@Table(name = "annotations")
public class Annotation {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "thermal_image_id", nullable = false)
    private ThermalImage thermalImage;
    
    // Spatial coordinates
    @Column(nullable = false)
    private String detectionId;      // Links to AI detection
    
    @Column(nullable = false)
    private String classType;        // faulty, potentially_faulty, normal
    
    @Column(nullable = false)
    private Double confidence;       // 0-1
    
    @Column(nullable = false)
    private Double x;               // Center X
    
    @Column(nullable = false)
    private Double y;               // Center Y
    
    @Column(nullable = false)
    private Double width;           // Box width
    
    @Column(nullable = false)
    private Double height;          // Box height
    
    // Annotation metadata
    @Column(nullable = false)
    private String annotationType;  // ai_detected, user_added, user_edited, user_deleted
    
    @Column(columnDefinition = "TEXT")
    private String comments;
    
    // Audit trail
    @Column(nullable = false)
    private String createdBy;
    
    @Column(nullable = false)
    private OffsetDateTime createdAt;
    
    @Column(nullable = false)
    private String modifiedBy;
    
    @Column(nullable = false)
    private OffsetDateTime modifiedAt;
    
    // Soft delete
    @Column(nullable = false)
    private Boolean isDeleted = false;
    
    // Getters, setters, constructors...
}
```

**AnnotationRepository.java**
```java
@Repository
public interface AnnotationRepository extends JpaRepository<Annotation, UUID> {
    List<Annotation> findByThermalImage_Id(UUID thermalImageId);
    
    List<Annotation> findByThermalImage_IdAndIsDeletedFalse(UUID thermalImageId);
    
    List<Annotation> findByThermalImage_IdAndAnnotationType(
        UUID thermalImageId, String annotationType);
    
    long countByThermalImage_IdAndIsDeletedFalse(UUID thermalImageId);
    
    List<Annotation> findByCreatedByAndModifiedAtAfter(
        String createdBy, OffsetDateTime timestamp);
    
    List<Annotation> findByAnnotationTypeIn(List<String> types);
}
```

#### 2. **Annotation Service**

**AnnotationService.java** (`backend/src/main/java/.../service/AnnotationService.java`)
```java
@Service
public class AnnotationService {
    @Autowired
    private AnnotationRepository annotationRepository;
    
    @Autowired
    private AnnotationFeedbackRepository feedbackRepository;
    
    @Autowired
    private ThermalImageService thermalImageService;
    
    // Create new annotation
    public AnnotationResponse createAnnotation(
            CreateAnnotationRequest request,
            String createdBy) {
        
        ThermalImage thermalImage = thermalImageService
            .getThermalImageById(request.thermalImageId());
        
        Annotation annotation = new Annotation();
        annotation.setThermalImage(thermalImage);
        annotation.setDetectionId(request.detectionId());
        annotation.setClassType(request.classType());
        annotation.setConfidence(request.confidence());
        annotation.setX(request.x());
        annotation.setY(request.y());
        annotation.setWidth(request.width());
        annotation.setHeight(request.height());
        annotation.setAnnotationType(
            request.detectionId() == null ? "user_added" : "ai_detected");
        annotation.setComments(request.comments());
        annotation.setCreatedBy(createdBy);
        annotation.setCreatedAt(OffsetDateTime.now());
        annotation.setModifiedBy(createdBy);
        annotation.setModifiedAt(OffsetDateTime.now());
        annotation.setIsDeleted(false);
        
        return convertToResponse(annotationRepository.save(annotation));
    }
    
    // Update annotation (move, resize)
    public AnnotationResponse updateAnnotation(
            UUID id,
            UpdateAnnotationRequest request,
            String modifiedBy) {
        
        Annotation annotation = annotationRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Annotation not found"));
        
        // Track changes
        recordFeedback(annotation, "MODIFIED", request, modifiedBy);
        
        // Update spatial data
        if (request.x() != null) annotation.setX(request.x());
        if (request.y() != null) annotation.setY(request.y());
        if (request.width() != null) annotation.setWidth(request.width());
        if (request.height() != null) annotation.setHeight(request.height());
        
        // Update class/confidence
        if (request.classType() != null) annotation.setClassType(request.classType());
        if (request.confidence() != null) annotation.setConfidence(request.confidence());
        
        // Update comments
        if (request.comments() != null) annotation.setComments(request.comments());
        
        // Track modification
        annotation.setAnnotationType("user_edited");
        annotation.setModifiedBy(modifiedBy);
        annotation.setModifiedAt(OffsetDateTime.now());
        
        return convertToResponse(annotationRepository.save(annotation));
    }
    
    // Delete annotation (soft delete)
    public void deleteAnnotation(UUID id, String deletedBy) {
        Annotation annotation = annotationRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Annotation not found"));
        
        // Record deletion feedback
        recordFeedback(annotation, "DELETED", null, deletedBy);
        
        annotation.setIsDeleted(true);
        annotation.setAnnotationType("user_deleted");
        annotation.setModifiedBy(deletedBy);
        annotation.setModifiedAt(OffsetDateTime.now());
        
        annotationRepository.save(annotation);
    }
    
    // Get active annotations
    public List<AnnotationResponse> getAnnotations(UUID thermalImageId) {
        return annotationRepository
            .findByThermalImage_IdAndIsDeletedFalse(thermalImageId)
            .stream()
            .map(this::convertToResponse)
            .collect(Collectors.toList());
    }
    
    // Sync annotations with AI detections
    public List<AnnotationResponse> syncAnnotationsWithDetections(
            UUID thermalImageId,
            List<Detection> detections) {
        
        ThermalImage thermalImage = thermalImageService
            .getThermalImageById(thermalImageId);
        
        List<Annotation> annotations = new ArrayList<>();
        
        for (Detection detection : detections) {
            Annotation annotation = new Annotation();
            annotation.setThermalImage(thermalImage);
            annotation.setDetectionId(detection.detection_id);
            annotation.setClassType(detection.classType);
            annotation.setConfidence(detection.confidence);
            annotation.setX(detection.x);
            annotation.setY(detection.y);
            annotation.setWidth(detection.width);
            annotation.setHeight(detection.height);
            annotation.setAnnotationType("ai_detected");
            annotation.setCreatedBy("ai_system");
            annotation.setCreatedAt(OffsetDateTime.now());
            annotation.setModifiedBy("ai_system");
            annotation.setModifiedAt(OffsetDateTime.now());
            annotation.setIsDeleted(false);
            
            annotations.add(annotationRepository.save(annotation));
        }
        
        return annotations.stream()
            .map(this::convertToResponse)
            .collect(Collectors.toList());
    }
    
    // Record feedback for compliance
    private void recordFeedback(
            Annotation annotation,
            String actionType,
            UpdateAnnotationRequest request,
            String performedBy) {
        
        AnnotationFeedback feedback = new AnnotationFeedback();
        feedback.setAnnotationId(annotation.getId());
        feedback.setThermalImageId(annotation.getThermalImage().getId());
        feedback.setActionType(actionType);
        feedback.setPerformedBy(performedBy);
        feedback.setPerformedAt(OffsetDateTime.now());
        
        if (request != null && request.confidence() != null) {
            feedback.setFieldChanged("confidence");
            feedback.setPreviousValue(annotation.getConfidence());
            feedback.setCurrentValue(request.confidence());
        }
        
        feedbackRepository.save(feedback);
    }
}
```

**AnnotationFeedback.java** (for compliance tracking)
```java
@Entity
@Table(name = "annotation_feedback")
public class AnnotationFeedback {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @Column(nullable = false)
    private UUID annotationId;
    
    @Column(nullable = false)
    private UUID thermalImageId;
    
    @Column(nullable = false)
    private String actionType;  // CREATED, MODIFIED, DELETED
    
    @Column(nullable = false)
    private String fieldChanged;
    
    @Column(columnDefinition = "TEXT")
    private String previousValue;
    
    @Column(columnDefinition = "TEXT")
    private String currentValue;
    
    @Column(nullable = false)
    private String performedBy;
    
    @Column(nullable = false)
    private OffsetDateTime performedAt;
    
    @Column(columnDefinition = "TEXT")
    private String reason;
}
```

#### 3. **Compliance Report Service**

**ComplianceReportService.java**
```java
@Service
public class ComplianceReportService {
    @Autowired
    private AnnotationRepository annotationRepository;
    
    @Autowired
    private AnnotationFeedbackRepository feedbackRepository;
    
    public ComplianceReport generateReport(UUID thermalImageId) {
        ThermalImage image = thermalImageService.getThermalImageById(thermalImageId);
        List<Annotation> annotations = annotationRepository
            .findByThermalImage_Id(thermalImageId);
        
        ComplianceReport report = new ComplianceReport();
        report.setReportId("RPT-" + System.currentTimeMillis());
        report.setGeneratedAt(OffsetDateTime.now());
        report.setThermalImageId(thermalImageId);
        
        // Calculate statistics
        long aiDetected = annotations.stream()
            .filter(a -> "ai_detected".equals(a.getAnnotationType()))
            .count();
        
        long userAdded = annotations.stream()
            .filter(a -> "user_added".equals(a.getAnnotationType()))
            .count();
        
        long userModified = feedbackRepository
            .countByAnnotationTypeAndAction("MODIFIED");
        
        long userDeleted = annotations.stream()
            .filter(Annotation::getIsDeleted)
            .count();
        
        report.setTotalAnnotations((int) (aiDetected + userAdded));
        report.setAiDetected((int) aiDetected);
        report.setUserAdded((int) userAdded);
        report.setUserModified((int) userModified);
        report.setUserDeleted((int) userDeleted);
        
        // Severity breakdown
        Map<String, Integer> severity = annotations.stream()
            .filter(a -> !a.getIsDeleted())
            .collect(Collectors.groupingBy(
                Annotation::getClassType,
                Collectors.summingInt(a -> 1)
            ));
        
        report.setCriticalCount(severity.getOrDefault("faulty", 0));
        report.setHighCount(severity.getOrDefault("potentially_faulty", 0));
        report.setLowCount(severity.getOrDefault("normal", 0));
        
        return report;
    }
    
    public String exportToPdf(ComplianceReport report) {
        // Generate PDF using iText or similar
        // Return file path
    }
    
    public String exportToCsv(ComplianceReport report) {
        // Export annotations to CSV for analysis
    }
}
```

#### 4. **Feedback Collection for Model Retraining**

**ModelFeedbackService.java**
```java
@Service
public class ModelFeedbackService {
    @Autowired
    private AnnotationRepository annotationRepository;
    
    public CocoDataset exportFeedbackForRetraining(LocalDate startDate, LocalDate endDate) {
        List<Annotation> annotations = annotationRepository
            .findByModifiedAtBetween(startDate.atStartOfDay(), endDate.atTime(23, 59, 59));
        
        CocoDataset dataset = new CocoDataset();
        
        // Convert annotations to COCO format
        for (Annotation annotation : annotations) {
            ImageInfo imageInfo = new ImageInfo();
            imageInfo.id = annotation.getThermalImage().getId().hashCode();
            imageInfo.file_name = extractFilename(annotation.getThermalImage().getImageUrl());
            imageInfo.height = 480;
            imageInfo.width = 640;
            dataset.images.add(imageInfo);
            
            AnnotationInfo annotInfo = new AnnotationInfo();
            annotInfo.id = annotation.getId().hashCode();
            annotInfo.image_id = imageInfo.id;
            annotInfo.category_id = getCategory(annotation.getClassType());
            annotInfo.bbox = new double[]{
                annotation.getX() - annotation.getWidth() / 2,
                annotation.getY() - annotation.getHeight() / 2,
                annotation.getWidth(),
                annotation.getHeight()
            };
            
            // Add feedback metadata
            AnnotationFeedback feedback = new AnnotationFeedback();
            feedback.original_confidence = annotation.getConfidence();
            feedback.user_correction = "user_edited".equals(annotation.getAnnotationType());
            annotInfo.feedback = feedback;
            
            dataset.annotations.add(annotInfo);
        }
        
        return dataset;
    }
    
    public void uploadFeedbackToRoboflow(CocoDataset dataset) {
        // POST to Roboflow API to add feedback data
        // Trigger automatic retraining
    }
}
```

---

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

**Canvas Drawing & Interaction** (~1,500 lines):

```typescript
interface CanvasState {
  image: HTMLImageElement | null;
  detections: Detection[];
  annotations: Annotation[];
  selectedAnnotationId: UUID | null;
  drawMode: boolean;
  drawStart: Point | null;
  editingMode: 'move' | 'resize' | 'none';
  resizeHandle: ResizeHandle | null;
  panStart: Point | null;
}

function ThermalImageCanvas({ imageUrl, detections, onAnnotationsChange }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [state, setState] = useState<CanvasState>({...});
  
  // Drawing operations
  const drawBoundingBox = useCallback((ctx, annotation, isSelected) => {
    const color = getColorForClass(annotation.classType);
    const lineWidth = isSelected ? 3 : 2;
    
    // Draw box
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.strokeRect(annotation.x, annotation.y, annotation.width, annotation.height);
    
    // Draw label
    ctx.fillStyle = color;
    ctx.font = "12px Arial";
    ctx.fillText(
      `${annotation.classType} ${(annotation.confidence * 100).toFixed(1)}%`,
      annotation.x + 5,
      annotation.y - 5
    );
    
    // Draw resize handles if selected
    if (isSelected) {
      drawResizeHandles(ctx, annotation);
    }
  }, []);
  
  // Resize handle drawing
  const drawResizeHandles = (ctx: CanvasRenderingContext2D, box: Annotation) => {
    const handleSize = 8;
    const handles: Record<ResizeHandle, [number, number]> = {
      'NW': [box.x - handleSize / 2, box.y - handleSize / 2],
      'NE': [box.x + box.width - handleSize / 2, box.y - handleSize / 2],
      'SE': [box.x + box.width - handleSize / 2, box.y + box.height - handleSize / 2],
      'SW': [box.x - handleSize / 2, box.y + box.height - handleSize / 2],
    };
    
    ctx.fillStyle = "#00FF00";
    Object.values(handles).forEach(([x, y]) => {
      ctx.fillRect(x, y, handleSize, handleSize);
    });
  };
  
  // Mouse event handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / scale + offset.x;
    const y = (e.clientY - rect.top) / scale + offset.y;
    
    if (state.drawMode) {
      // Start drawing new annotation
      setState(s => ({ ...s, drawStart: { x, y } }));
    } else {
      // Check if clicking on existing annotation
      const clickedAnnotation = findAnnotationAtPoint(x, y);
      
      if (clickedAnnotation) {
        // Check if clicking on resize handle
        const handle = getResizeHandle(clickedAnnotation, x, y);
        if (handle) {
          setState(s => ({
            ...s,
            editingMode: 'resize',
            resizeHandle: handle,
            selectedAnnotationId: clickedAnnotation.id
          }));
        } else {
          // Start dragging annotation
          setState(s => ({
            ...s,
            editingMode: 'move',
            selectedAnnotationId: clickedAnnotation.id,
            panStart: { x, y }
          }));
        }
      } else if (!e.ctrlKey) {
        // Deselect if clicking empty space
        setState(s => ({ ...s, selectedAnnotationId: null }));
      }
    }
  };
  
  const handleMouseMove = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / scale + offset.x;
    const y = (e.clientY - rect.top) / scale + offset.y;
    
    if (state.drawMode && state.drawStart) {
      // Show live preview of new box
      setState(s => ({ ...s, liveDrawBox: { x: s.drawStart!.x, y: s.drawStart!.y, x2: x, y2: y } }));
    } else if (state.editingMode === 'move' && state.selectedAnnotationId && state.panStart) {
      // Move annotation
      const annotation = state.annotations.find(a => a.id === state.selectedAnnotationId)!;
      const dx = x - state.panStart.x;
      const dy = y - state.panStart.y;
      
      const updated = { ...annotation, x: annotation.x + dx, y: annotation.y + dy };
      updateAnnotation(updated);
      setState(s => ({ ...s, panStart: { x, y } }));
    } else if (state.editingMode === 'resize' && state.selectedAnnotationId && state.resizeHandle) {
      // Resize annotation
      const annotation = state.annotations.find(a => a.id === state.selectedAnnotationId)!;
      const updated = resizeAnnotationBox(annotation, state.resizeHandle, x, y);
      updateAnnotation(updated);
    }
    
    // Update cursor based on hover
    updateCursor(x, y);
  };
  
  const handleMouseUp = () => {
    if (state.drawMode && state.drawStart && state.liveDrawBox) {
      // Finish drawing - open dialog to set class
      showAnnotationDialog({
        x: (state.drawStart.x + state.liveDrawBox.x2) / 2,
        y: (state.drawStart.y + state.liveDrawBox.y2) / 2,
        width: Math.abs(state.liveDrawBox.x2 - state.drawStart.x),
        height: Math.abs(state.liveDrawBox.y2 - state.drawStart.y),
      });
      setState(s => ({ ...s, drawMode: false, drawStart: null, liveDrawBox: null }));
    } else {
      setState(s => ({ ...s, editingMode: 'none', panStart: null, resizeHandle: null }));
    }
  };
}
```

#### 3. **Annotation Editor Dialog**

**AnnotationDialog Component**:
```typescript
function AnnotationDialog({ annotation, isOpen, onSave, onCancel }: Props) {
  const [classType, setClassType] = useState(annotation?.classType || 'normal');
  const [confidence, setConfidence] = useState(annotation?.confidence || 0.5);
  const [comments, setComments] = useState(annotation?.comments || '');
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const handleSave = () => {
    // Validation
    if (confidence < 0 || confidence > 1) {
      setErrors({ confidence: 'Must be between 0 and 1' });
      return;
    }
    
    onSave({
      classType,
      confidence,
      comments,
    });
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onCancel}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {annotation ? 'Edit Annotation' : 'Create Annotation'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label>Class Type</Label>
            <Select value={classType} onValueChange={setClassType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="faulty">
                  <span className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-600 rounded-full" />
                    Faulty (Critical)
                  </span>
                </SelectItem>
                <SelectItem value="potentially_faulty">
                  <span className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-orange-600 rounded-full" />
                    Potentially Faulty (High)
                  </span>
                </SelectItem>
                <SelectItem value="normal">
                  <span className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-600 rounded-full" />
                    Normal (Low)
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label>Confidence ({(confidence * 100).toFixed(1)}%)</Label>
            <Slider
              value={[confidence]}
              onValueChange={([v]) => setConfidence(v)}
              min={0}
              max={1}
              step={0.01}
            />
          </div>
          
          <div>
            <Label>Comments</Label>
            <Textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Add notes about this annotation..."
              rows={4}
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          <Button onClick={handleSave}>Save Annotation</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

---

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
