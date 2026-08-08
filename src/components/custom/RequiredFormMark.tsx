import type { ReactNode } from 'react'

interface RequiredMarkInfo {
    required: boolean
}

export function renderRequiredFormMark(
    label: ReactNode,
    { required }: RequiredMarkInfo,
) {
    return (
        <>
            {label}
            {required && (
                <span className="form-required-mark" aria-hidden="true">
                    *
                </span>
            )}
        </>
    )
}
