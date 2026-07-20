"use client"

import * as React from "react"
import { Calendar } from "./ui/calendar"
import { Card, CardContent } from "./ui/card"
import { addDays } from "date-fns"
import { type DateRange } from "react-day-picker"

interface CalendarRangeProps {
    onRangeChange?: (range: DateRange | undefined) => void;
}

export function CalendarRange({ onRangeChange }: CalendarRangeProps) {
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>({
    from: new Date(),
    to: addDays(new Date(), 7),
  })

  React.useEffect(() => {
    if (onRangeChange) {
        onRangeChange(dateRange);
    }
  }, [dateRange, onRangeChange]);

  return (
    <Card className="mx-auto w-fit p-0 overflow-hidden border-slate-200 shadow-lg">
      <CardContent className="p-0">
        <Calendar
          mode="range"
          defaultMonth={dateRange?.from}
          selected={dateRange}
          onSelect={setDateRange}
          numberOfMonths={2}
          disabled={(date) =>
            date < new Date(new Date().setHours(0,0,0,0))
          }
        />
      </CardContent>
    </Card>
  )
}
