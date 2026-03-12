import { createServerClient } from './supabase'

interface LogParams {
  requestId: string
  action: string
  actionBy: string
  fromStatus?: string
  toStatus?: string
  comment?: string
}

export async function logAction(params: LogParams) {
  const db = createServerClient()
  const logId = `LOG-${Date.now()}`

  const { error } = await db.from('hc_logs').insert({
    log_id: logId,
    request_id: params.requestId,
    action: params.action,
    action_by: params.actionBy,
    action_date: new Date().toISOString(),
    from_status: params.fromStatus,
    to_status: params.toStatus,
    comment: params.comment,
  })

  if (error) {
    console.error('Failed to log action:', error)
  }

  return { logId, error }
}
