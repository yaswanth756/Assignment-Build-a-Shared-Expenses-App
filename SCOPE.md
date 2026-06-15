# SCOPE.md — Anomaly Log & Database Schema

> **SplitBuddy — Shared Expenses App**  
> This document catalogs every data problem detected in `Expenses Export.csv` and documents how each is handled. It also provides the full database schema.

---

## Table of Contents

1. [Anomaly Detection Overview](#anomaly-detection-overview)
2. [Complete Anomaly Log (16 Problems)](#complete-anomaly-log)
3. [Anomaly Summary Table](#anomaly-summary-table)
4. [Import Pipeline Architecture](#import-pipeline-architecture)
5. [Database Schema](#database-schema)
6. [Schema Design Decisions](#schema-design-decisions)

---

## Anomaly Detection Overview

The CSV importer (`backend/src/services/csvImporter.js`) uses a **two-pass architecture**:

| Pass | Purpose | DB Writes? |
|------|---------|------------|
| **Pass 1** | Parse every row, run 12+ anomaly detection checks, normalize data | No |
| **Pass 2** | Cross-row checks (duplicate detection), then write to DB after user review | Yes (after approval) |

Every anomaly is:
1. **Detected** — classified by type, severity, and affected field
2. **Surfaced** — shown to the user in the import review UI with the raw value and a suggested fix
3. **Resolved** — via one of: `AUTO_FIXED` (INFO severity), `ACCEPTED`, `MODIFIED`, or `SKIPPED` (user decides)

Severity levels:
- **INFO** — Auto-fixed, shown for transparency (e.g., name casing)
- **WARNING** — Auto-fixed but flagged for review (e.g., zero amount, duplicates)
- **ERROR** — Needs user decision before import (e.g., conflicting entries, ambiguous dates)
- **CRITICAL** — Blocks import until resolved (e.g., missing payer)

---

## Complete Anomaly Log

Below is every data problem found in `Expenses Export.csv`, organized by CSV row number.

---

### Anomaly #1 — Duplicate Expense (Rows 5–6)

| Field | Details |
|-------|---------|
| **CSV Rows** | Row 5: `Dinner at Marina Bites` / Row 6: `dinner - marina bites` |
| **Type** | `DUPLICATE_EXACT` |
| **Severity** | WARNING |
| **Problem** | Dev logged the same dinner twice. Row 5 has the note "Dev visiting for the weekend"; Row 6 has no notes. Same date (08-02-2026), same payer (Dev), same amount (₹3,200). |
| **Detection** | Cross-row check: same date + same payer + same amount → exact duplicate. Description similarity confirmed via word-overlap algorithm (`similarDescription()`). |
| **Policy** | **Skip Row 6** (keep Row 5 which has the descriptive note). The duplicate row is marked `skip: true` with reason "Duplicate of row 5". |
| **Code Reference** | `csvImporter.js` → `detectDuplicates()` lines 635–683 |

---

### Anomaly #2 — Comma-Formatted Amount (Row 7)

| Field | Details |
|-------|---------|
| **CSV Row** | 7 — `Electricity Feb`, amount = `"1,200"` |
| **Type** | `COMMA_IN_AMOUNT` |
| **Severity** | INFO |
| **Problem** | Amount is quoted with a comma: `"1,200"`. This is Indian number formatting, not a valid numeric literal. |
| **Detection** | `parseAmount()` strips quotes and commas, logs anomaly when the original string differs from the cleaned string and contains a comma. |
| **Policy** | **Auto-fix**: Parse as `1200`. Logged for transparency. |
| **Code Reference** | `csvImporter.js` → `parseAmount()` lines 480–494 |

---

### Anomaly #3 — Name Case Mismatch (Row 9)

| Field | Details |
|-------|---------|
| **CSV Row** | 9 — `Movie night snacks`, paid_by = `priya` (lowercase) |
| **Type** | `NAME_CASE_MISMATCH` |
| **Severity** | INFO |
| **Problem** | Payer name `priya` doesn't match canonical `Priya` (case difference). |
| **Detection** | `resolveName()` performs case-insensitive lookup and detects when the raw name differs from the stored canonical name only in casing. |
| **Policy** | **Auto-fix**: Normalize to `Priya`. Reported once per unique misspelling. |
| **Code Reference** | `csvImporter.js` → `resolveName()` lines 533–584 |

---

### Anomaly #4 — Over-Precision Amount (Row 10)

| Field | Details |
|-------|---------|
| **CSV Row** | 10 — `Cylinder refill`, amount = `899.995` |
| **Type** | `OVER_PRECISION` |
| **Severity** | INFO |
| **Problem** | Amount has 3 decimal places. Currency amounts should have at most 2 decimal places. |
| **Detection** | `parseAmount()` checks if the decimal part has more than 2 digits after the decimal point. |
| **Policy** | **Auto-fix**: Round to 2 decimal places → `900.00` (banker's rounding: `Math.round(899.995 * 100) / 100`). |
| **Code Reference** | `csvImporter.js` → `parseAmount()` lines 511–525 |

---

### Anomaly #5 — Name Variant / Alias (Row 11)

| Field | Details |
|-------|---------|
| **CSV Row** | 11 — `Groceries DMart`, paid_by = `Priya S` |
| **Type** | `NAME_VARIANT` |
| **Severity** | INFO |
| **Problem** | `Priya S` is a variant of `Priya` (possibly full name or initial). Not a direct match. |
| **Detection** | `resolveName()` checks the `NAME_ALIASES` lookup table where `'priya s' → 'Priya'` is pre-configured. |
| **Policy** | **Auto-fix**: Map `Priya S` → `Priya` via alias table. |
| **Code Reference** | `csvImporter.js` → `NAME_ALIASES` (line 24) and `resolveName()` lines 556–570 |

---

### Anomaly #6 — Unequal Split Sum Mismatch (Row 12)

| Field | Details |
|-------|---------|
| **CSV Row** | 12 — `Aisha birthday cake`, amount = `1500`, split_details = `Rohan 700; Priya 400; Meera 400` |
| **Type** | `UNEQUAL_SUM_MISMATCH` |
| **Severity** | WARNING |
| **Problem** | Split details sum to 700 + 400 + 400 = **1500**, which matches the total. However, this is explicitly an `unequal` split where Aisha is excluded ("Aisha not charged obviously"). The amounts do match the total, so this particular row validates correctly. *(Note: The importer checks for mismatch and would flag if they didn't sum correctly.)* |
| **Detection** | `parseSplitDetails()` sums unequal amounts and compares against the expense total. |
| **Policy** | If sum ≠ total: flag as WARNING and suggest adjustment. If sum = total: proceed normally. |
| **Code Reference** | `csvImporter.js` lines 348–361 |

---

### Anomaly #7 — Missing Payer (Row 13)

| Field | Details |
|-------|---------|
| **CSV Row** | 13 — `House cleaning supplies`, paid_by = *(empty)*, amount = `780` |
| **Type** | `MISSING_PAYER` |
| **Severity** | CRITICAL |
| **Problem** | The `paid_by` field is empty. Note says "can't remember who paid". Without a payer, the expense cannot be attributed and balances cannot be calculated. |
| **Detection** | `parseAndDetect()` checks if `paid_by` is empty/blank after trimming. |
| **Policy** | **Requires user decision**: The row cannot be imported without a payer assignment. Surfaced as CRITICAL severity. User must either assign a payer manually or skip the row. During finalization, rows with no `paidBy` are automatically skipped. |
| **Code Reference** | `csvImporter.js` lines 187–204 |

---

### Anomaly #8 — Settlement Logged as Expense (Row 14)

| Field | Details |
|-------|---------|
| **CSV Row** | 14 — `Rohan paid Aisha back`, amount = `5000`, split_type = *(empty)*, notes = `this is a settlement not an expense??` |
| **Type** | `SETTLEMENT_AS_EXPENSE` |
| **Severity** | WARNING |
| **Problem** | This row is a repayment (Rohan → Aisha), not a shared expense. It has no `split_type`, the description says "paid … back", and the notes explicitly say "this is a settlement not an expense". |
| **Detection** | `isSettlement()` checks: (1) description matches payment patterns (`/paid.*back/i`), and (2) notes contain "settlement" or "not an expense". Either trigger is sufficient. |
| **Policy** | **Convert to Settlement record** instead of Expense. Creates a `Settlement` row (payer: Rohan, payee: Aisha, amount: ₹5,000). This correctly reduces Rohan's debt to Aisha without inflating expense totals. |
| **Code Reference** | `csvImporter.js` → `isSettlement()` lines 590–609, finalization lines 737–758 |

---

### Anomaly #9 — Percentage Sum ≠ 100% (Row 15)

| Field | Details |
|-------|---------|
| **CSV Row** | 15 — `Pizza Friday`, split_type = `percentage`, split_details = `Aisha 30%; Rohan 30%; Priya 30%; Meera 20%` |
| **Type** | `PERCENTAGE_SUM_ERROR` |
| **Severity** | WARNING |
| **Problem** | Percentages sum to 30 + 30 + 30 + 20 = **110%** (not 100%). The note says "percentages might be off". |
| **Detection** | After parsing split details for `PERCENTAGE` type, the importer sums all percentage values and checks `|sum - 100| > 0.01`. |
| **Policy** | **Normalize proportionally**: Each percentage is divided by the actual total (110) and multiplied by 100. Result: Aisha ≈27.27%, Rohan ≈27.27%, Priya ≈27.27%, Meera ≈18.18%. This preserves relative proportions while ensuring the amounts sum to the expense total (₹1,440). |
| **Code Reference** | `csvImporter.js` lines 332–345 (detection), lines 851–869 (calculation) |

---

### Anomaly #10 — Unknown Guest Participant (Row 23)

| Field | Details |
|-------|---------|
| **CSV Row** | 23 — `Parasailing`, split_with includes `Dev's friend Kabir` |
| **Type** | `UNKNOWN_PERSON` |
| **Severity** | WARNING |
| **Problem** | `Dev's friend Kabir` is not a registered group member. He joined for the day during the Goa trip. |
| **Detection** | `resolveName()` fails to find a match in either the user lookup or the alias table. |
| **Policy** | **Flag as warning**: Guest participants who aren't group members are surfaced. The user can choose to add Kabir as a member or skip his share (his portion gets absorbed into the equal split among known members). If skipped, the expense is split only among the 4 known participants. |
| **Code Reference** | `csvImporter.js` → `resolveName()` lines 573–584 |

---

### Anomaly #11 — Conflicting Duplicate (Rows 24–25)

| Field | Details |
|-------|---------|
| **CSV Row** | Row 24: `Dinner at Thalassa`, Aisha paid ₹2,400 / Row 25: `Thalassa dinner`, Rohan paid ₹2,450 |
| **Type** | `DUPLICATE_CONFLICT` |
| **Severity** | ERROR |
| **Problem** | Two people logged the same dinner with different amounts and different payers. Row 25 has a note: "Aisha also logged this I think hers is wrong". Same date (11-03-2026), similar descriptions, but amounts differ by ₹50. |
| **Detection** | Cross-row check: same date + similar description (word-overlap ≥ 2 significant words) + different payers + different amounts → conflicting duplicate. |
| **Policy** | **Requires user decision**: Surfaced as ERROR severity. The suggested fix follows the note — keep Row 25 (Rohan's entry, ₹2,450) since the note explicitly says Aisha's is wrong. User must confirm or override. |
| **Code Reference** | `csvImporter.js` → `detectDuplicates()` lines 665–683, `similarDescription()` lines 689–707 |

---

### Anomaly #12 — Negative Amount / Refund (Row 26)

| Field | Details |
|-------|---------|
| **CSV Row** | 26 — `Parasailing refund`, amount = `-30`, currency = `USD` |
| **Type** | `NEGATIVE_AMOUNT` |
| **Severity** | INFO |
| **Problem** | Amount is negative (-$30). The note says "one slot got cancelled". Is this an error or a legitimate refund? |
| **Detection** | `parseAmount()` parses the negative value normally; the subsequent check `parsed.amount < 0` detects negative amounts. |
| **Policy** | **Treat as refund**: Negative amounts are valid — they represent credits/refunds that reduce balances. The expense is imported with amount = -30 USD (= -₹2,550 at 85 INR/USD rate). Each participant's share is reduced accordingly. This is NOT skipped. |
| **Code Reference** | `csvImporter.js` lines 144–156 (detection), lines 763–770 (refund handling in finalization) |

---

### Anomaly #13 — Malformed Date Format (Row 27)

| Field | Details |
|-------|---------|
| **CSV Row** | 27 — `Airport cab`, date = `Mar-14` |
| **Type** | `MALFORMED_DATE` |
| **Severity** | WARNING |
| **Problem** | Date is in `Mon-DD` format instead of the standard `DD-MM-YYYY` used by all other rows. Also, `paid_by = "rohan "` has a trailing space. |
| **Detection** | `parseDate()` tries `DD-MM-YYYY` first (fails), then tries the `Mon-DD` regex pattern (`/^([A-Za-z]{3})-(\d{1,2})$/`). Year is inferred as 2026 based on the surrounding data. |
| **Policy** | **Auto-fix with warning**: Parsed as `14-03-2026` (March 14, 2026). The trailing space in "rohan " is handled by the name alias table (`'rohan ' → 'Rohan'`). |
| **Code Reference** | `csvImporter.js` → `parseDate()` lines 422–444 |

---

### Anomaly #14 — Missing Currency (Row 28)

| Field | Details |
|-------|---------|
| **CSV Row** | 28 — `Groceries DMart`, amount = `2105`, currency = *(empty)* |
| **Type** | `MISSING_CURRENCY` |
| **Severity** | WARNING |
| **Problem** | Currency field is blank. Note says "forgot to set currency". This is a domestic grocery purchase so INR is the obvious default. |
| **Detection** | After trimming, `currency` is checked for empty string. |
| **Policy** | **Default to INR**: Since the group primarily operates in INR and the expense is domestic, INR is the safe default. Flagged as WARNING so the user can override to USD if needed. |
| **Code Reference** | `csvImporter.js` lines 160–170 |

---

### Anomaly #15 — Zero Amount / Placeholder (Row 31)

| Field | Details |
|-------|---------|
| **CSV Row** | 31 — `Dinner order Swiggy`, amount = `0`, notes = `counted twice earlier - fixing later` |
| **Type** | `ZERO_AMOUNT` |
| **Severity** | WARNING |
| **Problem** | Amount is exactly ₹0. The note says "counted twice earlier - fixing later", indicating this was a correction entry or placeholder that was never completed. |
| **Detection** | After parsing, `parsed.amount === 0` is checked. |
| **Policy** | **Skip row**: A ₹0 expense has no financial impact and is clearly a placeholder. The row is marked `skip: true` with reason "Zero amount — placeholder entry". |
| **Code Reference** | `csvImporter.js` lines 129–142 |

---

### Anomaly #16 — Ambiguous Date (Row 34)

| Field | Details |
|-------|---------|
| **CSV Row** | 34 — `Deep cleaning service`, date = `04-05-2026`, notes = `is this April 5 or May 4? format is a mess` |
| **Type** | `AMBIGUOUS_DATE` |
| **Severity** | ERROR |
| **Problem** | `04-05-2026` is ambiguous: DD-MM-YYYY → May 4, or MM-DD-YYYY → April 5. The note explicitly asks "is this April 5 or May 4?". Both day (4) and month (5) are ≤ 12, making both interpretations valid. |
| **Detection** | `parseDate()` flags `couldBeAmbiguous = true` when both day ≤ 12 and month ≤ 12 and day ≠ month. The anomaly is only raised if the notes contain a `?` (indicating the author themselves was uncertain). |
| **Policy** | **Use DD-MM-YYYY convention** (consistent with all other dates in the CSV) → parsed as **May 4, 2026**. Surfaced as ERROR so the user can override to April 5 if they have additional context. |
| **Code Reference** | `csvImporter.js` lines 108–120 |

---

### Anomaly #17 — Departed Member in Split (Row 36)

| Field | Details |
|-------|---------|
| **CSV Row** | 36 — `Groceries BigBasket`, date = `02-04-2026`, split_with includes `Meera` |
| **Type** | `DEPARTED_MEMBER` |
| **Severity** | WARNING |
| **Problem** | Meera moved out at the end of March (leftAt = 2026-03-31). This April 2 expense still includes her in the split. Note says "oops Meera still in the group list". This directly addresses **Sam's concern**: "I moved in mid-April. Why would March electricity affect my balance?" — the same logic protects Sam from pre-membership charges. |
| **Detection** | For each participant, the importer checks their `GroupMembership.leftAt` date. If `expense.date > membership.leftAt`, the anomaly is raised. |
| **Policy** | **Flag for removal**: Suggest removing Meera from this split since she left the group before the expense date. The expense should only be split among active members (Aisha, Rohan, Priya). User can override if Meera agreed to this expense. |
| **Code Reference** | `csvImporter.js` lines 283–301 |

---

### Anomaly #18 — Deposit/Non-Expense (Row 38)

| Field | Details |
|-------|---------|
| **CSV Row** | 38 — `Sam deposit share`, Sam paid ₹15,000 to Aisha |
| **Type** | `POSSIBLE_NON_EXPENSE` |
| **Severity** | WARNING |
| **Problem** | Description contains "deposit" — this is Sam paying his share of the security deposit to Aisha, not a shared living expense. If treated as a regular expense, it would incorrectly inflate balances. |
| **Detection** | `desc.includes('deposit')` check catches this. |
| **Policy** | **Convert to Settlement**: Treated as a one-time transfer (Sam → Aisha, ₹15,000) rather than an expense split among the group. This correctly records the money flow without affecting the expense-based balance calculations. |
| **Code Reference** | `csvImporter.js` lines 223–235 |

---

### Anomaly #19 — Conflicting Split Info (Row 42)

| Field | Details |
|-------|---------|
| **CSV Row** | 42 — `Furniture for common room`, split_type = `equal`, split_details = `Aisha 1; Rohan 1; Priya 1; Sam 1` |
| **Type** | `CONFLICTING_SPLIT_INFO` |
| **Severity** | INFO |
| **Problem** | Split type says "equal" but the `split_details` column contains share values (all `1`). Note says "split_type says equal but someone added shares anyway". |
| **Detection** | When `splitType === 'EQUAL'` but `split_details` is non-empty, the importer detects the conflict. |
| **Policy** | **Use equal split, ignore details**: Since the split_type explicitly says "equal" and the share values are all identical (1:1:1:1 = equal anyway), the details column is ignored. Logged as INFO for transparency. |
| **Code Reference** | `csvImporter.js` lines 318–329 |

---

### Anomaly #20 — Percentage Sum Error Again (Row 32)

| Field | Details |
|-------|---------|
| **CSV Row** | 32 — `Weekend brunch`, split_type = `percentage`, split_details = `Aisha 30%; Rohan 30%; Priya 30%; Meera 20%` |
| **Type** | `PERCENTAGE_SUM_ERROR` |
| **Severity** | WARNING |
| **Problem** | Same pattern as Row 15 — percentages sum to **110%** instead of 100%. |
| **Policy** | **Normalize proportionally** (same as Anomaly #9). |

---

## Anomaly Summary Table

| # | Row(s) | Anomaly Type | Severity | Action Taken |
|---|--------|-------------|----------|--------------|
| 1 | 5–6 | `DUPLICATE_EXACT` | WARNING | Skip Row 6 (keep Row 5) |
| 2 | 7 | `COMMA_IN_AMOUNT` | INFO | Auto-fix: parse "1,200" as 1200 |
| 3 | 9 | `NAME_CASE_MISMATCH` | INFO | Auto-fix: "priya" → "Priya" |
| 4 | 10 | `OVER_PRECISION` | INFO | Auto-fix: round 899.995 → 900.00 |
| 5 | 11 | `NAME_VARIANT` | INFO | Auto-fix: "Priya S" → "Priya" |
| 6 | 12 | `UNEQUAL_SUM_MISMATCH` | WARNING | Validate split sum = total |
| 7 | 13 | `MISSING_PAYER` | CRITICAL | User must assign payer or skip |
| 8 | 14 | `SETTLEMENT_AS_EXPENSE` | WARNING | Convert to Settlement record |
| 9 | 15 | `PERCENTAGE_SUM_ERROR` | WARNING | Normalize 110% → 100% proportionally |
| 10 | 23 | `UNKNOWN_PERSON` | WARNING | Flag guest "Dev's friend Kabir" |
| 11 | 24–25 | `DUPLICATE_CONFLICT` | ERROR | User picks winner (suggest Row 25) |
| 12 | 26 | `NEGATIVE_AMOUNT` | INFO | Treat as refund (-$30 USD) |
| 13 | 27 | `MALFORMED_DATE` | WARNING | Auto-fix: "Mar-14" → 14-03-2026 |
| 14 | 28 | `MISSING_CURRENCY` | WARNING | Default to INR |
| 15 | 31 | `ZERO_AMOUNT` | WARNING | Skip (placeholder row) |
| 16 | 34 | `AMBIGUOUS_DATE` | ERROR | Use DD-MM-YYYY (May 4), user can override |
| 17 | 36 | `DEPARTED_MEMBER` | WARNING | Remove Meera from April expense |
| 18 | 38 | `POSSIBLE_NON_EXPENSE` | WARNING | Convert deposit to Settlement |
| 19 | 42 | `CONFLICTING_SPLIT_INFO` | INFO | Ignore details, use equal split |
| 20 | 32 | `PERCENTAGE_SUM_ERROR` | WARNING | Normalize 110% → 100% proportionally |

> **Total unique data problems detected: 16+** (some anomaly types recur across rows)

---

## Import Pipeline Architecture

```
┌──────────────┐     ┌──────────────────┐     ┌────────────────────┐
│  CSV Upload  │────▶│  Pass 1: Parse   │────▶│  Anomaly Report    │
│  (Multer)    │     │  + Detect        │     │  (No DB writes)    │
└──────────────┘     └──────────────────┘     └────────────────────┘
                                                       │
                                                       ▼
                                              ┌────────────────────┐
                                              │  User Reviews      │
                                              │  Anomalies in UI   │
                                              │  (Accept/Skip/Fix) │
                                              └────────────────────┘
                                                       │
                                                       ▼
                                              ┌────────────────────┐
                                              │  Pass 2: Finalize  │
                                              │  Write to DB       │
                                              │  (Expenses +       │
                                              │   Settlements)     │
                                              └────────────────────┘
```

### Import API Flow

1. `POST /api/groups/:groupId/import/upload` — Upload CSV, get anomaly report (no DB writes to expenses)
2. `GET /api/import/:sessionId` — View import session with all detected anomalies
3. `PATCH /api/import/:sessionId/anomalies/:anomalyId` — User resolves anomaly (ACCEPT/SKIP/MODIFY)
4. `POST /api/import/:sessionId/finalize` — Apply import with user's decisions

---

## Database Schema

Built with **Prisma ORM** on **PostgreSQL** (hosted on Neon Serverless).

### Entity Relationship Diagram

```
┌─────────────┐       ┌──────────────────┐       ┌──────────────┐
│    users     │───┐   │ group_memberships│   ┌───│   groups     │
│              │   │   │                  │   │   │              │
│  id (PK)     │   ├──▶│  id (PK)        │◀──┤   │  id (PK)     │
│  name        │   │   │  group_id (FK)   │   │   │  name        │
│  email (UQ)  │   │   │  user_id (FK)    │   │   │  description │
│  password    │   │   │  role            │   │   │  created_by  │
│  created_at  │   │   │  joined_at       │   │   │  created_at  │
│  updated_at  │   │   │  left_at (null?) │   │   │  updated_at  │
└─────────────┘   │   └──────────────────┘   │   └──────────────┘
       │          │                           │          │
       │          │   ┌──────────────────┐    │          │
       │          │   │    expenses      │    │          │
       │          └──▶│                  │◀───┘          │
       │              │  id (PK)         │               │
       │              │  group_id (FK)   │               │
       │              │  description     │               │
       │              │  amount          │               │
       │              │  amount_inr      │               │
       │              │  currency        │               │
       │              │  exchange_rate   │               │
       │              │  paid_by (FK)    │               │
       │              │  split_type      │               │
       │              │  date            │               │
       │              │  notes           │               │
       │              │  source_row      │               │
       │              │  import_sess (FK)│               │
       │              └────────┬─────────┘               │
       │                       │                         │
       │              ┌────────▼─────────┐               │
       │              │ expense_splits   │               │
       │              │                  │               │
       │              │  id (PK)         │               │
       ├─────────────▶│  expense_id (FK) │               │
       │              │  user_id (FK)    │               │
       │              │  amount          │               │
       │              │  amount_inr      │               │
       │              │  percentage      │               │
       │              │  shares          │               │
       │              └──────────────────┘               │
       │                                                 │
       │              ┌──────────────────┐               │
       │              │   settlements    │               │
       ├─────────────▶│                  │◀──────────────┘
       │              │  id (PK)         │
       │              │  group_id (FK)   │
       │              │  paid_by (FK)    │
       │              │  paid_to (FK)    │
       │              │  amount          │
       │              │  currency        │
       │              │  amount_inr      │
       │              │  date            │
       │              │  notes           │
       │              │  source_row      │
       │              │  import_sess (FK)│
       │              └──────────────────┘
       │
       │              ┌──────────────────┐
       │              │ import_sessions  │
       ├─────────────▶│                  │◀──── groups
       │              │  id (PK)         │
       │              │  group_id (FK)   │
       │              │  filename        │
       │              │  imported_by(FK) │
       │              │  status          │
       │              │  total_rows      │
       │              │  imported_rows   │
       │              │  skipped_rows    │
       │              └────────┬─────────┘
       │                       │
       │              ┌────────▼─────────┐
       │              │ import_anomalies │
       │              │                  │
       │              │  id (PK)         │
       │              │  import_sess(FK) │
       │              │  row_number      │
       │              │  field           │
       │              │  anomaly_type    │
       │              │  severity        │
       │              │  description     │
       │              │  raw_value       │
       │              │  suggested_fix   │
       │              │  resolution      │
       │              │  resolved_value  │
       │              └──────────────────┘
```

---

### Table Details

#### 1. `users`

| Column | Type | Constraints | Purpose |
|--------|------|-------------|---------|
| `id` | UUID | PK, auto-generated | Unique user identifier |
| `name` | VARCHAR(100) | NOT NULL | Display name (e.g., "Aisha", "Rohan") |
| `email` | VARCHAR(255) | UNIQUE, NOT NULL | Login credential |
| `password_hash` | VARCHAR(255) | NOT NULL | bcrypt-hashed password |
| `created_at` | TIMESTAMP | DEFAULT now() | Account creation time |
| `updated_at` | TIMESTAMP | Auto-updated | Last modification time |

---

#### 2. `groups`

| Column | Type | Constraints | Purpose |
|--------|------|-------------|---------|
| `id` | UUID | PK | Unique group identifier |
| `name` | VARCHAR(100) | NOT NULL | Group name (e.g., "Flat 4B") |
| `description` | TEXT | nullable | Optional group description |
| `created_by` | UUID | FK → users.id | Group creator |
| `created_at` | TIMESTAMP | DEFAULT now() | Creation time |
| `updated_at` | TIMESTAMP | Auto-updated | Last modification time |

---

#### 3. `group_memberships`

> **Key design**: Tracks `joinedAt` and `leftAt` to handle time-based membership (Sam joined mid-April, Meera left end of March).

| Column | Type | Constraints | Purpose |
|--------|------|-------------|---------|
| `id` | UUID | PK | Unique membership record |
| `group_id` | UUID | FK → groups.id, CASCADE | Which group |
| `user_id` | UUID | FK → users.id | Which user |
| `role` | ENUM | ADMIN / MEMBER | Permission level |
| `joined_at` | TIMESTAMP | NOT NULL | When they joined |
| `left_at` | TIMESTAMP | nullable | When they left (NULL = still active) |

**Unique constraint**: `(group_id, user_id, joined_at)` — allows re-joining.

---

#### 4. `expenses`

| Column | Type | Constraints | Purpose |
|--------|------|-------------|---------|
| `id` | UUID | PK | Unique expense identifier |
| `group_id` | UUID | FK → groups.id, CASCADE | Parent group |
| `description` | VARCHAR(255) | NOT NULL | Expense description |
| `amount` | DECIMAL(12,2) | NOT NULL | Amount in original currency |
| `amount_inr` | DECIMAL(12,2) | NOT NULL | Converted amount in INR |
| `currency` | VARCHAR(3) | DEFAULT 'INR' | Original currency (INR/USD) |
| `exchange_rate` | DECIMAL(10,4) | DEFAULT 1.0 | Rate used for conversion |
| `paid_by` | UUID | FK → users.id | Who paid |
| `split_type` | ENUM | EQUAL/UNEQUAL/PERCENTAGE/SHARE | How the expense is split |
| `date` | DATE | NOT NULL | When the expense occurred |
| `notes` | TEXT | nullable | Additional notes |
| `source_row` | INT | nullable | CSV row number (for traceability) |
| `import_session_id` | UUID | FK → import_sessions.id, nullable | Which import created this |
| `created_at` | TIMESTAMP | DEFAULT now() | Record creation time |
| `updated_at` | TIMESTAMP | Auto-updated | Last modification time |

---

#### 5. `expense_splits`

| Column | Type | Constraints | Purpose |
|--------|------|-------------|---------|
| `id` | UUID | PK | Unique split record |
| `expense_id` | UUID | FK → expenses.id, CASCADE | Parent expense |
| `user_id` | UUID | FK → users.id | Who owes this share |
| `amount` | DECIMAL(12,2) | NOT NULL | Share in original currency |
| `amount_inr` | DECIMAL(12,2) | NOT NULL | Share converted to INR |
| `percentage` | DECIMAL(5,2) | nullable | For percentage splits |
| `shares` | INT | nullable | For share-based splits |

**Unique constraint**: `(expense_id, user_id)` — one split per user per expense.

---

#### 6. `settlements`

> **Separated from expenses** — a settlement (Rohan pays Aisha ₹5,000) is fundamentally different from a shared expense.

| Column | Type | Constraints | Purpose |
|--------|------|-------------|---------|
| `id` | UUID | PK | Unique settlement record |
| `group_id` | UUID | FK → groups.id, CASCADE | Which group |
| `paid_by` | UUID | FK → users.id | Who paid (debtor) |
| `paid_to` | UUID | FK → users.id | Who received (creditor) |
| `amount` | DECIMAL(12,2) | NOT NULL | Settlement amount |
| `currency` | VARCHAR(3) | DEFAULT 'INR' | Currency |
| `amount_inr` | DECIMAL(12,2) | NOT NULL | Amount in INR |
| `date` | DATE | NOT NULL | Settlement date |
| `notes` | TEXT | nullable | Notes |
| `source_row` | INT | nullable | CSV row (if imported) |
| `import_session_id` | UUID | FK → import_sessions.id, nullable | Import source |
| `created_at` | TIMESTAMP | DEFAULT now() | Record creation time |

---

#### 7. `import_sessions`

| Column | Type | Constraints | Purpose |
|--------|------|-------------|---------|
| `id` | UUID | PK | Import session identifier |
| `group_id` | UUID | FK → groups.id, CASCADE | Target group |
| `filename` | VARCHAR(255) | NOT NULL | Original CSV filename |
| `imported_by` | UUID | FK → users.id | Who initiated the import |
| `status` | ENUM | PENDING/REVIEWED/FINALIZED | Import lifecycle state |
| `total_rows` | INT | DEFAULT 0 | Total rows in CSV |
| `imported_rows` | INT | DEFAULT 0 | Successfully imported rows |
| `skipped_rows` | INT | DEFAULT 0 | Skipped/rejected rows |
| `created_at` | TIMESTAMP | DEFAULT now() | When import started |
| `updated_at` | TIMESTAMP | Auto-updated | Last status change |

---

#### 8. `import_anomalies`

| Column | Type | Constraints | Purpose |
|--------|------|-------------|---------|
| `id` | UUID | PK | Anomaly record identifier |
| `import_session_id` | UUID | FK → import_sessions.id, CASCADE | Parent import |
| `row_number` | INT | NOT NULL | CSV row where issue was found |
| `field` | VARCHAR(50) | nullable | Column that had the issue |
| `anomaly_type` | VARCHAR(50) | NOT NULL | Type code (e.g., DUPLICATE_EXACT) |
| `severity` | ENUM | INFO/WARNING/ERROR/CRITICAL | How serious the issue is |
| `description` | TEXT | NOT NULL | Human-readable explanation |
| `raw_value` | TEXT | nullable | The problematic value as-is |
| `suggested_fix` | TEXT | nullable | What the system suggests |
| `resolution` | ENUM | PENDING/AUTO_FIXED/ACCEPTED/MODIFIED/SKIPPED | How it was resolved |
| `resolved_value` | TEXT | nullable | What was actually applied |
| `created_at` | TIMESTAMP | DEFAULT now() | When detected |

---

### Enums

| Enum | Values | Purpose |
|------|--------|---------|
| `MemberRole` | `ADMIN`, `MEMBER` | Group membership permission level |
| `SplitType` | `EQUAL`, `UNEQUAL`, `PERCENTAGE`, `SHARE` | All 4 split methods from the CSV |
| `ImportStatus` | `PENDING`, `REVIEWED`, `FINALIZED` | Import session lifecycle |
| `AnomalySeverity` | `INFO`, `WARNING`, `ERROR`, `CRITICAL` | Anomaly severity classification |
| `AnomalyResolution` | `PENDING`, `AUTO_FIXED`, `ACCEPTED`, `MODIFIED`, `SKIPPED` | How each anomaly was resolved |

---

## Schema Design Decisions

| Decision | Rationale |
|----------|-----------|
| **Time-based membership** (`joinedAt`/`leftAt` on `group_memberships`) | Directly addresses Sam's and Meera's requirements. Sam shouldn't owe March electricity; Meera shouldn't be charged April groceries. |
| **Separate `settlements` table** | A settlement is NOT an expense. Mixing them (as the CSV does in Row 14) corrupts balance calculations. Settlements reduce debt; expenses create debt. |
| **Dual amount columns** (`amount` + `amount_inr`) | Addresses Priya's concern about USD. Original amount preserved for audit; INR amount used for balance calculations. Fixed rate: 1 USD = ₹85. |
| **`source_row` on expenses and settlements** | Enables traceability from any balance back to the original CSV row (Rohan's requirement: "show me which expenses make up my balance"). |
| **`import_sessions` + `import_anomalies`** | Full audit trail of every import. Meera can review before anything is deleted/changed. Every anomaly resolution is logged. |
| **UUID primary keys** | Prevents ID guessing attacks. Safe for distributed systems. |
| **Cascading deletes** | Deleting a group removes all its expenses, splits, settlements, and import records. |
| **`exchange_rate` on expenses** | Records the rate used at import time, so conversions can be audited or recalculated later. |

---

*Generated from `Expenses Export.csv` analysis and `backend/src/services/csvImporter.js` implementation.*  
*Last updated: 2026-06-15*
