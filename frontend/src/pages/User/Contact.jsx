import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Mail, Phone, MapPin, Send, CheckCircle, AlertCircle } from 'lucide-react';
import { api } from '../../api/axiosConfig';

const Contact = () => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      const data = await api.post('/auth/contact/', formData);

      if (data.success) {
        setSubmitStatus({
          type: 'success',
          message: t('contact.successMessage', 'Your message has been sent successfully. We will get back to you soon!')
        });
        setFormData({ name: '', email: '', subject: '', message: '' });
      } else {
        setSubmitStatus({
          type: 'error',
          message: t('contact.errorMessage', 'Failed to send message. Please try again.')
        });
      }
    } catch (error) {
      setSubmitStatus({
        type: 'error',
        message: error.message || t('contact.errorMessage', 'Network error. Please check your connection and try again.')
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-indigo-50 py-12" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-[#3366CC] mb-4">
            {t('contact.title', 'Contact Us')}
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            {t('contact.subtitle', 'We\'d love to hear from you. Send us a message and we\'ll respond as soon as possible.')}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contact Information */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
              <h2 className="text-2xl font-bold text-[#3366CC] mb-6">
                {t('contact.getInTouch', 'Get in Touch')}
              </h2>

              <div className="space-y-4">
                <div className={`flex items-center ${isRTL ? '' : ''}`}>
                  <Mail className={`h-6 w-6 text-[#FF9800] ${isRTL ? 'ml-3' : 'mr-3'}`} />
                  <div>
                    <p className="font-medium text-[#3366CC]">Email</p>
                    <p className="text-gray-600">mhamed.bbh01@gmail.com</p>
                  </div>
                </div>

                <div className={`flex items-center ${isRTL ? '' : ''}`}>
                  <Phone className={`h-6 w-6 text-[#FF9800] ${isRTL ? 'ml-3' : 'mr-3'}`} />
                  <div>
                    <p className="font-medium text-[#3366CC]">{t('contact.phone', 'Phone')}</p>
                    <p dir="ltr" className={`text-gray-600 ${isRTL ? 'text-right' : 'text-left'}`}>+222 34 50 37 10</p>
                  </div>
                </div>

                <div className={`flex items-center ${isRTL ? '' : ''}`}>
                  <MapPin className={`h-6 w-6 text-[#FF9800] ${isRTL ? 'ml-3' : 'mr-3'}`} />
                  <div>
                    <p className="font-medium text-[#3366CC]">{t('contact.address', 'Address')}</p>
                    <p className="text-gray-600">{t('contact.location', 'Nouakchott, Mauritania')}</p>
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <h3 className="text-lg font-semibold text-[#3366CC] mb-4">
                  {t('contact.businessHours', 'Business Hours')}
                </h3>
                <div className="space-y-2 text-gray-600">
                  <p>{t('contact.weekdays', 'Monday - Friday: 9:00 AM - 6:00 PM')}</p>
                  <p>{t('contact.weekend', 'Saturday - Sunday: 10:00 AM - 4:00 PM')}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
              <h2 className="text-2xl font-bold text-[#3366CC] mb-6">
                {t('contact.sendMessage', 'Send us a Message')}
              </h2>

              {submitStatus && (
                <div className={`mb-6 p-4 rounded-lg flex items-center ${submitStatus.type === 'success'
                  ? 'bg-green-50 text-green-800 border border-green-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
                  } ${isRTL ? '' : ''}`}>
                  {submitStatus.type === 'success' ? (
                    <CheckCircle className={`h-5 w-5 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                  ) : (
                    <AlertCircle className={`h-5 w-5 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                  )}
                  {submitStatus.message}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="name" className={`block text-sm font-medium text-[#3366CC] mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>
                      {t('contact.name', 'Full Name')} *
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#3366CC] focus:border-[#3366CC] ${isRTL ? 'text-right' : 'text-left'}`}
                      placeholder={t('contact.namePlaceholder', 'Enter your full name')}
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className={`block text-sm font-medium text-[#3366CC] mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>
                      {t('contact.email', 'Email Address')} *
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#3366CC] focus:border-[#3366CC] ${isRTL ? 'text-right' : 'text-left'}`}
                      placeholder={t('contact.emailPlaceholder', 'Enter your email address')}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="subject" className={`block text-sm font-medium text-[#3366CC] mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>
                    {t('contact.subject', 'Subject')} *
                  </label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                    className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#3366CC] focus:border-[#3366CC] ${isRTL ? 'text-right' : 'text-left'}`}
                    placeholder={t('contact.subjectPlaceholder', 'What is this about?')}
                  />
                </div>

                <div>
                  <label htmlFor="message" className={`block text-sm font-medium text-[#3366CC] mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>
                    {t('contact.message', 'Message')} *
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows={6}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#3366CC] focus:border-[#3366CC] ${isRTL ? 'text-right' : 'text-left'}`}
                    placeholder={t('contact.messagePlaceholder', 'Tell us how we can help you...')}
                  />
                </div>

                <div>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-[#4CAF50] text-white py-3 px-6 rounded-md hover:bg-[#43A047] focus:outline-none focus:ring-2 focus:ring-[#4CAF50] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors duration-300"
                  >
                    {isSubmitting ? (
                      <div className={`animate-spin rounded-full h-5 w-5 border-b-2 border-white ${isRTL ? 'ml-2' : 'mr-2'}`}></div>
                    ) : (
                      <Send className={`h-5 w-5 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                    )}
                    {isSubmitting
                      ? t('contact.sending', 'Sending...')
                      : t('contact.sendButton', 'Send Message')
                    }
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;