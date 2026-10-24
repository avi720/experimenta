import Dashboard from './pages/Dashboard';
import Lab from './pages/Lab';
import LabWorkspace from './pages/LabWorkspace';
import AdminExperiments from './pages/AdminExperiments';
import AdminExperimentForm from './pages/AdminExperimentForm';
import Results from './pages/Results';
import AboutUs from './pages/AboutUs';
import WhatIsNew from './pages/WhatIsNew';
import Resources from './pages/Resources';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import Login from './pages/Login';
import __Layout from './Layout.jsx';
import { LEGACY_EXPERIMENT_PAGE_SLUGS } from './components/simulation/experimentRegistry';

const LEGACY_EXPERIMENT_PAGES = Object.fromEntries(
    Object.keys(LEGACY_EXPERIMENT_PAGE_SLUGS).map((pageName) => [
        pageName,
        LabWorkspace,
    ])
);

export const PAGES = {
    "Dashboard": Dashboard,
    "Lab": Lab,
    "LabWorkspace": LabWorkspace,
    ...LEGACY_EXPERIMENT_PAGES,
    "AdminExperiments": AdminExperiments,
    "AdminExperimentForm": AdminExperimentForm,
    "Results": Results,
    "AboutUs": AboutUs,
    "WhatIsNew": WhatIsNew,
    "Resources": Resources,
    "PrivacyPolicy": PrivacyPolicy,
    "TermsOfService": TermsOfService,
    "Login": Login,
};

export const FULL_SCREEN_PAGES = [
    "LabWorkspace",
    "AdminExperimentForm",
    ...Object.keys(LEGACY_EXPERIMENT_PAGE_SLUGS),
];

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};
