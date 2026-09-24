/** Backend event mirror document returned by GET /api/admin/events. */
export interface StreamEvent {
  id: string
  topic: string
  type: string
  payload: string
  createdAt: string
}
