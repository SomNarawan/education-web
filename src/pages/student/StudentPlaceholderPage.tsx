import { Card, Empty, Typography } from 'antd'

interface StudentPlaceholderPageProps {
    title: string
}

export default function StudentPlaceholderPage({
    title,
}: StudentPlaceholderPageProps) {
    return (
        <div className="student-page">
            <Typography.Title level={2}>{title}</Typography.Title>
            <Card>
                <Empty description="อยู่ระหว่างการพัฒนา" />
            </Card>
        </div>
    )
}
