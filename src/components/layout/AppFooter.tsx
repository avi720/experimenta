import { Link } from 'react-router-dom';
import BlackHoleMark from '@/components/brand/BlackHoleMark';
import { createPageUrl } from '@/utils';
import { FULL_SCREEN_PAGES } from '@/routes';
import { useTranslation } from '@/i18n';
import type { IsRTLProps } from '@/types/props';

type FooterLink = { text: string; url?: string; href?: string };

type FooterSection = { title: string; links: FooterLink[] };

export default function AppFooter({ isRTL, currentPageName }: IsRTLProps & { currentPageName: string }) {
    const { t, dir } = useTranslation(isRTL);

    if (FULL_SCREEN_PAGES.includes(currentPageName)) {
        return null;
    }

    const footerSections: FooterSection[] = [
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
                { text: t('footer.privacyPolicy'), url: createPageUrl("PrivacyPolicy") },
                { text: t('footer.termsOfService'), url: createPageUrl("TermsOfService") }
            ]
        }
    ];

    // On the home page the footer sits inside the CTA's event horizon, so no rule separates them.
    return (
        <footer className={`bg-hole text-dust mt-auto ${currentPageName === 'Dashboard' ? '' : 'border-t border-line'}`} dir={dir}>
            <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-16 pb-10">
                <div className="grid grid-cols-2 md:grid-cols-[2fr_1fr_1fr_1fr] gap-x-8 gap-y-10">
                    {/* Logo and contact */}
                    <div className="col-span-2 md:col-span-1 space-y-4 max-w-xs">
                        <Link to={createPageUrl("Dashboard")} className="focus-ring inline-flex items-center gap-2.5 rounded-md">
                            <BlackHoleMark className="h-8 w-8" />
                            <span className="text-[19px] font-medium tracking-tight text-star" lang="en" dir="ltr">Experimenta</span>
                        </Link>
                        <p className="text-[15px] leading-relaxed">
                            {t('footer.tagline')}
                        </p>
                        <a href="mailto:info@experimenta.com" className="focus-ring inline-block text-[15px] text-star underline decoration-line underline-offset-4 hover:decoration-blueshift rounded-sm">
                            info@experimenta.com
                        </a>
                    </div>

                    {/* Footer link sections */}
                    {footerSections.map((section) => (
                        <div key={section.title}>
                            <h2 className="text-star text-[15px] font-medium mb-4">{section.title}</h2>
                            <ul className="space-y-3">
                                {section.links.map((link) => (
                                    <li key={link.text}>
                                        {link.href ? (
                                            <a href={link.href} className="focus-ring text-[15px] hover:text-star transition-colors rounded-sm">
                                                {link.text}
                                            </a>
                                        ) : (
                                            <Link to={link.url ?? ''} className="focus-ring text-[15px] hover:text-star transition-colors rounded-sm">
                                                {link.text}
                                            </Link>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                {/* Bottom bar */}
                <div className="mt-14 pt-6 border-t border-line flex flex-col md:flex-row justify-between gap-3 text-[13px]">
                    <p>
                        © {new Date().getFullYear()} Experimenta.
                        {t('footer.allRightsReserved')}
                    </p>
                    <p>{t('footer.simulationNote')}</p>
                </div>
            </div>
        </footer>
    );
}
