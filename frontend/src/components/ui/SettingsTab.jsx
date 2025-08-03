import React from 'react';
import { useTranslation } from 'react-i18next';
import { Bell, Globe, Trash2 } from 'lucide-react';

const SettingsTab = ({ settings, handleSettingChange }) => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  const handleLanguageChange = (langCode) => {
    // Update i18n language
    i18n.changeLanguage(langCode);
    
    // Update document direction for Arabic
    document.documentElement.dir = langCode === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = langCode;
    
    // Update settings state
    handleSettingChange('language', langCode);
  };

  const getProfileVisibilityOptions = () => [
    { value: 'public', label: t('settingsTab.privacy.visibility.public') },
    { value: 'organizations', label: t('settingsTab.privacy.visibility.organizations') },
    { value: 'private', label: t('settingsTab.privacy.visibility.private') }
  ];

  const getLanguageOptions = () => [
    { value: 'en', label: 'English 🇺🇸' },
    { value: 'ar', label: 'العربية 🇲🇷' },
    { value: 'fr', label: 'Français 🇫🇷' }
  ];

  const getCurrencyOptions = () => [
    { value: 'MRU', label: t('settingsTab.privacy.currency.mru') },
    { value: 'USD', label: t('settingsTab.privacy.currency.usd') },
    { value: 'EUR', label: t('settingsTab.privacy.currency.eur') }
  ];

  return (
    <div className="space-y-8" dir={isRTL ? 'rtl' : 'ltr'}>
      <h2 className="text-2xl font-bold text-gray-900">{t('settingsTab.title')}</h2>

      {/* Notifications */}
      <div className="border-b pb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Bell className="w-5 h-5" />
          {t('settingsTab.notifications.title')}
        </h3>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <div className="font-medium text-gray-900">{t('settingsTab.notifications.email.title')}</div>
              <div className="text-sm text-gray-600">{t('settingsTab.notifications.email.description')}</div>
            </div>
            <button
              onClick={() => handleSettingChange('emailNotifications', !settings.emailNotifications)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.emailNotifications ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                settings.emailNotifications 
                  ? (isRTL ? 'translate-x-[-1.5rem]' : 'translate-x-6') 
                  : (isRTL ? 'translate-x-[-0.25rem]' : 'translate-x-1')
              }`} />
            </button>
          </div>

          <div className="flex justify-between items-center">
            <div>
              <div className="font-medium text-gray-900">{t('settingsTab.notifications.push.title')}</div>
              <div className="text-sm text-gray-600">{t('settingsTab.notifications.push.description')}</div>
            </div>
            <button
              onClick={() => handleSettingChange('pushNotifications', !settings.pushNotifications)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.pushNotifications ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                settings.pushNotifications 
                  ? (isRTL ? 'translate-x-[-1.5rem]' : 'translate-x-6') 
                  : (isRTL ? 'translate-x-[-0.25rem]' : 'translate-x-1')
              }`} />
            </button>
          </div>

          <div className="flex justify-between items-center">
            <div>
              <div className="font-medium text-gray-900">{t('settingsTab.notifications.volunteer.title')}</div>
              <div className="text-sm text-gray-600">{t('settingsTab.notifications.volunteer.description')}</div>
            </div>
            <button
              onClick={() => handleSettingChange('volunteerMatching', !settings.volunteerMatching)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.volunteerMatching ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                settings.volunteerMatching 
                  ? (isRTL ? 'translate-x-[-1.5rem]' : 'translate-x-6') 
                  : (isRTL ? 'translate-x-[-0.25rem]' : 'translate-x-1')
              }`} />
            </button>
          </div>
        </div>
      </div>

      {/* Privacy & Preferences */}
      <div className="border-b pb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('settingsTab.privacy.title')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('settingsTab.privacy.profileVisibility')}</label>
            <select
              value={settings.profileVisibility}
              onChange={(e) => handleSettingChange('profileVisibility', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              {getProfileVisibilityOptions().map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('settingsTab.privacy.language')}</label>
            <select
              value={i18n.language || settings.language}
              onChange={(e) => handleLanguageChange(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              {getLanguageOptions().map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

        </div>
      </div>

      {/* Danger Zone */}
      <div>
        <h3 className="text-lg font-semibold text-red-600 mb-4">{t('settingsTab.danger.title')}</h3>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex justify-between items-center">
            <div>
              <div className="font-medium text-red-900">{t('settingsTab.danger.deleteAccount.title')}</div>
              <div className="text-sm text-red-700">{t('settingsTab.danger.deleteAccount.description')}</div>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
              <Trash2 className="w-4 h-4" />
              {t('settingsTab.danger.deleteAccount.button')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsTab;