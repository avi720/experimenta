import React from "react";

export default function ExperimentCanvas({ isRTL, children }) {
    return (
        <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-slate-100 to-slate-200">
            {children}
        </div>
    );
}