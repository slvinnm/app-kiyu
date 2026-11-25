/**
 * Normalise API payloads to the shape the UI already speaks.
 *
 * The API returns queue sessions as `queue_session` with `session_number`
 * (the domain was renamed from "visit"). The UI keeps the older `visit` /
 * `visit_number` vocabulary for now, so we add those aliases at the boundary
 * instead of touching ~150 call sites. The API remains the source of truth:
 * this only *adds* properties; nothing the backend sent is removed.
 *
 * The mapping is narrowly keyed — it only fires on objects that actually carry
 * a queue-session or queue-ticket shape, so a department/customer/workflow
 * payload passes through untouched.
 */

type Dict = Record<string, unknown>

function isDict(value: unknown): value is Dict {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

/** A queue-session object → the `Visit` shape the UI reads. */
function normaliseSession(session: Dict): Dict {
  return {
    ...session,
    // `visit_number` is the UI's name for the session number.
    visit_number: session.visit_number ?? session.session_number,
    visit_token: session.visit_token ?? session.tracking_token ?? null,
    // The customer record is exposed to the UI as `client`.
    client_id: session.client_id ?? session.customer_id ?? null,
    client: session.client ?? session.customer ?? null,
    // Actor is exposed as `registered_by` in the UI.
    registered_by:
      session.registered_by ?? session.registered_by_user_id ?? null,
    // The UI reads `registered_at`; fall back to creation time.
    registered_at:
      session.registered_at ??
      session.checked_in_at ??
      session.created_at ??
      null,
  }
}

/** A queue-ticket object → the `QueueTicket` shape the UI reads. */
function normaliseTicket(ticket: Dict): Dict {
  const rawSession = ticket.queue_session ?? ticket.visit
  const session = isDict(rawSession) ? normaliseSession(rawSession) : null

  return {
    ...ticket,
    visit_id: ticket.visit_id ?? ticket.queue_session_id ?? session?.id ?? null,
    assigned_to: ticket.assigned_to ?? ticket.assigned_to_user_id ?? null,
    visit: session,
  }
}

function isSessionShaped(value: Dict): boolean {
  return (
    typeof value.session_number !== "undefined" &&
    typeof value.intake_channel !== "undefined"
  )
}

function isTicketShaped(value: Dict): boolean {
  return (
    typeof value.queue_number !== "undefined" &&
    (typeof value.queue_session_id !== "undefined" ||
      typeof value.visit_id !== "undefined")
  )
}

/**
 * Deep-walk a payload, adding the UI aliases wherever a session or ticket is
 * found. Returns a new structure; the input is not mutated.
 */
export function normalisePayload<T>(value: T): T {
  return walk(value) as T
}

function walk(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(walk)
  }

  if (!isDict(value)) {
    return value
  }

  // Recurse first so nested sessions/tickets are normalised before we shape the
  // parent (a ticket wraps a session).
  const recursed: Dict = {}

  for (const [key, child] of Object.entries(value)) {
    recursed[key] = walk(child)
  }

  // An explicit `queue_session` key: add its `visit` alias at the same level.
  if (isDict(recursed.queue_session) && typeof recursed.visit === "undefined") {
    recursed.visit = normaliseSession(recursed.queue_session)
  }

  if (
    isDict(recursed.queue_session) &&
    isSessionShaped(recursed.queue_session)
  ) {
    recursed.queue_session = normaliseSession(recursed.queue_session)
  }

  if (isTicketShaped(recursed)) {
    return normaliseTicket(recursed)
  }

  if (isSessionShaped(recursed)) {
    return normaliseSession(recursed)
  }

  return recursed
}
