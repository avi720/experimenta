import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Download } from "lucide-react";
import { useTranslation } from "@/i18n";
import { formatDisplayValue } from "./resultsDomain";
import type { Sample } from "@/types/results";

type DataTabProps = {
  samples: Sample[];
  onExportCsv: () => void;
};

export default function DataTab({ samples, onExportCsv }: DataTabProps) {
  const { t } = useTranslation();
  const columns = samples.length > 0 ? Object.keys(samples[0]) : [];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{t('results.dataTableTitle')}</CardTitle>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={onExportCsv} disabled={!samples.length} className="gap-2">
            <Download className="w-4 h-4" />
            CSV
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="max-h-96 overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((key) => (
                  <TableHead key={key} className="text-xs">{key}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {samples.map((row, index) => (
                <TableRow key={index}>
                  {Object.values(row).map((value, i) => (
                    <TableCell key={i} className="text-xs">
                      {formatDisplayValue(value, 4)}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
