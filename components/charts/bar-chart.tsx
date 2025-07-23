"use client"

import { TrendingUp, ArrowLeft, ArrowRight } from "lucide-react";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
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
import { Button } from "@/components/ui/button";

const chartConfig = {
  appointments: {
    label: "Appointments",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig;

interface AppointmentBarChartProps {
  data: Array<{
    name: string;
    appointments: number;
  }>;
  title?: string;
  weekRange?: string; // e.g. "Jul 21 - Jul 27"
  onPrevWeek?: () => void;
  onNextWeek?: () => void;
  disableNext?: boolean;
}

export function AppointmentBarChart({
  data,
  title = "Patient Visits (Weekly)",
  weekRange = "",
  onPrevWeek,
  onNextWeek,
  disableNext = false,
}: AppointmentBarChartProps) {
  return (
    <Card className="h-full flex flex-col justify-between">
      <CardHeader className="flex flex-row items-center justify-between w-full pb-2 pt-6 px-6">
        <div className="flex flex-col">
          <span className="text-base font-semibold">{title}</span>
          {weekRange && (
            <span className="text-xs text-muted-foreground mt-0.5">{weekRange}</span>
          )}
        </div>
        <div className="flex gap-2 ml-auto">
          <Button size="icon" variant="outline" onClick={onPrevWeek} disabled={!onPrevWeek}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <Button size="icon" variant="outline" onClick={onNextWeek} disabled={disableNext || !onNextWeek}>
            <ArrowRight className="w-5 h-5" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 justify-center items-center w-full pb-2">
        <div className="flex justify-center items-center w-full" style={{ minHeight: 160 }}>
          <div className="w-4/5 max-w-[500px] min-w-[250px]">
            <ChartContainer config={chartConfig} className="flex items-center justify-center">
              <BarChart accessibilityLayer data={data}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="name"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                  tickFormatter={(value) => value.slice(0, 3)}
                  tick={{ fontSize: 10 }}
                />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent hideLabel />}
                />
                <Bar dataKey="appointments: " fill="var(--color-appointments)" radius={8} />
              </BarChart>
            </ChartContainer>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col items-center gap-1 text-xs pt-0">
        <div className="flex gap-2 font-medium leading-none items-center justify-center">
          Trending up by 5.2% this week <TrendingUp className="h-3 w-3" />
        </div>
        <div className="leading-none text-muted-foreground text-center">
          Showing total appointments for the current week
        </div>
      </CardFooter>
    </Card>
  );
}

