export async function notifySlack(message: string) {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL
  if (!webhookUrl) {
    console.warn('SLACK_WEBHOOK_URL not set, skipping notification')
    return
  }

  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: message }),
    })
  } catch (error) {
    console.error('Failed to send Slack notification:', error)
  }
}

export function newRequestMessage(params: {
  department: string
  position: string
  managerName: string
  jobGrade?: string
}) {
  return `📣 *HC Request ใหม่!*
🏢 *แผนก:* ${params.department}
💼 *ตำแหน่ง:* ${params.position}
👤 *ผู้ขอ:* ${params.managerName}
📊 *JG:* ${params.jobGrade || '-'}`
}

export function assignedMessage(params: {
  requestId: string
  position: string
  assignedTo: string
}) {
  return `✋ *มีคนรับเคสแล้ว!*
📋 *Request:* ${params.requestId}
💼 *ตำแหน่ง:* ${params.position}
👤 *รับโดย:* ${params.assignedTo}`
}

export function statusChangedMessage(params: {
  requestId: string
  fromStatus: string
  toStatus: string
}) {
  return `🔄 *Status เปลี่ยน*
📋 *Request:* ${params.requestId}
📊 *${params.fromStatus} → ${params.toStatus}*`
}
