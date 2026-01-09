import { Card, CardContent } from "@/components/ui/card";

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    color: string;
    dataKey: string;
  }>;
  label?: string;
}

export function CustomChartTooltip({
  active,
  payload,
  label,
}: CustomTooltipProps) {
  if (!active || !payload || !payload.length) {
    return null;
  }

  return (
    <Card className="shadow-lg">
      <CardContent className="p-3">
        <p className="font-medium text-sm mb-2">{label}</p>
        <div className="space-y-1">
          {payload.map((entry, index) => (
            <div
              key={index}
              className="flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-sm"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-sm text-muted-foreground">
                  {entry.name}:
                </span>
              </div>
              <span className="text-sm font-medium">
                {entry.value.toLocaleString()} pcs
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
