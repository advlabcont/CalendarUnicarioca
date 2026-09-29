# Security Specification for EduSchedule

## 1. Data Invariants
- **Config Invariant**: The `config/teacher` document must have a `password` property of type string with size between 1 and 100 characters.
- **Booking ID Invariant**: The document ID for any booking must match a standard timeslot format (e.g. `hh:mm`) and must equal the `id` field within the payload.
- **Booking Fields Invariant**: Every booking must contain `id`, `slot`, `projectTitle`, `members`, `materials`, and `createdAt` of valid types.
- **Size Limits**: `projectTitle` must be <= 200 chars, `members` must be <= 500 chars, `customMaterials` (if present) must be <= 500 chars, and `materials` array must be <= 20 items.

## 2. The "Dirty Dozen" Payloads (Malicious/Invalid Writes)

### Config Collection Hacks
1. **Empty Password Injection**:
```json
{
  "password": ""
}
```
2. **Gigantic Password DOS**:
```json
{
  "password": "A".repeat(10000)
}
```
3. **Invalid Config Type**:
```json
{
  "password": 12345
}
```
4. **Unapproved Field Injection**:
```json
{
  "password": "senha",
  "isAdmin": true
}
```

### Bookings Collection Hacks
5. **ID Mismatch**:
```json
{
  "id": "10:00",
  "slot": "08:00 - 08:20",
  "projectTitle": "Test",
  "members": "John",
  "materials": [],
  "createdAt": 1719183600000
}
```
6. **SQL/Junk ID Injection**:
```json
{
  "id": "../hacked/path",
  "slot": "08:00 - 08:20",
  "projectTitle": "Test",
  "members": "John",
  "materials": [],
  "createdAt": 1719183600000
}
```
7. **Missing Required Field**:
```json
{
  "id": "08:00",
  "slot": "08:00 - 08:20",
  "members": "John",
  "materials": [],
  "createdAt": 1719183600000
}
```
8. **Invalid Title Type**:
```json
{
  "id": "08:00",
  "slot": "08:00 - 08:20",
  "projectTitle": 42,
  "members": "John",
  "materials": [],
  "createdAt": 1719183600000
}
```
9. **Super-Sized Project Title**:
```json
{
  "id": "08:00",
  "slot": "08:00 - 08:20",
  "projectTitle": "A".repeat(1000),
  "members": "John",
  "materials": [],
  "createdAt": 1719183600000
}
```
10. **Huge Materials List (Array Bloating)**:
```json
{
  "id": "08:00",
  "slot": "08:00 - 08:20",
  "projectTitle": "Test",
  "members": "John",
  "materials": ["A", "B", "C"].repeat(50),
  "createdAt": 1719183600000
}
```
11. **Non-String in Materials List**:
```json
{
  "id": "08:00",
  "slot": "08:00 - 08:20",
  "projectTitle": "Test",
  "members": "John",
  "materials": [123, "Projector"],
  "createdAt": 1719183600000
}
```
12. **Future Timestamp Spoofing**:
```json
{
  "id": "08:00",
  "slot": "08:00 - 08:20",
  "projectTitle": "Test",
  "members": "John",
  "materials": [],
  "createdAt": 9999999999999
}
```

## 3. The Test Runner Spec
A standard test configuration checks all rules against these constraints. Since we are testing client-side anonymous access, the runner ensures that:
- Anyone can read/write valid `config` and `bookings`.
- Any invalid schemas/payloads from the Dirty Dozen result in `PERMISSION_DENIED`.
