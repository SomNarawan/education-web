export function formatDecimal(value: number) {
    return value.toFixed(2)
}

export function formatDiff(value: string | number) {
    const numericValue = Number(value)

    if (Number.isNaN(numericValue)) {
        return String(value)
    }

    return numericValue > 0
        ? `+${formatDecimal(numericValue)}`
        : formatDecimal(numericValue)
}

export function getDiffColor(value: string | number) {
    const numericValue = Number(value)

    return !Number.isNaN(numericValue) && numericValue < 0
        ? '#ff0000'
        : '#008000'
}
