export function logQueueEvent(
  action: 'Published' | 'Received' | 'Deleted' | 'Failed',
  fields: {
    eventId?: string;
    messageId?: string;
    simulationRunId?: string;
    eventType?: string;
    details?: string;
  },
) {
  const payload = {
    action,
    eventId: fields.eventId,
    messageId: fields.messageId,
    simulationRunId: fields.simulationRunId,
    eventType: fields.eventType,
    details: fields.details,
  };

  const line = JSON.stringify(payload);
  if (action === 'Failed') {
    console.error(line);
    return;
  }

  console.log(line);
}
