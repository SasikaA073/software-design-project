import React, { useState } from 'react';
import './TransformerDashboard.css';
import AddTransformerModal from './AddTransformerModal';

const TransformerDashboard = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('All Regions');
  const [selectedType, setSelectedType] = useState('All Types');
  const [sortBy, setSortBy] = useState('By Transformer No');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Sample transformer data based on your image
  const [transformers, setTransformers] = useState([
    { id: 1, transformerNo: 'AZ-8890', poleNo: 'EN-122-A', region: 'Nugegoda', type: 'Bulk', starred: true },
    { id: 2, transformerNo: 'AZ-1649', poleNo: 'EN-122-A', region: 'Nugegoda', type: 'Bulk', starred: false },
    { id: 3, transformerNo: 'AZ-7316', poleNo: 'EN-122-B', region: 'Nugegoda', type: 'Bulk', starred: false },
    { id: 4, transformerNo: 'AZ-4613', poleNo: 'EN-122-B', region: 'Nugegoda', type: 'Bulk', starred: false },
    { id: 5, transformerNo: 'AX-8993', poleNo: 'EN-122-A', region: 'Nugegoda', type: 'Distribution', starred: false },
    { id: 6, transformerNo: 'AY-8790', poleNo: 'EN-122-B', region: 'Nugegoda', type: 'Distribution', starred: false },
    { id: 7, transformerNo: 'AZ-4563', poleNo: 'EN-123-A', region: 'Maharagama', type: 'Bulk', starred: false },
    { id: 8, transformerNo: 'AZ-8523', poleNo: 'EN-123-A', region: 'Maharagama', type: 'Bulk', starred: false },
    { id: 9, transformerNo: 'AZ-8456', poleNo: 'EN-123-B', region: 'Maharagama', type: 'Bulk', starred: false },
    { id: 10, transformerNo: 'AZ-7896', poleNo: 'EN-123-B', region: 'Maharagama', type: 'Bulk', starred: false },
    { id: 11, transformerNo: 'AX-8990', poleNo: 'EN-123-A', region: 'Maharagama', type: 'Distribution', starred: false }
  ]);

  const [starredTransformers, setStarredTransformers] = useState(
    transformers.filter(t => t.starred).map(t => t.id)
  );

  const regions = ['All Regions', 'Nugegoda', 'Maharagama'];
  const types = ['All Types', 'Bulk', 'Distribution'];

  const toggleStar = (id) => {
    setStarredTransformers(prev => 
      prev.includes(id) 
        ? prev.filter(starId => starId !== id)
        : [...prev, id]
    );
  };

  const filteredTransformers = transformers.filter(transformer => {
    const matchesSearch = transformer.transformerNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transformer.poleNo.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRegion = selectedRegion === 'All Regions' || transformer.region === selectedRegion;
    const matchesType = selectedType === 'All Types' || transformer.type === selectedType;
    
    return matchesSearch && matchesRegion && matchesType;
  });

  const handleAddTransformer = (newTransformerData) => {
    // Create new transformer object with a unique ID
    const newTransformer = {
      id: transformers.length + 1,
      transformerNo: newTransformerData.transformerNo,
      poleNo: newTransformerData.poleNo,
      region: newTransformerData.region,
      type: newTransformerData.type,
      starred: false,
      locationDetails: newTransformerData.locationDetails,
      imageId: newTransformerData.imageId,
      imageType: newTransformerData.imageType,
      environmentConditionTag: newTransformerData.environmentConditionTag,
      uploadDataTime: newTransformerData.uploadDataTime,
      uploaderAdminUserId: newTransformerData.uploaderAdminUserId,
      uploadedImage: newTransformerData.uploadedImage
    };

    // Add to transformers list
    setTransformers(prev => [...prev, newTransformer]);
    
    // Show success message (you can implement a toast notification here)
    console.log('New transformer added successfully:', newTransformer);
  };

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedRegion('All Regions');
    setSelectedType('All Types');
    setSortBy('By Transformer No');
  };

  return (
    <div className="transformer-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div className="header-left">
          <div className="header-icon">
            <span className="icon">⚡</span>
          </div>
          <h1 className="header-title">Transformers</h1>
        </div>
        <div className="header-right">
          <button 
            className="add-transformer-btn"
            onClick={() => setIsModalOpen(true)}
          >
            Add Transformer
          </button>
          <div className="header-tabs">
            <button className="tab-btn active">Transformers</button>
            <button className="tab-btn">Inspections</button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="filters-left">
          <select 
            className="sort-dropdown"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option>By Transformer No</option>
            <option>By Region</option>
            <option>By Type</option>
          </select>
          
          <div className="search-container">
            <input
              type="text"
              placeholder="Search Transformer"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            <button className="search-btn">🔍</button>
          </div>
          
          <button className="star-btn">⭐</button>
        </div>
        
        <div className="filters-right">
          <select 
            className="filter-dropdown"
            value={selectedRegion}
            onChange={(e) => setSelectedRegion(e.target.value)}
          >
            {regions.map(region => (
              <option key={region} value={region}>{region}</option>
            ))}
          </select>
          
          <select 
            className="filter-dropdown"
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
          >
            {types.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
          
          <button className="reset-filters-btn" onClick={resetFilters}>Reset Filters</button>
        </div>
      </div>

      {/* Table */}
      <div className="table-container">
        <table className="transformers-table">
          <thead>
            <tr>
              <th></th>
              <th>Transformer No. ↕</th>
              <th>Pole No.</th>
              <th>Region</th>
              <th>Type</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filteredTransformers.map((transformer) => (
              <tr key={transformer.id}>
                <td>
                  <button 
                    className={`star-icon ${starredTransformers.includes(transformer.id) ? 'starred' : ''}`}
                    onClick={() => toggleStar(transformer.id)}
                  >
                    {starredTransformers.includes(transformer.id) ? '★' : '☆'}
                  </button>
                </td>
                <td className="transformer-no">{transformer.transformerNo}</td>
                <td>{transformer.poleNo}</td>
                <td>{transformer.region}</td>
                <td>{transformer.type}</td>
                <td>
                  <button className="view-btn">View</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Transformer Modal */}
      <AddTransformerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleAddTransformer}
      />
    </div>
  );
};

export default TransformerDashboard;
