import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Heart, Users, Globe, Shield, Target, CheckCircle, Eye, Handshake, Facebook } from 'lucide-react';
import { api } from '../../api/axiosConfig';

export default function AboutUs() {
    const { t, i18n } = useTranslation();
    const isRTL = i18n.language === 'ar';
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    // Fetch real platform statistics
    useEffect(() => {
        const fetchStats = async () => {
            try {
                console.log('Fetching platform statistics...');
                const data = await api.get('/campaigns/platform-statistics/');
                console.log('Statistics data:', data);
                setStats(data);
            } catch (error) {
                console.error('Failed to fetch platform statistics:', error);
                // Set fallback data if API fails
                setStats({
                    campaigns: { total: 0, active: 0, completed: 0 },
                    financial: { total_raised: '0', total_donations: 0 },
                    community: { total_donors: 0, organizations: 0, verified_organizations: 0, volunteers: 0 },
                    categories: 0,
                    success_rate: 0,
                    last_updated: new Date().toISOString()
                });
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    const values = [
        {
            icon: <Heart className="w-8 h-8" />,
            titleKey: 'about.values.compassion.title',
            descriptionKey: 'about.values.compassion.description'
        },
        {
            icon: <Users className="w-8 h-8" />,
            titleKey: 'about.values.community.title',
            descriptionKey: 'about.values.community.description'
        },
        {
            icon: <Shield className="w-8 h-8" />,
            titleKey: 'about.values.transparency.title',
            descriptionKey: 'about.values.transparency.description'
        },
        {
            icon: <Target className="w-8 h-8" />,
            titleKey: 'about.values.impact.title',
            descriptionKey: 'about.values.impact.description'
        }
    ];

    const features = [
        {
            icon: <CheckCircle className="w-8 h-8" />,
            titleKey: 'about.features.verification.title',
            descriptionKey: 'about.features.verification.description'
        },
        {
            icon: <Facebook className="w-8 h-8" />,
            titleKey: 'about.features.facebook.title',
            descriptionKey: 'about.features.facebook.description'
        },
        {
            icon: <Eye className="w-8 h-8" />,
            titleKey: 'about.features.tracking.title',
            descriptionKey: 'about.features.tracking.description'
        },
        {
            icon: <Handshake className="w-8 h-8" />,
            titleKey: 'about.features.volunteer.title',
            descriptionKey: 'about.features.volunteer.description'
        }
    ];

    return (
        <div className={`min-h-screen bg-gradient-to-br from-teal-50 to-indigo-50 ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
            {/* Hero Section */}
            <section className="relative py-20 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center">
                        <h1 className="text-4xl md:text-6xl font-bold text-[#3366CC] mb-6">
                            {t('about.hero.title')}
                        </h1>
                        <p className="text-xl md:text-2xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
                            {t('about.hero.subtitle')}
                        </p>
                    </div>
                </div>
            </section>

            {/* Mission Section */}
            <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
                <div className="max-w-7xl mx-auto">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        <div className={`${isRTL ? 'lg:order-2' : ''}`}>
                            <h2 className="text-3xl md:text-4xl font-bold text-[#3366CC] mb-6">
                                {t('about.mission.title')}
                            </h2>
                            <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                                {t('about.mission.description')}
                            </p>
                            <p className="text-lg text-gray-600 leading-relaxed">
                                {t('about.mission.vision')}
                            </p>
                        </div>
                        <div className={`${isRTL ? 'lg:order-1' : ''}`}>
                            <div className="bg-gradient-to-br from-[#3366CC] to-[#4CAF50] rounded-2xl p-8 text-white">
                                <Globe className="w-16 h-16 mb-6 mx-auto" />
                                <h3 className="text-2xl font-bold text-center mb-4">
                                    {t('about.mission.mauritaniaFocus')}
                                </h3>
                                <p className="text-center text-white/90">
                                    {t('about.mission.mauritaniaDescription')}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-16 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold text-[#3366CC] mb-4">
                            {t('about.features.title')}
                        </h2>
                        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                            {t('about.features.subtitle')}
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {features.map((feature, index) => (
                            <div key={index} className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
                                <div className="text-[#FF9800] mb-4 flex justify-center">
                                    {feature.icon}
                                </div>
                                <h3 className="text-xl font-bold text-center mb-3 text-gray-800">
                                    {t(feature.titleKey)}
                                </h3>
                                <p className="text-gray-600 text-center leading-relaxed">
                                    {t(feature.descriptionKey)}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Values Section */}
            <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold text-[#3366CC] mb-4">
                            {t('about.values.title')}
                        </h2>
                        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                            {t('about.values.subtitle')}
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {values.map((value, index) => (
                            <div key={index} className="bg-gradient-to-br from-teal-50 to-indigo-50 rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
                                <div className="text-[#4CAF50] mb-4 flex justify-center">
                                    {value.icon}
                                </div>
                                <h3 className="text-xl font-bold text-center mb-3 text-gray-800">
                                    {t(value.titleKey)}
                                </h3>
                                <p className="text-gray-600 text-center leading-relaxed">
                                    {t(value.descriptionKey)}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="py-16 px-4 sm:px-6 lg:px-8 bg-[#3366CC]">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                            {t('about.stats.title')}
                        </h2>
                        <p className="text-xl text-white/80 max-w-3xl mx-auto">
                            {t('about.stats.subtitle')}
                        </p>
                    </div>

                    {loading ? (
                        <div className="text-center text-white">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                            <p>Loading statistics...</p>
                        </div>
                    ) : (
                        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                            <div className="text-center">
                                <div className="text-4xl md:text-5xl font-bold text-white mb-2">
                                    {stats?.campaigns?.total || '0'}
                                </div>
                                <div className="text-white/80 text-lg">
                                    {t('about.stats.campaigns.label')}
                                </div>
                            </div>
                            <div className="text-center">
                                <div className="text-4xl md:text-5xl font-bold text-white mb-2">
                                    {stats?.community?.total_donors || '0'}
                                </div>
                                <div className="text-white/80 text-lg">
                                    {t('about.stats.donors.label')}
                                </div>
                            </div>
                            <div className="text-center">
                                <div className="text-4xl md:text-5xl font-bold text-white mb-2">
                                    {stats?.financial?.total_raised ?
                                        `${parseFloat(stats.financial.total_raised).toLocaleString()} MRU` :
                                        '0 MRU'
                                    }
                                </div>
                                <div className="text-white/80 text-lg">
                                    {t('about.stats.raised.label')}
                                </div>
                            </div>
                            <div className="text-center">
                                <div className="text-4xl md:text-5xl font-bold text-white mb-2">
                                    {stats?.community?.verified_organizations || '0'}
                                </div>
                                <div className="text-white/80 text-lg">
                                    {t('about.stats.organizations.label')}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Debug info - remove in production */}
                    {!loading && stats && (
                        <div className="mt-8 text-center text-white/60 text-sm">
                            Last updated: {new Date(stats.last_updated).toLocaleString()}
                        </div>
                    )}
                </div>
            </section>



            {/* Call to Action */}
            <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-teal-50 to-indigo-50">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-3xl md:text-4xl font-bold text-[#3366CC] mb-6">
                        {t('about.cta.title')}
                    </h2>
                    <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
                        {t('about.cta.subtitle')}
                    </p>
                    <div className={`flex flex-col sm:flex-row gap-4 justify-center ${isRTL ? 'sm:flex-row-reverse' : ''}`}>
                        <a
                            href="/explore"
                            className="px-8 py-3 bg-[#3366CC] hover:bg-[#2557B8] text-white rounded-lg font-medium transition-colors duration-300"
                        >
                            {t('about.cta.exploreCampaigns')}
                        </a>
                        <a
                            href="/volunteer"
                            className="px-8 py-3 bg-[#FF9800] hover:bg-[#FB8C00] text-white rounded-lg font-medium transition-colors duration-300"
                        >
                            {t('about.cta.becomeVolunteer')}
                        </a>
                    </div>
                </div>
            </section>
        </div>
    );
}