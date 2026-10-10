export type VacationRequest = {
  id: string
  employeeName: string
  startDate: string
  endDate: string
  workingDays: number
  status: string
  createdAt: string
  dateLabel: string
}

export type VacationPreview = {
  workingDays: number
  message: string
}
