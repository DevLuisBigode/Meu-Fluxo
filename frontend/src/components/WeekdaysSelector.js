import React from "react";
import { Button } from "@/components/ui/button";

const WeekdaysSelector = ({ selected = [], onChange }) => {
  const weekdays = [
    { value: 0, label: "Dom" },
    { value: 1, label: "Seg" },
    { value: 2, label: "Ter" },
    { value: 3, label: "Qua" },
    { value: 4, label: "Qui" },
    { value: 5, label: "Sex" },
    { value: 6, label: "Sáb" },
  ];

  const toggleDay = (day) => {
    if (selected.includes(day)) {
      onChange(selected.filter((d) => d !== day));
    } else {
      onChange([...selected, day].sort());
    }
  };

  return (
    <div className="grid grid-cols-7 gap-2" data-testid="weekdays-selector">
      {weekdays.map((day) => (
        <Button
          key={day.value}
          type="button"
          variant={selected.includes(day.value) ? "default" : "outline"}
          className="h-12 w-full text-xs font-semibold"
          onClick={() => toggleDay(day.value)}
          data-testid={`weekday-${day.value}`}
        >
          {day.label}
        </Button>
      ))}
    </div>
  );
};

export default WeekdaysSelector;