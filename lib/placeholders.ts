// The placeholder marker (see CLAUDE.md, "Placeholders: always xxx").
// "xxx" alone = unknown. A value ending in " xxx" = a best guess to confirm.

export const XXX = "xxx";
export const isUnknown = (value: string) => value.trim() === XXX;
export const isGuess = (value: string) => value.trim().endsWith(` ${XXX}`);
