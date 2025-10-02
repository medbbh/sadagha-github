import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, ChevronUp, Search, HelpCircle } from 'lucide-react';

export default function FAQ() {
    const { t, i18n } = useTranslation();
    const isRTL = i18n.language === 'ar';
    const [searchTerm, setSearchTerm] = useState('');
    const [openItems, setOpenItems] = useState(new Set());

    const toggleItem = (index) => {
        const newOpenItems = new Set(openItems);
        if (newOpenItems.has(index)) {
            newOpenItems.delete(index);
        } else {
            newOpenItems.add(index);
        }
        setOpenItems(newOpenItems);
    };

    const faqCategories = [
        {
            titleKey: 'faq.categories.general.title',
            items: [
                {
                    questionKey: 'faq.general.whatIsSadagha.question',
                    answerKey: 'faq.general.whatIsSadagha.answer'
                },
                {
                    questionKey: 'faq.general.howItWorks.question',
                    answerKey: 'faq.general.howItWorks.answer'
                }
            ]
        },
        {
            titleKey: 'faq.categories.donations.title',
            items: [
                {
                    questionKey: 'faq.donations.howToDonate.question',
                    answerKey: 'faq.donations.howToDonate.answer'
                },
                {
                    questionKey: 'faq.donations.paymentMethods.question',
                    answerKey: 'faq.donations.paymentMethods.answer'
                }
            ]
        },
        {
            titleKey: 'faq.categories.campaigns.title',
            items: [
                {
                    questionKey: 'faq.campaigns.createCampaign.question',
                    answerKey: 'faq.campaigns.createCampaign.answer'
                },
                {
                    questionKey: 'faq.campaigns.verification.question',
                    answerKey: 'faq.campaigns.verification.answer'
                }
            ]
        },
        {
            titleKey: 'faq.categories.account.title',
            items: [
                {
                    questionKey: 'faq.account.createAccount.question',
                    answerKey: 'faq.account.createAccount.answer'
                },
                {
                    questionKey: 'faq.account.forgotPassword.question',
                    answerKey: 'faq.account.forgotPassword.answer'
                }
            ]
        }
    ];

    // Filter FAQ items based on search term
    const filteredCategories = faqCategories.map(category => ({
        ...category,
        items: category.items.filter(item => 
            searchTerm === '' || 
            t(item.questionKey).toLowerCase().includes(searchTerm.toLowerCase()) ||
            t(item.answerKey).toLowerCase().includes(searchTerm.toLowerCase())
        )
    })).filter(category => category.items.length > 0);

    return (
        <div className={`min-h-screen bg-gradient-to-br from-teal-50 to-indigo-50 ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
            {/* Hero Section */}
            <section className="relative py-20 px-4 sm:px-6 lg:px-8">
                <div className="max-w-4xl mx-auto text-center">
                    <HelpCircle className="w-16 h-16 text-[#3366CC] mx-auto mb-6" />
                    <h1 className="text-4xl md:text-5xl font-bold text-[#3366CC] mb-6">
                        {t('faq.hero.title')}
                    </h1>
                    <p className="text-xl text-gray-600 mb-8">
                        {t('faq.hero.subtitle')}
                    </p>
                    
                    {/* Search Bar */}
                    <div className="relative max-w-2xl mx-auto">
                        <Search className={`absolute top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 ${isRTL ? 'right-4' : 'left-4'}`} />
                        <input
                            type="text"
                            placeholder={t('faq.search.placeholder')}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className={`w-full py-4 bg-white rounded-xl border border-gray-200 shadow-lg focus:outline-none focus:ring-2 focus:ring-[#3366CC] focus:border-transparent ${isRTL ? 'pr-12 pl-4' : 'pl-12 pr-4'}`}
                        />
                    </div>
                </div>
            </section>

            {/* FAQ Content */}
            <section className="py-16 px-4 sm:px-6 lg:px-8">
                <div className="max-w-4xl mx-auto">
                    {filteredCategories.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="text-gray-400 mb-4">
                                <Search className="w-16 h-16 mx-auto" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-600 mb-2">
                                {t('faq.search.noResults')}
                            </h3>
                            <p className="text-gray-500">
                                {t('faq.search.tryDifferentTerms')}
                            </p>
                        </div>
                    ) : (
                        filteredCategories.map((category, categoryIndex) => (
                            <div key={categoryIndex} className="mb-12">
                                <h2 className="text-2xl font-bold text-[#3366CC] mb-6 flex items-center">
                                    <span className="w-8 h-8 bg-[#3366CC] text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">
                                        {categoryIndex + 1}
                                    </span>
                                    {t(category.titleKey)}
                                </h2>
                                
                                <div className="space-y-4">
                                    {category.items.map((item, itemIndex) => {
                                        const globalIndex = `${categoryIndex}-${itemIndex}`;
                                        const isOpen = openItems.has(globalIndex);
                                        
                                        return (
                                            <div key={itemIndex} className="bg-white rounded-xl shadow-lg overflow-hidden">
                                                <button
                                                    onClick={() => toggleItem(globalIndex)}
                                                    className={`w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors duration-200 ${isRTL ? 'text-right' : ''}`}
                                                >
                                                    <span className="font-semibold text-gray-800 flex-1">
                                                        {t(item.questionKey)}
                                                    </span>
                                                    {isOpen ? (
                                                        <ChevronUp className="w-5 h-5 text-[#3366CC] flex-shrink-0 ml-2" />
                                                    ) : (
                                                        <ChevronDown className="w-5 h-5 text-[#3366CC] flex-shrink-0 ml-2" />
                                                    )}
                                                </button>
                                                
                                                {isOpen && (
                                                    <div className="px-6 pb-4 border-t border-gray-100">
                                                        <p className="text-gray-600 leading-relaxed pt-4">
                                                            {t(item.answerKey)}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </section>


        </div>
    );
}