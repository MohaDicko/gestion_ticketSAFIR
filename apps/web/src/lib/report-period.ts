export type ReportPeriod =
  | "DAILY"
  | "WEEKLY"
  | "MONTHLY"
  | "QUARTERLY"
  | "SEMESTER"
  | "YEARLY"
  | "CUSTOM";

export interface ReportDateRange {
  from: string;
  to: string;
}

const formatLocalDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const getReportDateRange = (
  period: ReportPeriod,
  customFrom: string,
  customTo: string,
  referenceDate = new Date(),
): ReportDateRange => {
  if (period === "CUSTOM") {
    return { from: customFrom, to: customTo };
  }

  const start = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate(),
  );
  const end = new Date(start);

  switch (period) {
    case "DAILY":
      break;
    case "WEEKLY": {
      const daysSinceMonday = (start.getDay() + 6) % 7;
      start.setDate(start.getDate() - daysSinceMonday);
      end.setTime(start.getTime());
      end.setDate(end.getDate() + 6);
      break;
    }
    case "MONTHLY":
      start.setDate(1);
      end.setMonth(end.getMonth() + 1, 0);
      break;
    case "QUARTERLY": {
      const quarterStartMonth = Math.floor(start.getMonth() / 3) * 3;
      start.setMonth(quarterStartMonth, 1);
      end.setFullYear(start.getFullYear(), quarterStartMonth + 3, 0);
      break;
    }
    case "SEMESTER": {
      const semesterStartMonth = Math.floor(start.getMonth() / 6) * 6;
      start.setMonth(semesterStartMonth, 1);
      end.setFullYear(start.getFullYear(), semesterStartMonth + 6, 0);
      break;
    }
    case "YEARLY":
      start.setMonth(0, 1);
      end.setMonth(11, 31);
      break;
  }

  return { from: formatLocalDate(start), to: formatLocalDate(end) };
};
