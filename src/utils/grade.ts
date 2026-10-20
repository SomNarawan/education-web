import { chartColors } from '../config/appColors'

export const gradeRanges = [
    'เกรด(0-1.74)',
    'เกรด(1.75-1.99)',
    'เกรด(2.0-3.24)',
    'เกรด(3.25-4.00)',
]

export const gradeRangeColors = [
    chartColors.gradeLow,
    chartColors.gradeBelowStandard,
    chartColors.gradeGood,
    chartColors.gradeExcellent,
]

function getGradeRangeIndex(gpa: number) {
    if (gpa >= 3.25) {
        return 3
    }

    if (gpa >= 2) {
        return 2
    }

    if (gpa >= 1.75) {
        return 1
    }

    return 0
}

export function getGradeRange(gpa: number) {
    return gradeRanges[getGradeRangeIndex(gpa)]
}

export function getGradeColor(gpa: number) {
    return gradeRangeColors[getGradeRangeIndex(gpa)]
}
