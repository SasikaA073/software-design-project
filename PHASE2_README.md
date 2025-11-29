# Phase 2 - Automated Anomaly Detection

## Overview

Phase 2 implements an AI-powered thermal anomaly detection engine that automatically identifies temperature deviations and hotspots in transformer thermal images. The system compares new maintenance images against baseline reference images and highlights potential issues for engineer review.
---

## Scope & Features Implemented

### FR2.1: AI-Based Anomaly Detection Engine ✅

#### Implemented Features:

1. **Computer Vision Model Integration**
   - ✅ YOLOv11 model trained on thermal transformer images
   - ✅ Roboflow platform for model training and hosting
   - ✅ Serverless API deployment for inference
   - ✅ Automatic detection during image upload
   - ✅ Real-time analysis with progress tracking

2. **Detection Model Capabilities**
   - Detects thermal anomalies including:
     - Overheating components
     - Insulation degradation
     - Hot spots and thermal gradients
     - Load imbalances
     - Abnormal temperature patterns
   - Multi-class classification:
     - **Faulty**: Critical issues requiring immediate attention
     - **Potentially Faulty**: Areas needing monitoring
     - **Normal**: Standard thermal readings
   - Confidence scoring (0-1 range, displayed as percentage)
   - Bounding box predictions for spatial localization

3. **Detection Workflow**
   ```
   Upload Maintenance Image
        ↓
   Extract image data
        ↓
   Call Roboflow API
        ↓
   AI Model processes image (YOLOv11)
        ↓
   Returns detections with:
   - Class (faulty/potentially_faulty/normal)
   - Confidence score
   - Bounding box coordinates (x, y, width, height)
   - Pixel coordinates
        ↓
   Store detections in database
        ↓
   Display results to user
   ```

4. **Threshold Mechanism**
   - ✅ Fixed confidence threshold: 0.5 (50%)
   - Anomalies below threshold filtered out
   - Adjustable via configuration
   - Applied at inference time for performance

5. **Error Handling**
   - Graceful handling of API failures
   - Fallback to manual annotation if AI fails
   - User-friendly error messages
   - Detailed backend logging
   - Retry mechanism for transient failures

#### Technical Details:

**Roboflow Integration** (`backend/src/main/java/.../service/RoboflowDatasetService.java`)
```java
public class RoboflowDatasetService {
    // Configuration
    private String roboflowApiKey;
    private String roboflowProject = "transformer-anomalies";
    private String roboflowVersion = "1";
    private double confidenceThreshold = 0.5;
    
    // Methods
    public List<Detection> detectAnomalies(BufferedImage image) {
        // 1. Prepare image for API
        // 2. Send to Roboflow endpoint
        // 3. Parse predictions
        // 4. Filter by confidence threshold
        // 5. Return Detection objects
    }
    
    public List<Detection> callRoboflowAPI(String base64Image) {
        // HTTP POST to:
        // https://api.roboflow.com/v2/project/{name}/predict
        // With parameters:
        // - api_key: from environment
        // - confidence: threshold
        // - overlap: NMS overlap threshold
    }
}
```

**Detection Data Structure**
```typescript
interface Detection {
  detection_id: string;           // Unique identifier
  class: string;                  // "faulty" | "potentially_faulty" | "normal"
  confidence: number;             // 0-1 (0.95 = 95%)
  x: number;                      // Center X coordinate (pixels)
  y: number;                      // Center Y coordinate (pixels)
  width: number;                  // Bounding box width (pixels)
  height: number;                 // Bounding box height (pixels)
  
  // FR3.1 metadata (added in Phase 3)
  annotationType?: string;        // "ai_detected" | "user_added" | "user_edited"
  comments?: string;              // User notes
  createdAt?: string;            // ISO timestamp
  createdBy?: string;            // "ai_system"
  modifiedAt?: string;
  modifiedBy?: string;
}
```

**Storage in Database**
```sql
-- Stored as JSON string in thermal_images table
ALTER TABLE thermal_images ADD COLUMN detection_data TEXT;

-- Example value:
detection_data = '[
  {
    "detection_id": "det_1",
    "class": "faulty",
    "confidence": 0.95,
    "x": 156,
    "y": 203,
    "width": 45,
    "height": 52,
    "annotationType": "ai_detected",
    "createdBy": "ai_system"
  },
  {
    "detection_id": "det_2",
    "class": "potentially_faulty",
    "confidence": 0.78,
    "x": 298,
    "y": 321,
    "width": 61,
    "height": 58
  }
]'
```

---

### FR2.2: Side-by-Side Image Comparison View ✅

#### Implemented Features:

1. **Dual Image Display**
   - ✅ Baseline image (left) vs Maintenance image (right)
   - ✅ Synchronized viewing
   - ✅ Equal size scaling
   - ✅ High-quality rendering
   - ✅ Responsive layout (mobile-friendly)

2. **Image Controls**
   - ✅ Zoom In button: Magnify image by 0.2x increments (max 3x)
   - ✅ Zoom Out button: Reduce zoom (min 1x)
   - ✅ Mouse Wheel Zoom: Intuitive scroll-based magnification
   - ✅ Pan/Move: Click and drag to navigate zoomed images
   - ✅ Reset View: Return to original 1x zoom and position
   - ✅ Smooth transitions: Animated zoom and pan movements

3. **Anomaly Highlighting**
   - ✅ Color-coded bounding boxes on maintenance image:
     - **Red (#FF0000)**: Faulty components
     - **Orange (#FF9800)**: Potentially faulty areas
     - **Green (#00FF00)**: Normal readings
   - ✅ Boxes show confidence percentage
   - ✅ Interactive selection (click to highlight)
   - ✅ Hover effects for better visibility
   - ✅ Badge showing anomaly count

4. **Visual Feedback**
   - ✅ Selected anomaly highlighted with glow effect
   - ✅ Hovered boxes show tooltip
   - ✅ Real-time coordinate display
   - ✅ Severity color consistency

5. **Responsive Design**
   ```
   Desktop (> 1024px):
   ┌──────────────────────────────────────┐
   │  Baseline Image   │   Maintenance     │
   │  (50% width)      │   Image (50%)     │
   │                   │   + Anomalies     │
   └──────────────────────────────────────┘
   
   Tablet (768px - 1024px):
   ┌──────────────────────────────────────┐
   │    Baseline Image (100%)              │
   ├──────────────────────────────────────┤
   │    Maintenance Image (100%)           │
   │    + Anomalies                        │
   └──────────────────────────────────────┘
   
   Mobile (< 768px):
   ┌──────────────────────────────────────┐
   │    Baseline Image (100%)              │
   ├──────────────────────────────────────┤
   │    Maintenance Image (100%)           │
   │    + Anomalies (scrollable)           │
   └──────────────────────────────────────┘
   ```

#### Component Implementation:

**InspectionDetails Component** (`frontend/components/inspections/inspection-details.tsx`)
- Renders side-by-side image comparison
- Loads baseline image from transformer
- Loads maintenance image from thermal image
- Passes detections to canvas component
- Responsive grid layout

**ThermalImageCanvas Component** (`frontend/components/inspections/thermal-image-canvas.tsx`)
- Advanced canvas-based image viewer
- 1200+ lines of TypeScript
- Complete zoom and pan implementation
- Bounding box rendering and interaction
- Real-time coordinate tracking

---

### FR2.3: Automatic Anomaly Marking ✅

#### Implemented Features:

1. **AI-Generated Annotations**
   - ✅ Automatic bounding box generation
   - ✅ Color-coded overlays based on class
   - ✅ Confidence scores displayed
   - ✅ Severity indicators
   - ✅ Metadata popup on hover

2. **Detection Visualization**
   ```typescript
   // Color mapping for severity
   const CLASS_COLORS: Record<string, string> = {
     faulty: "#ff0000",              // Red
     potentially_faulty: "#ff9800",  // Orange
     normal: "#00ff00",              // Green
     default: "#00bcd4",             // Cyan
   }
   ```

3. **Metadata Display**
   - ✅ Pixel coordinates (center X, Y)
   - ✅ Bounding box dimensions (width × height)
   - ✅ Area calculation (width × height in pixels²)
   - ✅ Confidence percentage
   - ✅ Anomaly class with color indicator
   - ✅ Severity level assessment

4. **Detection Summary Panel**
   ```
   ┌─────────────────────────────────────────┐
   │  Detection Summary (2 anomalies detected)│
   ├─────────────────────────────────────────┤
   │  ┌─────────────────────────────────────┐│
   │  │ 🔴 Faulty   Confidence: 95.5%       ││
   │  │ X: 120px    Y: 145px                ││
   │  │ Width: 50px Height: 40px            ││
   │  │ Area: 2,000 px²                     ││
   │  │ Severity: CRITICAL                  ││
   │  │ Click to view details                ││
   │  └─────────────────────────────────────┘│
   │  ┌─────────────────────────────────────┐│
   │  │ 🟠 Potentially Faulty 78.2%         ││
   │  │ X: 250px    Y: 300px                ││
   │  │ Width: 65px Height: 55px            ││
   │  │ Area: 3,575 px²                     ││
   │  │ Severity: HIGH                      ││
   │  └─────────────────────────────────────┘│
   └─────────────────────────────────────────┘
   ```

5. **Severity Classification**
   ```typescript
   function getSeverityLevel(confidence: number): string {
     if (confidence >= 0.8) return "CRITICAL";
     if (confidence >= 0.6) return "HIGH";
     if (confidence >= 0.4) return "MEDIUM";
     return "LOW";
   }
   
   function getSeverityColor(confidence: number): string {
     if (confidence >= 0.8) return "text-red-600";
     if (confidence >= 0.6) return "text-orange-600";
     if (confidence >= 0.4) return "text-yellow-600";
     return "text-blue-600";
   }
   ```

6. **Interactive Details View**
   - Click anomaly to select
   - Display expanded metadata
   - Show in context on image
   - Highlight related detections
   - Options for action (Phase 3+)

---

## Technical Implementation

### Backend Architecture

#### 1. **AI Service Integration**

**RoboflowDatasetService** (`backend/src/main/java/.../service/RoboflowDatasetService.java`)
```java
@Service
public class RoboflowDatasetService {
    @Value("${roboflow.api.key}")
    private String apiKey;
    
    @Value("${roboflow.api.url:https://api.roboflow.com}")
    private String apiUrl;
    
    private static final String PROJECT = "transformer-anomalies";
    private static final String VERSION = "1";
    private static final double CONFIDENCE_THRESHOLD = 0.5;
    
    public List<Detection> detectAnomalies(MultipartFile file) throws IOException {
        // 1. Convert image to base64
        String base64Image = encodeImageToBase64(file);
        
        // 2. Call Roboflow API
        String response = callRoboflowAPI(base64Image);
        
        // 3. Parse JSON response
        List<Detection> detections = parseDetections(response);
        
        // 4. Filter by confidence threshold
        return detections.stream()
            .filter(d -> d.getConfidence() >= CONFIDENCE_THRESHOLD)
            .collect(Collectors.toList());
    }
    
    private String callRoboflowAPI(String base64Image) {
        RestTemplate restTemplate = new RestTemplate();
        String endpoint = String.format(
            "%s/v2/%s/%s/predict?api_key=%s&confidence=%f",
            apiUrl, PROJECT, VERSION, apiKey, CONFIDENCE_THRESHOLD
        );
        
        Map<String, Object> request = new HashMap<>();
        request.put("image", base64Image);
        
        return restTemplate.postForObject(endpoint, request, String.class);
    }
}
```

**ThermalImageService Enhancement**
```java
@Service
public class ThermalImageService {
    @Autowired
    private RoboflowDatasetService roboflowService;
    
    public ThermalImage uploadAndAnalyze(
            UUID inspectionId, 
            MultipartFile file, 
            String imageType) throws IOException {
        
        // 1. Save image to file system
        String imagePath = saveImageToFile(file);
        
        // 2. Create ThermalImage entity
        ThermalImage image = new ThermalImage();
        image.setInspectionId(inspectionId);
        image.setImageUrl(imagePath);
        image.setImageType(imageType);
        image.setUploadedAt(OffsetDateTime.now());
        
        // 3. Call AI detection if maintenance image
        if ("Maintenance".equals(imageType)) {
            List<Detection> detections = roboflowService.detectAnomalies(file);
            image.setAnomalyDetected(!detections.isEmpty());
            image.setDetectionData(convertDetectionsToJson(detections));
            
            // 4. Create annotations for Phase 3
            createAnnotationsFromDetections(image, detections);
        }
        
        // 5. Save to database
        return thermalImageRepository.save(image);
    }
}
```

#### 2. **Detection Data Processing**

**Detection Parsing**
```java
private List<Detection> parseDetections(String apiResponse) {
    ObjectMapper mapper = new ObjectMapper();
    JsonNode root = mapper.readTree(apiResponse);
    JsonNode predictions = root.get("predictions");
    
    List<Detection> detections = new ArrayList<>();
    for (JsonNode pred : predictions) {
        Detection detection = new Detection();
        detection.setDetectionId(UUID.randomUUID().toString());
        detection.setDetectionClass(pred.get("class").asText());
        detection.setConfidence(pred.get("confidence").asDouble());
        detection.setX(pred.get("x").asDouble());
        detection.setY(pred.get("y").asDouble());
        detection.setWidth(pred.get("width").asDouble());
        detection.setHeight(pred.get("height").asDouble());
        detection.setAnnotationType("ai_detected");
        detection.setCreatedBy("ai_system");
        detections.add(detection);
    }
    
    return detections;
}
```

#### 3. **Progress Tracking**

**Upload Progress Handler**
```java
@PostMapping("/thermal-images/upload")
public ResponseEntity<?> uploadThermalImage(
        @RequestParam UUID inspectionId,
        @RequestParam("file") MultipartFile file,
        @RequestParam String imageType,
        @RequestParam(required = false) String weatherCondition) {
    
    ProgressTracker progress = new ProgressTracker();
    
    try {
        // Stage 1: Upload (0-40%)
        progress.update(20, "Uploading file...");
        String filePath = saveImageToFile(file);
        progress.update(40, "File uploaded successfully");
        
        // Stage 2: AI Analysis (40-70%)
        progress.update(50, "AI analyzing image...");
        List<Detection> detections = null;
        if ("Maintenance".equals(imageType)) {
            detections = roboflowService.detectAnomalies(file);
        }
        progress.update(70, "Analysis complete");
        
        // Stage 3: Finalization (70-100%)
        progress.update(80, "Processing results...");
        ThermalImage image = createThermalImageRecord(
            inspectionId, filePath, imageType, detections);
        progress.update(100, "Complete");
        
        return ResponseEntity.ok(image);
    } catch (Exception e) {
        progress.update(0, "Error: " + e.getMessage());
        return ResponseEntity.status(500).build();
    }
}
```

---

### Frontend Architecture

#### 1. **Component Hierarchy**

```
InspectionDetails
├── Header (Title, Status)
├── ImageComparisonSection
│   ├── Baseline Image Panel
│   │   ├── Image Display
│   │   └── Controls (optional)
│   └── Maintenance Image Panel
│       ├── ThermalImageCanvas
│       │   ├── Canvas Element
│       │   ├── Zoom Controls
│       │   ├── Pan Functionality
│       │   └── Bounding Box Rendering
│       └── Anomaly Count Badge
└── DetectionSummarySection
    ├── Grid of Detection Cards
    │   └── Individual Detection Card
    │       ├── Color Badge
    │       ├── Class & Confidence
    │       ├── Coordinates
    │       └── Area
    └── Details View (on selection)
```

#### 2. **ThermalImageCanvas Component Deep Dive**

**Core Features** (~1200 lines):

```typescript
interface ThermalImageCanvasProps {
  imageUrl: string;
  detections?: Detection[];
  alt?: string;
  className?: string;
  onDetectionsChange?: (detections: Detection[]) => void;
  highlightedBoxIndex?: number | null;
  onHighlightDetection?: (index: number | null) => void;
}

export function ThermalImageCanvas(props: ThermalImageCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // State
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [detections, setDetections] = useState<Detection[]>([]);
  
  // Transform state (zoom & pan)
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  
  // Rendering
  const draw = useCallback(() => {
    if (!canvasRef.current || !image) return;
    
    const ctx = canvasRef.current.getContext("2d");
    // 1. Clear canvas
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    
    // 2. Apply transformations
    ctx.save();
    ctx.translate(canvasRef.current.width / 2, canvasRef.current.height / 2);
    ctx.scale(scale, scale);
    ctx.translate(offset.x, offset.y);
    
    // 3. Draw image
    const centerX = -image.width / 2;
    const centerY = -image.height / 2;
    ctx.drawImage(image, centerX, centerY);
    
    // 4. Draw bounding boxes
    detections.forEach((detection, index) => {
      drawBoundingBox(ctx, detection, index);
    });
    
    ctx.restore();
  }, [image, detections, scale, offset]);
  
  // Bounding box rendering
  const drawBoundingBox = (
    ctx: CanvasRenderingContext2D,
    detection: Detection,
    index: number
  ) => {
    const color = getColorForClass(detection.class);
    
    // Convert coordinates
    const dims = getDrawDimensions();
    const boxX = dims.drawX + detection.x * dims.scaleX - (detection.width * dims.scaleX) / 2;
    const boxY = dims.drawY + detection.y * dims.scaleY - (detection.height * dims.scaleY) / 2;
    
    // Draw box
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.strokeRect(boxX, boxY, detection.width * dims.scaleX, detection.height * dims.scaleY);
    
    // Draw label
    ctx.fillStyle = color;
    ctx.font = "12px Arial";
    ctx.fillText(`${detection.class} ${(detection.confidence * 100).toFixed(1)}%`, boxX + 5, boxY - 5);
  };
  
  // Zoom functionality
  const handleWheel = (e: WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setScale(prevScale => Math.min(Math.max(prevScale * delta, 1), 3));
  };
  
  // Pan functionality
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsPanning(true);
    setPanStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };
  
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPanning) return;
    setOffset({
      x: e.clientX - panStart.x,
      y: e.clientY - panStart.y
    });
  };
  
  // Rendering effect
  useEffect(() => {
    draw();
  }, [draw]);
}
```

#### 3. **Anomaly Detection Summary**

**DetectionMetadata Component** (part of thermal-image-canvas.tsx):
```typescript
function DetectionMetadata({ detection, isHighlighted }: Props) {
  return (
    <div
      className={`p-3 rounded-lg border cursor-pointer transition-all ${
        isHighlighted ? 'border-primary shadow-lg bg-primary/5' : ''
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: getColorForClass(detection.class) }}
          />
          <span className="text-sm font-medium">{detection.class}</span>
          <span className="text-xs text-gray-500">
            {(detection.confidence * 100).toFixed(1)}%
          </span>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="font-mono">X: {Math.round(detection.x)}px</div>
        <div className="font-mono">Y: {Math.round(detection.y)}px</div>
        <div className="font-mono">W: {Math.round(detection.width)}px</div>
        <div className="font-mono">H: {Math.round(detection.height)}px</div>
      </div>
      
      <div className="mt-2 text-xs text-gray-600">
        Area: {Math.round(detection.width * detection.height)} px²
      </div>
    </div>
  );
}
```

---

## Database Updates

### ThermalImage Table Schema
```sql
ALTER TABLE thermal_images ADD COLUMN detection_data TEXT COMMENT 'JSON array of detections';
ALTER TABLE thermal_images ADD COLUMN anomaly_detected BOOLEAN DEFAULT FALSE;

-- Create index for faster queries
CREATE INDEX idx_anomaly_detected ON thermal_images(anomaly_detected);
```

### Sample Detection Data
```json
{
  "predictions": [
    {
      "detection_id": "det_001",
      "class": "faulty",
      "confidence": 0.9523,
      "x": 156,
      "y": 203,
      "width": 45,
      "height": 52,
      "annotationType": "ai_detected",
      "createdBy": "ai_system",
      "createdAt": "2025-10-15T10:30:00Z"
    },
    {
      "detection_id": "det_002",
      "class": "potentially_faulty",
      "confidence": 0.7821,
      "x": 298,
      "y": 321,
      "width": 61,
      "height": 58,
      "annotationType": "ai_detected",
      "createdBy": "ai_system",
      "createdAt": "2025-10-15T10:30:00Z"
    }
  ]
}
```

---

## API Endpoints

### Thermal Image Upload (Enhanced)
```http
POST /api/thermal-images/upload
Content-Type: multipart/form-data

inspectionId: 550e8400-e29b-41d4-a716-446655440002
file: [thermal_image.jpg]
imageType: Maintenance
weatherCondition: Sunny

Response: 200 OK
{
  "id": "550e8400-e29b-41d4-a716-446655440003",
  "imageUrl": "/uploads/thermal-image-abc123.jpg",
  "imageType": "Maintenance",
  "anomalyDetected": true,
  "detectionData": "[{detection_id, class, confidence, x, y, width, height}, ...]",
  "uploadedAt": "2025-10-15T10:30:00Z"
}
```

### Get Thermal Images
```http
GET /api/thermal-images?inspectionId=550e8400-e29b-41d4-a716-446655440002

Response: 200 OK
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440003",
    "imageUrl": "/uploads/maintenance-image.jpg",
    "imageType": "Maintenance",
    "anomalyDetected": true,
    "detectionData": "[...]",
    "uploadedAt": "2025-10-15T10:30:00Z"
  },
  {
    "id": "550e8400-e29b-41d4-a716-446655440004",
    "imageUrl": "/uploads/baseline-image.jpg",
    "imageType": "Baseline",
    "weatherCondition": "Sunny",
    "uploadedAt": "2025-10-15T09:00:00Z"
  }
]
```

### Update Detection Data
```http
PUT /api/thermal-images/{id}/detections
Content-Type: application/json

[
  {
    "detection_id": "det_001",
    "class": "faulty",
    "confidence": 0.95,
    "x": 156,
    "y": 203,
    "width": 45,
    "height": 52
  }
]

Response: 200 OK
{
  "id": "550e8400-e29b-41d4-a716-446655440003",
  "detectionData": "[...]",
  ...
}
```

---

## Configuration

### Backend Configuration (application.properties)
```properties
# Roboflow AI Configuration
roboflow.api.key=${ROBOFLOW_API_KEY}
roboflow.api.url=https://api.roboflow.com
roboflow.project.name=transformer-anomalies
roboflow.project.version=1
roboflow.confidence.threshold=0.5

# File Upload Configuration
file.upload-dir=/uploads
file.max-size=52428800  # 50MB
file.allowed-types=jpg,jpeg,png,tiff

# Progress Tracking
progress.update-interval=1000  # milliseconds
```

### Environment Variables
```bash
export ROBOFLOW_API_KEY="your-api-key-here"
export ROBOFLOW_WORKSPACE_NAME="your-workspace"
export ANOMALY_DETECTION_ENABLED=true
export CONFIDENCE_THRESHOLD=0.5
```
---
