import { describe, expect, it } from "vitest"

import { normalisePayload } from "./normalize"

/**
 * The API renamed `visit`→`queue_session`; the UI still reads `visit`. This
 * mapper is the only thing keeping the two in sync, so it is tested directly.
 */
describe("normalisePayload", () => {
  it("adds a visit alias and visit_number for a queue session", () => {
    const session = {
      id: 7,
      session_number: "A-012",
      intake_channel: "KIOSK",
      status: "WAITING",
      customer_id: 3,
      customer: { id: 3, name: "Budi" },
      department: { id: 1, name: "General" },
    }

    const out = normalisePayload({
      data: { queue_session: session },
    }) as unknown as {
      data: {
        queue_session: Record<string, unknown>
        visit: Record<string, unknown>
      }
    }

    expect(out.data.visit.visit_number).toBe("A-012")
    expect(out.data.visit.client_id).toBe(3)
    expect(out.data.visit.client).toEqual({ id: 3, name: "Budi" })
    expect(out.data.queue_session.visit_number).toBe("A-012")
  })

  it("adds visit_id and visit to a queue ticket", () => {
    const ticket = {
      id: 9,
      queue_session_id: 7,
      queue_number: "R001",
      status: "CREATED",
      assigned_to_user_id: 2,
      queue_session: {
        id: 7,
        session_number: "A-012",
        intake_channel: "MANUAL",
        department: { id: 1, name: "General" },
      },
    }

    const out = normalisePayload({ data: ticket }) as unknown as {
      data: Record<string, unknown> & { visit: Record<string, unknown> }
    }

    expect(out.data.visit_id).toBe(7)
    expect(out.data.assigned_to).toBe(2)
    expect(out.data.visit.visit_number).toBe("A-012")
    expect(out.data.visit.department).toEqual({ id: 1, name: "General" })
  })

  it("leaves an unrelated payload untouched", () => {
    const payload = { data: { id: 1, name: "General", code: "GEN" } }

    expect(normalisePayload(payload)).toEqual(payload)
  })

  it("walks arrays", () => {
    const out = normalisePayload({
      data: {
        data: [
          {
            id: 1,
            queue_session_id: 5,
            queue_number: "A1",
            queue_session: {
              id: 5,
              session_number: "S1",
              intake_channel: "KIOSK",
            },
          },
        ],
      },
    }) as unknown as { data: { data: Array<Record<string, unknown>> } }

    expect(out.data.data[0].visit_id).toBe(5)
  })
})
