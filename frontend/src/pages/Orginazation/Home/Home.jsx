import { use, useEffect, useState } from "react";
import OrganizationProfileForm from "../../../components/ui/OrganzationProfileForm";   
import { fetchOrgProfile } from "../../../api/endpoints/OrgAPI";
import OrganizationDashboard from "./OrganizationDashboard";

export default function OrganizationHome() {

    return (
        <>
            <OrganizationDashboard />
        </>
    );
    }   