export const appColors = {
    error: '#ff4d4f',
    success: '#52c41a',
    warning: '#faad14',
    info: '#1677ff',
    neutral: '#64748b',
} as const

export const chartColors = {
    gradeLow: '#ff5b5b',
    gradeBelowStandard: '#ff8a34',
    gradeGood: '#8bcf8b',
    gradeExcellent: '#8bd2f2',
} as const

const cssVariables: Record<string, string> = {
    '--app-color-error': appColors.error,
    '--app-color-success': appColors.success,
    '--app-color-warning': appColors.warning,
    '--app-color-info': appColors.info,
    '--app-color-neutral': appColors.neutral,
}

export function applyAppColorVariables() {
    for (const [name, value] of Object.entries(cssVariables)) {
        document.documentElement.style.setProperty(name, value)
    }
}
