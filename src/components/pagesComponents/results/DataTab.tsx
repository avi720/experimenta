import { Download } from "lucide-react";
import { useTranslation } from "@/i18n";
import { formatDisplayValue } from "./resultsDomain";
import { panelTitleClass, primaryButtonClass } from "./resultsStyles";
import type { Sample } from "@/types/results";

type DataTabProps = {
  samples: Sample[];
  onExportCsv: () => void;
};

export default function DataTab({ samples, onExportCsv }: DataTabProps) {
  const { t } = useTranslation();
  const columns = samples.length > 0 ? Object.keys(samples[0]) : [];

  return (
    <section>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className={panelTitleClass}>{t('results.dataTableTitle')}</h3>
        {/* Export is the one primary action of the detail panel. */}
        <button type="button" onClick={onExportCsv} disabled={!samples.length} className={primaryButtonClass}>
          <Download className="w-4 h-4" aria-hidden="true" />
          CSV
        </button>
      </div>

      {/* Sample columns are physical quantities, so the table reads left to right in both languages. */}
      <div className="mt-4 max-h-[28rem] overflow-auto border border-line" dir="ltr">
        <table className="w-full caption-bottom text-xs">
          <thead className="sticky top-0 z-10 bg-space-raised">
            <tr>
              {columns.map((key) => (
                <th
                  key={key}
                  scope="col"
                  className="h-9 px-3 text-end align-middle font-medium text-dust whitespace-nowrap border-b border-line"
                >
                  {key}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {samples.map((row, index) => (
              <tr key={index} className="even:bg-space-raised/50 hover:bg-blueshift/5 transition-colors">
                {Object.values(row).map((value, i) => (
                  <td key={i} className="px-3 py-1.5 text-end font-mono tabular-nums text-star/90 whitespace-nowrap">
                    {formatDisplayValue(value, 4)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
