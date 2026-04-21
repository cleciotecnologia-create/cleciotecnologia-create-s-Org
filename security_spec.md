# Security Specification - Complaints

## Data Invariants
- A complaint must have a subject and description.
- A complaint must belong to a condo.
- If not anonymous, the sender's name and ID must match the authenticated user.
- If anonymous, no sender ID should be identifiable to non-admins (though we store senderId for the user to see their own history).

## The Dirty Dozen Payloads (Complaints)
1. Create complaint for a different condo.
2. Create complaint as another resident (identity spoofing).
3. Update someone else's complaint status as a resident.
4. Delete a complaint (not allowed for anyone for audit reasons).
5. Read all complaints as a resident (privacy breach).
6. Create anonymous complaint but inject a fake senderId.
7. Update complaint description after it has been reviewed.
8. Injection in subject (poisoning).
9. Injection in description (poisoning).
10. Create complaint without required fields.
11. Update status to an invalid value.
12. Read complaints without being authenticated.

## Implementation Strategy
- `isValidComplaint` helper for schema validation.
- `allow create`: If authenticated, valid schema, belongs to user's condo.
- `allow read (get)`: If owner or admin.
- `allow list`: If admin (see all) or resident (filter by senderId).
- `allow update`: Only admin can change status.
