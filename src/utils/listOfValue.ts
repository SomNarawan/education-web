import type { ListOfValue } from '../types/ListOfValue'
import type { SelectOption } from '../types/MasterData'

export function getListOfValueLabel(item: ListOfValue): string {
    return item.name_th.trim() || item.name_en?.trim() || '-'
}

export function toListOfValueOptions(
    items: ListOfValue[],
): SelectOption[] {
    return items.map((item) => ({
        label: getListOfValueLabel(item),
        value: item.id,
    }))
}
