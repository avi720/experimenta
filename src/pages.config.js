import Dashboard from './pages/Dashboard';
import Lab from './pages/Lab';
import AdminExperiments from './pages/AdminExperiments';
import AdminExperimentForm from './pages/AdminExperimentForm';
import Results from './pages/Results';
import ShoExperiment from './pages/ShoExperiment';
import QuantumTunnelingExperiment from './pages/QuantumTunnelingExperiment';
import DoubleSlitExperiment from './pages/DoubleSlitExperiment';
import FreeFallExperiment from './pages/FreeFallExperiment';
import AboutUs from './pages/AboutUs';
import WhatIsNew from './pages/WhatIsNew';
import Resources from './pages/Resources';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Dashboard": Dashboard,
    "Lab": Lab,
    "AdminExperiments": AdminExperiments,
    "AdminExperimentForm": AdminExperimentForm,
    "Results": Results,
    "ShoExperiment": ShoExperiment,
    "QuantumTunnelingExperiment": QuantumTunnelingExperiment,
    "DoubleSlitExperiment": DoubleSlitExperiment,
    "FreeFallExperiment": FreeFallExperiment,
    "AboutUs": AboutUs,
    "WhatIsNew": WhatIsNew,
    "Resources": Resources,
    "PrivacyPolicy": PrivacyPolicy,
    "TermsOfService": TermsOfService,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};