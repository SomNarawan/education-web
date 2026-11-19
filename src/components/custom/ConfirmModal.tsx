import { Modal } from 'antd'
import type { ModalProps } from 'antd'
import { mergeConfirmModalClassName } from './confirmModalHelpers'

type ConfirmModalProps = Omit<ModalProps, 'centered'>

export default function ConfirmModal({
    className,
    cancelText = 'ยกเลิก',
    ...props
}: ConfirmModalProps) {
    return (
        <Modal
            {...props}
            centered
            className={mergeConfirmModalClassName(className)}
            cancelText={cancelText}
        />
    )
}
