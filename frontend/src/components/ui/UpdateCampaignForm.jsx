import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchCampaignById, updateCampaign } from '../../api/endpoints/CampaignAPI';
import { DollarSign, Target, X } from 'lucide-react';

export default function UpdateCampaignForm() {
  const { campaignId } = useParams();
  const navigate = useNavigate();
  
  // Local state management
  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [filesToDelete, setFilesToDelete] = useState([]);
  
  // Form state - initialized with campaign data structure
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    target: '',
    current_amount: '',
    number_of_donors: 0,
    files: []
  });

  // Function to load campaign
  const loadCampaign = async (id) => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchCampaignById(id);
      setCampaign(data);
      
      // Update form data when campaign is loaded
      setFormData({
        name: data.name || '',
        description: data.description || '',
        target: data.target || '',
        current_amount: data.current_amount || '',
        number_of_donors: data.number_of_donors || 0,
        files: data.files || []
      });
    } catch (err) {
      setError(err.message);
      console.error('Failed to fetch campaign:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch campaign data on component mount
  useEffect(() => {
    if (campaignId) {
      loadCampaign(campaignId);
    }
  }, [campaignId]);

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle file uploads
  const handleFileChange = (e) => {
    setFormData(prev => ({
      ...prev,
      files: [...prev.files, ...Array.from(e.target.files)]
    }));
  };

  // Remove a file
  const removeFile = (index) => {
    const file = formData.files[index];
    if (file.url) {
      setFilesToDelete(prev => [...prev, file.url]);
    }
    setFormData(prev => ({
      ...prev,
      files: prev.files.filter((_, i) => i !== index)
    }));
  };

  // Get file URL - for both existing files and newly uploaded files
  const getFileUrl = (file) => {
    if (file.url) return file.url; // Existing file from server
    if (file instanceof File) return URL.createObjectURL(file); // Newly uploaded file
    return '';
  };

  // Form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const formPayload = new FormData();
      formPayload.append('name', formData.name);
      formPayload.append('description', formData.description);
      formPayload.append('target', formData.target);
      formPayload.append('current_amount', formData.current_amount);

      // Append files to delete
      filesToDelete.forEach(url => {
        formPayload.append('files_to_delete', url);
      });

      // Append new files (only File objects)
      formData.files.forEach(file => {
        if (file instanceof File) {
          formPayload.append('files', file);
        }
      });

      await updateCampaign({ 
        id: campaignId, 
        data: formPayload 
      });
      
      setSuccess(true);
      setTimeout(() => navigate(`/campaign/${campaignId}`), 1500);
    } catch (err) {
      setError(err.message || 'Failed to update campaign');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error && !campaign) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <h2 className="text-xl font-medium text-red-800">Error Loading Campaign</h2>
          <p className="text-red-600 mt-2">{error}</p>
          <button 
            onClick={() => loadCampaign(campaignId)}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="bg-gray-50 shadow-sm rounded-xl p-6 text-center">
          <h2 className="text-xl font-medium text-gray-700">Campaign not found</h2>
          <p className="text-gray-500 mt-2">The campaign you're trying to edit doesn't exist.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6">Update Campaign</h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}
      
      {success && (
        <div className="mb-4 p-3 bg-green-100 text-green-700 rounded">
          Campaign updated successfully! Redirecting...
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Campaign Name *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="mb-4">
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label htmlFor="target" className="block text-sm font-medium text-gray-700 mb-1">
              Target Amount (MRU) *
            </label>
            <div className="relative">
              <input
                type="number"
                id="target"
                name="target"
                value={formData.target}
                onChange={handleChange}
                required
                min="0"
                step="0.01"
                className="w-full pl-10 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="absolute left-3 top-2">
                <Target className="w-5 h-5 text-gray-400" />
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="current_amount" className="block text-sm font-medium text-gray-700 mb-1">
              Current Amount (MRU)
            </label>
            <div className="relative">
              <input
                type="number"
                id="current_amount"
                name="current_amount"
                value={formData.current_amount}
                readOnly
                className="w-full pl-10 px-3 py-2 border border-gray-300 rounded-md bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="absolute left-3 top-2">
                <DollarSign className="w-5 h-5 text-gray-400" />
              </div>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Files
          </label>
          <input
            type="file"
            multiple
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          
          <div className="mt-4 grid grid-cols-3 gap-4">
            {formData.files.map((file, index) => (
              <div key={index} className="relative group">
                {/* Display image preview */}
                <img 
                  src={getFileUrl(file)} 
                  alt={file.name || file.url?.split('/').pop()}
                  className="w-full h-32 object-cover rounded-md"
                />
                {/* X button to remove */}
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-md hover:bg-red-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-400"
          >
            {submitting ? 'Updating...' : 'Update Campaign'}
          </button>
        </div>
      </form>
    </div>
  );
}