# Roboflow Model Retraining Guide

## Overview

This guide explains how to use the corrected annotations from your application to retrain the AI model on Roboflow.

---

## 🎯 Workflow: From User Corrections to Model Retraining

```
User edits/adds annotations
         ↓
Annotations saved to database (with metadata)
         ↓
Click "Upload to Roboflow for Retraining"
         ↓
Images + annotations sent to Roboflow
         ↓
Generate new dataset version
         ↓
Train improved AI model
         ↓
Deploy updated model
         ↓
Better detection accuracy!
```

---

## 🚀 How to Retrain the Model

### Option 1: Upload Single Image (After Editing)

**When to use:** You've corrected annotations on a specific thermal image.

**Steps:**
1. View an inspection with edited annotations
2. Look for the "Upload to Roboflow for Retraining" button (appears when user has made edits)
3. Click the button
4. Select dataset split (train/valid/test)
5. Click "Upload to Roboflow"
6. Wait for confirmation

**API Endpoint:**
```bash
POST /api/roboflow/upload/{thermalImageId}?split=train
```

---

### Option 2: Batch Upload All User Corrections

**When to use:** You want to upload all images where users have made corrections.

**Steps:**
1. Call the batch upload API endpoint
2. All images with `user_added` or `user_edited` annotations will be uploaded

**API Endpoint:**
```bash
POST /api/roboflow/upload/user-corrections?split=train
```

**Response:**
```json
{
  "success": true,
  "total": 15,
  "success": 14,
  "failure": 1,
  "split": "train",
  "message": "User-corrected annotations uploaded to Roboflow for retraining"
}
```

---

### Option 3: Manual Batch Upload

**When to use:** You want to upload specific images.

**API Endpoint:**
```bash
POST /api/roboflow/upload/batch?split=train
Content-Type: application/json

["uuid1", "uuid2", "uuid3"]
```

---

## 📋 Dataset Splits

When uploading, you must specify which split the data goes into:

| Split | Purpose | Recommended % |
|-------|---------|---------------|
| `train` | Training the model | 70% |
| `valid` | Validating during training | 20% |
| `test` | Final model evaluation | 10% |

---

## 🔧 Configuration

### Update Roboflow Credentials

**File:** `backend/src/main/java/com/example/transformermanagement/service/RoboflowDatasetService.java`

```java
// Update these with your Roboflow workspace/project
private static final String WORKSPACE_ID = "isiriw";
private static final String PROJECT_ID = "detect-count-and-visualize";
private static final String ROBOFLOW_API_KEY = "xLuuGmq6EfcX0kVtqEnA";
```

**To find your workspace and project IDs:**
1. Go to your Roboflow project
2. Look at the URL: `app.roboflow.com/{workspace}/{project}/...`
3. Get your API key from: Settings → Roboflow API → Private API Key

---

## 📊 Annotation Format Sent to Roboflow

**JSON Format:**
```json
{
  "image": "base64_encoded_image_data",
  "annotation": {
    "image": {
      "width": 1024,
      "height": 768,
      "name": "thermal_image_123.jpg"
    },
    "annotations": [
      {
        "x": 512.5,
        "y": 384.2,
        "width": 128.0,
        "height": 96.0,
        "class": "faulty",
        "annotationType": "user_edited",
        "createdBy": "system",
        "note": "User corrected this detection"
      }
    ]
  }
}
```

---

## 🎓 Complete Retraining Process

### Step 1: Accumulate Training Data
- Users review AI detections
- Users correct false positives/negatives
- Users add missing annotations
- All edits saved with metadata

### Step 2: Upload to Roboflow
**Using UI:**
- Click "Upload to Roboflow" button on inspection page

**Using API:**
```bash
# Upload all user corrections
curl -X POST http://localhost:8080/api/roboflow/upload/user-corrections?split=train
```

### Step 3: Generate New Dataset Version (On Roboflow)
1. Go to your Roboflow project
2. Navigate to "Versions" tab
3. Click "Generate New Version"
4. Select preprocessing/augmentation options
5. Click "Generate"

### Step 4: Train New Model
**Option A: On Roboflow (Recommended)**
1. After generating version, click "Train Model"
2. Select training duration (Small/Medium/Large)
3. Wait for training to complete

**Option B: Trigger via API**
```bash
POST /api/roboflow/train?version=2
```

### Step 5: Deploy Updated Model
1. Once training completes, test the new model
2. If satisfied, deploy to production
3. Update your inference endpoint to use the new version

---

## 🔍 Export Annotations (Alternative Formats)

### YOLO Format Export

**API Endpoint:**
```bash
GET /api/roboflow/export/yolo/{thermalImageId}
```

**Response:**
```
0 0.500000 0.500000 0.125000 0.125000
1 0.195312 0.195312 0.062500 0.062500
```

**Format:** `<class_id> <x_center> <y_center> <width> <height>` (normalized 0-1)

**Class Mapping:**
- `0` = faulty
- `1` = potentially_faulty
- `2` = normal

---

## 📈 Monitoring Training Quality

### Metadata Tracked for Each Annotation:
- **`annotationType`**: `ai_detected`, `user_added`, `user_edited`, `user_deleted`
- **`createdBy`**: User ID who created the annotation
- **`createdAt`**: Timestamp of creation
- **`modifiedBy`**: User ID who last modified
- **`modifiedAt`**: Timestamp of last modification
- **`comments`**: Optional notes about the annotation

### Why This Matters:
- Track which annotations are human-verified
- Identify users who provide high-quality corrections
- Measure improvement in AI accuracy over time
- Build an audit trail for compliance

---

## 🚨 Troubleshooting

### Error: "Failed to upload to Roboflow"

**Possible causes:**
1. Invalid API key
2. Incorrect workspace/project ID
3. Network connectivity issues
4. Image file not found

**Solutions:**
```java
// Check console logs for detailed error messages
System.err.println("Roboflow upload failed: " + response.statusCode());
```

### Error: "No annotations found"

**Cause:** Trying to upload an image with no bounding boxes.

**Solution:** Only upload images that have at least one annotation.

### Error: "Image file not found"

**Cause:** Image path incorrect or file deleted.

**Solution:** Verify `file.upload-dir` in `application.properties`.

---

## 🎯 Best Practices

### 1. Quality Over Quantity
- Focus on correcting obvious AI mistakes
- Add annotations for missed anomalies
- Remove false positives

### 2. Consistent Labeling
- Use the same class names consistently
- Follow annotation guidelines
- Add meaningful comments when ambiguous

### 3. Balanced Dataset
- Upload similar numbers to train/valid/test splits
- Ensure all classes are represented
- Include diverse weather conditions

### 4. Iterative Improvement
- Train new version after ~50-100 corrections
- Test new model on held-out data
- Compare performance metrics
- Repeat process

### 5. Track Metadata
- Review who made corrections
- Identify high-quality annotators
- Use comments for edge cases

---

## 🔗 API Reference

### Upload Single Image
```http
POST /api/roboflow/upload/{thermalImageId}?split=train
```

### Batch Upload
```http
POST /api/roboflow/upload/batch?split=train
Content-Type: application/json
Body: ["uuid1", "uuid2"]
```

### Upload User Corrections
```http
POST /api/roboflow/upload/user-corrections?split=train
```

### Export YOLO
```http
GET /api/roboflow/export/yolo/{thermalImageId}
```

### Trigger Training
```http
POST /api/roboflow/train?version=2
```

---

## 📚 Additional Resources

- [Roboflow Documentation](https://docs.roboflow.com/)
- [Roboflow Upload API](https://docs.roboflow.com/api-reference/upload)
- [Model Training Guide](https://docs.roboflow.com/train)
- [Dataset Versioning](https://docs.roboflow.com/datasets/versioning)

---

## ✅ Checklist for Production

- [ ] Update Roboflow API key
- [ ] Update workspace/project IDs
- [ ] Test upload with sample image
- [ ] Verify annotations format
- [ ] Set up monitoring for failed uploads
- [ ] Document class mapping
- [ ] Train baseline model
- [ ] Deploy and test improved model
- [ ] Set up periodic retraining schedule

---

**Need Help?** Check Roboflow documentation or contact their support.

