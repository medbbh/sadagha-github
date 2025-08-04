// components/common/ImageUpload.jsx
import React, { useState, useRef } from 'react';
import { Upload, X, Camera, Trash2 } from 'lucide-react';

export default function ImageUpload({ 
  currentImage, 
  onImageUpload, 
  onImageDelete, 
  type = 'profile', // 'profile' or 'cover'
  loading = false,
  className = ''
}) {
  const [dragOver, setDragOver] = useState(false);
  const [previewImage, setPreviewImage] = useState(currentImage);
  const fileInputRef = useRef(null);

  const isProfile = type === 'profile';
  const isCover = type === 'cover';

  // Validate image file
  const validateImage = (file) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!allowedTypes.includes(file.type)) {
      throw new Error('Please upload a valid image file (JPEG, PNG, or WebP)');
    }

    if (file.size > maxSize) {
      throw new Error('Image size must be less than 5MB');
    }

    return true;
  };

  // Handle file selection
  const handleFileSelect = (file) => {
    try {
      validateImage(file);
      
      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setPreviewImage(previewUrl);
      
      // Call upload handler
      onImageUpload(file);
      
    } catch (error) {
      alert(error.message);
    }
  };

  // Handle file input change
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  // Handle drag and drop
  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  // Handle delete
  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete this ${type} image?`)) {
      setPreviewImage(null);
      onImageDelete();
    }
  };

  // Click to upload
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const containerClasses = `
    relative overflow-hidden border-2 border-dashed transition-all duration-200 cursor-pointer
    ${dragOver ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'}
    ${loading ? 'opacity-50 cursor-not-allowed' : ''}
    ${isProfile ? 'w-32 h-32 rounded-full' : 'w-full h-48 rounded-lg'}
    ${className}
  `;

  const overlayClasses = `
    absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 
    hover:opacity-100 transition-opacity duration-200
    ${loading ? 'opacity-100' : ''}
  `;

  return (
    <div className="space-y-3">
      {/* Image Upload Area */}
      <div
        className={containerClasses}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={!loading ? handleUploadClick : undefined}
      >
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          onChange={handleFileChange}
          className="hidden"
          disabled={loading}
        />

        {/* Image Preview or Upload Placeholder */}
        {previewImage ? (
          <>
            <img
              src={previewImage}
              alt={`${type} preview`}
              className={`w-full h-full object-cover ${isProfile ? 'rounded-full' : 'rounded-lg'}`}
            />
            
            {/* Overlay with actions */}
            <div className={overlayClasses}>
              {loading ? (
                <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-white"></div>
              ) : (
                <div className="flex space-x-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleUploadClick();
                    }}
                    className="p-2 bg-white bg-opacity-20 rounded-full hover:bg-opacity-30 transition-colors"
                    title="Change image"
                  >
                    <Camera className="w-4 h-4 text-white" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete();
                    }}
                    className="p-2 bg-red-500 bg-opacity-80 rounded-full hover:bg-opacity-100 transition-colors"
                    title="Delete image"
                  >
                    <Trash2 className="w-4 h-4 text-white" />
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          /* Upload Placeholder */
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <Upload className={`${isProfile ? 'w-8 h-8' : 'w-12 h-12'} mb-2`} />
            <div className="text-center">
              <p className={`${isProfile ? 'text-xs' : 'text-sm'} font-medium`}>
                Upload {type}
              </p>
              <p className={`${isProfile ? 'text-xs' : 'text-xs'} text-gray-400 mt-1`}>
                {isProfile ? 'JPG, PNG' : 'JPG, PNG, WebP'}
              </p>
              <p className="text-xs text-gray-400">
                Max 5MB
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Upload Instructions */}
      <div className="text-center">
        <p className="text-xs text-gray-500">
          {isProfile ? 'Recommended: 400x400px' : 'Recommended: 1200x400px'}
        </p>
        <p className="text-xs text-gray-400">
          Click to upload or drag and drop
        </p>
      </div>
    </div>
  );
}