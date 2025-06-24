import { useEffect, useState } from "react";
import { 
  Edit3, 
  X, 
  Upload, 
  Image,
  Trash2,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
export default function CampaignCarousel({ 
  files, 
  isEditing, 
  formData, 
  onFileChange, 
  onMarkForDeletion, 
  onUnmarkForDeletion, 
  onRemoveNewFile 
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showImageManager, setShowImageManager] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(true);
  
  const allFiles = files || [];
  const hasFiles = allFiles.length > 0;

  // Reset currentIndex when files change or if currentIndex is out of bounds
  useEffect(() => {
    if (allFiles.length > 0 && currentIndex >= allFiles.length) {
      setCurrentIndex(0);
    }
  }, [allFiles.length, currentIndex]);

  const nextImage = () => {
    if (allFiles.length > 1) {
      setCurrentIndex((prev) => (prev + 1) % allFiles.length);
      setIsImageLoading(true);
    }
  };

  const prevImage = () => {
    if (allFiles.length > 1) {
      setCurrentIndex((prev) => (prev - 1 + allFiles.length) % allFiles.length);
      setIsImageLoading(true);
    }
  };

  const goToImage = (index) => {
    if (index >= 0 && index < allFiles.length && index !== currentIndex) {
      setCurrentIndex(index);
      setIsImageLoading(true);
    }
  };

  // Auto-advance carousel (optional - remove if not wanted)
  useEffect(() => {
    if (allFiles.length > 1) {
      const interval = setInterval(() => {
        nextImage();
      }, 8000); // Change image every 8 seconds
      
      return () => clearInterval(interval);
    }
  }, [allFiles.length, currentIndex]);

  if (!hasFiles && !isEditing) {
    return (
      <div className="h-96 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center rounded-t-xl">
        <div className="text-center">
          <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <Image className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-600 mb-2">No Images Available</h3>
          <p className="text-gray-500 text-sm">Upload images to showcase your campaign</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-t-xl">
      {/* Main Image Display */}
      <div className="h-96 bg-gray-900 relative group">
        {hasFiles ? (
          <>
            <div className="relative h-full">
              <img
                src={allFiles[currentIndex]?.url}
                alt={`Campaign image ${currentIndex + 1}`}
                className={`w-full h-full object-cover transition-all duration-500 ${
                  isImageLoading ? 'opacity-0 scale-105' : 'opacity-100 scale-100'
                }`}
                onLoad={() => setIsImageLoading(false)}
                onError={() => setIsImageLoading(false)}
              />
              
              {/* Loading Overlay */}
              {isImageLoading && (
                <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-white"></div>
                </div>
              )}
              
              {/* Gradient Overlays for better text readability */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-black/20"></div>
            </div>
            
            {/* Image Counter */}
            <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-sm font-medium">
              {currentIndex + 1} / {allFiles.length}
            </div>

            {/* Image Title/Name */}
            <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-sm text-white px-3 py-1.5 rounded-lg">
              <p className="text-sm font-medium truncate max-w-48">
                {allFiles[currentIndex]?.name?.replace(/\.[^/.]+$/, "") || `Image ${currentIndex + 1}`}
              </p>
            </div>
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
            <div className="text-center">
              <div className="w-20 h-20 bg-gray-300 rounded-full flex items-center justify-center mx-auto mb-3">
                <Image className="w-10 h-10 text-gray-500" />
              </div>
              <span className="text-gray-600 text-lg font-medium">No Images</span>
              <p className="text-gray-500 text-sm mt-1">Add images to your campaign</p>
            </div>
          </div>
        )}

        {/* Navigation Arrows - Enhanced */}
        {allFiles.length > 1 && (
          <>
            <button
              onClick={(e) => {
                e.preventDefault();
                prevImage();
              }}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/40 backdrop-blur-sm hover:bg-black/60 text-white p-3 rounded-full transition-all duration-300 opacity-0 group-hover:opacity-100 hover:scale-110 z-10"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={(e) => {
                e.preventDefault();
                nextImage();
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/40 backdrop-blur-sm hover:bg-black/60 text-white p-3 rounded-full transition-all duration-300 opacity-0 group-hover:opacity-100 hover:scale-110 z-10"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}

        {/* Edit Button - Enhanced */}
        {isEditing && (
          <button
            onClick={() => setShowImageManager(true)}
            className="absolute bottom-4 right-4 bg-blue-600/90 backdrop-blur-sm hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center transition-all duration-300 shadow-lg hover:shadow-xl z-10"
          >
            <Edit3 className="w-4 h-4 mr-2" />
            Manage Images
          </button>
        )}
      </div>

      {/* Enhanced Thumbnail Navigation */}
      {allFiles.length > 1 && (
        <div className="bg-white border-t border-gray-200 p-4">
          <div className="flex items-center justify-center">
            <div className="flex space-x-3 overflow-x-auto scrollbar-hide max-w-full">
              {allFiles.map((file, index) => {
                const isMarkedForDeletion = formData?.filesToDelete?.some(f => f.url === file.url);
                const isActive = index === currentIndex;
                
                return (
                  <button
                    key={file.id || index}
                    onClick={(e) => {
                      e.preventDefault();
                      goToImage(index);
                    }}
                    className={`flex-shrink-0 relative transition-all duration-300 rounded-lg overflow-hidden ${
                      isActive
                        ? 'ring-3 ring-blue-500 scale-110 shadow-lg'
                        : 'ring-1 ring-gray-200 hover:ring-gray-300 hover:scale-105 shadow-sm hover:shadow-md'
                    }`}
                  >
                    <img
                      src={file.url}
                      alt={`Thumbnail ${index + 1}`}
                      className={`w-20 h-20 object-cover transition-all duration-300 ${
                        isMarkedForDeletion ? 'opacity-50 grayscale' : ''
                      } ${isActive ? 'brightness-110' : 'hover:brightness-105'}`}
                      onError={(e) => {
                        e.target.style.backgroundColor = '#f3f4f6';
                        e.target.alt = 'Failed to load';
                      }}
                    />
                    
                    {/* Active Indicator */}
                    {isActive && (
                      <div className="absolute inset-0 border-2 border-blue-500 rounded-lg">
                        <div className="absolute -top-2 -right-2 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        </div>
                      </div>
                    )}
                    
                    {/* Deletion Indicator */}
                    {isMarkedForDeletion && (
                      <div className="absolute inset-0 bg-red-500/70 flex items-center justify-center rounded-lg">
                        <X className="w-5 h-5 text-white drop-shadow-lg" />
                      </div>
                    )}
                    
                    {/* Hover Effect */}
                    <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors duration-200 rounded-lg"></div>
                  </button>
                );
              })}
            </div>
          </div>
          
          {/* Dot Indicators for mobile */}
          <div className="flex justify-center mt-3 space-x-2 md:hidden">
            {allFiles.map((_, index) => (
              <button
                key={index}
                onClick={() => goToImage(index)}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  index === currentIndex 
                    ? 'bg-blue-500 w-6' 
                    : 'bg-gray-300 hover:bg-gray-400'
                }`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Enhanced Image Manager Modal */}
      {isEditing && showImageManager && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">Manage Campaign Images</h3>
                  <p className="text-gray-600 mt-1">Upload new images or remove existing ones</p>
                </div>
                <button
                  onClick={() => setShowImageManager(false)}
                  className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              {/* Upload Section */}
              <div className="mb-8">
                <label className="block text-sm font-semibold text-gray-800 mb-3">
                  Add New Images
                </label>
                <div className="relative">
                  <input
                    type="file"
                    id="image-upload"
                    multiple
                    accept="image/*"
                    onChange={onFileChange}
                    className="sr-only"
                  />
                  <label
                    htmlFor="image-upload"
                    className="flex items-center justify-center w-full px-8 py-12 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all duration-300 group"
                  >
                    <div className="text-center">
                      <div className="w-16 h-16 bg-gray-100 group-hover:bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 transition-colors">
                        <Upload className="w-8 h-8 text-gray-400 group-hover:text-blue-500 transition-colors" />
                      </div>
                      <span className="text-lg font-medium text-gray-700 group-hover:text-blue-600 transition-colors">
                        Click to upload images
                      </span>
                      <p className="text-sm text-gray-500 mt-2">PNG, JPG, GIF up to 10MB each</p>
                    </div>
                  </label>
                </div>
              </div>

              {/* New Files Preview */}
              {formData?.newFiles?.length > 0 && (
                <div className="mb-8">
                  <h4 className="text-lg font-semibold text-gray-800 mb-4">
                    New Images ({formData.newFiles.length})
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {formData.newFiles.map((file, index) => (
                      <div key={index} className="relative group">
                        <div className="aspect-square bg-gray-100 rounded-xl overflow-hidden shadow-sm">
                          <img
                            src={URL.createObjectURL(file)}
                            alt={`New image ${index + 1}`}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                        <button
                          onClick={() => onRemoveNewFile(index)}
                          className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-lg"
                        >
                          <X className="w-4 h-4" />
                        </button>
                        <p className="text-xs text-gray-600 mt-2 truncate font-medium">{file.name}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Current Images */}
              {allFiles.length > 0 && (
                <div>
                  <h4 className="text-lg font-semibold text-gray-800 mb-4">
                    Current Images ({allFiles.length})
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {allFiles.map((file) => {
                      const isMarkedForDeletion = formData?.filesToDelete?.some(f => f.url === file.url);
                      return (
                        <div key={file.id} className="relative group">
                          <div className={`aspect-square bg-gray-100 rounded-xl overflow-hidden shadow-sm transition-all duration-300 ${
                            isMarkedForDeletion ? 'ring-2 ring-red-500 ring-offset-2' : ''
                          }`}>
                            <img
                              src={file.url}
                              alt={file.name}
                              className={`w-full h-full object-cover transition-all duration-300 ${
                                isMarkedForDeletion ? 'opacity-50 grayscale scale-95' : 'group-hover:scale-105'
                              }`}
                            />
                          </div>
                          <button
                            onClick={() => isMarkedForDeletion 
                              ? onUnmarkForDeletion(file.url) 
                              : onMarkForDeletion(file.url, file.name)
                            }
                            className={`absolute -top-2 -right-2 rounded-full p-2 opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-lg ${
                              isMarkedForDeletion 
                                ? 'bg-green-500 hover:bg-green-600 text-white' 
                                : 'bg-red-500 hover:bg-red-600 text-white'
                            }`}
                          >
                            {isMarkedForDeletion ? (
                              <CheckCircle className="w-4 h-4" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                          <p className={`text-xs mt-2 truncate font-medium transition-colors ${
                            isMarkedForDeletion ? 'text-red-600 line-through' : 'text-gray-600'
                          }`}>
                            {file.name}
                          </p>
                          {isMarkedForDeletion && (
                            <p className="text-xs text-red-600 font-semibold mt-1">Will be deleted</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex justify-end mt-8 pt-6 border-t border-gray-200">
                <button
                  onClick={() => setShowImageManager(false)}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors duration-200 shadow-lg hover:shadow-xl"
                >
                  Done Managing Images
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
  