import type { ListOfValue } from '../types/ListOfValue'
import type { SelectOption } from '../types/MasterData'

export function getListOfValueLabel(item: ListOfValue<string | number>): string {
    return item.name_th.trim() || item.name_en?.trim() || '-'
}

export function toListOfValueOptions<T extends string | number>(
    items: ListOfValue<T>[],
): SelectOption<T>[] {
    return items.map((item) => ({
        label: getListOfValueLabel(item),
        value: item.id,
    }))
}
