import { Typography } from 'antd'
import type { GuardianPhoneHistory as GuardianPhoneHistoryItem } from '../../types/StudentDetailResponse'

const { Text } = Typography

interface GuardianPhoneHistoryProps {
    currentPhone: string | null
    histories: GuardianPhoneHistoryItem[]
}

export default function GuardianPhoneHistory({
    currentPhone,
    histories,
}: GuardianPhoneHistoryProps) {
    const previousPhones = histories.filter((history) => history.old_phone)

    return (
        <span
            style={{
                display: 'inline-flex',
                flexDirection: 'column',
                gap: 2,
            }}
        >
            <Text>{currentPhone || '-'}</Text>

            {previousPhones.map((history) => (
                <Text key={history.id} delete type="secondary">
                    {history.old_phone}
                </Text>
            ))}
        </span>
    )
}
