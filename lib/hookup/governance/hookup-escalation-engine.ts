export function escalateCase(
  report_count: number
) {

  if (report_count > 10) {
    return "AUTO_BAN";
  }

  if (report_count > 5) {
    return "HUMAN_REVIEW_PRIORITY";
  }

  return "NORMAL_QUEUE";
}
