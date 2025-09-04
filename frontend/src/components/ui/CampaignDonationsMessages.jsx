import React, { useEffect, useState } from "react";
import axios from "axios";
import { Loader2 } from "lucide-react";
import { campaignDonations } from "../../api/endpoints/CampaignAPI";
import { useTranslation } from "react-i18next";

const CampaignDonations = ({ campaignId }) => {
    const { t } = useTranslation();
    const [donations, setDonations] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDonations = async () => {
            try {
                const res = await campaignDonations(campaignId);
                setDonations(res.donations || []);
            } catch (error) {
                console.error("Error fetching donations:", error);
            } finally {
                setLoading(false);
            }
        };

        if (campaignId) {
            fetchDonations();
        }
    }, [campaignId]);

    if (loading) {
        return (
            <div className="flex justify-center items-center py-8">
                <Loader2 className="animate-spin w-6 h-6 text-gray-500" />
            </div>
        );
    }

    if (!donations || donations.length === 0) {
        return (
            <p className="text-gray-500 text-center py-4">
                {t("campaignDonationsMessage.noDonations")}
            </p>
        );
    }

    return (
        <div className="mt-6 bg-white rounded-xl shadow p-4 sm:p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
                {t("campaignDonationsMessage.title")}
            </h2>
            <ul className="divide-y divide-gray-200">
                {donations.map((donation) => (
                    <li key={donation.id} className="py-3 flex justify-between items-start">
                        <div>
                            <p className="font-medium text-gray-900">
                                {donation.is_anonymous
                                    ? t("campaignDonationsMessage.anonymous")
                                    : donation.donor_display_name}
                            </p>
                            {donation.message && (
                                <p className="text-gray-600 text-sm mt-1">{donation.message}</p>
                            )}
                            <p className="text-xs text-gray-400 mt-1">
                                {new Date(donation.created_at).toLocaleDateString()} - {new Date(donation.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="font-semibold text-green-600">
                                {Number(donation.amount).toLocaleString()} MRU
                            </p>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default CampaignDonations;
