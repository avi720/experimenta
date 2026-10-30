import { useState, useRef, useEffect, useMemo, type MouseEvent as ReactMouseEvent } from "react";
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
    ResponsiveContainer
} from "recharts";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/i18n";
import type { ExperimentGuide, Quantity } from "@/simulation/guides";
import { ghostIconButtonClass, instrumentSurfaceClass } from "../workspace/workspaceStyles";
import ChartAxisControls from "./ChartAxisControls";
import {
    axisUnit,
    chartableQuantities,
    defaultAxes,
    formatTick,
    groupByUnit,
    sanitizeAxes,
    type AxisSelection,
} from "./chartAxes";
import type { ExperimentTemplateData } from "@/types/experiment";
import type { IsRTLProps } from "@/types/props";
import type { SimulationDataPoint } from "@/types/simulation";

type SimulationChartsProps = IsRTLProps & {
    simulationData?: SimulationDataPoint[];
    experiment?: Pick<ExperimentTemplateData, "outputs" | "slug"> | null;
    isOpen?: boolean;
    onToggle?: () => void;
    guide?: ExperimentGuide | null;
    /** Quantities hidden while they would give away the unknown. */
    hiddenKeys?: ReadonlyArray<string>;
};

// Series colours come from the brand (--chart-1..5 in src/index.css: plasma, blueshift, horizon,
// plasma-hi, a cool teal); axes and grid are drawn in dust and line so the traces carry the colour.
const SERIES_COLORS = [1, 2, 3, 4, 5].map((n) => `hsl(var(--chart-${n}))`);
const AXIS_COLOR = "rgb(var(--dust))";
const GRID_COLOR = "rgb(var(--line))";
const TICK_STYLE = { fill: AXIS_COLOR, fontFamily: "IBM Plex Mono, monospace", fontSize: 11 };

type UnitChartProps = {
    data: SimulationDataPoint[];
    x: Quantity | undefined;
    series: Quantity[];
    colors: Record<string, string>;
    showXTicks: boolean;
    pickLabel: (quantity: Quantity) => string;
};

/** One chart of the stack: every series that shares a unit, against the chosen X quantity. */
function UnitChart({ data, x, series, colors, showXTicks, pickLabel }: UnitChartProps) {
    if (!x) return null;
    const unit = axisUnit(series[0]);
    return (
        <div className="flex-1 min-h-[90px] flex flex-col">
            <p className="text-xs text-star">
                {series.map((q) => `${pickLabel(q)} ${q.symbol}`).join(" · ")}{" "}
                <span className="font-mono text-dust" dir="ltr">{unit}</span>
            </p>
            {/* Charts read left to right in both languages, like the equations. */}
            <div className="flex-1 min-h-0" dir="ltr">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data} margin={{ top: 6, right: 12, bottom: 0, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} />
                        <XAxis
                            dataKey={x.key}
                            type="number"
                            domain={x.key === "time" ? [0, "dataMax"] : ["auto", "auto"]}
                            tickFormatter={formatTick}
                            tick={showXTicks ? TICK_STYLE : false}
                            height={showXTicks ? 22 : 4}
                            stroke={AXIS_COLOR}
                        />
                        <YAxis
                            width={56}
                            domain={["auto", "auto"]}
                            tickFormatter={formatTick}
                            tick={TICK_STYLE}
                            stroke={AXIS_COLOR}
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
                            labelFormatter={(value) => `${x.symbol} = ${formatTick(Number(value))} ${x.unit}`}
                            formatter={(value, _name, item) => {
                                const q = series.find((s) => s.key === item.dataKey);
                                return [`${formatTick(Number(value))} ${q?.unit ?? ""}`, q ? `${pickLabel(q)} ${q.symbol}` : String(item.dataKey)];
                            }}
                            itemStyle={{ fontFamily: "IBM Plex Mono, monospace" }}
                            cursor={{ stroke: GRID_COLOR }}
                        />
                        {series.map((q) => (
                            <Line
                                key={q.key}
                                // Linear segments in sample order, so non-time axes (e.g. phase space) draw correctly.
                                type="linear"
                                dataKey={q.key}
                                name={q.key}
                                stroke={colors[q.key]}
                                strokeWidth={2}
                                dot={false}
                                isAnimationActive={false}
                            />
                        ))}
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}

export default function SimulationCharts({
    simulationData,
    experiment,
    isRTL,
    isOpen = false,
    onToggle,
    guide = null,
    hiddenKeys = []
}: SimulationChartsProps) {
    const { t, pick } = useTranslation(isRTL);
    const [height, setHeight] = useState(340);
    const [isDragging, setIsDragging] = useState(false);
    const dragStartY = useRef(0);
    const dragStartHeight = useRef(0);

    const hasData = !!simulationData && simulationData.length > 0;
    const slug = experiment?.slug ?? "";
    const outputs = experiment?.outputs;
    const firstSample = hasData ? simulationData[0] : null;

    const quantities = useMemo(() => chartableQuantities(guide, firstSample), [guide, firstSample]);
    const colorByKey = useMemo(
        () => Object.fromEntries(quantities.map((q, i) => [q.key, SERIES_COLORS[i % SERIES_COLORS.length]])),
        [quantities]
    );
    const fallbackAxes = useMemo(() => defaultAxes(quantities, outputs || [], guide), [quantities, outputs, guide]);
    // The student's choice belongs to one experiment; another experiment starts from its defaults.
    const [selection, setSelection] = useState<(AxisSelection & { slug: string }) | null>(null);
    const axes = sanitizeAxes(selection?.slug === slug ? selection : fallbackAxes, quantities, hiddenKeys, fallbackAxes);
    const xQuantity = quantities.find((q) => q.key === axes.x);
    const groups = groupByUnit(axes.y, quantities);

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
            <div className="flex flex-col overflow-hidden" style={{ height: `calc(${height}px - 24px)` }}>
                {quantities.length > 0 && (
                    <ChartAxisControls
                        quantities={quantities}
                        colors={colorByKey}
                        hiddenKeys={hiddenKeys}
                        views={guide?.chartViews || []}
                        selection={axes}
                        onChange={(next) => setSelection({ slug, ...next })}
                        isRTL={isRTL}
                    />
                )}
                <div className="flex-1 min-h-0 px-4 pb-3 sm:px-6">
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
                    ) : groups.length === 0 ? (
                        <p className="h-full flex items-center justify-center text-sm text-dust">{t("workspace.charts.pickY")}</p>
                    ) : (
                        <div className="h-full flex flex-col gap-1">
                            {groups.length > 1 && (
                                <p className="text-xs text-dust">{t("workspace.charts.unitsSplit")}</p>
                            )}
                            {groups.map((group, index) => (
                                <UnitChart
                                    key={group.unit}
                                    data={simulationData}
                                    x={xQuantity}
                                    series={group.quantities}
                                    colors={colorByKey}
                                    showXTicks={index === groups.length - 1}
                                    pickLabel={(q) => pick(q.label)}
                                />
                            ))}
                            {xQuantity && (
                                <p className="text-center text-xs text-dust">
                                    {pick(xQuantity.label)} <span className="font-mono" dir="ltr">{axisUnit(xQuantity)}</span>
                                </p>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
}
