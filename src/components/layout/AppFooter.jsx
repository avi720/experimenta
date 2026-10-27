import React from 'react';
import { Link } from 'react-router-dom';
import { Beaker, Mail } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { FULL_SCREEN_PAGES } from '@/pages.config';
import { useTranslation } from '@/i18n';

export default function AppFooter({ isRTL, currentPageName }) {
    const { t, dir } = useTranslation(isRTL);

    if (FULL_SCREEN_PAGES.includes(currentPageName)) {
        return null;
    }

    const footerSections = [
        {
            title: t('footer.aboutSectionTitle'),
            links: [
                { text: t('footer.aboutExperimenta'), url: createPageUrl("AboutUs") },
                { text: t('footer.contactUs'), href: "mailto:info@experimenta.com" }
            ]
        },
        {
            title: t('footer.whatsNewSectionTitle'),
            links: [
                { text: t('footer.updates'), url: createPageUrl("WhatIsNew") }
            ]
        },
        {
            title: t('footer.legalSectionTitle'),
            links: [
                { text: t('footer.privacyPolicy'), url: createPageUrl("PrivacyPolicy"), isBold: true },
                { text: t('footer.termsOfService'), url: createPageUrl("TermsOfService"), isBold: true }
            ]
        }
    ];

    return (
        <footer className="bg-slate-900 text-slate-300 mt-auto" dir={dir}>
            <div className="max-w-7xl mx-auto px-4 py-12">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    {/* Logo and Contact Section */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 via-blue-700 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                                <Beaker className="w-6 h-6 text-white" />
                            </div>
                            <span className="text-2xl font-bold text-white">Experimenta</span>
                        </div>
                        <p className="text-sm text-slate-400 leading-relaxed">
                            {t('footer.tagline')}
                        </p>
                        <div className="flex items-center gap-2 text-sm">
                            <Mail className="w-4 h-4 text-blue-400" />
                            <a href="mailto:info@experimenta.com" className="hover:text-white transition-colors">
                                info@experimenta.com
                            </a>
                        </div>
                    </div>

                    {/* Footer Link Sections */}
                    {footerSections.map((section, index) => (
                        <div key={index}>
                            <h3 className="text-white font-semibold mb-4 text-lg">{section.title}</h3>
                            <ul className="space-y-2">
                                {section.links.map((link, linkIndex) => (
                                    <li key={linkIndex}>
                                        {link.href ? (
                                            <a
                                                href={link.href}
                                                className="text-sm hover:text-white transition-colors"
                                            >
                                                {link.text}
                                            </a>
                                        ) : (
                                            <Link
                                                to={link.url}
                                                className={`text-sm hover:text-white transition-colors ${
                                                    link.isBold ? 'font-semibold text-slate-200' : ''
                                                }`}
                                            >
                                                {link.text}
                                            </Link>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                {/* Bottom Bar */}
                <div className="mt-12 pt-8 border-t border-slate-800">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-slate-400">
                        <p>
                            © {new Date().getFullYear()} Experimenta.
                            {t('footer.allRightsReserved')}
                        </p>
                        <p className="text-xs">
                            {t('footer.builtWithLove')}
                        </p>
                    </div>
                </div>
            </div>
        </footer>
    );
}
