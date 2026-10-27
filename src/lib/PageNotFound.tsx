import { Link, useLocation } from 'react-router-dom';
import { Home } from 'lucide-react';
import { useAppData } from '@/components/hooks/useAppData';
import { useTranslation } from '@/i18n';

export default function PageNotFound() {
    const location = useLocation();
    const pageName = location.pathname.substring(1);
    const { isRTL } = useAppData();
    const { t, dir } = useTranslation(isRTL);

    return (
        <div
            className="min-h-[70vh] flex items-center justify-center p-6"
            dir={dir}
        >
            <div className="max-w-md w-full">
                <div className="text-center space-y-6">
                    {/* 404 Error Code */}
                    <div className="space-y-2">
                        <h1 className="text-7xl font-light text-slate-300">404</h1>
                        <div className="h-0.5 w-16 bg-slate-200 mx-auto"></div>
                    </div>

                    {/* Main Message */}
                    <div className="space-y-3">
                        <h2 className="text-2xl font-medium text-slate-800">
                            {t('errors.notFoundTitle')}
                        </h2>
                        <p className="text-slate-600 leading-relaxed">
                            {t('errors.notFoundPrefix')}{' '}
                            <span className="font-medium text-slate-700" dir="ltr">&quot;{pageName}&quot;</span>{' '}
                            {t('errors.notFoundSuffix')}
                        </p>
                    </div>

                    {/* Action Button */}
                    <div className="pt-4">
                        <Link
                            to="/"
                            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-slate-300 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500"
                        >
                            <Home className="w-4 h-4" />
                            {t('common.backToHome')}
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
