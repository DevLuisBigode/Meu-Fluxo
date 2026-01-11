import React from "react";
import { Button } from "@/components/ui/button";

const DayOfMonthSelector = ({ selected, onChange }) => {
  const days = Array.from({ length: 31 }, (_, i) => i + 1);

  return (
    <div className="grid grid-cols-7 gap-2 max-h-64 overflow-y-auto" data-testid="day-of-month-selector">
      {days.map((day) => (
        <Button
          key={day}
          type="button"
          variant={selected === day ? "default" : "outline"}
          className="h-10 text-sm font-semibold"
          onClick={() => onChange(day)}
          data-testid={`day-${day}`}
        >
          {day}
        </Button>
      ))}
    </div>
  );
};

export default DayOfMonthSelector;