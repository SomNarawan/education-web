import { Col, Row, Typography } from 'antd'
import type { ReactNode } from 'react'

const { Text } = Typography

interface DetailItemProps {
    label: string
    value?: ReactNode
}

export default function DetailItem({ label, value }: DetailItemProps) {
    const displayValue =
        value === null || value === undefined || value === '' ? '-' : value

    return (
        <Row style={{ marginBottom: 18 }}>
            <Col span={10}>
                <Text strong style={{ color: '#000000' }}>
                    {label} :
                </Text>
            </Col>
            <Col span={14}>
                <Text>{displayValue}</Text>
            </Col>
        </Row>
    )
}
