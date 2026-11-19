import { Modal } from 'antd'
import type { ModalFuncProps } from 'antd'

const confirmModalClassName = 'centered-confirm-modal'

export function mergeConfirmModalClassName(className?: string) {
    return [confirmModalClassName, className].filter(Boolean).join(' ')
}

export function showConfirmModal({
    className,
    ...props
}: ModalFuncProps) {
    return Modal.confirm({
        cancelText: 'ยกเลิก',
        ...props,
        centered: true,
        className: mergeConfirmModalClassName(className),
    })
}
