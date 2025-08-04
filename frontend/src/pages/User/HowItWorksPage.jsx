import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Users, Heart, Target, DollarSign, Shield, CheckCircle, 
  ArrowRight, Play, User, Building, Lightbulb, MessageSquare,
  Star, Globe, TrendingUp, Award, Handshake, Eye,
  CreditCard, Bell, BarChart3, FileCheck, Search
} from 'lucide-react';

const HowItWorksPage = () => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const [activeTab, setActiveTab] = useState('donors');

  const tabs = [
    { id: 'donors', label: t('howItWorks.tabs.forDonors'), icon: Heart, color: 'blue' },
    { id: 'volunteers', label: t('howItWorks.tabs.forVolunteers'), icon: Users, color: 'green' },
    { id: 'organizations', label: t('howItWorks.tabs.forOrganizations'), icon: Building, color: 'orange' }
  ];

  const features = [
    {
      icon: Shield,
      title: t('howItWorks.features.bankLevelSecurity.title'),
      description: t('howItWorks.features.bankLevelSecurity.description'),
      highlight: t('howItWorks.features.bankLevelSecurity.highlight')
    },
    {
      icon: Globe,
      title: t('howItWorks.features.multilingualPlatform.title'),
      description: t('howItWorks.features.multilingualPlatform.description'),
      highlight: t('howItWorks.features.multilingualPlatform.highlight')
    },
    {
      icon: Eye,
      title: t('howItWorks.features.completeTransparency.title'),
      description: t('howItWorks.features.completeTransparency.description'),
      highlight: t('howItWorks.features.completeTransparency.highlight')
    },
    {
      icon: FileCheck,
      title: t('howItWorks.features.verifiedOrganizations.title'),
      description: t('howItWorks.features.verifiedOrganizations.description'),
      highlight: t('howItWorks.features.verifiedOrganizations.highlight')
    }
  ];

  const renderTabContent = () => {
    const contentMap = {
      donors: {
        title: t('howItWorks.donors.title'),
        subtitle: t('howItWorks.donors.subtitle'),
        color: 'blue',
        steps: [
          {
            icon: User,
            title: t('howItWorks.donors.steps.createAccount.title'),
            description: t('howItWorks.donors.steps.createAccount.description'),
            details: t('howItWorks.donors.steps.createAccount.details')
          },
          {
            icon: Search,
            title: t('howItWorks.donors.steps.discoverCampaigns.title'),
            description: t('howItWorks.donors.steps.discoverCampaigns.description'),
            details: t('howItWorks.donors.steps.discoverCampaigns.details')
          },
          {
            icon: CreditCard,
            title: t('howItWorks.donors.steps.makeSecureDonations.title'),
            description: t('howItWorks.donors.steps.makeSecureDonations.description'),
            details: t('howItWorks.donors.steps.makeSecureDonations.details')
          },
          {
            icon: BarChart3,
            title: t('howItWorks.donors.steps.trackProgress.title'),
            description: t('howItWorks.donors.steps.trackProgress.description'),
            details: t('howItWorks.donors.steps.trackProgress.details')
          }
        ]
      },
      volunteers: {
        title: t('howItWorks.volunteers.title'),
        subtitle: t('howItWorks.volunteers.subtitle'),
        color: 'green',
        steps: [
          {
            icon: User,
            title: t('howItWorks.volunteers.steps.activateProfile.title'),
            description: t('howItWorks.volunteers.steps.activateProfile.description'),
            details: t('howItWorks.volunteers.steps.activateProfile.details')
          },
          {
            icon: Handshake,
            title: t('howItWorks.volunteers.steps.getMatched.title'),
            description: t('howItWorks.volunteers.steps.getMatched.description'),
            details: t('howItWorks.volunteers.steps.getMatched.details')
          },
          {
            icon: Eye,
            title: t('howItWorks.volunteers.steps.reviewPrograms.title'),
            description: t('howItWorks.volunteers.steps.reviewPrograms.description'),
            details: t('howItWorks.volunteers.steps.reviewPrograms.details')
          },
          {
            icon: Star,
            title: t('howItWorks.volunteers.steps.acceptContribute.title'),
            description: t('howItWorks.volunteers.steps.acceptContribute.description'),
            details: t('howItWorks.volunteers.steps.acceptContribute.details')
          }
        ]
      },
      organizations: {
        title: t('howItWorks.organizations.title'),
        subtitle: t('howItWorks.organizations.subtitle'),
        color: 'orange',
        steps: [
          {
            icon: FileCheck,
            title: t('howItWorks.organizations.steps.applyVerification.title'),
            description: t('howItWorks.organizations.steps.applyVerification.description'),
            details: t('howItWorks.organizations.steps.applyVerification.details')
          },
          {
            icon: Building,
            title: t('howItWorks.organizations.steps.completeProfile.title'),
            description: t('howItWorks.organizations.steps.completeProfile.description'),
            details: t('howItWorks.organizations.steps.completeProfile.details')
          },
          {
            icon: Target,
            title: t('howItWorks.organizations.steps.launchCampaigns.title'),
            description: t('howItWorks.organizations.steps.launchCampaigns.description'),
            details: t('howItWorks.organizations.steps.launchCampaigns.details')
          },
          {
            icon: Users,
            title: t('howItWorks.organizations.steps.createVolunteerPrograms.title'),
            description: t('howItWorks.organizations.steps.createVolunteerPrograms.description'),
            details: t('howItWorks.organizations.steps.createVolunteerPrograms.details')
          }
        ]
      }
    };

    const content = contentMap[activeTab];
    const colorClasses = {
      blue: 'bg-blue-100 text-blue-600 border-blue-200',
      green: 'bg-green-100 text-green-600 border-green-200',
      orange: 'bg-orange-100 text-orange-600 border-orange-200'
    };
    
    return (
      <div className="space-y-12">
        <div className="text-center">
          <h3 className="text-4xl font-bold text-gray-900 mb-4">{content.title}</h3>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">{content.subtitle}</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {content.steps.map((step, index) => {
            const Icon = step.icon;
            
            return (
              <div key={index} className="bg-white rounded-2xl border border-gray-200 p-8 hover:shadow-lg transition-all duration-200">
                <div className={`flex items-start gap-4 ${isRTL ? '' : ''}`}>
                  <div className="flex-shrink-0">
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${colorClasses[content.color]} relative`}>
                      <Icon className="w-8 h-8" />
                      <div className={`absolute -top-2 w-8 h-8 bg-gray-900 text-white rounded-full flex items-center justify-center text-sm font-bold ${isRTL ? '-start-2' : '-end-2'}`}>
                        {index + 1}
                      </div>
                    </div>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-xl font-bold text-gray-900 mb-3 text-start">{step.title}</h4>
                    <p className="text-gray-600 mb-4 leading-relaxed text-start">{step.description}</p>
                    <p className="text-sm text-gray-500 italic text-start">{step.details}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Process Flow Visualization */}
        <div className="bg-gray-50 rounded-2xl p-8 mt-12">
          <h4 className="text-xl font-semibold text-gray-900 mb-6 text-center">{t('howItWorks.simpleProcessFlow')}</h4>
          <div className={`flex items-center justify-between ${isRTL ? '' : ''}`}>
            {content.steps.map((step, index) => (
              <React.Fragment key={index}>
                <div className="flex flex-col items-center text-center max-w-32">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colorClasses[content.color]} mb-2`}>
                    <step.icon className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-medium text-gray-700">{step.title}</p>
                </div>
                {index < content.steps.length - 1 && (
                  <ArrowRight className={`w-6 h-6 text-gray-400 flex-shrink-0 ${isRTL ? 'rotate-180' : ''}`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 text-white relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-black/10"></div>
        <div className={`absolute top-0 w-96 h-96 bg-white/5 rounded-full -translate-y-48 ${isRTL ? 'start-0 -translate-x-48' : 'end-0 translate-x-48'}`}></div>
        <div className={`absolute bottom-0 w-64 h-64 bg-white/5 rounded-full translate-y-32 ${isRTL ? 'end-0 translate-x-32' : 'start-0 -translate-x-32'}`}></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-5xl md:text-7xl font-bold mb-8 leading-tight">
              {t('howItWorks.hero.title')}<br />
              <span className="text-blue-200">{t('howItWorks.hero.titleHighlight')}</span>
            </h1>
            <p className="text-xl md:text-2xl text-blue-100 mb-10 max-w-4xl mx-auto leading-relaxed">
              {t('howItWorks.hero.subtitle')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="inline-flex items-center px-8 py-4 bg-white text-blue-600 font-semibold rounded-xl hover:bg-blue-50 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
                <Play className={`w-5 h-5 ${isRTL ? 'ms-2' : 'me-2'}`} />
                {t('howItWorks.hero.watchDemo')}
              </button>
              <button className="inline-flex items-center px-8 py-4 bg-transparent border-2 border-white text-white font-semibold rounded-xl hover:bg-white hover:text-blue-600 transition-all duration-300">
                <Heart className={`w-5 h-5 ${isRTL ? 'ms-2' : 'me-2'}`} />
                {t('howItWorks.hero.getStarted')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        {/* Tab Navigation */}
        <div className="mb-16">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">{t('howItWorks.chooseYourRole')}</h2>
            <p className="text-lg text-gray-600">{t('howItWorks.seeHowSada9aWorks')}</p>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-3 px-8 py-4 rounded-2xl font-semibold transition-all duration-200 ${isRTL ? '' : ''} ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-xl scale-105'
                      : 'bg-white text-gray-600 hover:bg-gray-50 border-2 border-gray-200 hover:border-blue-200 hover:scale-102'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        {renderTabContent()}

        {/* Features Section */}
        <div className="mt-24">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              {t('howItWorks.whyChooseSada9a')}
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {t('howItWorks.builtForMauritania')}
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index} className="bg-white rounded-2xl border border-gray-200 p-8 text-center hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 group">
                  <div className="w-20 h-20 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-blue-600 transition-colors duration-300">
                    <Icon className="w-10 h-10 text-blue-600 group-hover:text-white transition-colors duration-300" />
                  </div>
                  <div className="mb-3">
                    <span className="inline-block px-3 py-1 bg-blue-100 text-blue-600 text-sm font-semibold rounded-full mb-3">
                      {feature.highlight}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">{feature.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>


        {/* CTA Section */}
        <div className="mt-24">
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-3xl p-12 text-center text-white relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute inset-0 bg-black/10 rounded-3xl"></div>
            <div className={`absolute top-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 ${isRTL ? 'start-0 -translate-x-32' : 'end-0 translate-x-32'}`}></div>
            <div className={`absolute bottom-0 w-48 h-48 bg-white/10 rounded-full translate-y-24 ${isRTL ? 'end-0 translate-x-24' : 'start-0 -translate-x-24'}`}></div>
            
            <div className="relative">
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                {t('howItWorks.cta.title')}
              </h2>
              <p className="text-xl mb-10 max-w-3xl mx-auto opacity-90 leading-relaxed">
                {t('howItWorks.cta.subtitle')}
              </p>
              <div className="flex flex-col sm:flex-row gap-6 justify-center">
                <button className="inline-flex items-center px-10 py-5 bg-white text-blue-600 font-bold rounded-xl hover:bg-blue-50 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 text-lg">
                  <Heart className={`w-6 h-6 ${isRTL ? 'ms-3' : 'me-3'}`} />
                  {t('howItWorks.cta.startDonating')}
                </button>
                <button className="inline-flex items-center px-10 py-5 bg-transparent border-2 border-white text-white font-bold rounded-xl hover:bg-white hover:text-blue-600 transition-all duration-300 text-lg">
                  <Users className={`w-6 h-6 ${isRTL ? 'ms-3' : 'me-3'}`} />
                  {t('howItWorks.cta.becomeVolunteer')}
                </button>
              </div>
              <p className="mt-6 text-blue-200 text-sm">
                {t('howItWorks.cta.freeToJoin')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HowItWorksPage;