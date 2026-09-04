import { countdownLabel, urgency } from '../lib/consignments'
import Badge from './Badge'

const TONE_BY_URGENCY = {
  overdue: 'danger',
  soon: 'gold',
  ok: 'neutral',
  frozen: 'navy',
}

export default function Countdown({ consignment }) {
  const level = urgency(consignment)
  return (
    <Badge tone={TONE_BY_URGENCY[level]}>
      {countdownLabel(consignment)}
    </Badge>
  )
}
