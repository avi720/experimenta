import { lazy } from 'react';
import Dashboard from './pages/Dashboard';

// Every page except the landing page is split into its own chunk (T30); App wraps routes in Suspense.
const Lab = lazy(() => import('./pages/Lab'));
const LabWorkspace = lazy(() => import('./pages/LabWorkspace'));
const AdminExperiments = lazy(() => import('./pages/AdminExperiments'));
const AdminExperimentForm = lazy(() => import('./pages/AdminExperimentForm'));
const Results = lazy(() => import('./pages/Results'));
const AboutUs = lazy(() => import('./pages/AboutUs'));
const WhatIsNew = lazy(() => import('./pages/WhatIsNew'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const TermsOfService = lazy(() => import('./pages/TermsOfService'));
const Login = lazy(() => import('./pages/Login'));
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
