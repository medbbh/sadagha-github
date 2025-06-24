import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, ToggleLeft, ToggleRight, Power, PowerOff, Phone, Building2, CreditCard, Smartphone } from 'lucide-react';
import Loading from '../common/Loading';
import organizationApi from '../../api/endpoints/OrgAPI';

const ManualPaymentCard = ({ payment, onEdit, onDelete, onToggleActive }) => {
  const [isToggling, setIsToggling] = useState(false);

  const handleToggleActive = async () => {
    setIsToggling(true);
    try {
      await onToggleActive(payment.id, 'manual');
    } finally {
      setIsToggling(false);
    }
  };

  return (
    <div className={`rounded-lg border-2 p-5 transition-all duration-200 ${
      payment.is_active 
        ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 shadow-sm' 
        : 'bg-gray-50 border-gray-200 opacity-75'
    }`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {/* Payment Header */}
          <div className="flex items-center space-x-3 mb-3">
            <div className="flex items-center">
              <Phone className="w-5 h-5 text-blue-600 mr-2" />
              <span className="text-lg font-semibold text-gray-900">
                {payment.phone_number}
              </span>
            </div>
            
            {/* Status Badge */}
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              payment.is_active 
                ? 'bg-green-100 text-green-800 border border-green-200' 
                : 'bg-gray-100 text-gray-600 border border-gray-200'
            }`}>
              {payment.is_active ? (
                <>
                  <Power className="w-3 h-3 mr-1" />
                  Active
                </>
              ) : (
                <>
                  <PowerOff className="w-3 h-3 mr-1" />
                  Inactive
                </>
              )}
            </div>
          </div>
          
          {/* Payment Details */}
          <div className="space-y-1 mb-3">
            <div className="text-sm text-gray-700">
              <span className="font-semibold">Wallet:</span>{' '}
              <span className="text-gray-600">{payment.wallet_provider_name}</span>
            </div>
            {payment.account_name && (
              <div className="text-sm text-gray-700">
                <span className="font-semibold">Account Name:</span>{' '}
                <span className="text-gray-600">{payment.account_name}</span>
              </div>
            )}
          </div>
          
          {/* Created Date */}
          <div className="text-xs text-gray-500">
            Added on {new Date(payment.created_at).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            })}
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex items-center space-x-2 ml-6">
          {/* Toggle Active Button */}
          <button
            onClick={handleToggleActive}
            disabled={isToggling}
            className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              payment.is_active
                ? 'bg-red-100 text-red-700 hover:bg-red-200 border border-red-200'
                : 'bg-green-100 text-green-700 hover:bg-green-200 border border-green-200'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isToggling ? (
              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-current mr-2"></div>
            ) : payment.is_active ? (
              <ToggleRight className="w-4 h-4 mr-1" />
            ) : (
              <ToggleLeft className="w-4 h-4 mr-1" />
            )}
            {payment.is_active ? 'Deactivate' : 'Activate'}
          </button>
          
          {/* Edit Button */}
          <button
            onClick={() => onEdit(payment, 'manual')}
            className="inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium text-blue-700 bg-blue-100 hover:bg-blue-200 border border-blue-200 transition-colors"
          >
            <Edit2 className="w-4 h-4 mr-1" />
            Edit
          </button>
          
          {/* Delete Button */}
          <button
            onClick={() => onDelete(payment.id, 'manual')}
            className="inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium text-red-700 bg-red-100 hover:bg-red-200 border border-red-200 transition-colors"
          >
            <Trash2 className="w-4 h-4 mr-1" />
            Delete
          </button>
        </div>
      </div>
      
      {/* Inactive Warning */}
      {!payment.is_active && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center">
            <PowerOff className="w-4 h-4 text-yellow-600 mr-2" />
            <span className="text-sm text-yellow-800">
              This payment method is inactive and won't receive donations.
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

const NextPayPaymentCard = ({ payment, onEdit, onDelete, onToggleActive }) => {
  const [isToggling, setIsToggling] = useState(false);

  const handleToggleActive = async () => {
    setIsToggling(true);
    try {
      await onToggleActive(payment.id, 'nextpay');
    } finally {
      setIsToggling(false);
    }
  };

  return (
    <div className={`rounded-lg border-2 p-5 transition-all duration-200 ${
      payment.is_active 
        ? 'bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200 shadow-sm' 
        : 'bg-gray-50 border-gray-200 opacity-75'
    }`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {/* Payment Header */}
          <div className="flex items-center space-x-3 mb-3">
            <div className="flex items-center">
              <Building2 className="w-5 h-5 text-purple-600 mr-2" />
              <span className="text-lg font-semibold text-gray-900">
                {payment.commercial_number}
              </span>
            </div>
            
            {/* Status Badge */}
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              payment.is_active 
                ? 'bg-purple-100 text-purple-800 border border-purple-200' 
                : 'bg-gray-100 text-gray-600 border border-gray-200'
            }`}>
              {payment.is_active ? (
                <>
                  <Power className="w-3 h-3 mr-1" />
                  Active
                </>
              ) : (
                <>
                  <PowerOff className="w-3 h-3 mr-1" />
                  Inactive
                </>
              )}
            </div>

            {/* Verified Badge */}
            {payment.verified_at && (
              <div className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                Verified
              </div>
            )}
          </div>
          
          {/* Payment Details */}
          <div className="space-y-1 mb-3">
            <div className="text-sm text-gray-700">
              <span className="font-semibold">Wallet:</span>{' '}
              <span className="text-gray-600">{payment.wallet_provider_name}</span>
            </div>
            {payment.account_name && (
              <div className="text-sm text-gray-700">
                <span className="font-semibold">Account Name:</span>{' '}
                <span className="text-gray-600">{payment.account_name}</span>
              </div>
            )}
            {payment.verified_at && (
              <div className="text-sm text-gray-700">
                <span className="font-semibold">Verified:</span>{' '}
                <span className="text-gray-600">
                  {new Date(payment.verified_at).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>
          
          {/* Created Date */}
          <div className="text-xs text-gray-500">
            Added on {new Date(payment.created_at).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            })}
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex items-center space-x-2 ml-6">
          {/* Toggle Active Button */}
          <button
            onClick={handleToggleActive}
            disabled={isToggling}
            className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              payment.is_active
                ? 'bg-red-100 text-red-700 hover:bg-red-200 border border-red-200'
                : 'bg-green-100 text-green-700 hover:bg-green-200 border border-green-200'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isToggling ? (
              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-current mr-2"></div>
            ) : payment.is_active ? (
              <ToggleRight className="w-4 h-4 mr-1" />
            ) : (
              <ToggleLeft className="w-4 h-4 mr-1" />
            )}
            {payment.is_active ? 'Deactivate' : 'Activate'}
          </button>
          
          {/* Edit Button */}
          <button
            onClick={() => onEdit(payment, 'nextpay')}
            className="inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium text-blue-700 bg-blue-100 hover:bg-blue-200 border border-blue-200 transition-colors"
          >
            <Edit2 className="w-4 h-4 mr-1" />
            Edit
          </button>
          
          {/* Delete Button */}
          <button
            onClick={() => onDelete(payment.id, 'nextpay')}
            className="inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium text-red-700 bg-red-100 hover:bg-red-200 border border-red-200 transition-colors"
          >
            <Trash2 className="w-4 h-4 mr-1" />
            Delete
          </button>
        </div>
      </div>
      
      {/* Inactive Warning */}
      {!payment.is_active && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center">
            <PowerOff className="w-4 h-4 text-yellow-600 mr-2" />
            <span className="text-sm text-yellow-800">
              This payment method is inactive and won't receive donations.
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

const PaymentMethodForm = ({ isOpen, onClose, onSave, editingPayment, walletProviders, paymentType }) => {
  const [formData, setFormData] = useState({
    wallet_provider_id: '',
    phone_number: '',
    commercial_number: '',
    account_name: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (editingPayment) {
      setFormData({
        wallet_provider_id: editingPayment.wallet_provider?.id || '',
        phone_number: editingPayment.phone_number || '',
        commercial_number: editingPayment.commercial_number || '',
        account_name: editingPayment.account_name || '',
      });
    } else {
      setFormData({
        wallet_provider_id: '',
        phone_number: '',
        commercial_number: '',
        account_name: '',
      });
    }
    setError(null);
  }, [editingPayment, isOpen, paymentType]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!formData.wallet_provider_id) {
        throw new Error('Please select a wallet provider.');
      }

      if (paymentType === 'manual' && !formData.phone_number) {
        throw new Error('Phone number is required for manual payments.');
      }

      if (paymentType === 'nextpay' && !formData.commercial_number) {
        throw new Error('Commercial number is required for NextPay payments.');
      }

      await onSave(formData, paymentType);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <h3 className="text-lg font-semibold mb-4">
          {editingPayment ? 'Edit' : 'Add'} {paymentType === 'manual' ? 'Manual Payment' : 'NextPay Payment'}
        </h3>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-200 text-red-700 rounded text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Wallet Provider */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Wallet Provider *
            </label>
            <select
              value={formData.wallet_provider_id}
              onChange={(e) => setFormData(prev => ({ ...prev, wallet_provider_id: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select a wallet provider</option>
              {walletProviders.map(wallet => (
                <option key={wallet.id} value={wallet.id}>
                  {wallet.name}
                </option>
              ))}
            </select>
          </div>

          {/* Phone Number for Manual Payments */}
          {paymentType === 'manual' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number *
              </label>
              <input
                type="tel"
                value={formData.phone_number}
                onChange={(e) => setFormData(prev => ({ ...prev, phone_number: e.target.value }))}
                placeholder="Enter phone number"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <p className="text-xs text-gray-500 mt-1">The phone number donors will send money to</p>
            </div>
          )}

          {/* Commercial Number for NextPay */}
          {paymentType === 'nextpay' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Commercial Number *
              </label>
              <input
                type="text"
                value={formData.commercial_number}
                onChange={(e) => setFormData(prev => ({ ...prev, commercial_number: e.target.value }))}
                placeholder="Enter commercial number"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <p className="text-xs text-gray-500 mt-1">Your commercial account number</p>
            </div>
          )}

          {/* Account Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Account Name
            </label>
            <input
              type="text"
              value={formData.account_name}
              onChange={(e) => setFormData(prev => ({ ...prev, account_name: e.target.value }))}
              placeholder="Enter account holder name"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 flex items-center"
            >
              {loading && (
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-white mr-2"></div>
              )}
              {loading ? 'Saving...' : (editingPayment ? 'Update' : 'Add')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default function PaymentMethodsManagement({ paymentMethods, onUpdate }) {
  const [manualPayments, setManualPayments] = useState([]);
  const [nextpayPayments, setNextpayPayments] = useState([]);
  const [walletProviders, setWalletProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingPayment, setEditingPayment] = useState(null);
  const [formPaymentType, setFormPaymentType] = useState('manual');
  const [activeTab, setActiveTab] = useState('manual');

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (paymentMethods) {
      setManualPayments(paymentMethods.manual_payments || []);
      setNextpayPayments(paymentMethods.nextpay_payments || []);
    }
  }, [paymentMethods]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [manualResponse, nextpayResponse, walletsResponse] = await Promise.all([
        organizationApi.fetchManualPayments().catch(() => ({ data: [] })),
        organizationApi.fetchNextPayPayments().catch(() => ({ data: [] })),
        organizationApi.fetchWalletProviders().catch(() => [])
      ]);

      console.log('Manual Payments:', manualResponse);
      console.log('NextPay Payments:', nextpayResponse);
      console.log('Wallet Providers:', walletsResponse);
      
      setManualPayments(manualResponse || []);
      setNextpayPayments(nextpayResponse || []);
      setWalletProviders(walletsResponse || []);
    } catch (err) {
      console.error('Error loading payment data:', err);
      setError(err.message || 'Failed to load payment data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddPayment = (paymentType) => {
    setEditingPayment(null);
    setFormPaymentType(paymentType);
    setShowForm(true);
  };

  const handleEditPayment = (payment, paymentType) => {
    setEditingPayment(payment);
    setFormPaymentType(paymentType);
    setShowForm(true);
  };

  const handleSavePayment = async (formData, paymentType) => {
    try {
      if (paymentType === 'manual') {
        if (editingPayment) {
          await organizationApi.updateManualPayment(editingPayment.id, formData);
        } else {
          await organizationApi.createManualPayment(formData);
        }
      } else if (paymentType === 'nextpay') {
        if (editingPayment) {
          await organizationApi.updateNextPayPayment(editingPayment.id, formData);
        } else {
          await organizationApi.createNextPayPayment(formData);
        }
      }
      await loadData();
      onUpdate?.();
    } catch (err) {
      console.error('Error saving payment:', err);
      throw err;
    }
  };

  const handleDeletePayment = async (paymentId, paymentType) => {
    if (window.confirm('Are you sure you want to delete this payment method?')) {
      try {
        if (paymentType === 'manual') {
          await organizationApi.deleteManualPayment(paymentId);
        } else if (paymentType === 'nextpay') {
          await organizationApi.deleteNextPayPayment(paymentId);
        }
        await loadData();
        onUpdate?.();
      } catch (err) {
        setError(err.message);
      }
    }
  };

  const handleToggleActive = async (paymentId, paymentType) => {
    try {
      if (paymentType === 'manual') {
        await organizationApi.toggleManualPaymentActive(paymentId);
      } else if (paymentType === 'nextpay') {
        await organizationApi.toggleNextPayPaymentActive(paymentId);
      }
      await loadData();
      onUpdate?.();
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <Loading />;

  const totalPayments = manualPayments.length + nextpayPayments.length;
  const maxPayments = 5; // Total across both types

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Payment Methods</h2>
          <p className="text-sm text-gray-600 mt-1">
            Manage your organization's payment methods for receiving donations
          </p>
        </div>
        
        {totalPayments < maxPayments && (
          <div className="flex space-x-2">
            <button
              onClick={() => handleAddPayment('manual')}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Phone className="w-4 h-4 mr-2" />
              Add Manual Payment
            </button>
            <button
              onClick={() => handleAddPayment('nextpay')}
              className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <Building2 className="w-4 h-4 mr-2" />
              Add NextPay
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-200 text-red-700 rounded">
          {error}
        </div>
      )}

      {/* Payment Method Tabs */}
      <div className="flex space-x-2 mb-6 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('manual')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'manual'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          <Phone className="w-4 h-4 inline mr-2" />
          Manual Payments ({manualPayments.length})
        </button>
        <button
          onClick={() => setActiveTab('nextpay')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'nextpay'
              ? 'border-purple-500 text-purple-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          <Building2 className="w-4 h-4 inline mr-2" />
          NextPay ({nextpayPayments.length})
        </button>
      </div>

      {/* Manual Payments Tab */}
      {activeTab === 'manual' && (
        <div>
          {manualPayments.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <Phone className="w-16 h-16 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Manual Payments</h3>
              <p className="text-gray-600 mb-4">
                Add manual payment methods where donors send money and provide proof
              </p>
              <button
                onClick={() => handleAddPayment('manual')}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Manual Payment
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {manualPayments.map(payment => (
                <ManualPaymentCard
                  key={payment.id}
                  payment={payment}
                  onEdit={handleEditPayment}
                  onDelete={handleDeletePayment}
                  onToggleActive={handleToggleActive}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* NextPay Payments Tab */}
      {activeTab === 'nextpay' && (
        <div>
          {nextpayPayments.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <Building2 className="w-16 h-16 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No NextPay Payments</h3>
              <p className="text-gray-600 mb-4">
                Add NextPay payment methods for automatic instant payments
              </p>
              <button
                onClick={() => handleAddPayment('nextpay')}
                className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add NextPay Payment
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {nextpayPayments.map(payment => (
                <NextPayPaymentCard
                  key={payment.id}
                  payment={payment}
                  onEdit={handleEditPayment}
                  onDelete={handleDeletePayment}
                  onToggleActive={handleToggleActive}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Max Payments Warning */}
      {totalPayments >= maxPayments && (
        <div className="mt-4 text-center py-4 text-sm text-gray-500">
          Maximum of {maxPayments} payment methods allowed (across all types)
        </div>
      )}

      <PaymentMethodForm
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        onSave={handleSavePayment}
        editingPayment={editingPayment}
        walletProviders={walletProviders}
        paymentType={formPaymentType}
      />
    </div>
  );
}