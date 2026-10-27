# Compliance Desk: The Complete Guide

This guide assumes you know nothing about compliance. Read it top to bottom once and you should be able to open the Compliance desk, understand every screen, click through every drill-down, explain every KPI, and present the whole story to someone else.

Everything here covers only the Compliance screens in `screens/cmp/`. All numbers are fixed demo values: snapshot **05-Oct-2026 09:10**, with the auditor's review starting **12-Oct-2026** (7 days away).

**Contents**
1. Compliance in plain words
2. Words you will see on every screen
3. How the desk is organised
4. Conventions: colours, clicks and buttons
5. Screen 1: Audit readiness
6. Screen 2: Controls
7. Screen 3: Investigations
8. Screen 4: Findings
9. Screen 5: Evidence pack
10. Screen 6: Entity profiles
11. Drill-down map
12. End-to-end walkthrough: a day on the desk
13. KPI reference
14. How to present it to people
15. What is demo data and what is not

---

## 1. Compliance in plain words

A company has **rules** about how money moves. Examples:
- A purchase needs an approved purchase order (PO) before anyone pays the invoice.
- One person must not both create a vendor and approve payments to that vendor.
- When a vendor changes its bank account, someone phones the vendor to confirm it before the next payment.

Each rule, built into a system or a process, is a **control**. The company has **412** of them across its five process areas, called **towers**.

Once a year an **auditor** (an outside firm) checks whether those controls actually work. The auditor:
1. picks a sample of transactions for each important control,
2. asks for the document that proves the control worked for each one,
3. writes up anything wrong as a **finding**, which the company must fix by a due date.

**The Compliance team's job** is to make sure that when the auditor arrives:
- the controls are working,
- nothing has actually gone wrong (no fraud, no misused access, no money paid wrongly),
- old findings have been fixed,
- every document the auditor will ask for is on file.

**The Compliance desk** is the tool that tells the team, in one place, *"Will we pass the audit, and if not, what do we do this week to get there?"* Every gap on the desk ends in a **decision**: a case you open and decide.

---

## 2. Words you will see on every screen

| Word | Meaning |
|---|---|
| **Tower** | A process area of the business. There are five: **P2P** (Procure to pay: buying and paying vendors), **O2C** (Order to cash: selling and collecting from customers), **R2R** (Record to report: the accounts and month-end close), **Supply chain** (stock and inventory), **Compliance** (company-wide rules such as access and sanctions). |
| **Entity** | A legal company within the group. There are 10: IN-01 to IN-08 in India, US-01 and EU-01. Five are **focus entities** (IN-02, IN-03, IN-04, IN-05, IN-08) because they carry most of the problems. |
| **Control** | A rule that prevents or catches a mistake or fraud, e.g. "Duplicate invoice blocked before payment". Each has an ID such as `CTL-P2P-010`. |
| **Key control** | A control the auditor relies on. If it fails and nothing else covers the risk, a material error or fraud could reach the books. 138 of the 412 are key. The auditor samples **up to 40 items** per key control. |
| **Pass rate** | The share of transactions in which a control worked, e.g. 96% means it worked on 96 of every 100. |
| **Failing control** | A control whose latest test failed: the KPI it guards is off target, or, for fraud-type controls (bank call-back, duplicates, segregation of duties), it had even one exception. |
| **Live vs baseline** | **Live** = tested on real September transactions. Today only **P2P** is live. **Baseline** = the latest available test results for the other towers, used until they go live. |
| **Anomaly** | A transaction the anomaly model thinks looks unusual, scored 0–100. A high score is a reason to look, not proof. |
| **Access conflict (SoD conflict)** | One user holds two rights that should be split between people (SoD = segregation of duties), e.g. *create a vendor* + *approve payments*. A **used** conflict means they actually did both, which is a real control failure. |
| **Sanctions screening** | Checking vendors and customers against government sanctions lists. A match would stop all business with that party. |
| **Finding** | A problem written up by the statutory auditor, internal audit, or our own monitoring, with a due date for the fix. A **repeat** finding was raised before and has come back. |
| **Fix action** | One task in the plan that closes a finding. Each finding here has 3. |
| **Evidence** | The document that proves a control worked for a sampled transaction (an approval e-mail, a signed count sheet, a call-back log). |
| **Attestation** | The control owner's formal sign-off that their control worked this quarter. The auditor needs it before relying on the control. |
| **Evidence pack** | A bundle of evidence that answers a specific request the auditor has already made. |
| **Case** | A problem that needs a decision, with an ID such as `CMP-SOD-01`. Cases are opened with **Decide**. The prefix shows the owning tower: `PTP` = P2P, `RTR` = R2R, `SC` = Supply chain, `CMP` = Compliance. |
| **Money at risk** | ₹ in open high and critical cases that may already have left the company, or is about to, until it is protected or proven legitimate. |
| **Audit readiness** | One score out of 100 that answers "will we pass?". Target: **90**. |
| **₹ Cr / ₹ L** | Crore (10 million rupees) / lakh (100,000 rupees). ₹1 Cr = ₹100 L. |
| **Q2 FY27** | July to September 2026 (financial year runs April to March). |

---

## 3. How the desk is organised

The left menu has two tabs:

- **Audit story**: five screens in a fixed order, shown as underline tabs across the top. Each screen answers one question the auditor will ask:

  | # | Screen | File | Question |
  |---|---|---|---|
  | 1 | Audit readiness | `executive.html` | Will we pass the audit? |
  | 2 | Controls | `controls.html` | What is broken? |
  | 3 | Investigations | `investigation.html` | Has anything actually gone wrong? |
  | 4 | Findings | `issues.html` | Are we fixing what the auditor told us? |
  | 5 | Evidence pack | `audit.html` | Can we prove it? |

- **Entity profiles** (`entities.html`): the same picture cut by legal entity. "Where is each entity exposed, and why?"

**The flow of the story:** the score (1) → what is broken (2) → whether it turned into real damage (3) → whether past problems are being fixed (4) → whether we can prove all of it (5) → back to the score. Screen 5 ends with a link back to screen 1, so the story is a loop.

```
 Audit readiness ──► Controls ──► Investigations ──► Findings ──► Evidence pack
       ▲                                                              │
       └──────────────────── "Back to Audit readiness" ───────────────┘

 Entity profiles: the same numbers, one legal entity at a time
```

---

## 4. Conventions: colours, clicks and buttons

**Colours**
| Colour | Meaning |
|---|---|
| Red | Off target, critical, or failing |
| Orange / amber | Warning, high, or in progress |
| Green | On target, passing, done |
| Grey | Not measured, no action needed, or "other" |

**Clicks**
- **A KPI card** opens its KPI detail (how it is calculated, its inputs, why it matters, a breakdown).
- **A whole table row** opens that record (control, anomaly, finding, pack, entity).
- **A chart bar** filters the table beside or below it, where the screen says so (Anomalies, Missing evidence).
- **The breadcrumb** at the top takes you back up one level.

**Buttons**
| Button | What it does |
|---|---|
| **Decide** | Opens the case drawer. You take the recommended action, or override it with a reason. The decision is logged and filed into the evidence pack. |
| **Open in P2P / R2R / O2C / SC ↗** | Jumps to that tower's own screen, filtered to the entity where possible. |
| **Review** | Opens an anomaly that still needs a person to look at it. |
| **Chase** | Sends a reminder to the owner (simulated in the demo). |
| **Record sign-off** | Records an owner's attestation (simulated in the demo; see section 15). |
| **Export** | Sends a ready evidence pack to the auditor (simulated in the demo). |

---

## 5. Screen 1: Audit readiness (`executive.html`)

**Question:** *Will we pass the audit?*
**Who uses it:** CFO, controller, head of compliance. This is the landing page.

### What you see, top to bottom

**a) The readiness score**
- A ring showing **85.5 of 100**. The target is **90**, so the desk is **4.53 points short**.
- Pills: *Below target*, *▲ 0.5 pts* since last month, *7 days to review*.
- A small trend line: Apr 79 → May 80 → Jun 81 → Jul 83 → Aug 85 → today 85.5.

**b) The five readiness areas** (each worth 20 points)

| Area | Score | Points | Lost | What drives it |
|---|---|---|---|---|
| Controls passing | 96.12% | 19.22 | 0.78 | 396 of 412 controls passed |
| Evidence on file | 99.23% | 19.85 | 0.15 | 5,439 of 5,481 samples on file |
| Findings | 70% | 14.00 | **6.00** | 8 open, 4 overdue |
| Access conflicts | 70% | 14.00 | **6.00** | 3 open, 1 used |
| Fixes on time | 92% | 18.40 | 1.60 | 138 of 150 actions on time |
| **Total** | | **85.47** | **14.53** | |

**The main insight:** Findings and Access conflicts lose 6 points each. Everything else is nearly perfect.

**c) Four KPI cards**, one per weak spot, matching the readiness areas: **Failing controls** (16), **Evidence on file** (99.23%), **Open findings** (8), **Access conflicts** (3, 1 used). Clicking a card jumps to the screen that explains it.

**d) Path to 90: two decisions**
`85.5 → +4.0 Remove the used access conflict at IN-03 [Decide] → +1.0 Close repeat finding F-2026-031 [Decide] → 90.5 ✓ target met`

Below it: removing the 2 unused access conflicts (+2.0) takes readiness to **92.5**. Separately, the Apex Chem call-back log must be filed before 12-Oct. It adds almost no points, but one missing log fails the auditor's sample for control CTL-P2P-009.

**e) Controls across all towers**
- Left: **pass rate by control**, one tower at a time (toggle P2P / O2C / R2R / Supply chain / Compliance). The axis runs 80–100% so small gaps show. Any control below 80% gets no bar and a red label instead, e.g. *CTL-P2P-009: 0% · failed outright, below the axis* (1 of 1 bank changes without a call-back).
- Right: **pass rate by tower and entity** heat map. Click a cell to open that entity.

**f) Cases to decide**
The 8 cases holding the ₹7.64 Cr at risk, plus 1 evidence case (CMP-EVD-05) with no money. Pills: *₹7.64 Cr at risk · 5 critical · 4 high*. Each row shows priority (0–100), case, entity, ₹ impact, severity, **Open in …** and **Decide**. Priority combines ₹ impact, urgency, effect on close and audit, control risk, AI confidence, and how hard the action is to undo.

### Drill-down
1. Click the **ring** → *Readiness detail*: trend by month with the "after the actions" point, **points lost by area** (bar chart), and the **path-to-90 table** (priority, action, process, gain, Decide). The Apex row shows *"Protects the 12-Oct sample"* instead of a tiny points number.
2. Click an **area** → *Area view*: the exact scoring formula, its inputs, the action that wins points back, and a breakdown. Click a breakdown row → you land on that area's screen.
3. Click a **case row** or **Decide** → the case drawer.

---

## 6. Screen 2: Controls (`controls.html`)

**Question:** *What is broken?*

### What you see, top to bottom

**a) Four KPI cards**
| Card | Value | How to read it |
|---|---|---|
| Failing controls | 16 of 412 | 14 of them are key controls. Footer splits them: 10 from live tests (P2P), 6 baseline (other towers). |
| Key-control effectiveness | 89.9% (124 of 138) | Bar on an 80–100% scale with a **98%** target marker. Red because it is well short. |
| Automation | 61% (251 of 412) | Automated controls test every transaction; manual ones rely on samples. Supply chain is lowest (41%). |
| Policy compliance | 94.93% | Checks with no policy breach ÷ all checks, 56,484 in September. Bar on 80–100% with a **97%** target. |

**b) Controls by process**
- Left: passing vs failing controls per tower (stacked bars).
- Right: **failing control pass rate by entity**: each failing control by name (ID underneath), with its pass rate at the five focus entities and "Other 5". Worst control first. Cell colours: green ≥99%, amber 97–98.9%, orange 94–96.9%, red <94%, "—" = not in scope. Click a row to open the control.

**c) Failing controls table**
All 16 failing controls, most severe first: severity, control, process, worst entity, test result in words (e.g. "928 of 13,652 invoices without a PO"), and **Open in …** / **Decide** where a case exists.

### Drill-down
1. Click a control → **control profile**: why it surfaced, process, worst entity, whether it is key, which case fixes it, the evidence the auditor needs, and its **pass rate by entity** as bars ("Below 97%" or "97% or above").
2. Click an entity bar → **that control at that entity**: its pass rate there, failing controls at the entity, **Open entity profile**, **Open in P2P**, and the table **How IN-xx compares with the other entities** (see section 10).

---

## 7. Screen 3: Investigations (`investigation.html`)

**Question:** *Has anything actually gone wrong?*
A broken control is only a *risk*. This screen shows where risk turned into money paid, access misused, or a suspicious transaction.

### What you see, top to bottom

**a) Four KPI cards**
| Card | Value | How to read it |
|---|---|---|
| Money at risk | ₹7.64 Cr in 8 cases | 5 critical, 3 high. Mini bars by tower: Supply chain ₹2.96 Cr, R2R ₹2.82 Cr, P2P ₹1.61 Cr. ₹1.80 Cr of it also appears in P2P's own exposure figure (shown, never added twice). |
| Anomalies to review | 11 | 47 flagged in September, 11 scored 80+, **0 of 11 reviewed**. |
| Access conflicts | 3 | 1 used, 2 not used. 6 readiness points at stake. |
| Sanctions screening | 0 hits | 570 parties screened: 150 vendors (P2P, live), 420 customers (O2C, baseline). |

**b) Cases holding the ₹7.64 Cr**
The 8 cases behind money at risk, largest first, with a total row:

| Case | What | Entity | At risk |
|---|---|---|---|
| RTR-JNL-02 | Manual journal of ₹2.40 Cr to revenue at period end | IN-05 | ₹2.40 Cr |
| SC-CNT-04 | Cycle-count shortage; catalysts short by 14% | IN-05 | ₹1.86 Cr |
| PTP-BNK-05 | Vendor bank-detail change before the payment run | IN-02 | ₹1.12 Cr |
| SC-ADJ-12 | Write-offs split under the approval limit | IN-08 | ₹1.10 Cr |
| PTP-DUP-03 | Probable duplicate invoice | IN-04 | ₹48.6 L |
| RTR-PER-10 | Posting to a closed period | IN-08 | ₹42 L |
| CMP-SOD-01 | SoD conflict used: vendor create and payment approve | IN-03 | ₹18.7 L |
| CMP-ANM-07 | Vendor bank account matches an employee salary account | IN-05 | ₹6.2 L |

Money leaves this list when it is protected or confirmed legitimate.

**c) Anomalies: chart and table work together**
- Chart: all 47 flagged transactions by **score band**.

  | Band | Count | Meaning | Action |
  |---|---|---|---|
  | 90–100 | 4 | Act today | Hold the payment and open a case |
  | 80–89 | 7 | A person reviews | Confirm or release each one |
  | 60–79 | 21 | Watch | Tracked as a trend, not reviewed one by one |
  | Below 60 | 15 | Logged | Normal variation |

- **How to filter:** by default the table lists the **80–100** transactions (11). Click a bar, or use the band selector above the table (80–100 · 90–100 · 80–89 · 60–79 · Below 60), to list that band. Selected bars stay solid, the others fade. Click the same bar again to return to 80–100.
- Table: score (coloured by band), what was flagged, entity, amount, source tower, and action. Rows without a case come first.
  - 80+ with a case → **Decide**
  - 80+ without a case → **Review**
  - below 80 → *Watch*

**d) Access conflicts table**
| Conflict | Rights held together | User | Used? | Points |
|---|---|---|---|---|
| SoD-01 | Vendor master maintain + Payment run approve | IN-03, AP executive | **Yes** | 4.0 |
| SoD-02 | Journal post + Journal approve | IN-05, GL accountant | No | 1.0 |
| SoD-03 | Customer master + Credit memo approve | US-01, Billing analyst | No | 1.0 |

### Drill-down
1. Click an **anomaly** → one plain sentence saying **why it was flagged** (e.g. *"The vendor's bank account number is the same as the salary account of an employee at IN-05"*), then risk score, amount, entity, source, linked case, and what happens next. P2P anomalies also have **Open the P2P records**.
2. Click an **access conflict** → the rights, the user, whether it was used (SoD-01: created vendor V-310992 Sai Enterprises on 14-Sep, approved ₹18.7 L to it on 22-Sep), readiness cost, linked finding (F-2026-034), and the fix (remove *Payment run approve*; readiness rises 85.5 → 89.5).

---

## 8. Screen 4: Findings (`issues.html`)

**Question:** *Are we fixing what the auditor told us?*

### What you see, top to bottom

**a) Four KPI cards**
| Card | Value | How to read it |
|---|---|---|
| Open findings | 8 | 4 overdue, 4 in progress. Costs **6 readiness points** (1 per overdue, 0.5 per other open). |
| Oldest overdue | 41 days | F-2026-031, GRNI review evidence, due 25-Aug, a *repeat finding*. Bar list of all 4 overdue. |
| Fixes on time | 92% (138 of 150) | Fix actions due Q2 FY27 closed by their due date. Bar on 0–100% with a **95%** target. |
| Repeat findings | 5 of 8 | Split by theme: Evidence 3, Approval 1, Access 1. |

**b) Opened and closed**
- Left: findings opened (orange) and closed (green) each month, Apr–Sep, with a line for **open at month end**: Apr 14 → May 13 → Jun 15 → Jul 11 → Aug 10 → Sep 8. Falling = the backlog is shrinking.
- Right: open findings by theme (Evidence, Approval, Access, Segregation), split into repeat and new.

**c) Findings register**
Oldest due first. Columns: finding, raised by, process, due, status, repeat, **points lost** (1.0 / 0.5), Decide. Total row: **6.0**.

| Finding | Process | Due | Status | Repeat | Points | Case |
|---|---|---|---|---|---|---|
| F-2026-031 GRNI review evidence incomplete | P2P | 25-Aug | 41 d overdue | Yes | 1.0 | CMP-REM-06 |
| F-2026-034 Vendor creation + payment rights, one user, IN-03 | Compliance | 15-Sep | 20 d overdue | Yes | 1.0 | CMP-SOD-01 |
| F-2026-038 Intercompany confirmations not obtained | R2R | 20-Sep | 15 d overdue | Yes | 1.0 | CMP-FND-09 |
| F-2026-041 Manual journals without support | R2R | 30-Sep | 5 d overdue | Yes | 1.0 | CMP-FND-10 |
| F-2026-046 Credit limits overridden without approval, US-01 | O2C | 15-Oct | In progress | Yes | 0.5 | CMP-FND-11 |
| F-2026-049 Job-work challans over 365 days not tracked | Supply chain | 25-Oct | In progress | No | 0.5 | CMP-FND-12 |
| F-2026-044 Inventory count not independent of custodian, IN-05 | Supply chain | 31-Oct | In progress | No | 0.5 | CMP-FND-13 |
| F-2026-047 Three-way-match tolerance changed without approval | P2P | 31-Oct | In progress | No | 0.5 | CMP-FND-14 |

### Drill-down
Click a finding → its details (raised by, theme, due, status, repeat, readiness cost, fix case) and **How it closes**: a specific closure plan, the points it wins back, and a note that extensions move the due date but are logged. Example: *F-2026-031: the tower already filed GRNI evidence for Jul–Sep automatically; "Close with evidence" sends it to the auditor and adds 1 point.*

---

## 9. Screen 5: Evidence pack (`audit.html`)

**Question:** *Can we prove it?*
The auditor samples up to 40 items per key control (fewer where a control ran fewer times) and asks for the document behind each one. **A missing document fails the sample even when the control worked.**

### What you see, top to bottom

**a) Four KPI cards**
| Card | Value | How to read it |
|---|---|---|
| Evidence on file | 99.23% | 5,439 of 5,481 on file, 42 missing. Bar on 90–100% with a **99%** target. |
| Attestations signed | 95% (114 of 120) | 6 owners have not signed; the oldest is 6 days overdue. |
| Evidence packs ready | 1 of 4 | 2 waiting on a case decision, 1 waiting on documents due 09-Oct. |
| Ready for the auditor? | 1 of 5 checks | See (e). |

**b) Missing evidence: chart and table work together**
- Left: missing items by area (P2P 1, O2C 6, R2R 18, Supply chain 15, IT general controls 2). Amber bars are below 99% on file.
- Right: **the 42 missing items**: item, area, count, owner, due 09-Oct, **Chase**. Largest first, with a total.
- **Click an area bar** to list only that area's items; click again or **Show all** to reset.

**c) Outstanding attestations**
6 controls: control, owner, days overdue, **Chase** and **Record sign-off**.

**d) Evidence packs for the auditor**
| Pack | Process | Status | Action |
|---|---|---|---|
| EVP-RTR-019 Reconciliation certification, Q1 FY27 | R2R | Ready | **Export** |
| EVP-CTL-P2P-014 Three-way-match tolerance, IN-05 | P2P | Pending | **Decide** CMP-CTL-02 |
| EVP-PTP-BNK-05 Bank-change decision, Apex Chem | P2P | Pending | **Decide** PTP-BNK-05 |
| EVP-2026-044 Internal Audit request, vendor payments | P2P | Pending (125 documents due 09-Oct) | **Chase** |

A pack turns **Ready** when its case is decided or its documents are submitted.

**e) Ready for the auditor? Five checks**, shown as tiles ending at an *Auditor review · 12-Oct* tile. They are independent; any can close first.

| Check | Status | What closes it |
|---|---|---|
| Evidence on file ≥ 99% | ✓ Passed | Already 99.23% |
| Every owner signed | ✗ Open | 6 attestations signed |
| Review-scope evidence on file | ✗ Open | Apex call-back log filed (CMP-EVD-05) |
| Evidence packs ready | ✗ Open | 2 cases decided + documents submitted |
| Audit readiness ≥ 90 | ✗ Open | CMP-SOD-01 (+4) and CMP-REM-06 (+1) decided |

Then **Back to Audit readiness**, which closes the loop.

### Drill-down
Click a pack → contents, process, linked case, status, and what turns it Ready.

---

## 10. Screen 6: Entity profiles (`entities.html`)

**Question:** *Where is each entity exposed, and why?*

### What you see, top to bottom

**a) P2P pass rate against money at risk (bubble chart)**
- Each bubble is an entity. Right = better pass rate; up = more money at risk; bigger = more September spend.
- Teal = focus entity, grey = other. Red ring = over ₹1 Cr at risk. Shaded band = below the group pass rate (95.47%).
- Key takeaways: **IN-05** holds the most money at risk (₹4.32 Cr); **IN-02** has the lowest pass rate (94.14%).

**b) Failing controls by worst entity**: each of the 16 counted once, where it is worst. Click to open.

**c) Control pass rate by tower and entity**: heat map of every tower at every entity. Click a cell to open that entity.

**d) All entities table**, most money at risk first: spend, P2P pass rate, approval rate, failing controls, anomalies 80+, access conflicts, cases, money at risk, weakest tower (tagged *live* or *baseline*). The group row adds up exactly: ₹551.0 Cr spend, 16 failing controls, 11 anomalies, 3 conflicts, 12 entity cases plus group-wide cases, ₹7.64 Cr at risk.

### Drill-down: an entity profile
1. **Why IN-xx surfaced**: plain bullets, e.g. money at risk and its cases, cases with no money, open findings, failing controls worst here, an access conflict, anomalies 80+, a pass rate below the group. Button: **Open P2P for IN-xx ↗** (opens the P2P desk already filtered to that entity).
2. **Control pass rate by tower** at this entity, live or baseline.
3. **How IN-xx compares with the other entities**: 16 figures in four groups (Scale, Control health, P2P exceptions, Risk and audit). Each figure is a strip:

```
P2P pass %                                    94.14%
 ●──·───·──·──|──·──·───·──·──·
Worst: 94.14% · IN-02            Best: 97.00% · IN-07
6 of 9 entities do better
```
- Left end = worst entity, right end = best, both named. For % figures higher is better; for counts and ₹ lower is better, so those strips are flipped. Further right is always better.
- Large dot = this entity. Small dots = the others. Tick = the typical (median) entity.
- Colour: green = fewer than 3 entities do better, amber = 3–5, red = 6 or more. Spend and case volume are neutral (lowest → highest).

The same comparison appears as a table (figure, this entity, typical entity, standing with a 10-cell rank meter and a verdict) when you drill into an entity from Controls or from a KPI breakdown.

---

## 11. Drill-down map

Every screen follows the same three levels: **Board → detail → record**, with a breadcrumb to go back.

```
AUDIT READINESS
 ├─ ring ─────────► readiness detail ─► area ─► area screen (#kpi=…)
 ├─ KPI card ─────► Controls / Evidence pack / Findings / Investigations
 ├─ Path to 90 ───► Decide (case drawer)
 ├─ heat map cell ► Entity profile
 └─ case row ─────► case drawer

CONTROLS
 ├─ KPI card ─────► KPI detail ─► breakdown bar ─► record table
 ├─ control row ──► control profile ─► entity ─► comparison table / Open entity profile / Open in P2P
 └─ Decide / Open in … 

INVESTIGATIONS
 ├─ KPI card ─────► KPI detail
 ├─ case row ─────► case drawer
 ├─ band bar ─────► filters the anomaly table
 ├─ anomaly row ──► why flagged + next step ─► Decide / Open the P2P records
 └─ conflict row ─► the conflict + fix ─► Decide CMP-SOD-01

FINDINGS
 ├─ KPI card ─────► KPI detail
 └─ finding row ──► finding + how it closes ─► Decide

EVIDENCE PACK
 ├─ KPI card ─────► KPI detail
 ├─ area bar ─────► filters the missing-items table ─► Chase
 ├─ attestation ──► Chase / Record sign-off
 └─ pack row ─────► pack detail ─► Decide / Export / Chase

ENTITY PROFILES
 ├─ bubble / bar / heat cell / row ─► entity profile ─► Open P2P for the entity
 └─ (also reached from any entity link on other screens: entities.html#IN-05)
```

**Every KPI detail** has the same layout: **How it is calculated** (formula, tower-neutral), **inputs** (where the live/baseline split shows), **why it matters**, and a **breakdown** you can switch (e.g. by entity, process, severity). Clicking a breakdown bar lists the records behind it.

---

## 12. End-to-end walkthrough: a day on the desk

Follow these steps once and you have used every part of the desk.

1. **Open Audit readiness.** Read the ring: 85.5, target 90, 7 days left.
2. **Find where points are lost.** Look at the five areas: Findings −6, Access conflicts −6.
3. **Act on the path to 90.** In the Path to 90 strip, click **Decide** on *Remove the used access conflict at IN-03* (CMP-SOD-01, +4), then on *Close F-2026-031* (CMP-REM-06, +1). That reaches 90.5.
4. **Go to Controls.** See 16 failing. Open *Bank-detail change verified by call-back* (CTL-P2P-009, 0%). Click IN-02 to see it there, then compare IN-02 with the other entities.
5. **Go to Investigations.** Check the 8 cases holding ₹7.64 Cr and **Decide** the largest. In Anomalies, work the 80–100 list: **Review** each one without a case. Click the 60–79 bar to see what is only being watched. Open SoD-01 to see exactly what happened.
6. **Go to Findings.** Sort out what is overdue: four rows cost 1 point each. Open one and read *How it closes*. Click **Decide** on its case.
7. **Go to Evidence pack.** Click the *Record to report* bar to see its 18 missing items, and **Chase** the owner. **Chase** the 6 outstanding attestations. **Decide** the two pending packs, **Export** the ready one, **Chase** the documents for EVP-2026-044.
8. **Check the five tiles.** When all five are green, you are ready for the auditor. Click **Back to Audit readiness**.
9. **For an entity review** (e.g. a call with IN-05's CFO), open **Entity profiles**, click IN-05, read *Why IN-05 surfaced*, and use the comparison strips to show where it is worse than its peers.

---

## 13. KPI reference

For every KPI: what it is, how it is calculated, its current value, and why it matters.

### 13.1 Audit readiness (the headline)
- **What:** one score for "will we pass the audit?"
- **Formula:** the sum of five areas, each worth 20 points.
  - Controls: 396 ÷ 412 × 20 = **19.22**
  - Evidence: 5,439 ÷ 5,481 × 20 = **19.85**
  - Findings: 20 − (1 × 4 overdue) − (0.5 × 4 other open) = **14.00**
  - Access conflicts: 20 − (4 × 1 used) − (1 × 2 unused) = **14.00**
  - Fixes on time: 138 ÷ 150 × 20 = **18.40**
  - **Total: 85.47** (shown as 85.5)
- **Target:** 90.
- **Why it matters:** one number for the board, and every lost point maps to a named action.
- **Why areas, not towers:** the auditor judges these five things, not towers. Findings, access conflicts and attestations cut across towers. And only P2P is live, so a tower-based score would mix live and baseline data. Towers are still shown one level down (heat maps, by-process breakdowns).

### 13.2 Controls
| KPI | Value | Formula | Why it matters |
|---|---|---|---|
| Failing controls | 16 of 412 | Controls whose latest test failed, across every tower | Each is a weak spot the auditor will test again |
| Key-control effectiveness | 89.9% (124/138), target 98% | Passing key controls ÷ all key controls | The auditor relies on these; a failure widens the sample or becomes a finding |
| Automation | 61% (251/412) | Automated ÷ all controls | Automated controls check every transaction; manual ones depend on samples |
| Policy compliance | 94.93%, warn below 97% | Checks without a violation ÷ all checks (2,863 violations in 56,484) | Policy breaches are the auditor's first sample |

### 13.3 Investigations
| KPI | Value | Formula | Why it matters |
|---|---|---|---|
| Money at risk | ₹7.64 Cr in 8 cases | Sum of ₹ impact of open high and critical cases tagged to Compliance | Money that may have left, or is about to |
| Anomalies to review | 11 of 47 | Transactions scored 80+ in September not yet reviewed | A high score isn't proof; each needs a person |
| Access conflicts | 3 (1 used) | Users holding two rights that should be split | A used conflict is an actual control failure |
| Sanctions screening | 570 screened, 0 matches | Vendors and customers checked against sanctions lists | One match stops business with that party |

**How the anomaly score bands work:** 90–100 act today, 80–89 a person reviews, 60–79 watch, below 60 logged. In the demo these bands are fixed values; there is no scoring model in the code yet. The proposed definition: 60% worst signal + 40% weighted average of signals (unusual amount, recent bank or master-data change, duplicate likeness, SoD involvement, timing such as period end or just under a limit, known fraud patterns), with any fraud-pattern hit floored at 90. Thresholds should be set from reviewer capacity and checked each quarter against confirmed cases.

### 13.4 Findings
| KPI | Value | Formula | Why it matters |
|---|---|---|---|
| Open findings | 8 (4 overdue) | Open findings from the auditor, internal audit and monitoring | Costs 6 readiness points |
| Oldest overdue | 41 days | Days since the due date of the oldest open finding | A repeat finding this late says the fix hasn't worked |
| Fixes on time | 92% (138/150), target 95% | Fix actions closed by their due date ÷ due, Q2 FY27 | Shows whether management keeps its promises to the auditor |
| Repeat findings | 5 of 8 | Open findings raised in an earlier audit | Repeats tell the auditor a fix did not work |

### 13.5 Evidence
| KPI | Value | Formula | Why it matters |
|---|---|---|---|
| Evidence on file | 99.23%, target 99% | Items on file ÷ items the auditor will ask for | A missing document fails the sample even if the control worked |
| Attestations signed | 114 of 120 | (Required − outstanding) ÷ required, Q2 FY27 | The auditor needs the owner's sign-off before relying on a control |
| Evidence packs ready | 1 of 4 | Packs whose case is decided, or that were submitted | Each pack answers a request the auditor already made |
| Ready for the auditor? | 1 of 5 checks | Five yes/no checks (section 9e) | One answer to "can we prove it?" before the review |

### 13.6 Entity figures (the 16 compared on Entity profiles)
| Group | Figures | Better is |
|---|---|---|
| Scale | Spend Sep, Open P2P cases | Neutral / lower |
| Control health | P2P pass %, Approval %, Master data %, Evidence %, Failing controls | Higher (%), lower (count) |
| P2P exceptions | No-PO Sep, PO after invoice, Forced matches Q2, MSME >45 d unpaid | Lower |
| Risk and audit | Money at risk, Compliance cases, Anomalies 80+, Access conflicts, Open findings | Lower |

---

## 14. How to present it to people

Tell it as **five questions an auditor will ask**, in tab order. One sentence per screen, then one click that proves it.

1. **"Will we pass?"** (Audit readiness)
   *"We're at 85.5 against 90, with 7 days to the review. We lose almost all our points in two places: findings and access conflicts. Two decisions get us to 90.5."* → point at the Path to 90 strip.
2. **"What is broken?"** (Controls)
   *"16 of 412 controls failed, 14 of them key. The worst is the bank-change call-back at 0%: one bank change went through without a call."* → open CTL-P2P-009.
3. **"Has anything actually gone wrong?"** (Investigations)
   *"A broken control is a risk; here it became real. ₹7.64 Cr sits in 8 cases, 11 high-score anomalies are waiting for review, and one user at IN-03 created a vendor and paid it ₹18.7 L."* → open SoD-01.
4. **"Are we fixing what the auditor told us?"** (Findings)
   *"8 findings are open, 5 are repeats, and 4 are overdue at a point each. The oldest is 41 days late, but the evidence now exists, so we can close it today."* → open F-2026-031.
5. **"Can we prove it?"** (Evidence pack)
   *"99.23% of evidence is on file, but only 1 of 5 audit checks passes. We need 6 sign-offs, one call-back log and two decisions."* → show the five tiles, then click **Back to Audit readiness**.

**Close with Entity profiles:** *"And here is the same picture by entity: IN-05 holds ₹4.32 Cr of the risk; IN-02 has the weakest controls."*

**The message in one line:** *We know the score, we know exactly why it's short, and every gap has a named decision. Decide two cases this week and we are audit-ready.*

---

## 15. What is demo data and what is not

All figures are fixed demo values. The following were added during the design pass and are illustrative, not from a source system. Replace them when real data arrives.

| Item | Where | Note |
|---|---|---|
| Priorities 72 (SC-ADJ-12) and 58 (RTR-PER-10) | Audit readiness, Cases to decide | Placeholders |
| SC-ADJ-12 and RTR-PER-10 case drawers | Decide button | Not in `data/exceptions.js`; Decide shows "not part of this demo" |
| 36 anomalies scored below 80 | Investigations | Invented rows so every band can be listed |
| "Why it was flagged" sentences | Investigations, anomaly detail | Written from each anomaly's title |
| Anomaly score model and band thresholds | Investigations | No model exists yet (see 13.3) |
| "How it closes" for 6 findings | Findings detail | Written from each finding's title |
| 95% target for Fixes on time | Findings | Suggested; no target was defined |
| Chase, Record sign-off, Export | Evidence pack | Show a confirmation only; counts do not change |
| Reviewed 0 of 11 | Investigations | There is no way to mark an anomaly reviewed yet |

**Known open points**
- **Record sign-off** sits next to **Chase** on the compliance view. Strictly, only the control owner should record their own attestation; on this screen, Chase is the compliance team's action.
- **5,481 required evidence items** is below 138 key controls × 40 = 5,520. It is explained as "up to 40 items" (fewer where a control ran fewer times), but the real per-control sample counts are not in the data.
- **Live vs baseline:** only P2P is tested live. O2C, R2R, Supply chain and Compliance figures are baseline and need re-checking when those towers go live.
