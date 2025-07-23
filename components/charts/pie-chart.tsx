"use client";

import * as React from "react";
import { TrendingUp } from "lucide-react";
import { Label, Pie, PieChart } from "recharts";

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

interface TreatmentPieChartProps {
  data: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  title?: string;
  description?: string;
}

export function TreatmentPieChart({
  data,
  title = "Treatment Types",
  description = "This month's distribution",
}: TreatmentPieChartProps) {
  const chartConfig = React.useMemo(() => {
    const config: ChartConfig = {};
    data.forEach((item) => {
      config[item.name.toLowerCase().replace(/\s+/g, "")] = {
        label: item.name,
        color: item.color,
      };
    });
    return config;
  }, [data]);

  const chartData = data.map((item) => ({
    treatment: item.name.toLowerCase().replace(/\s+/g, ""),
    visitors: item.value,
    fill: item.color,
  }));

  const totalVisitors = React.useMemo(() => {
    return chartData.reduce((acc, curr) => acc + curr.visitors, 0);
  }, [chartData]);

  return (
    <Card className="h-full flex flex-col justify-between">
      <CardHeader className="flex flex-row items-center justify-between w-full pb-2 pt-6 px-6">
        <div className="flex flex-col">
          <span className="text-base font-semibold">{title}</span>
          {description && (
            <span className="text-xs text-muted-foreground mt-0.5">
              {description}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 justify-center items-center w-full pb-2">
        <div className="w-4/5 max-w-[500px] min-w-[250px]">
          <ChartContainer
            config={chartConfig}
            className="mx-auto aspect-square max-h-[250px]"
          >
            <PieChart>
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent hideLabel />}
              />
              <Pie
                data={chartData}
                dataKey="visitors"
                nameKey="treatment"
                innerRadius={40}
                strokeWidth={3}
              >
                <Label
                  content={({ viewBox }) => {
                    if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                      return (
                        <text
                          x={viewBox.cx}
                          y={viewBox.cy}
                          textAnchor="middle"
                          dominantBaseline="middle"
                        >
                          <tspan
                            x={viewBox.cx}
                            y={viewBox.cy}
                            className="fill-foreground text-xl font-bold"
                          >
                            {totalVisitors.toLocaleString()}
                          </tspan>
                          <tspan
                            x={viewBox.cx}
                            y={(viewBox.cy || 0) + 16}
                            className="fill-muted-foreground text-xs"
                          >
                            Treatments
                          </tspan>
                        </text>
                      );
                    }
                  }}
                />
              </Pie>
            </PieChart>
          </ChartContainer>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col items-center gap-1 text-xs pt-0">
        <div className="flex gap-2 font-medium leading-none items-center justify-center">
          Trending up by 5.2% this month <TrendingUp className="h-3 w-3" />
        </div>
        <div className="leading-none text-muted-foreground text-center">
          Showing total treatments for the current month
        </div>
      </CardFooter>
    </Card>
  );
}
