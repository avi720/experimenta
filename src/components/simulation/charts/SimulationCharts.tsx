import { useState, useRef, useEffect, type MouseEvent as ReactMouseEvent } from "react";
import { motion } from "framer-motion";
import { GripHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from "recharts";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/i18n";
import { ghostIconButtonClass, instrumentSurfaceClass } from "../workspace/workspaceStyles";
import type { ExperimentTemplateData } from "@/types/experiment";
import type { IsRTLProps } from "@/types/props";
import type { SimulationDataPoint } from "@/types/simulation";

type SimulationChartsProps = IsRTLProps & {
    simulationData?: SimulationDataPoint[];
    experiment?: Pick<ExperimentTemplateData, "outputs"> | null;
    isOpen?: boolean;
    onToggle?: () => void;
};

// Series colours come from the brand (--chart-1..5 in src/index.css: plasma, blueshift, horizon,
// plasma-hi, a cool teal); axes and grid are drawn in dust and line so the traces carry the colour.
const SERIES_COLORS = [1, 2, 3, 4, 5].map((n) => `hsl(var(--chart-${n}))`);
const AXIS_COLOR = "rgb(var(--dust))";
const GRID_COLOR = "rgb(var(--line))";

export default function SimulationCharts({
    simulationData,
    experiment,
    isRTL,
    isOpen = false,
    onToggle
}: SimulationChartsProps) {
    const { t } = useTranslation(isRTL);
    const [height, setHeight] = useState(300);
    const [isDragging, setIsDragging] = useState(false);
    const dragStartY = useRef(0);
    const dragStartHeight = useRef(0);

    const hasData = simulationData && simulationData.length > 0;
    const outputs = experiment?.outputs || [];

    const handleMouseDown = (e: ReactMouseEvent<HTMLDivElement>) => {
        setIsDragging(true);
        dragStartY.current = e.clientY;
        dragStartHeight.current = height;
        e.preventDefault();
    };

    useEffect(() => {
        if (!isDragging) return;

        const handleMouseMove = (e: MouseEvent) => {
            const deltaY = dragStartY.current - e.clientY;
            const newHeight = Math.max(150, Math.min(600, dragStartHeight.current + deltaY));
            setHeight(newHeight);
        };

        const handleMouseUp = () => {
            setIsDragging(false);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, height]);

    if (!isOpen) {
        return (
            <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-40">
                <button
                    onClick={onToggle}
                    className="focus-ring flex items-center gap-2 px-5 h-10 rounded-full border border-line bg-space/80 backdrop-blur-md text-star shadow-lg shadow-hole/50 transition-colors hover:border-blueshift/60 hover:text-blueshift"
                >
                    <span className="w-1.5 h-1.5 rounded-full bg-blueshift" aria-hidden="true" />
                    <div className="text-sm font-medium">
                        {t("workspace.liveCharts")}
                    </div>
                </button>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ y: height }}
            animate={{ y: 0 }}
            exit={{ y: height }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className={cn("fixed bottom-0 left-0 right-0 border-t shadow-2xl shadow-hole/60 z-40", instrumentSurfaceClass)}
            style={{ height: `${height}px` }}
        >
            {/* Drag Handle */}
            <div
                onMouseDown={handleMouseDown}
                className={cn(
                    "h-6 border-b border-line flex items-center justify-center cursor-ns-resize hover:bg-space-raised transition-colors relative",
                    isDragging && "bg-space-raised"
                )}
            >
                <GripHorizontal className="w-5 h-5 text-dust" />

                <div className="absolute end-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onToggle}
                        className={cn("h-6 w-6", ghostIconButtonClass)}
                    >
                        <X className="w-3 h-3" />
                    </Button>
                </div>
            </div>

            {/* Content */}
            <div className="p-6 overflow-auto" style={{ height: `calc(${height}px - 24px)` }}>
                {!hasData ? (
                    <div className="h-full flex flex-col items-center justify-center text-center">
                        <svg className="w-14 h-14 text-line mb-4" aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                        </svg>
                        <p className="text-star text-sm">
                            {t("workspace.runSimulationToSeeCharts")}
                        </p>
                        <p className="text-dust text-xs mt-2">
                            {t("workspace.clickPlayInConsole")}
                        </p>
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                            data={simulationData}
                            key={simulationData.length}
                        >
                            <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} />
                            <XAxis
                                dataKey="time"
                                label={{
                                    value: t("workspace.timeAxisLabel"),
                                    position: 'insideBottom',
                                    offset: -5,
                                    fill: AXIS_COLOR
                                }}
                                stroke={AXIS_COLOR}
                                tick={{ fill: AXIS_COLOR, fontFamily: "IBM Plex Mono, monospace" }}
                                style={{ fontSize: '12px' }}
                                domain={['dataMin', 'dataMax']}
                            />
                            <YAxis
                                label={{
                                    value: t("workspace.valuesAxisLabel"),
                                    angle: -90,
                                    position: 'insideLeft',
                                    fill: AXIS_COLOR
                                }}
                                stroke={AXIS_COLOR}
                                tick={{ fill: AXIS_COLOR, fontFamily: "IBM Plex Mono, monospace" }}
                                style={{ fontSize: '12px' }}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'rgb(var(--space-raised))',
                                    border: `1px solid ${GRID_COLOR}`,
                                    borderRadius: '6px',
                                    color: 'rgb(var(--star))',
                                    fontSize: '12px'
                                }}
                                labelStyle={{ color: AXIS_COLOR }}
                                itemStyle={{ fontFamily: "IBM Plex Mono, monospace" }}
                                cursor={{ stroke: GRID_COLOR }}
                            />
                            <Legend
                                wrapperStyle={{ fontSize: '12px', color: AXIS_COLOR }}
                            />
                            {outputs.map((output, index) => {
                                const hasOutputData = simulationData.some(d => d[output] !== undefined);
                                if (!hasOutputData) return null;

                                return (
                                    <Line
                                        key={output}
                                        type="monotone"
                                        dataKey={output}
                                        name={output}
                                        stroke={SERIES_COLORS[index % SERIES_COLORS.length]}
                                        strokeWidth={2}
                                        dot={false}
                                        isAnimationActive={false}
                                    />
                                );
                            })}
                        </LineChart>
                    </ResponsiveContainer>
                )}
            </div>
        </motion.div>
    );
}
