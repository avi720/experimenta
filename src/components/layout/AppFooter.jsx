import React from 'react';
import { Link } from 'react-router-dom';
import { Beaker } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { Facebook, Twitter, Instagram, Linkedin, Mail } from 'lucide-react';

export default function AppFooter({ isRTL, currentPageName }) {
    const pagesWithoutFooter = [
        'LabWorkspace', 
        'AdminExperimentForm', 
        'FreeFallExperiment', 
        'ShoExperiment', 
        'QuantumTunnelingExperiment', 
        'DoubleSlitExperiment'
    ];
    
    if (pagesWithoutFooter.includes(currentPageName)) {
        return null;
    }

    const footerSections = [
        {
            title: isRTL ? "אודותינו" : "About Us",
            links: [
                { text: isRTL ? "אודות Experimenta" : "About Experimenta", url: createPageUrl("AboutUs") },
                { text: isRTL ? "צור קשר" : "Contact Us", url: "#", isPlaceholder: true }
            ]
        },
        {
            title: isRTL ? "מה חדש" : "What's New",
            links: [
                { text: isRTL ? "עדכונים" : "Updates", url: createPageUrl("WhatIsNew") },
                { text: isRTL ? "בלוג המדע" : "Science Matters Blog", url: "#", isPlaceholder: true }
            ]
        },
        {
            title: isRTL ? "משאבים" : "Resources",
            links: [
                { text: isRTL ? "משאבים" : "Resources", url: createPageUrl("Resources") },
                { text: isRTL ? "מסמכים ודוחות" : "Documents & Reports", url: "#", isPlaceholder: true },
                { text: isRTL ? "גישה ציבורית" : "Public Access", url: "#", isPlaceholder: true },
                { text: isRTL ? "אבטחת מחקר" : "Research Security", url: "#", isPlaceholder: true },
                { text: isRTL ? "יושרה מדעית" : "Scientific Integrity", url: "#", isPlaceholder: true },
                { text: "Research.gov", url: "#", isPlaceholder: true },
                { text: isRTL ? "מדיניות פרטיות" : "Privacy Policy", url: createPageUrl("PrivacyPolicy"), isBold: true },
                { text: isRTL ? "תנאי שירות" : "Terms of Service", url: createPageUrl("TermsOfService"), isBold: true }
            ]
        }
    ];

    const socialLinks = [
        { icon: Facebook, label: "Facebook", url: "#" },
        { icon: Twitter, label: "X", url: "#" },
        { icon: Instagram, label: "Instagram", url: "#" },
        { icon: Linkedin, label: "LinkedIn", url: "#" },
    ];

    return (
        <footer className="bg-slate-900 text-slate-300 mt-auto" dir={isRTL ? 'rtl' : 'ltr'}>
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
                            {isRTL 
                                ? "פלטפורמה חדשנית לסימולציות פיזיקליות אינטראקטיביות" 
                                : "Innovative platform for interactive physics simulations"
                            }
                        </p>
                        <div className="flex items-center gap-2 text-sm">
                            <Mail className="w-4 h-4 text-blue-400" />
                            <a href="mailto:info@experimenta.com" className="hover:text-white transition-colors">
                                info@experimenta.com
                            </a>
                        </div>
                        {/* Social Icons */}
                        <div className="flex gap-3 pt-2">
                            {socialLinks.map((social, index) => {
                                const Icon = social.icon;
                                return (
                                    <a
                                        key={index}
                                        href={social.url}
                                        aria-label={social.label}
                                        className="w-9 h-9 bg-slate-800 hover:bg-blue-600 rounded-lg flex items-center justify-center transition-colors"
                                        onClick={(e) => e.preventDefault()}
                                    >
                                        <Icon className="w-4 h-4" />
                                    </a>
                                );
                            })}
                        </div>
                    </div>

                    {/* Footer Link Sections */}
                    {footerSections.map((section, index) => (
                        <div key={index}>
                            <h3 className="text-white font-semibold mb-4 text-lg">{section.title}</h3>
                            <ul className="space-y-2">
                                {section.links.map((link, linkIndex) => (
                                    <li key={linkIndex}>
                                        {link.isPlaceholder ? (
                                            <span className="text-sm text-slate-500 cursor-not-allowed">
                                                {link.text}
                                            </span>
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
                            {isRTL ? " כל הזכויות שמורות." : " All rights reserved."}
                        </p>
                        <p className="text-xs">
                            {isRTL 
                                ? "נבנה עם אהבה למדע ולחינוך" 
                                : "Built with love for science and education"
                            }
                        </p>
                    </div>
                </div>
            </div>
        </footer>
    );
}