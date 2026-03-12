export type Status =
  | 'Open'
  | 'Assigned'
  | 'Recruiting'
  | 'Interviewing'
  | 'Offering'
  | 'On Hold'
  | 'Cancelled'
  | 'Closed'

export type Role = 'manager' | 'people_experience' | 'ceo'

export type RequestType = 'Replacement' | 'Request New HC'

export interface User {
  id: string
  email: string
  name_surname: string
  nickname?: string
  full_name?: string
  department: string
  position: string
  job_grade?: string
  role: Role
}

export interface HCRequest {
  id: string
  request_id: string
  created_at: string
  manager_email: string
  department: string
  request_type: RequestType
  position_select?: string
  position_new?: string
  replace_who?: string
  last_working_date?: string
  job_grade?: string
  requirements_comment?: string
  jd_file_url?: string
  status: Status
  assigned_to?: string
  assigned_date?: string
  updated_at: string
  // computed
  position_display?: string
  assigned_display?: string
  // joined
  manager_name?: string
  assigned_name?: string
}

export interface HCLog {
  id: string
  log_id: string
  request_id: string
  action: string
  action_by: string
  action_date: string
  from_status?: string
  to_status?: string
  comment?: string
  // joined
  action_by_name?: string
}

export interface Staff {
  id: string
  name_surname: string
  nickname?: string
  full_name?: string
  email: string
  department: string
  position: string
  job_grade?: string
  created_at: string
}

export interface Position {
  id: string
  position: string
  department: string
  job_grade?: string
}

export const STATUS_COLORS: Record<Status, string> = {
  Open: '#f59e0b',
  Assigned: '#3b82f6',
  Recruiting: '#8b5cf6',
  Interviewing: '#f97316',
  Offering: '#10b981',
  'On Hold': '#6b7280',
  Cancelled: '#ef4444',
  Closed: '#008065',
}

export const STATUS_LIST: Status[] = [
  'Open',
  'Assigned',
  'Recruiting',
  'Interviewing',
  'Offering',
  'On Hold',
  'Cancelled',
  'Closed',
]

export const JOB_GRADES = [
  'JG0', 'JG1', 'JG2', 'JG3', 'JG4', 'JG5', 'JG6',
  'JG7', 'JG8', 'JG9', 'JG10', 'JG11', 'JG12', 'JG13', 'JG14',
]
