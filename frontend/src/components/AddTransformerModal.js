import React, { useState } from 'react';
import './AddTransformerModal.css';

const AddTransformerModal = ({ isOpen, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    region: '',
    transformerNo: '',
    poleNo: '',
    type: '',
    locationDetails: '',
    imageType: 'Baseline',
    environmentConditionTag: 'Sunny',
    uploadedImage: null,
    uploaderAdminUserId: '0001'
  });

  const [errors, setErrors] = useState({});

  const regions = ['Nugegoda', 'Maharagama', 'Colombo', 'Kandy', 'Galle'];
  const types = ['Bulk', 'Distribution'];
  const environmentConditions = ['Sunny', 'Cloudy', 'Rainy'];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
      if (!allowedTypes.includes(file.type)) {
        setErrors(prev => ({
          ...prev,
          image: 'Please upload a valid image file (JPEG, PNG, JPG)'
        }));
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({
          ...prev,
          image: 'Image size should be less than 5MB'
        }));
        return;
      }

      setFormData(prev => ({
        ...prev,
        uploadedImage: file
      }));
      
      // Clear image error
      if (errors.image) {
        setErrors(prev => ({
          ...prev,
          image: ''
        }));
      }
    }
  };

  const generateRandomId = () => {
    return Math.random().toString(36).substr(2, 9).toUpperCase();
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.region.trim()) {
      newErrors.region = 'Region is required';
    }
    if (!formData.transformerNo.trim()) {
      newErrors.transformerNo = 'Transformer No is required';
    }
    if (!formData.poleNo.trim()) {
      newErrors.poleNo = 'Pole No is required';
    }
    if (!formData.type.trim()) {
      newErrors.type = 'Type is required';
    }
    if (!formData.locationDetails.trim()) {
      newErrors.locationDetails = 'Location Details is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    // Create submission data with generated image ID and current timestamp
    const submissionData = {
      ...formData,
      imageId: generateRandomId(),
      uploadDataTime: new Date().toISOString(),
      // Only include environment condition if image type is Baseline
      environmentConditionTag: formData.imageType === 'Baseline' ? formData.environmentConditionTag : null
    };

    console.log('Transformer Data:', submissionData);
    
    // Call parent submit handler
    onSubmit(submissionData);
    
    // Reset form
    setFormData({
      region: '',
      transformerNo: '',
      poleNo: '',
      type: '',
      locationDetails: '',
      imageType: 'Baseline',
      environmentConditionTag: 'Sunny',
      uploadedImage: null,
      uploaderAdminUserId: '0001'
    });
    
    // Close modal
    onClose();
  };

  const handleCancel = () => {
    // Reset form
    setFormData({
      region: '',
      transformerNo: '',
      poleNo: '',
      type: '',
      locationDetails: '',
      imageType: 'Baseline',
      environmentConditionTag: 'Sunny',
      uploadedImage: null,
      uploaderAdminUserId: '0001'
    });
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Add Transformer</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="transformer-form">
          {/* Region */}
          <div className="form-group">
            <label htmlFor="region">Regions</label>
            <select
              id="region"
              name="region"
              value={formData.region}
              onChange={handleInputChange}
              className={errors.region ? 'error' : ''}
            >
              <option value="">Region</option>
              {regions.map(region => (
                <option key={region} value={region}>{region}</option>
              ))}
            </select>
            {errors.region && <span className="error-text">{errors.region}</span>}
          </div>

          {/* Transformer No */}
          <div className="form-group">
            <label htmlFor="transformerNo">Transformer No</label>
            <input
              type="text"
              id="transformerNo"
              name="transformerNo"
              placeholder="Transformer No"
              value={formData.transformerNo}
              onChange={handleInputChange}
              className={errors.transformerNo ? 'error' : ''}
            />
            {errors.transformerNo && <span className="error-text">{errors.transformerNo}</span>}
          </div>

          {/* Pole No */}
          <div className="form-group">
            <label htmlFor="poleNo">Pole No</label>
            <input
              type="text"
              id="poleNo"
              name="poleNo"
              placeholder="Pole No"
              value={formData.poleNo}
              onChange={handleInputChange}
              className={errors.poleNo ? 'error' : ''}
            />
            {errors.poleNo && <span className="error-text">{errors.poleNo}</span>}
          </div>

          {/* Type */}
          <div className="form-group">
            <label htmlFor="type">Type</label>
            <select
              id="type"
              name="type"
              value={formData.type}
              onChange={handleInputChange}
              className={errors.type ? 'error' : ''}
            >
              <option value="">Type</option>
              {types.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
            {errors.type && <span className="error-text">{errors.type}</span>}
          </div>

          {/* Location Details */}
          <div className="form-group">
            <label htmlFor="locationDetails">Location Details</label>
            <textarea
              id="locationDetails"
              name="locationDetails"
              placeholder="Location Details"
              value={formData.locationDetails}
              onChange={handleInputChange}
              className={errors.locationDetails ? 'error' : ''}
              rows={3}
            />
            {errors.locationDetails && <span className="error-text">{errors.locationDetails}</span>}
          </div>

          {/* Image Type - Radio Buttons */}
          <div className="form-group">
            <label>Image Type</label>
            <div className="radio-group">
              <label className="radio-option">
                <input
                  type="radio"
                  name="imageType"
                  value="Baseline"
                  checked={formData.imageType === 'Baseline'}
                  onChange={handleInputChange}
                />
                <span className="radio-custom"></span>
                Baseline
              </label>
              <label className="radio-option">
                <input
                  type="radio"
                  name="imageType"
                  value="Maintenance"
                  checked={formData.imageType === 'Maintenance'}
                  onChange={handleInputChange}
                />
                <span className="radio-custom"></span>
                Maintenance
              </label>
            </div>
          </div>

          {/* Environment Condition - Only show if Baseline is selected */}
          {formData.imageType === 'Baseline' && (
            <div className="form-group">
              <label htmlFor="environmentConditionTag">Environment Condition</label>
              <select
                id="environmentConditionTag"
                name="environmentConditionTag"
                value={formData.environmentConditionTag}
                onChange={handleInputChange}
              >
                {environmentConditions.map(condition => (
                  <option key={condition} value={condition}>{condition}</option>
                ))}
              </select>
            </div>
          )}

          {/* Image Upload */}
          <div className="form-group">
            <label htmlFor="imageUpload">Upload Image</label>
            <div className="file-upload-container">
              <input
                type="file"
                id="imageUpload"
                accept="image/*"
                onChange={handleImageUpload}
                className="file-input"
              />
              <label htmlFor="imageUpload" className="file-upload-btn">
                {formData.uploadedImage ? formData.uploadedImage.name : 'Choose Image'}
              </label>
            </div>
            {errors.image && <span className="error-text">{errors.image}</span>}
          </div>

          {/* Hidden fields for tracking */}
          <div className="form-group hidden">
            <input
              type="hidden"
              name="uploaderAdminUserId"
              value={formData.uploaderAdminUserId}
            />
          </div>

          {/* Form Actions */}
          <div className="form-actions">
            <button type="submit" className="confirm-btn">
              Confirm
            </button>
            <button type="button" className="cancel-btn" onClick={handleCancel}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddTransformerModal;
