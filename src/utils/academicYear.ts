export const BUDDHIST_ERA_OFFSET = 543

export interface AcademicYearOption {
    value: number
    label: string
}

export function toBuddhistYear(year: number): number {
    return year + BUDDHIST_ERA_OFFSET
}

export function toChristianYear(year: number): number {
    return year - BUDDHIST_ERA_OFFSET
}

export function createAcademicYearRange(
    currentYear: number,
    previousYearCount: number,
    futureYearCount: number,
): number[] {
    return Array.from(
        { length: previousYearCount + futureYearCount + 1 },
        (_, index) => currentYear + futureYearCount - index,
    )
}

export function createAcademicYearOptions(
    years: number[],
): AcademicYearOption[] {
    return Array.from(new Set(years))
        .sort((firstYear, secondYear) => secondYear - firstYear)
        .map((year) => ({
            value: year,
            label: String(toBuddhistYear(year)),
        }))
}
