import { Card, Typography } from 'antd'

const { Title, Paragraph } = Typography

export default function Dashboard() {
    return (
        <Card>
            <Title level={4}>Dashboard</Title>
            <Paragraph>
                หน้านี้เตรียมไว้สำหรับแสดงข้อมูลสรุป เช่น จำนวนนิสิตทั้งหมด GPAX เฉลี่ย
                และสถานะนิสิต
            </Paragraph>
        </Card>
    )
}