import * as React from "react";

type ReportLanguage = "ko" | "en";

export const detectReportLanguage = (source: string): ReportLanguage =>
  /\p{Script=Hangul}/u.test(source) ? "ko" : "en";

export const ReportLanguageContext = React.createContext<ReportLanguage>("en");
