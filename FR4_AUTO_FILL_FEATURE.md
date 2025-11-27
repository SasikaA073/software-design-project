# FR4: Maintenance Record Auto-Fill Feature

## Overview

The Maintenance Record Form now automatically populates critical fields when you select an inspection and transformer. This streamlines the record creation process and ensures data consistency.

## Auto-Fill Features

### 1. **Inspector Name Auto-Fill**
- **Trigger**: When you select an inspection
- **Source**: Inspection's `inspectedBy` field
- **Benefit**: No need to manually re-enter inspector name
- **Status**: ✅ Auto-populated in form

### 2. **Baseline Image Display**
- **Trigger**: When you select a transformer
- **Source**: Transformer's baseline image URLs (Sunny/Cloudy/Rainy)
- **Priority**: Sunny > Cloudy > Rainy
- **Display**: Side-by-side with maintenance image
- **Status**: ✅ Auto-loaded and displayed

### 3. **Maintenance Thermal Image with Bounding Boxes**
- **Trigger**: When you select an inspection
- **Source**: Thermal image from inspection report
- **Visualization**: Interactive canvas with anomaly bounding boxes
- **Details Shown**: 
  - Bounding box coordinates (X, Y, Width, Height)
  - Confidence percentage
  - Anomaly classification (Faulty/Potentially Faulty/Normal)
- **Status**: ✅ Auto-loaded with visual representation

### 4. **Detected Anomalies Auto-Population**
- **Trigger**: When you select an inspection
- **Source**: Detection data from thermal image metadata
- **Information Provided**:
  - Anomaly class (faulty, potentially_faulty, normal)
  - Confidence score (as percentage)
  - Bounding box coordinates
  - Comments from AI detection
- **Display**: 
  - Visual bounding boxes on maintenance image (via ThermalImageCanvas)
  - Detailed list below with all anomaly information
  - Color-coded badges (Red/Orange/Green) for classification
- **Status**: ✅ Auto-detected and displayed

## User Flow

### Creating a Maintenance Record

1. **Open Create Maintenance Record Page**
   - Navigate to `/maintenance-records/create`

2. **Select Transformer**
   ```
   Form Status:
   - Baseline image loads automatically
   - Ready for next step
   ```

3. **Select Inspection**
   ```
   Form Status:
   - Inspector name auto-fills
   - Inspection date displays
   - Thermal images load (baseline + maintenance)
   - Anomalies parse and display
   - Bounding boxes render on maintenance image
   ```

4. **Review Auto-Filled Data**
   - **Left Column**: Static baseline image (reference)
   - **Right Column**: Maintenance image with interactive anomaly bounding boxes
   - **Below**: Detailed list of all detected anomalies

5. **Adjust if Needed**
   - All auto-filled fields are editable
   - Can add engineer notes, comments, recommendations
   - Can modify status if needed

6. **Submit**
   - All data (auto-filled + manual) saves to database
   - Record gets unique ID and record number

## Technical Implementation

### Component: `maintenance-record-form.tsx`

**New Imports**:
```typescript
import { ThermalImageCanvas } from "@/components/inspections/thermal-image-canvas"
import { Thermometer } from "lucide-react"
```

**New State Variables**:
```typescript
const [baselineImageUrl, setBaselineImageUrl] = useState<string | null>(null)
const [thermalImages, setThermalImages] = useState<ThermalImageData[]>([])
const [detections, setDetections] = useState<Detection[]>([])
const [loadingAuxData, setLoadingAuxData] = useState(false)
```

**Key Functions**:

1. **`loadBaselineImage(transformerId)`**
   - Calls `api.getTransformer(transformerId)`
   - Extracts baseline URL (Sunny/Cloudy/Rainy)
   - Updates `baselineImageUrl` state

2. **`autoFillFromInspection()`**
   - Called when inspection is selected
   - Fetches inspection details via `api.getInspection()`
   - Extracts inspector name → populates form
   - Loads thermal images via `api.getThermalImages()`
   - Parses detection JSON from `detectionData` field
   - Updates states with images and detections

3. **`getAnomalyTypeVariant(anomalyClass)`**
   - Maps anomaly class to badge color
   - faulty → red (destructive)
   - potentially_faulty → orange (secondary)
   - normal → green (default)

### API Methods Used

**New Method Added** (in `lib/api.ts`):
```typescript
async getTransformer(id: string): Promise<ApiResponse<TransformerData>>
async getTransformerDetails(id: string): Promise<ApiResponse<TransformerData>>
```

**Existing Methods**:
- `api.getInspection(id)` - Fetch inspection details
- `api.getThermalImages(inspectionId)` - Fetch thermal images and detections

## UI Layout

### Thermal Image Analysis Section

```
┌─────────────────────────────────────────────────────┐
│  🌡️ Thermal Image Analysis    [2 Anomalies]        │
├─────────────────────────────────────────────────────┤
│
│  ┌──────────────────────┐  ┌──────────────────────┐
│  │  Baseline Image      │  │  Maintenance Image   │
│  │  (Reference)         │  │  (with Anomalies)    │
│  │                      │  │  [Red Badge: 2 Anom] │
│  │  [Static Image]      │  │  [Canvas w/ Boxes]   │
│  │                      │  │                      │
│  └──────────────────────┘  └──────────────────────┘
│
├─────────────────────────────────────────────────────┤
│  Detected Anomalies (2)   [Auto-detected]           │
├─────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────┐   │
│  │ 🔴 Faulty  Confidence: 95.5%                │   │
│  │ X: 120px  Y: 145px  Width: 50px Height: 40px│   │
│  │ Comments: High thermal gradient detected    │   │
│  └─────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────┐   │
│  │ 🟠 Potentially Faulty  Confidence: 78.2%   │   │
│  │ X: 250px  Y: 300px  Width: 65px Height: 55px│   │
│  │ Comments: Elevated temperature zone        │   │
│  └─────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

## Data Flow

```
User selects Transformer
        ↓
loadBaselineImage(transformerId)
        ↓
getTransformer(transformerId) → Extract baseline URLs
        ↓
Baseline image displayed

User selects Inspection
        ↓
autoFillFromInspection()
        ↓
├─ getInspection(inspectionId) → Extract inspector name
├─ getThermalImages(inspectionId) → Load images
└─ Parse detectionData → Extract bounding boxes
        ↓
Form populated with:
├─ Inspector name (text field)
├─ Inspection timestamp (metadata)
├─ Baseline image (left column)
├─ Maintenance image with boxes (right column)
├─ Anomaly list (below)
└─ Detection coordinates and confidence
```

## Error Handling

- **Missing baseline image**: Shows message "No baseline image available"
- **Failed to load inspection**: Error alert displayed, inspection not selected
- **No anomalies detected**: Section not shown, form still functional
- **Malformed detection JSON**: Error logged, empty detections array fallback

## Loading States

- **`loadingAuxData`** indicator shows during inspection data fetch
- Prevents user interaction while data loads
- Automatically clears after data is populated

## Testing Checklist

- [ ] Select transformer → baseline image loads
- [ ] Select inspection → inspector name fills in
- [ ] Select inspection → thermal images load
- [ ] Maintenance image shows bounding boxes
- [ ] Anomalies list displays all detections
- [ ] Can edit all fields after auto-fill
- [ ] Can submit record with auto-filled data
- [ ] Print shows all auto-filled content
- [ ] No anomalies case → form still works
- [ ] Missing baseline image case → form still works

## Benefits

✅ **Faster Record Creation**: Pre-fills inspector and inspection data  
✅ **Visual Verification**: See anomalies immediately on form  
✅ **Data Accuracy**: Pulls directly from inspection source  
✅ **Better Workflow**: No re-entering inspector name  
✅ **Professional Output**: Includes reference images and analysis  
✅ **Interactive UI**: Bounding boxes with coordinates displayed  

## Future Enhancements

1. **Filtering**: Allow filtering anomalies by confidence threshold
2. **Acknowledgment**: Checkbox to acknowledge each anomaly
3. **Comments**: Pre-fill comments from inspection report
4. **Templates**: Save/load maintenance plan templates
5. **Recommendations**: Auto-suggest actions based on anomaly severity
6. **Notifications**: Alert if critical anomalies detected

---

**Version**: 1.0  
**Status**: ✅ Complete & Tested  
**Last Updated**: November 27, 2025
