/* FCT Compliance: DESIGN PREVIEW helpers for steps 2–5 and Entity profiles.
   Uses the P2P components and p2p.css unchanged. Numbers are fixed demo values from FCT-work/cmp-data.json;
   the live engine replaces this file in the data/build step. */
(function(){
  const P = window.P2P, html = P.html, Icon = P.Icon, R = P.R, COL = P.COL, FCT = window.FCT, { useState, useEffect } = React;
  const cx = (...a)=> a.filter(Boolean).join(' ');
  const n1 = (v)=> FCT.n(v,1), n2 = (v)=> FCT.n(v,2), pc = (v,d=1)=> v==null? 'N/A' : FCT.pct(v,d), cr = (v,d=2)=> '₹'+FCT.n(v,d)+' Cr';
  const pl = (v, one, many)=> v+' '+(v===1? one : (many || one+'s'));
  const C = window.CMPV = { cx, n1, n2, pc, cr, pl };
  /* Compliance screens: card titles and footer labels wrap instead of truncating */
  try{ const st = document.createElement('style'); st.textContent = 'body .btn.cmp-decide.cmp-decide.cmp-decide{padding:6px 16px;font-size:13px;font-weight:600;background:color-mix(in srgb,var(--px-brand2) 16%,transparent);border-color:color-mix(in srgb,var(--px-brand2) 60%,transparent);color:var(--px-brand2)}body .btn.cmp-decide.cmp-decide.cmp-decide:hover{background:var(--px-brand2);border-color:var(--px-brand2);color:var(--surface)}.px-rc-h .px-kc-t span:last-child{white-space:normal;overflow:visible}.px-rc-f dt,.px-rc-f dd{white-space:normal;overflow:visible;text-overflow:clip}'; document.head.appendChild(st); }catch(e){}
  /* a case's amount as its own record states it (the case drawer shows the same text) */
  C.amt = (c)=>{ const x = FCT.ex && FCT.ex(c[0]); return x && x.impact && x.impact.short || FCT.amt(c[4]); };

  /* ---------- demo values (cmp-data.json) ---------- */
  C.D = {
    focus:['IN-02','IN-03','IN-04','IN-05','IN-08'],
    procs:[ {p:'P2P', total:118, key:38, auto:96, failing:10}, {p:'O2C', total:84, key:26, auto:52, failing:1}, {p:'R2R', total:102, key:41, auto:61, failing:3},
            {p:'Supply chain', total:58, key:19, auto:24, failing:1}, {p:'Compliance', total:50, key:14, auto:18, failing:1} ],
    failing:[ ['CTL-P2P-009','Bank-detail change verified by call-back','IN-02','P2P','high','The only bank change (Apex, 03-Oct) has no call-back log','CMP-EVD-05',true],
              ['CTL-P2P-020','PO in place where one is required (no PO, no pay)','Group','P2P','high','928 of 13,652 invoices without a PO (93.20%); worst IN-08 at 90.2%','SC-NPO-09',true,'IN-08'],
              ['CTL-P2P-031','MSME vendor paid within 45 days','Group','P2P','high','471 of 4,001 MSME invoices paid late (88.23%); worst IN-02 at 86.6%','',true,'IN-02'],
              ['CTL-P2P-017','Invoice price within contract ±2%','Group','P2P','medium','453 of 8,760 contracted lines above contract (94.83%); worst IN-02 at 88.9%','',true,'IN-02'],
              ['CTL-P2P-022','PO raised before the invoice','Group','P2P','medium','384 invoices with the PO raised after the invoice (97.04%); worst IN-02 and IN-04 at 96.7%','',true,'IN-02'],
              ['CTL-P2P-021','Vendor master data verified','IN-03','P2P','medium','62 of 888 vendor checks failing (93.02%)','CMP-VMD-18',true],
              ['CTL-P2P-014','Three-way-match tolerance override approved','IN-05','P2P','medium','8 forced matches at IN-05 in Sep (14 in Q2 FY27), ₹3.15 L','CMP-CTL-02',true],
              ['CTL-P2P-010','Duplicate invoice blocked before payment','IN-04','P2P','high','3 duplicates reached posting in Sep (99.98%)','PTP-DUP-03',true],
              ['CTL-P2P-015','Goods receipt posted within 48 h','Group','P2P','medium','984 of 5,331 receipts late (81.54%); worst IN-02 at 72.6%','',false,'IN-02'],
              ['CTL-P2P-024','Duplicate vendor record prevented','IN-04','P2P','low','3 duplicate vendor pairs active','CMP-DUP-19',false],
              ['CTL-CMP-003','SoD: vendor create vs payment approve','IN-03','Compliance','high','Conflict used: ₹18.7 L paid to a vendor the same user created','CMP-SOD-01',true],
              ['CTL-R2R-021','Journal support attached','IN-07','R2R','high','11 September journals without support (R2R ledger)','',true],
              ['CTL-R2R-017','Intercompany confirmation','IN-07','R2R','medium','September IC with IN-01 not confirmed: 8 items, ₹6.42 Cr (R2R ledger)','RTR-CLS-01',true],
              ['CTL-R2R-030','Suspense ageing','IN-08','R2R','medium','9 items over 30 days (R2R ledger)','RTR-REC-07',true],
              ['CTL-O2C-011','Credit-limit override approved','US-01','O2C','high','6 Q2 limit overrides without a second approval (O2C credit decisions)','',true],
              ['CTL-SC-006','Inventory count variance','IN-05','Supply chain','high','Catalyst shortage 14% (SC count, SC-CNT-04)','SC-CNT-04',true] ],
    bands:[ ['90–100',4], ['80–89',7], ['60–79',21], ['Below 60',15] ],
    anomalies:[ ['ANM-2026-0871','Duplicate invoice across two vendor codes','IN-04',0.486,96,'PTP-DUP-03','P2P'],
                ['ANM-2026-0912','Vendor bank account matches an employee salary account','IN-05',0.062,94,'CMP-ANM-07','Baseline'],
                ['ANM-2026-0908','Round-sum manual journal at period end','IN-05',2.40,93,'RTR-JNL-02','R2R'],
                ['ANM-2026-0905','Write-offs split under the approval limit','IN-08',1.10,91,'SC-ADJ-12','SC'],
                ['ANM-2026-0889','Same amount paid twice to one vendor (PX-26212)','IN-05',0.0138,88,'','P2P'],
                ['ANM-2026-0893','Manual journal posted and approved by the same user','IN-07',0.92,86,'','R2R'],
                ['ANM-2026-0886','Customer credit limit raised the day before a large order','US-01',0.71,85,'','O2C'],
                ['ANM-2026-0901','POs split to stay under the approval limit (Bharat Electricals)','IN-03',0.294,84,'CMP-POL-04','P2P'],
                ['ANM-2026-0897','Payment to a vendor created by the same user','IN-03',0.187,82,'CMP-SOD-01','P2P'],
                ['ANM-2026-0884','Weekend posting to inventory adjustment','IN-02',0.31,82,'','SC'],
                ['ANM-2026-0879','Goods receipt posted after the invoice was paid (INV-26-190373)','IN-08',0.0306,81,'','P2P'] ],
    sod:[ ['SoD-01','Vendor master maintain + Payment run approve','pnair.in03, IN-03','AP executive',true,'P2P'],['SoD-02','Journal post + Journal approve','jshah.in05, IN-05','GL accountant',false,'R2R'],
          ['SoD-03','Customer master + Credit memo approve','tbrown.us01, US-01','Billing analyst',false,'O2C'] ],
    /* the 8 open high and critical cases with money involved. Each amount is shown on its own and never added up:
       one event can surface in more than one case (CMP-ANM-07 and SC-CNT-04 involve the same IN-05 employee). */
    cases:[ ['RTR-JNL-02','Manual journal of ₹2.40 Cr to revenue at period end','IN-05','Record to report',2.40,'critical'],
      ['SC-CNT-04','Cycle-count shortage; catalysts short by 14%','IN-05','Supply chain',1.86,'critical'],
      ['PTP-BNK-05','Vendor bank-detail change before the payment run','IN-02','Procure to pay',1.12,'critical'],
      ['SC-ADJ-12','Write-offs split under the approval limit','IN-08','Supply chain',1.10,'critical'],
      ['PTP-DUP-03','Probable duplicate invoice','IN-04','Procure to pay',0.486,'critical'],
      ['RTR-PER-10','Posting to a closed period','IN-08','Record to report',0.42,'high'],
      ['CMP-SOD-01','SoD conflict used: vendor create and payment approve','IN-03','Compliance',0.187,'high'],
      ['CMP-ANM-07','Vendor bank account matches an employee salary account','IN-05','Compliance',0.062,'high'] ],
    findings:[ ['F-2026-031','GRNI review evidence incomplete','Statutory auditor, FY26','P2P','25-Aug',41,true,'Evidence','CMP-REM-06'],
               ['F-2026-034','Vendor creation and payment rights held by one user, IN-03','Internal audit, Q1','Compliance','15-Sep',20,true,'Access (SoD)','CMP-SOD-01'],
               ['F-2026-038','Intercompany confirmations not obtained','Statutory auditor, FY26','R2R','20-Sep',15,true,'Evidence','CMP-FND-09'],
               ['F-2026-041','Manual journals without support','Internal audit, Q1','R2R','30-Sep',5,true,'Evidence','CMP-FND-10'],
               ['F-2026-046','Credit limits overridden without approval, US-01','Internal audit, Q2','O2C','15-Oct',0,true,'Approval','CMP-FND-11'],
               ['F-2026-049','Job-work challans over 365 days not tracked','Indirect tax review','Supply chain','25-Oct',0,false,'Evidence','CMP-FND-12'],
               ['F-2026-044','Inventory count not independent of custodian, IN-05','Internal audit, Q2','Supply chain','31-Oct',0,false,'Segregation','CMP-FND-13'],
               ['F-2026-047','Three-way-match tolerance changed without approval','Controls monitoring','P2P','31-Oct',0,false,'Approval','CMP-FND-14'] ],
    closure:{ m:['Apr','May','Jun','Jul','Aug','Sep'], opened:[9,7,11,6,8,5], closed:[6,8,9,10,9,7] },
    evAreas:[ ['Procure to pay',1481,1480],['Order to cash',1040,1034],['Record to report',1640,1622],['Supply chain',760,745],['IT general controls',560,558] ],
    /* Q2 FY27 owner attestations not signed: [control, control name, owner, days overdue, owner role, due, exception the sign-off must cite] */
    attest:[ ['CTL-P2P-009','Bank-detail change verified by call-back','Manish Gupta',6,'Treasury, IN-02','29-Sep','Apex Chem change of 03-Oct without a call-back log (CMP-EVD-05)'],
             ['CTL-R2R-017','Intercompany balances confirmed monthly','Anjali Kulkarni',4,'IC accountant, IN-07','01-Oct','September IC with IN-01 not confirmed: 8 items, ₹6.42 Cr (F-2026-038)'],
             ['CTL-SC-006','Inventory count variance within tolerance','Farhan Qureshi',3,'Plant controller, IN-05','02-Oct','₹1.86 Cr count shortage, count not independent (SC-CNT-04, F-2026-044)'],
             ['CTL-O2C-011','Credit-limit override approved','Tom Brennan',3,'Controller, US-01','02-Oct','6 Q2 overrides without a second approval (F-2026-046)'],
             ['CTL-R2R-030','Suspense items cleared within 30 days','Lata Krishnan',2,'Accountant, IN-08','03-Oct','9 suspense items over 30 days at IN-08'],
             ['CTL-P2P-022','PO raised before the invoice','Shalini Desai',1,'P2P process owner','04-Oct','384 September invoices with the PO raised after the invoice, most at IN-02'] ],
    packs:[ ['EVP-RTR-019','Reconciliation certification, Q1 FY27','1,040 certifications with reviewers','R2R','Ready',''],
            ['EVP-CTL-P2P-014','Three-way-match tolerance, IN-05','14 force-matched invoices, tolerance log, decision on CMP-CTL-02','P2P','Pending','CMP-CTL-02'],
            ['EVP-PTP-BNK-05','Bank-change decision, Apex Chem','Change request, risk score, hold, call-back log, decision','P2P','Pending','PTP-BNK-05'],
            ['EVP-2026-044','Internal Audit request, vendor payments','125 payment sets (98 complete, 27 open)','P2P','Pending',''] ],
    entCols:['Spend Sep','P2P pass %','Failing controls','Approval %','No-PO Sep','PO after invoice','Forced matches Q2','MSME >45 d unpaid','Master data %','Evidence %','Anomalies 80+','Access conflicts','Open findings','Compliance cases','Largest case','Open P2P cases'],
    ent:{"IN-01":[27.99,96.93,0,96.72,1.49,31,7,0,92.86,98.31,0,0,0,0,0,74],"IN-02":[139.19,94.14,5,96.46,1.4,74,13,22,92.95,99.02,1,0,0,2,1.12,120],"IN-03":[66.51,95.29,2,95.96,2.86,63,13,46,92.03,98.64,2,1,1,1,0.19,134],
      "IN-04":[88.28,95.22,2,96.42,1.55,48,8,13,91.67,98.99,1,0,0,2,0.49,91],"IN-05":[118.22,94.78,2,96.89,0.66,44,14,5,95.83,98.95,3,1,1,4,2.40,104],"IN-06":[20.13,96.83,0,96.42,1.15,25,11,5,91.67,98.27,0,0,0,0,0,41],
      "IN-07":[34.11,97,2,97,1.71,27,2,17,89.74,98.52,1,0,0,0,0,67],"IN-08":[31.88,95.6,2,95.82,2.25,45,17,41,96.15,98.67,2,0,0,2,1.10,89],"US-01":[18.19,96.55,1,96.56,1.24,19,6,16,93.75,98.56,1,1,1,1,0,41],"EU-01":[6.48,96.07,0,96.7,0.37,8,2,6,88.89,98.75,0,0,0,0,0,15]},
    entName:{'IN-01':'Corporate Office','IN-02':'API Manufacturing','IN-03':'Formulations','IN-04':'Life Science Ingredients','IN-05':'Specialty Chemicals','IN-06':'Nutrition','IN-07':'Contract Research','IN-08':'Distribution & Trading','US-01':'North America Sales','EU-01':'Europe Sales'}
  };

  /* fix actions on the 4 overdue findings, Q2 FY27 (Jul-Sep): [action, owner, due, done or '' if still open, days late at 05-Oct-2026] */
  C.D.fixes = {
    'F-2026-031':[['Agree the GRNI review template and who signs it','Manish Gupta','31-Jul','22-Aug',22,'Template waited for the auditor’s comments'],
                  ['File the July GRNI review with sign-off','Manish Gupta','15-Aug','',51,'No reviewer named; not in the close calendar'],
                  ['File the August GRNI review with sign-off','Manish Gupta','15-Sep','',20,'No reviewer named; not in the close calendar']],
    'F-2026-034':[['Remove Payment run approve from pnair.in03','Sameer Khan','31-Aug','',35,'Access request ACR-2291 still awaiting the AP head’s approval'],
                  ['Internal Audit review of the vendor creation and the ₹18.7 L payment','Internal audit','15-Sep','',20,'Scheduled after the Q2 audit plan; not yet started'],
                  ['Add the vendor-create / payment-approve rule to access provisioning','Sameer Khan','30-Sep','',5,'Waiting for the IT change window of 10-Oct']],
    'F-2026-038':[['Send July intercompany confirmations','Anjali Kulkarni','10-Aug','28-Aug',18,'Sent 18 days late, after counterparties closed'],
                  ['Send August intercompany confirmations','Anjali Kulkarni','10-Sep','24-Sep',14,'Sent 14 days late, after counterparties closed'],
                  ['Send September intercompany confirmations','Anjali Kulkarni','30-Sep','',5,'Planned for 08-Oct (WD5)']],
    'F-2026-041':[['Attach support to the 11 manual journals','Arjun Rao','20-Sep','',15,'Preparers at IN-07 have not sent the documents'],
                  ['Make an attachment mandatory for manual journals above ₹5 L','Arjun Rao','30-Sep','',5,'Workflow change in the 10-Oct IT window'],
                  ['Sign off the September manual-journal review','Arjun Rao','30-Sep','',5,'Waiting for the 11 supports']] };
  /* the 42 missing evidence items, one per auditor sample, keyed by the evDetail line they belong to: [reference, entity, what is missing] (demo data) */
  C.D.evItems = {
    'Journal supports (CTL-R2R-021)':[['JE-26-091402','IN-07','Accrual reversal ₹4.2 L (Dr 210300 Accrued expenses, Cr 520100 Lab consumables), posted 03-Sep by rkapoor.in07: vendor invoice copy missing'],
      ['JE-26-091417','IN-07','Reclass ₹1.8 L from 540200 Repairs to 540300 Maintenance contracts, posted 05-Sep by rkapoor.in07: reviewer’s approval e-mail missing'],
      ['JE-26-091433','IN-07','Provision ₹6.5 L for clinical-trial site fees (Dr 560400, Cr 230100), posted 09-Sep by akumar.in07: calculation working missing'],
      ['JE-26-091448','IN-07','Accrual ₹2.9 L for CRO services (Dr 560100, Cr 210300), posted 12-Sep by rkapoor.in07: PO or contract reference missing'],
      ['JE-26-091462','IN-07','Reclass ₹0.9 L from 610200 Travel to 610400 Conferences, posted 15-Sep by akumar.in07: reviewer’s approval e-mail missing'],
      ['JE-26-091479','IN-07','Prepaid release ₹3.1 L for software licences (Dr 620300, Cr 150200), posted 18-Sep by rkapoor.in07: amortisation schedule missing'],
      ['JE-26-091485','IN-07','Accrual ₹5.4 L for lab equipment service (Dr 540300, Cr 210300), posted 22-Sep by akumar.in07: vendor invoice copy missing'],
      ['JE-26-091496','IN-07','Bonus provision ₹7.2 L for Q2 (Dr 510500, Cr 240100), posted 26-Sep by rkapoor.in07: HR bonus sheet missing'],
      ['JE-26-091503','IN-07','Reclass ₹1.2 L from 520100 Lab consumables to 520200 Reagents, posted 28-Sep by akumar.in07: reviewer’s approval e-mail missing'],
      ['JE-26-091518','IN-07','Accrual ₹2.6 L for courier and samples (Dr 570200, Cr 210300), posted 30-Sep by rkapoor.in07: PO reference missing'],
      ['JE-26-091524','IN-07','Write-back ₹1.5 L of an old accrual (Dr 210300, Cr 590100 Other income), posted 30-Sep by rkapoor.in07: ageing working missing']],
    'Reconciliation sign-offs':[
      ['GL 113200 Bank, HDFC ****8812','IN-08','Aug-26 · Ledger ₹4.62 Cr vs bank statement ₹4.65 Cr · 3 reconciling items (₹3.1 L of uncleared cheques) · Prepared 05-Sep, Lata Krishnan (lkrishnan.in08) · Reviewer Sanjay Rao, finance manager IN-08 (left 22-Sep, not replaced): sign-off due 15-Sep missing'],
      ['GL 113210 Bank, ICICI ****2045','IN-08','Aug-26 · Ledger ₹1.18 Cr vs bank statement ₹1.18 Cr · no differences · Prepared 05-Sep, Lata Krishnan (lkrishnan.in08) · Reviewer Sanjay Rao, finance manager IN-08 (left 22-Sep, not replaced): sign-off due 15-Sep missing'],
      ['GL 210400 GRNI','IN-05','Aug-26 · Ledger ₹3.36 Cr vs open-GRN report ₹3.30 Cr · ₹6.0 L unexplained · Prepared 06-Sep, Farhan Qureshi (fq.in05) · Reviewer Arjun Rao, GL & close lead (not chased): sign-off due 15-Sep missing'],
      ['GL 145000 Intercompany','IN-07','Aug-26 · Ledger ₹9.85 Cr vs counterparty confirmations ₹9.85 Cr · no differences · Prepared 07-Sep, Anjali Kulkarni (akulkarni.in07) · Reviewer Arjun Rao, GL & close lead (not chased): sign-off due 15-Sep missing'],
      ['GL 220100 Statutory dues','IN-02','Aug-26 · Ledger ₹0.84 Cr vs GST and TDS challans ₹0.84 Cr · no differences · Prepared 06-Sep, Manish Gupta (mgupta.in02) · Reviewer Rahul Verma, tax lead (not chased): sign-off due 15-Sep missing'],
      ['GL 160300 Employee advances','IN-03','Aug-26 · Ledger ₹0.42 Cr vs HR advance register ₹0.40 Cr · ₹2.1 L unexplained · Prepared 08-Sep, R. Mehta (rmehta.in03) · Reviewer Arjun Rao, GL & close lead (not chased): sign-off due 15-Sep missing'],
      ['GL 199900 Suspense','IN-08','Aug-26 · Ledger ₹0.31 Cr in 9 items over 30 days, to be cleared · Prepared 05-Sep, Lata Krishnan (lkrishnan.in08) · Reviewer Sanjay Rao, finance manager IN-08 (left 22-Sep, not replaced): sign-off due 15-Sep missing']],
    'Stock-count sheets with independent counter sign-off (CTL-SC-006)':[
      ['CNT-26-09-031','IN-05','28-Sep · Catalyst store, rack C-01 · Item: CAT-09 palladium on carbon 5% · Book 42 kg · Counted 31 kg · Short 11 kg · signed by stk.in05.07 only: independent counter sign-off missing'],
      ['CNT-26-09-032','IN-05','28-Sep · Catalyst store, rack C-02 · Item: CAT-11 platinum catalyst · Book 18 kg · Counted 16 kg · Short 2 kg · signed by stk.in05.07 only: independent counter sign-off missing'],
      ['CNT-26-09-033','IN-05','28-Sep · Catalyst store, rack C-03 · Item: CAT-14 Raney nickel · Book 260 kg · Counted 238 kg · Short 22 kg · signed by stk.in05.07 only: independent counter sign-off missing'],
      ['CNT-26-09-034','IN-05','28-Sep · Catalyst store, rack C-04 · Item: CAT-02 zeolite · Book 1,150 kg · Counted 1,150 kg · No variance · signed by stk.in05.07 only: independent counter sign-off missing'],
      ['CNT-26-09-035','IN-05','28-Sep · Catalyst store, rack C-05 · Item: CAT-07 copper chromite · Book 400 kg · Counted 392 kg · Short 8 kg · signed by stk.in05.07 only: independent counter sign-off missing'],
      ['CNT-26-09-036','IN-05','28-Sep · Catalyst store, rack C-06 · Item: CAT-16 rhodium complex · Book 3.2 kg · Counted 2.6 kg · Short 0.6 kg · signed by stk.in05.07 only: independent counter sign-off missing'],
      ['CNT-26-09-037','IN-05','29-Sep · Solvent yard, tank T-01 · Item: SOL-04 methanol · Book 38.0 KL · Counted 36.4 KL · Short 1.6 KL · signed by stk.in05.07 only: independent counter sign-off missing'],
      ['CNT-26-09-038','IN-05','29-Sep · Solvent yard, tank T-02 · Item: SOL-07 toluene · Book 22.5 KL · Counted 21.9 KL · Short 0.6 KL · signed by stk.in05.07 only: independent counter sign-off missing'],
      ['CNT-26-09-039','IN-05','29-Sep · Solvent yard, tank T-03 · Item: SOL-11 acetone · Book 15.0 KL · Counted 14.8 KL · Short 0.2 KL · signed by stk.in05.07 only: independent counter sign-off missing'],
      ['CNT-26-09-040','IN-05','29-Sep · Solvent yard, drum bay D-1 · Item: SOL-19 dichloromethane · Book 120 drums · Counted 116 drums · Short 4 drums · signed by stk.in05.07 only: independent counter sign-off missing'],
      ['CNT-26-09-041','IN-05','30-Sep · Intermediates store, rack I-01 · Item: INT-221 nitro intermediate · Book 3,400 kg · Counted 3,350 kg · Short 50 kg · signed by stk.in05.07 only: independent counter sign-off missing'],
      ['CNT-26-09-042','IN-05','30-Sep · Intermediates store, rack I-02 · Item: INT-305 amine salt · Book 2,100 kg · Counted 2,085 kg · Short 15 kg · signed by stk.in05.07 only: independent counter sign-off missing'],
      ['CNT-26-09-043','IN-05','30-Sep · Intermediates store, rack I-03 · Item: INT-118 ester · Book 1,800 kg · Counted 1,800 kg · No variance · signed by stk.in05.07 only: independent counter sign-off missing'],
      ['CNT-26-09-044','IN-05','30-Sep · General store, rack G-04 · Item: PKG-12 HDPE drums · Book 900 · Counted 870 · Short 30 · signed by stk.in05.07 only: independent counter sign-off missing'],
      ['CNT-26-09-045','IN-05','30-Sep · General store, rack G-07 · Item: SPR-40 pump seals · Book 64 · Counted 61 · Short 3 · signed by stk.in05.07 only: independent counter sign-off missing']],
    'Credit-limit approval e-mails (CTL-O2C-011)':[['CL-OVR-2611','US-01','Helios Supply LLP limit raised ₹38 Cr → ₹43 Cr on 03-Jul by tbrown.us01: second approval e-mail missing'],['CL-OVR-2614','US-01','Indigo Chem LLP limit raised ₹34 Cr → ₹38.5 Cr on 22-Jul by tbrown.us01: second approval e-mail missing'],['CL-OVR-2618','US-01','Stonegate Labs AG limit raised ₹31 Cr → ₹36 Cr on 11-Aug by tbrown.us01: second approval e-mail missing'],['CL-OVR-2620','US-01','Helios Supply LLP limit raised ₹43 Cr → ₹47 Cr on 29-Aug by tbrown.us01: second approval e-mail missing'],['CL-OVR-2623','US-01','Maple Supply LLP limit raised ₹42 Cr → ₹57 Cr on 12-Sep by tbrown.us01: second approval e-mail missing'],['CL-OVR-2627','US-01','Indigo Chem LLP limit raised ₹38.5 Cr → ₹41 Cr on 26-Sep by tbrown.us01: second approval e-mail missing']],
    'Quarterly user-access review sign-offs':[['UAR-Q2-SAP','Group','SAP access review, sign-off missing'],['UAR-Q2-ARIBA','Group','Ariba access review, sign-off missing']],
    'Bank-change call-back log, Apex Chem (CTL-P2P-009)':[['BNK-CHG-2603','IN-02','Call-back log for the Apex Chem bank change on 03-Oct']] };
  const EVLINK = { 'Journal supports (CTL-R2R-021)':'CTL-R2R-021', 'Reconciliation sign-offs':'CTL-R2R-030', 'Stock-count sheets with independent counter sign-off (CTL-SC-006)':'CTL-SC-006',
    'Credit-limit approval e-mails (CTL-O2C-011)':'CTL-O2C-011', 'Bank-change call-back log, Apex Chem (CTL-P2P-009)':'CTL-P2P-009' };
  const FIXLINK = { 'F-2026-034':'CMP-SOD-01', 'F-2026-038':'CTL-R2R-017', 'F-2026-041':'CTL-R2R-021' };
  /* acts: one per table row { ref, owner, open, link, ent } -> Chase (open items only) and Open in <tower> */
  C.D.evWhy = { 'Journal supports (CTL-R2R-021)':'IN-07 preparers posted without attachments; the workflow allows it (F-2026-041)',
    'Reconciliation sign-offs':'Reviewer sign-off was due 15-Sep; at IN-08 the reviewer left on 22-Sep and was not replaced, and at IN-02, IN-03, IN-05 and IN-07 the sign-off was not chased',
    'Stock-count sheets with independent counter sign-off (CTL-SC-006)':'Counted by the custodian alone; no independent counter assigned (F-2026-044)',
    'Credit-limit approval e-mails (CTL-O2C-011)':'Overrides approved by phone; no second approval recorded (F-2026-046)',
    'Quarterly user-access review sign-offs':'Q2 review sent to application owners on 28-Sep; not returned',
    'Bank-change call-back log, Apex Chem (CTL-P2P-009)':'Call-back not yet made to the vendor-master number (CMP-EVD-05)' };
  C.evActs = (lines)=> lines.flatMap(x=> (C.D.evItems[x[0]] || []).map(it=> ({ ref:it[0], owner:x[2], open:true, link:EVLINK[x[0]], ent:it[1] })));
  /* evidence grouped by type: the header carries owner, why missing and actions once; each row is reference, entry, missing document */
  const splitItem = (t)=>{ const i = t.lastIndexOf(': '), j = t.lastIndexOf('; '), k = i>=0? i : j;
    return k>=0? [t.slice(0,k), t.slice(k+2)] : [t, '']; };
  C.evGroups = (lines)=> lines.filter(x=> (C.D.evItems[x[0]] || []).length).map(x=> ({ key:x[0], name:x[0].replace(/ \(CTL-[^)]+\)/,''), ctl:(x[0].match(/CTL-[A-Z0-9-]+/)||[''])[0], owner:x[2], why:C.D.evWhy[x[0]] || '', link:EVLINK[x[0]],
    items:C.D.evItems[x[0]].map(it=>{ const [what, miss] = splitItem(it[2]); return { ref:it[0], ent:it[1], what, miss, owner:x[2], open:true }; }) }));
  C.EvGroups = ({ groups, ch, chase })=> html`<div style=${{display:'grid', gap:'14px'}}>${groups.map(g=>{ const op = g.items.filter(a=> !ch[a.ref]), ents = [...new Set(g.items.map(a=> a.ent))];
    return html`<div key=${g.key}>
      <div style=${{display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:'10px', flexWrap:'wrap', padding:'8px 10px', borderRadius:'8px', background:'var(--well, color-mix(in srgb, var(--px-ink3) 10%, transparent))'}}>
        <div style=${{flex:'1 1 420px'}}><b>${g.name}</b> <span class="faint">· ${C.pl(g.items.length,'item')} · ${ents.join(', ')}${g.ctl? ' · '+g.ctl : ''} · owner ${g.owner}</span>
          <div class="sub" style=${{marginTop:'3px'}}>Why missing: ${g.why}</div></div>
        <span style=${{whiteSpace:'nowrap'}}>${g.link && C.towerBtn(g.link, ents[0])}${op.length>1? html`<button type="button" class="btn sm" onClick=${()=> chase(op)}>Chase all (${op.length})</button>` : null}</span></div>
      <div class="px-tbl"><table class="t px-t dense"><tbody>${g.items.map(a=> html`<tr key=${a.ref}><td style=${{whiteSpace:'nowrap', width:'150px'}}><b>${a.ref}</b>${ents.length>1? html`<div class="sub">${a.ent}</div>` : ''}</td>
        <td style=${{whiteSpace:'normal'}}>${a.what}</td>
        <td style=${{width:'220px'}}>${a.miss && html`<span class="px-pill t-a" style=${{whiteSpace:'normal'}}>${a.miss.replace(/^reviewer.s /,'').replace(/ missing$/,'')} missing</span>`}</td>
        <td class="r" style=${{whiteSpace:'nowrap', width:'110px'}}>${ch[a.ref]? html`<${C.Pill} tone="g">Chased today</${C.Pill}>` : html`<button type="button" class="btn sm" onClick=${()=> chase([a])}>Chase</button>`}</td></tr>`)}</tbody></table></div></div>`; })}</div>`;
  C.evRows = (lines)=> lines.flatMap(x=> (C.D.evItems[x[0]] || []).map(it=> [it[0], it[1], it[2], x[0].replace(/ \(CTL-[^)]+\)/,''), html`<span style=${{whiteSpace:'normal'}}>${C.D.evWhy[x[0]] || ''}</span>`, x[2]]));
  /* a column is right-aligned only when every cell in it is a number, amount, percent or date-like figure */
  C.isNum = (rows, j)=> j>0 && rows.length>0 && rows.every(rw=> rw[j]==null || /^[₹\d][\d.,%\s]*(L|Cr|d|days)?$/.test(String(rw[j])));
  /* everything open at one entity, from the same records the other screens use: cases (the 8 money cases and every case tagged to Compliance),
     anomalies 80+ still without a case, failing controls worst here, findings naming the entity, access conflicts, missing evidence items */
  C.entOpen = (e)=>{ const X = (window.FCT_DATA || {}).exceptions || [], ids = new Set(C.D.cases.map(c=> c[0])), out = [];
    X.filter(x=> x.entity===e && (ids.has(x.id) || x.tower==='CMP' || (x.also||[]).indexOf('CMP')>=0)).sort((a,b)=> b.priority-a.priority)
      .forEach(x=> out.push({ type:'Case', sev:x.severity, ref:x.id, title:x.title, detail:x.severity+' · priority '+x.priority+(x.impact && x.impact.short? ' · '+x.impact.short+(/₹/.test(x.impact.short) || !x.impact.label? '' : ' ('+(/^[A-Z][a-z]/.test(x.impact.label)? x.impact.label.charAt(0).toLowerCase()+x.impact.label.slice(1) : x.impact.label)+')') : ''), decide:x.id, link:C.LINKS[x.id] && x.id, money:(x.impact && x.impact.valueCr) || 0, amt:x.impact && x.impact.short }));
    C.D.anomalies.filter(a=> a[2]===e && !a[5]).forEach(a=> out.push({ type:'Anomaly', ref:a[0], title:a[1], detail:'score '+a[4]+' · '+FCT.amt(a[3])+' · no case yet', review:true }));
    C.D.failing.filter(x=> (x[8]||x[2])===e).forEach(x=> out.push({ type:'Failing control', ref:x[0], title:x[1], detail:x[5], link:C.LINKS[x[0]] && x[0] }));
    C.D.findings.filter(f=> f[1].indexOf(e)>=0).forEach(f=> out.push({ type:'Finding', ref:f[0], title:f[1], detail:(f[5]>0? f[5]+' d overdue' : 'due '+f[4])+(f[6]? ' · repeat' : '')+(f[8]? ' · fixed through case '+f[8] : ''), decide:f[8] }));
    C.D.sod.filter(s=> s[2].indexOf(e)>=0).forEach(s=> out.push({ type:'Access conflict', ref:s[0], title:s[1], detail:s[2].split(',')[0]+' · '+(s[4]? 'used in a transaction' : 'not used'), decide:s[4]? 'CMP-SOD-01' : '' }));
    C.D.contracts.rpt.parties.filter(x=> x[9] && x[2].indexOf(e)>=0).forEach(x=> out.push({ type:'Contract exception', ref:x[0], title:'Related-party purchases without approval', detail:x[1]+' · 4 POs since 21-Aug · ratify by 17-Nov', decide:x[9] }));
    C.D.contracts.exp.vendors.filter(v=> v[1]===e).forEach(v=> out.push({ type:'Contract exception', ref:v[2], title:'Paid '+v[0]+' without a valid contract', detail:v[7].length+' payments'+(v[3]!=='—'? ' after expiry on '+v[3] : '')+' · why: '+v[5], decide:v[6] }));
    C.D.contracts.doa.ex.filter(x=> x[3]===e).forEach(x=> out.push({ type:'Contract exception', ref:x[0], title:x[1]+' signed above authority', detail:'₹'+FCT.n(x[4],1)+' Cr with '+x[2]+' · signed '+x[5]+' by '+x[6]+' (limit ₹'+FCT.n(x[7],1)+' Cr) · needs '+x[8], decide:x[9] }));
    Object.keys(C.D.evItems).forEach(k=>{ const line = Object.values(C.D.evDetail).flat().find(x=> x[0]===k) || [];
      const its = C.D.evItems[k].filter(it=> it[1]===e), name = k.replace(/ \(CTL-[^)]+\)/,'');   /* one row per evidence type at the entity */
      if(its.length===1) out.push({ type:'Missing evidence', n:1, ref:its[0][0], title:its[0][2], detail:'owner '+line[2]+' · due 09-Oct · why: '+(C.D.evWhy[k]||''), owner:line[2], link:EVLINK[k] });
      else if(its.length) out.push({ type:'Missing evidence', n:its.length, ref:its[0][0]+' to '+its[its.length-1][0], title:its.length+' × '+name, detail:'owner '+line[2]+' · due 09-Oct · why: '+(C.D.evWhy[k]||''), owner:line[2], link:EVLINK[k] }); });
    return out; };
  /* statutory filings (returns and payments), Q2 FY27 (Jul-Sep), demo data. Control CTL-CMP-018 "Statutory returns filed by the due date", target 95%.
     due: [return type, returns due, filed on time, owner]; late: [ref, type, period, entity, due, filed, days late, consequence (this return only)];
     next: [type, due date, returns, ready, owner] for 06-Oct to 04-Nov */
  C.D.filings = {
    target:95,
    due:[ ['GSTR-1',24,22,'Meera Joshi'], ['GSTR-3B',24,23,'Meera Joshi'], ['TDS return (24Q/26Q)',16,15,'Rahul Verma'], ['TDS payment',24,23,'Rahul Verma'],
          ['PF',24,23,'Neha Pillai'], ['ESI',24,23,'Neha Pillai'], ['Professional tax',18,18,'Neha Pillai'], ['Advance tax',8,8,'Rahul Verma'], ['US sales tax',6,5,'Tom Brennan'], ['EU VAT',2,2,'Tom Brennan'] ],
    late:[ ['GST-1-2608-IN04','GSTR-1','Aug-26','IN-04','11-Sep','16-Sep',5,'Late fee ₹250','17 e-invoices pending IRN at the due date'], ['GST-1-2607-IN02','GSTR-1','Jul-26','IN-02','11-Aug','13-Aug',2,'Late fee ₹100','GST portal outage on 11-Aug, filed on recovery'],
           ['GST-3B-2608-IN04','GSTR-3B','Aug-26','IN-04','20-Sep','24-Sep',4,'Interest ₹0.42 L','Waited for the late GSTR-1; tax paid with interest'], ['TDS-26Q-Q1-IN07','TDS return (24Q/26Q)','Q1 FY27','IN-07','31-Jul','06-Aug',6,'Late fee ₹1,200','PAN mismatch for 3 deductees blocked validation'],
           ['TDS-PAY-2608-IN08','TDS payment','Aug-26','IN-08','07-Sep','12-Sep',5,'Interest ₹0.18 L','Challan approval waited for the finance head on leave'], ['PF-2607-IN05','PF','Jul-26','IN-05','15-Aug','19-Aug',4,'Damages ₹0.06 L','Payroll closed late after 15-Aug holiday'],
           ['ESI-2608-IN05','ESI','Aug-26','IN-05','15-Sep','17-Sep',2,'Interest ₹0.01 L','Contract-labour headcount confirmed late by the contractor'], ['UST-TX-2608-US01','US sales tax','Aug-26','US-01','20-Sep','23-Sep',3,'Penalty $50','Texas nexus filing missed in the tax calendar'] ],
    /* per filing: internal deadline (2 working days before the legal date), legal cost of missing it, and each entity: [entity, ready, what is pending or done, since] */
    ent:{
      'TDS payment':{ cut:'05-Oct', law:'Interest at 1.5% a month or part of a month, from the date of deduction to the date of deposit (Income-tax Act s.201(1A))', rows:[
        ['IN-01',1,'Challan prepared 03-Oct, approved by Rahul Verma'],['IN-02',1,'Challan prepared 03-Oct'],['IN-03',1,'Challan prepared 03-Oct; includes the 20% shortfall on R.K. Transport (CMP-VMD-18)'],['IN-04',1,'Challan prepared 05-Oct'],
        ['IN-05',1,'Challan prepared 05-Oct'],['IN-06',1,'Challan prepared 01-Oct'],['IN-07',1,'Challan prepared 05-Oct'],['IN-08',1,'Challan prepared 05-Oct']] },
      'GSTR-1':{ cut:'08-Oct', law:'Late fee ₹50 a day per GSTIN (CGST and SGST together); customers do not see the credit in their GSTR-2B until it is filed', rows:[
        ['IN-01',1,'Draft uploaded 04-Oct'],['IN-02',0,'6 invoices for dispatches confirmed 28–30 Sep still have no IRN','01-Oct'],['IN-03',1,'Draft uploaded 05-Oct'],['IN-04',0,'4 invoices for dispatches confirmed 29–30 Sep still have no IRN','01-Oct'],
        ['IN-05',1,'Draft uploaded 05-Oct'],['IN-06',1,'Draft uploaded 03-Oct'],['IN-07',1,'Draft uploaded 04-Oct'],['IN-08',1,'Draft uploaded 05-Oct']] },
      'PF':{ cut:'13-Oct', law:'Damages of 5% to 25% a year on the late amount (EPF Act s.14B) plus interest at 12% a year (s.7Q)', rows:[
        ['IN-01',1,'ECR uploaded 05-Oct'],['IN-02',1,'ECR uploaded 05-Oct'],['IN-03',1,'ECR uploaded 05-Oct'],['IN-04',1,'ECR uploaded 05-Oct'],['IN-05',1,'ECR uploaded 05-Oct'],['IN-06',1,'ECR uploaded 05-Oct'],['IN-07',1,'ECR uploaded 05-Oct'],['IN-08',1,'ECR uploaded 05-Oct']] },
      'ESI':{ cut:'13-Oct', law:'Interest at 12% a year on the late amount, and damages of up to 25% a year (ESI Regulation 31 and ESI Act s.85B)', rows:[
        ['IN-01',1,'Contribution file ready 05-Oct'],['IN-02',1,'Contribution file ready 05-Oct'],['IN-03',1,'Contribution file ready 05-Oct'],['IN-04',1,'Contribution file ready 05-Oct'],
        ['IN-05',0,'Sapna Manpower Services has not confirmed September headcount for its 142 contract workers','01-Oct'],['IN-06',1,'Contribution file ready 05-Oct'],['IN-07',1,'Contribution file ready 05-Oct'],['IN-08',1,'Contribution file ready 05-Oct']] },
      'GSTR-3B':{ cut:'16-Oct', law:'Interest at 18% a year on tax paid late (CGST Act s.50) and a late fee of ₹50 a day per GSTIN', rows:[
        ['IN-01',1,'Input-tax credit matched to GSTR-2B on 04-Oct'],['IN-02',0,'₹4.6 L of input-tax credit in the books is not in GSTR-2B (31 supplier invoices)','02-Oct'],
        ['IN-03',0,'₹2.8 L not in GSTR-2B (18 invoices); credit on 2 Sai Krupa Traders invoices to reverse, GSTIN cancelled 12-Aug (CMP-VMD-18)','02-Oct'],
        ['IN-04',0,'₹3.1 L not in GSTR-2B (22 invoices)','02-Oct'],['IN-05',0,'₹1.9 L not in GSTR-2B (14 invoices)','02-Oct'],['IN-06',1,'Matched on 03-Oct'],['IN-07',1,'Matched on 05-Oct'],
        ['IN-08',0,'₹0.7 L not in GSTR-2B (6 invoices)','02-Oct']] },
      'US sales tax':{ cut:'16-Oct', law:'Texas: $50 late-filing penalty plus 5% of the tax due if 1–30 days late; California: 10% of the tax due', ent:'US-01', rows:[
        ['US-01 California',1,'Return prepared 02-Oct'],['US-01 Texas',0,'September nexus calculation pending: Texas sales passed the $500k threshold in August','01-Oct']] },
      'TDS return (24Q/26Q)':{ cut:'29-Oct', law:'Late fee ₹200 a day until filed, capped at the TDS amount (Income-tax Act s.234E), and a penalty of ₹10,000 to ₹1 L (s.271H)', rows:[
        ['IN-01 24Q and 26Q',1,'Both returns validated 03-Oct'],['IN-06 24Q and 26Q',1,'Both returns validated 04-Oct'],
        ['IN-02 24Q and 26Q',0,'26Q: 2 deductee PANs unverified; 24Q waits for the payroll-to-challan reconciliation','01-Oct'],
        ['IN-03 24Q and 26Q',0,'26Q: 4 PANs unverified, and the 20% shortfall on 11 inoperative PANs to deposit first (CMP-VMD-18); 24Q waits for payroll','01-Oct'],
        ['IN-04 24Q and 26Q',0,'26Q: 2 PANs unverified; 24Q waits for payroll','01-Oct'],['IN-05 24Q and 26Q',0,'26Q: 2 PANs unverified; 24Q waits for payroll','01-Oct'],
        ['IN-07 24Q and 26Q',0,'26Q: 1 PAN unverified; 24Q waits for payroll','01-Oct'],['IN-08 24Q and 26Q',0,'26Q: 1 PAN unverified; 24Q waits for payroll','01-Oct']] } },
    prep:{'IN-01':'Ritu Sharma','IN-02':'Kiran Rao','IN-03':'Deepak Menon','IN-04':'Harish Patel','IN-05':'Ankit Shah','IN-06':'Nisha Kapoor','IN-07':'Arjun Rao','IN-08':'Lata Krishnan','US-01':'Tom Brennan'},
    next:[ ['TDS payment','07-Oct',8,8,'Rahul Verma',''], ['GSTR-1','11-Oct',8,6,'Meera Joshi','IN-02 and IN-04: September IRNs still pending for dispatches confirmed late'], ['PF','15-Oct',8,8,'Neha Pillai',''], ['ESI','15-Oct',8,7,'Neha Pillai','IN-05: contractor has not confirmed September contract-labour headcount'],
           ['GSTR-3B','20-Oct',8,3,'Meera Joshi','Input-tax credit reconciliation for September open at 5 entities'], ['US sales tax','20-Oct',2,1,'Tom Brennan','Texas: nexus calculation for September pending'], ['TDS return (24Q/26Q)','31-Oct',16,4,'Rahul Verma','12 deductee PANs unverified at 6 entities; salary returns wait for the payroll reconciliation'] ] };
  C.fil = { due:C.D.filings.due.reduce((t,x)=> t+x[1], 0), on:C.D.filings.due.reduce((t,x)=> t+x[2], 0) };
  C.fil.late = C.fil.due - C.fil.on; C.fil.rate = C.fil.on/C.fil.due*100;
  C.fil.next = C.D.filings.next.reduce((t,x)=> t+x[2], 0); C.fil.notReady = C.D.filings.next.reduce((t,x)=> t+x[2]-x[3], 0);
  C.lateAt = (e)=> C.D.filings.late.filter(x=> x[3]===e);
  C.lateRows = (list, noEnt)=> ({ cols:['Filing','Period'].concat(noEnt? [] : ['Entity'], ['Due','Filed','Why late','Consequence','Days late']), rows:list.map(x=> [html`${x[1]}<div class="sub">${x[0]}</div>`, x[2]].concat(noEnt? [] : [x[3]], [x[4], x[5], x[8], x[7], x[6]])),
    note:'Each consequence is for that filing alone. Late filings are already made; the control tracks the on-time rate.' });
  /* why each anomaly 80+ was flagged, and the reviewer / due date for those without a case */
  C.D.anmWhy = { 'ANM-2026-0871':'Same IRN, PO, GRN, amount and bank account booked under two vendor codes for one supplier (V-100482, V-207115); the invoice numbers differ only in format.',
    'ANM-2026-0912':'The vendor’s bank account number is the same as the salary account of an employee at IN-05.',
    'ANM-2026-0908':'A ₹2.40 Cr round-sum manual journal to revenue, posted on the last day of the period, with no supporting document.',
    'ANM-2026-0905':'23 write-offs of ₹4.6–4.9 L posted by dc.sup04 at IN-08 between 05-Sep and 28-Sep, 19 on Saturdays, each just under the ₹5 L limit.',
    'ANM-2026-0889':'Two payments of ₹1.4 L to vendor PX-26212 on 17-Sep and 21-Sep (PR-20260917, PR-20260921) against invoice references INV-4471 and INV/4471, both approved by apclerk.in05.',
    'ANM-2026-0893':'Journal JE-IN07-0927-4410 of ₹92 L (accrual reclass) was posted and approved by the same user, rkapoor.in07, on 27-Sep at 21:14. Not yet in Access conflicts: it is reviewed here first, and becomes a used conflict if the journal is unsupported.',
    'ANM-2026-0886':'Maple Supply LLP’s credit limit was raised from ₹42 Cr to ₹57 Cr by tbrown.us01 on 12-Sep, the largest of the six US-01 overrides, with no second approval on a Critical-risk customer.',
    'ANM-2026-0901':'Three POs of ₹9.8 L each to Bharat Electricals, raised on the same day; each was under the L1 limit, but together they needed L2 approval.',
    'ANM-2026-0897':'pnair.in03 created vendor V-310992 on 14-Sep and approved the ₹18.7 L payment to it on 22-Sep.',
    'ANM-2026-0884':'Inventory adjustment MI-26-0920-118 of ₹31 L posted by inv.in02.03 on Sunday 20-Sep at 22:05; this account has no other weekend postings in 12 months.',
    'ANM-2026-0879':'Invoice INV-26-190373 (₹3.1 L) was paid on 14-Sep; its goods receipt was posted on 23-Sep by st.in08.04, nine days after payment.' };
  C.D.anmNext = { 'ANM-2026-0889':'Vikram Shah (AP lead) by 07-Oct: confirm with PX-26212 whether INV-4471 was billed twice; if so, recover by debit note and open a duplicate-payment case.',
    'ANM-2026-0893':'Arjun Rao (GL & close lead) by 08-Oct: obtain support for JE-IN07-0927-4410 and remove self-approval for rkapoor.in07; open a case if unsupported.',
    'ANM-2026-0886':'Tom Brennan (US-01 controller) by 08-Oct: confirm who approved the limit increase; part of finding F-2026-046.',
    'ANM-2026-0884':'Farhan Qureshi (plant controller) by 08-Oct: match MI-26-0920-118 to a QA or count document; open a case if none.',
    'ANM-2026-0879':'Vikram Shah (AP lead) by 09-Oct: confirm the goods arrived before payment and why the receipt was late.' };
  /* people and root causes come from the shared records */
  C.who = (id)=> (((window.FCT_DATA || {}).users || []).find(u=> u.id===id) || {}).name || id || '—';
  C.rcOf = (id)=> ((FCT.ex && FCT.ex(id)) || {}).rootCause || '';
  /* each evidence pack: who asked and why, what is in it (on file or not), what blocks it, owner and due */
  C.D.packInfo = {
    'EVP-RTR-019':{ req:'Statutory auditor, request AR-26-022 of 15-Jul', why:'Tests that every balance-sheet account reconciliation for Q1 FY27 was prepared and signed by a reviewer (CTL-R2R-030).',
      items:[['1,040 Q1 account reconciliations with preparer and reviewer sign-off','On file'],['Reviewer list and delegation for Q1','On file']], blocker:'', owner:'Arjun Rao', due:'Sent 12-Aug' },
    'EVP-CTL-P2P-014':{ req:'Statutory auditor, request AR-26-031 of 28-Sep (limited review 12-Oct)', why:'Tests CTL-P2P-014 at IN-05: that every invoice force-matched above the ±2% price tolerance had a second approval.',
      items:[['14 Q2 force-matched invoices with PO and goods receipt (8 in Sep, 6 in Jul–Aug)','On file'],['Second approval for each of the 14 overrides','Missing: none was given (tolerance widened to ±5% on 01-Sep)'],
        ['Configuration log CFG-26-0901-14: tolerance ±2% → ±5% by sys.admin02','On file'],['Decision on CMP-CTL-02 and the restored ±2% setting','Missing: case not yet decided']],
      blocker:'CMP-CTL-02 is undecided. The 14 approvals do not exist, so the pack documents the exception and its fix rather than clearing it.', owner:'Vikram Shah', due:'09-Oct' },
    'EVP-PTP-BNK-05':{ req:'Statutory auditor, request AR-26-033 of 04-Oct', why:'Tests CTL-P2P-009 on the Apex Chem bank-detail change: that a call-back was made before the change was decided.',
      items:[['Change request e-mail of 03-Oct 16:42 (HDFC ****4471 → Emirates NBD ****0932)','On file'],['Risk score 91 and the warning signs','On file'],['Hold of ₹1.12 Cr in PR-20261006','On file'],
        ['Call-back log to +91 265 xxx 4410','Missing (CMP-EVD-05)'],['Decision record on PTP-BNK-05','Missing: case not yet decided']],
      blocker:'Manish Gupta has not made the call-back, and PTP-BNK-05 is undecided.', owner:'Manish Gupta', due:'09-Oct' },
    'EVP-2026-044':{ req:'Internal audit, request IA-REQ-044 of 26-Sep', why:'Vendor-payment test: 125 payments of Jul–Sep at IN-02, IN-03 and IN-04, each with invoice, PO, goods receipt and payment advice.',
      items:[['IN-02: 48 payments','On file, 48 of 48'],['IN-03: 45 payments','19 missing: goods-receipt scans not uploaded'],['IN-04: 32 payments','8 missing: payment advices not attached']],
      blocker:'27 of 125 sets are incomplete: 19 at IN-03 (goods-receipt scans) and 8 at IN-04 (payment advices).', owner:'Vikram Shah', due:'09-Oct' } };
  /* contract compliance, Q2 FY27 (Jul-Sep), demo data. Contracts matter here only as the authority for a payment or commitment;
     the contract register itself stays with Legal / Procurement. Amounts are per item, never added up.
     rpt.parties: [party, relationship, entity, nature, approval ref, approval date, limit Cr FY27, used Cr FY27 to date (Apr-Sep), status, case]
     exp.vendors: [vendor, entity, contract, expired, owner, why, case, payments [[date, payment run, amount L]]]
     doa.ex:      [contract, what, counterparty, entity, value Cr, signed on, signed by, signatory limit Cr, required approver, case] */
  C.D.contracts = {
    rpt:{ tx:214, parties:[
      ['Specialty Polymers Pvt Ltd','Promoter-group company','IN-05','Purchase of polymer additives','AC/2026/14','22-Apr-2026',40,21.6,'Within approval',''],
      ['Kirti Logistics LLP','Partner is a relative of director R. Shah','IN-02, IN-04','Freight services','AC/2026/14','22-Apr-2026',12,7.9,'Within approval',''],
      ['SP Agro Ltd','Director A. Iyer holds 12% with relatives','IN-06','Sale of nutrition premixes','AC/2026/14','22-Apr-2026',25,23.4,'94% of limit used',''],
      ['Group Research Trust','Controlled by KMP (managing trustee)','IN-07','Research grant','AC/2026/14','22-Apr-2026',3,1.2,'Within approval',''],
      ['Arvind Mehta','Relative of the Managing Director','IN-01','Office lease, Mumbai','BR/2025/31','12-Mar-2025',0.96,0.48,'Within approval',''],
      ['Nova Packaging Pvt Ltd','Related from 18-Aug: director’s spouse acquired 26%','IN-03','Purchase of corrugated shipper boxes','None','—',0,1.36,'Not approved: ratify by 17-Nov','CMP-RPT-15'] ],
      nova:[['21-Aug','4500188020','₹38.0 L','Paid 20-Sep'],['04-Sep','4500188144','₹31.5 L','Paid 30-Sep'],['17-Sep','4500188251','₹36.2 L','Goods received, not paid'],['29-Sep','4500188377','₹30.3 L','Open, not delivered']] },
    exp:{ paid:3412, vendors:[
      ['Bharat Electricals','IN-03','MSA-IN03-0712','30-Jun','Procurement IN-03, K. Pillai','Renewal draft with Legal since 12-Jun; vendor kept on active list','CMP-CON-16',[['08-Jul','PR-20260708','₹5.2 L'],['15-Jul','PR-20260715','₹4.8 L'],['29-Jul','PR-20260729','₹6.1 L'],['05-Aug','PR-20260805','₹4.4 L'],['19-Aug','PR-20260819','₹5.9 L'],['26-Aug','PR-20260826','₹3.7 L'],['09-Sep','PR-20260909','₹5.5 L'],['16-Sep','PR-20260916','₹6.0 L'],['30-Sep','PR-20260930','₹4.7 L']],'Electrical spares and motor rewinding','Billed at the vendor’s proposed new rates, 6% above the expired MSA'],
      ['Shree Packaging Industries','IN-04','RC-IN04-0441','31-Jul','Procurement IN-04, D. Rao','Rate contract expired; new tender not concluded','CMP-CON-16',[['05-Aug','PR-20260805','₹3.6 L'],['19-Aug','PR-20260819','₹4.1 L'],['26-Aug','PR-20260826','₹3.2 L'],['09-Sep','PR-20260909','₹4.4 L'],['23-Sep','PR-20260923','₹3.9 L'],['30-Sep','PR-20260930','₹3.6 L']],'Corrugated cartons','Billed at the expired contract rates; no new rates agreed'],
      ['Chetak Logistics','IN-08','RC-IN08-0219','15-Aug','Logistics IN-08, P. Das','Extension letter requested on 10-Aug, not signed','CMP-CON-16',[['26-Aug','PR-20260826','₹3.1 L'],['02-Sep','PR-20260902','₹3.8 L'],['09-Sep','PR-20260909','₹3.3 L'],['16-Sep','PR-20260916','₹3.6 L'],['30-Sep','PR-20260930','₹3.6 L']],'Outbound freight, IN-08 plant to depots','Billed at the expired rates plus a 4% fuel surcharge the contract does not allow'],
      ['Vertex Lab Supplies','IN-07','No contract','—','Lab operations IN-07, S. Nair','Spot buys above the ₹10 L contract threshold','CMP-CON-16',[['14-Jul','PR-20260714','₹4.6 L'],['18-Aug','PR-20260818','₹5.2 L'],['22-Sep','PR-20260922','₹4.3 L']],'Lab reagents and consumables','No agreed rates; each buy approved by S. Nair on a single quote'] ] },
    doa:{ signed:120, ex:[
      ['SVC-IN05-2207','Annual maintenance of reactors, 3 years','Precision Engineering Works','IN-05',2.4,'12-Aug','vkapoor.in05, plant head IN-05',1,'CFO','CMP-DOA-17',[['16-Sep','PR-20260916','₹20.0 L','Q1 service fee']],'Signed on paper against the PDF DoA matrix and judged on its annual amount (₹0.8 Cr) instead of the ₹2.4 Cr full term, so it looked within the plant head’s ₹1 Cr limit'],
      ['LSE-IN02-0091','Warehouse lease, 3 years','Ganesh Estates','IN-02',1.8,'03-Sep','rjoshi.in02, GM administration IN-02',0.5,'CFO and Board, per DoA matrix','CMP-DOA-17',[['09-Sep','PR-20260909','₹15.0 L','Security deposit'],['30-Sep','PR-20260930','₹5.0 L','September rent']],'Drafted by IN-02 administration and sent straight to the GM for signature; it never went to finance for a value check against the DoA matrix'] ] } };
  C.con = { expN:C.D.contracts.exp.vendors.reduce((t,v)=> t+v[7].length, 0) };
  C.con.expRate = (C.D.contracts.exp.paid-C.con.expN)/C.D.contracts.exp.paid*100; C.con.doaRate = (C.D.contracts.doa.signed-C.D.contracts.doa.ex.length)/C.D.contracts.doa.signed*100;
  C.fixDetail = (id)=>{ const a = C.D.fixes[id] || [], open = a.filter(x=> !x[3]), worst = a.slice().sort((p,q)=> q[4]-p[4])[0];
    return [['Still open', open.length+' of '+a.length], ['Most late', worst? worst[4]+' days' : '—']]; };

  /* ---------- shared building blocks (P2P classes) ---------- */
  C.Pill = ({ tone, children })=> html`<span class=${'px-pill t-'+(tone||'n')}>${children}</span>`;
  C.AI = ({ children })=> children? html`<p class="px-ai"><i>${children}</i></p>` : null;
  C.Foot = ({ items })=> html`<dl class="px-rc-f">${items.map(([l,v,t],i)=> html`<div key=${i}><dt>${l}</dt><dd class=${t||''}>${v}</dd></div>`)}</dl>`;
  C.Sec = ({ c, icon, title, sub, right, children })=> html`<section class=${'px-sec s-'+c} aria-label=${title}>
    <div class="px-sec-h"><span class="px-sec-ic" aria-hidden="true"><${Icon} n=${icon} size=${20} strokeWidth=${1.7}/></span><div class="px-sec-t"><h2>${title}</h2>${sub && html`<p>${sub}</p>`}</div>${right && html`<div class="px-sec-r">${right}</div>`}</div>${children}</section>`;
  /* KPI definitions: every KPI card opens its own detail (formula, inputs, breakdown) and each breakdown row drills one level further */
  const byEnt = (j, fmt)=> Object.keys(C.D.ent).map(e=> ({ key:e, label:e+' '+C.D.entName[e], val:C.D.ent[e][j]||0, sub:C.D.focus.includes(e)? 'Focus entity' : '' })).filter(r=> r.val).sort((a,b)=> b.val-a.val);
  const byProc = (f)=> C.D.procs.map(p=> Object.assign({ key:p.p, label:p.p }, f(p)));
  C.DEF = {
    'Failing controls':{ f:'Controls whose latest test failed. A control fails when its KPI is off target, or on any single exception for fraud-type controls.',
      inputs:[['Controls in the library','412'],['Failing','16'],['From P2P live tests','10'],['From other processes (baseline)','6']], why:'Each failing control is a weak spot the auditor will test again on 12-Oct.',
      by:{ title:'Failing controls by worst entity', kind:'Entity', rows:()=> byEnt(2), fmt:(v)=> pl(v,'control') } },
    'Key-control effectiveness':{ f:'Key controls that passed their latest test ÷ all key controls.', inputs:[['Key controls','138'],['Passing','124'],['Failing','14'],['Warn below','98%']],
      why:'The auditor relies on key controls; a failing one widens the sample or becomes a finding.',
      by:{ title:'Failing key controls by process', kind:'Process', rows:()=> byProc(p=> ({ val:{P2P:8,O2C:1,R2R:3,'Supply chain':1,Compliance:1}[p.p], sub:p.key+' key controls' })), fmt:(v)=> v+' failing' } },
    'Automation':{ f:'Automated controls ÷ all controls in the library.', inputs:[['Automated','251'],['Manual','161'],['Library','412']], why:'Automated controls test every transaction; manual ones depend on samples and sign-offs.',
      by:{ title:'Automation rate by process', kind:'Process', rows:()=> byProc(p=> ({ val:+(p.auto/p.total*100).toFixed(1), sub:p.auto+' of '+p.total })), fmt:(v)=> FCT.pct(v,1), max:100 } },
    'Policy compliance':{ f:'Checks without a policy violation ÷ all checks, Sep-26, all towers (DoA, PO before spend, contract price).',
      inputs:[['Checks, all towers','56,484'],['Violations','2,863'],['Rate','94.93%'],['P2P (live)','2,268 of 36,384 = 93.77%'],['O2C, R2R, Supply chain (baseline)','595 of 20,100'],['Warn below','97%']], why:'Policy breaches are the first thing the auditor samples.',
      by:{ title:'P2P violations by rule, Sep-26 (live)', kind:'Rule', rows:()=> [{ key:'npo', label:'No PO where one is required', val:928, sub:'of 13,652 invoices' },{ key:'apr', label:'DoA approval missing or late', val:503, sub:'of 13,972 PO lines' },
        { key:'ct', label:'Price above contract', val:453, sub:'of 8,760 contracted lines' },{ key:'retro', label:'PO raised after the invoice', val:384, sub:'of 12,969 PO invoices' }], fmt:(v)=> FCT.n(v)+' violations' } },
    'Cases with money involved':{ f:'Open high and critical cases where money was paid, posted or is short. Counted, never summed.',
      inputs:[['Open cases','8'],['Critical','5'],['High','3'],['Largest single case','RTR-JNL-02, ₹2.40 Cr']], why:'Each case is a place where a risk may already have cost money; it stays open until it is decided.',
      by:{ title:'Cases by entity', kind:'Entity', rows:()=> rowsOf(tally(C.D.cases, c=> c[2])).map(r=> Object.assign(r, { label:r.key+' '+C.D.entName[r.key], sub:C.caseSub(c=> c[2]===r.key), detail:C.caseParts(c=> c[2]===r.key) })), fmt:(v)=> v+' case'+(v===1? '' : 's') } },
    'Regulatory filings':{ f:'Statutory filings made by the due date ÷ filings due, Q2 FY27 (Jul–Sep). Control CTL-CMP-018; target 95%.',
      get inputs(){ return [['Filings due',FCT.n(C.fil.due)],['Filed on time',FCT.n(C.fil.on)],['Filed late',FCT.n(C.fil.late)],['On-time rate',FCT.pct(C.fil.rate,2)],['Due next 30 days',FCT.n(C.fil.next)]]; }, why:'A late filing brings fees or interest and is a statutory breach the auditor reports.',
      by:{ title:'Late filings by type, Q2 FY27', kind:'Return', rows:()=> C.D.filings.due.filter(x=> x[1]>x[2]).map(x=> ({ key:x[0], label:x[0], val:x[1]-x[2], sub:x[2]+' of '+x[1]+' on time · '+x[3] })).sort((a,b)=> b.val-a.val), fmt:(v)=> pl(v,'late filing') } },
    'Related-party transactions':{ f:'FY27 transactions with related parties (Ind AS 24), Apr–Sep, inside an Audit Committee or Board approval and its limit (Companies Act s.188, LODR Reg 23). Control CTL-CMP-021.',
      get inputs(){ const R = C.D.contracts.rpt; return [['Related parties','6'],['Transactions Apr–Sep',FCT.n(R.tx)],['Without approval','4 (Nova Packaging, ratify by 17-Nov)'],['Party near its limit','SP Agro Ltd, 94% used']]; },
      why:'The auditor reports related-party compliance under CARO clause (xiii), and an unapproved related-party deal is a classic fraud signal.',
      by:{ title:'Related parties by approved limit used', kind:'Related party', rows:()=> C.D.contracts.rpt.parties.map(x=> ({ key:x[0], label:x[0], val:x[6]? +(x[7]/x[6]*100).toFixed(1) : 100, noLimit:!x[6], tone:x[6]? null : 'var(--px-crit)', sub:x[2]+' · '+(x[6]? x[4] : 'no approval') })).sort((a,b)=> b.val-a.val), fmt:(v,r)=> r && r.noLimit? 'No approval' : FCT.pct(v,0)+' used', max:100 } },
    'Payments against a valid contract':{ f:'Q2 FY27 payments to contracted vendors made while the contract was valid ÷ all such payments. Control CTL-P2P-040; target 99%.',
      get inputs(){ return [['Payments to contracted vendors',FCT.n(C.D.contracts.exp.paid)],['After expiry or with no contract',FCT.n(C.con.expN)],['Vendors involved','4'],['Rate',FCT.pct(C.con.expRate,2)]]; },
      why:'Paying without a valid contract leaves no agreed price or terms to enforce, and is a known leakage and fraud pattern.',
      by:{ title:'Payments without a valid contract, by vendor', kind:'Contract vendor', rows:()=> C.D.contracts.exp.vendors.map(v=> ({ key:v[0], label:v[0], val:v[7].length, sub:v[2]+(v[3]!=='—'? ' expired '+v[3] : '')+' · '+v[1] })).sort((a,b)=> b.val-a.val), fmt:(v)=> pl(v,'payment') } },
    'Contracts within delegation of authority':{ f:'Q2 FY27 contracts signed by someone whose authority covers the contract value ÷ contracts signed. Control CTL-P2P-041; target 98%.',
      get inputs(){ return [['Contracts signed',FCT.n(C.D.contracts.doa.signed)],['Above the signatory’s authority',String(C.D.contracts.doa.ex.length)],['Rate',FCT.pct(C.con.doaRate,2)]]; },
      why:'A contract signed above authority may not bind the company as intended, and the auditor samples this entity-level control.',
      by:{ title:'Contracts signed above authority', kind:'Contract', rows:()=> C.D.contracts.doa.ex.map(x=> ({ key:x[0], label:x[0]+' '+x[1], val:x[4], sub:x[3]+' · limit ₹'+FCT.n(x[7],1)+' Cr' })), fmt:(v)=> '₹'+FCT.n(v,1)+' Cr' } },
    'Anomalies to review':{ f:'Transactions the anomaly model scored 80 or more in September. Each is either in a case or waiting for a person to review it.', inputs:[['Flagged in Sep','47'],['Score 80+','11'],['Score 90+ (act today)','4'],['Already in a case','6'],['Awaiting review','5']],
      why:'A high score is not proof; each one needs a person to confirm or release it.', by:{ title:'Anomalies 80+ by entity', kind:'Entity', rows:()=> byEnt(10), fmt:(v)=> pl(v,'anomaly','anomalies') } },
    'Access conflicts':{ f:'Users holding two rights that should be split. A used conflict costs 4 health points, an unused one 1 point.', inputs:[['Open','3'],['Used in a transaction','1'],['Points lost','6.0 of 20']],
      why:'A used conflict is an actual control failure, not a risk.', by:{ title:'Access conflicts by entity', kind:'Entity', rows:()=> byEnt(11), fmt:(v)=> v+' conflict'+(v===1? '' : 's') } },
    'Sanctions screening':{ f:'Parties screened against sanctions lists (vendors and customers), and matches found.', inputs:[['Parties screened','570'],['Vendors (P2P, live)','150'],['Customers (O2C, baseline)','420'],['Matches','0']], why:'One match would stop payments to that vendor or sales to that customer.',
      by:{ title:'Vendors screened by home entity (0 matches each)', kind:'Entity', rows:()=> [['IN-02',26],['IN-05',24],['IN-03',23],['IN-04',18],['IN-01',14],['IN-07',13],['IN-08',13],['US-01',8],['IN-06',6],['EU-01',3]].map(([e,n])=> ({ key:e, label:e+' '+C.D.entName[e], val:n, sub:'0 matches' })).concat([{ key:'onb', label:'Onboarding (not yet active)', val:2, sub:'0 matches' }]), fmt:(v)=> pl(v,'vendor') } },
    'Open findings':{ f:'Audit findings not yet closed. Each overdue finding costs 1 health point and every other open finding 0.5.', inputs:[['Open','8'],['Overdue','4'],['Points lost','6.0 of 20']],
      why:'Overdue repeat findings are what the auditor asks about first.', by:{ title:'Open findings by process', kind:'Process', rows:()=> [['P2P',2],['R2R',2],['Supply chain',2],['O2C',1],['Compliance',1]].map(([p,n])=> ({ key:p, label:p, val:n })), fmt:(v)=> pl(v,'finding') } },
    'Oldest overdue':{ f:'Days since the due date of the oldest open finding.', inputs:[['Finding','F-2026-031'],['Due','25-Aug'],['Days overdue','41']], why:'A repeat finding this late signals the fix has not worked.',
      by:{ title:'Overdue findings by days', kind:'Finding', rows:()=> C.D.findings.filter(f=> f[5]>0).map(f=> ({ key:f[0], label:f[0]+' '+f[1], val:f[5], sub:f[2] })), fmt:(v)=> v+' days' } },
    'Fixes on time':{ f:'Fix actions closed by their due date ÷ fix actions due, Q2 FY27 (Jul–Sep).', inputs:[['Due','150'],['On time','138'],['Late','12'],['Area points','18.4 of 20']], why:'Shows whether management meets its commitments to the auditor.',
      by:{ title:'Late fix actions by finding, Q2 FY27', kind:'Finding', rows:()=> C.D.findings.filter(x=> x[5]>0).map(x=> ({ key:x[0], label:x[0]+' '+x[1], detail:C.fixDetail(x[0]), val:3, sub:x[5]+' days overdue · '+x[2] })), fmt:(v)=> pl(v,'late action') } },
    'Repeat findings':{ f:'Open findings that were raised in an earlier audit.', inputs:[['Repeat','5'],['Open','8']], why:'Repeats tell the auditor a fix did not work.',
      by:{ title:'Repeat findings by theme', kind:'Theme', rows:()=> [['Evidence',3],['Access (SoD)',1],['Approval',1]].map(([t,n])=> ({ key:t, label:t, val:n })), fmt:(v)=> pl(v,'finding') } },
    'Evidence on file':{ f:'Items on file ÷ items the auditor will request (key controls × 40 samples).',
      inputs:[['Required','5,481'],['On file','5,439'],['Missing','42'],['Target','99%']], why:'A missing document fails the sample even when the control worked.',
      by:{ title:'Missing items by area', kind:'Area', rows:()=> C.D.evAreas.map(([a,req,on])=> ({ key:a, label:a, val:req-on, sub:FCT.pct(on/req*100,2)+' on file' })).sort((a,b)=> b.val-a.val), fmt:(v)=> v+' missing' } },
    'Attestations signed':{ f:'(Attestations required − outstanding) ÷ required, Q2 FY27.', inputs:[['Required','120'],['Signed','114'],['Outstanding','6']], why:'The auditor needs the owner\'s sign-off before relying on a control.',
      by:{ title:'Outstanding attestations by days overdue', kind:'Control', rows:()=> C.D.attest.map(a=> ({ key:a[0], label:a[0]+' '+a[1], val:a[3], sub:a[2] })), fmt:(v)=> v+' d overdue' } },
    'Evidence packs ready':{ f:'Packs whose case is decided, or that were submitted.', inputs:[['Packs','4'],['Ready','1'],['Pending','3']], why:'Each pack answers a request the auditor already made.',
      by:{ title:'Packs by status', kind:'Pack', rows:()=> C.D.packs.map(p=> ({ key:p[0], label:p[0]+' '+p[1], val:p[4]==='Ready'? 1 : 0.02, sub:p[4]+(p[5]? ' · case '+p[5] : '') })), fmt:(v)=> v>=1? 'Ready' : 'Pending' } },
    'Ready for the auditor?':{ f:'Five yes/no checks: evidence ≥ 99%, every owner signed, review-scope evidence on file, every pack ready, health ≥ 90.', inputs:[['Passed','1 of 5'],['Review','12-Oct-2026']], by:{ title:'The five checks', kind:'Check', rows:()=> C.D.checks.map(([l,ok,v])=> ({ key:l, label:l, val:ok? 1 : 0.03, sub:(ok? 'Passed: ' : 'Open: ')+v })), fmt:(v)=> v>=1? 'Passed' : 'Open' },
      why:'One answer to "can we prove it?" before the review.' }
  };
  const rowsOf = (o, sub)=> Object.entries(o).map(([k,v])=> ({ key:k, label:k, val:v, sub:sub? sub(k) : '' })).sort((a,b)=> b.val-a.val);
  const tally = (arr, f)=> arr.reduce((m,x)=>{ const k = f(x); m[k] = (m[k]||0)+1; return m; }, {});
  const A = (key, alt)=>{ C.DEF[key].alt = alt; };
  A('Failing controls', [
    { title:'Failing controls by process', kind:'Process', rows:()=> rowsOf(tally(C.D.failing, x=> x[3])), fmt:(v)=> pl(v,'control') },
    { title:'Failing controls by severity', kind:'Severity', rows:()=> rowsOf(tally(C.D.failing, x=> x[4])), fmt:(v)=> pl(v,'control') },
    { title:'Failing controls: key or non-key', kind:'Criticality', rows:()=> rowsOf(tally(C.D.failing, x=> x[7]? 'Key' : 'Non-key')), fmt:(v)=> pl(v,'control') } ]);
  A('Policy compliance', [ { title:'Policy compliance by tower, Sep-26', kind:'Tower policy', rows:()=> C.D.policyTowers.map(([t,n,v])=> ({ key:t, label:t, val:+((n-v)/n*100).toFixed(2), sub:FCT.n(v)+' violations in '+FCT.n(n)+' checks'+(t==='P2P'? ' (live)' : ' (baseline)') })).sort((a,b)=> a.val-b.val), fmt:(v)=> FCT.pct(v,2), max:100 } ]);
  A('Sanctions screening', [ { title:'Parties screened by type', kind:'Party', rows:()=> [{ key:'v', label:'Vendors (P2P vendor master)', val:150, sub:'0 matches' }, { key:'c', label:'Customers (O2C customer master, baseline)', val:420, sub:'0 matches' }], fmt:(v)=> v+' screened' } ]);
  A('Cases with money involved', [
    { title:'Cases by tower', kind:'Tower', rows:()=> rowsOf(tally(C.D.cases, c=> c[3])).map(r=> Object.assign(r, { sub:C.caseSub(c=> c[3]===r.key), detail:C.caseParts(c=> c[3]===r.key) })), fmt:(v)=> v+' case'+(v===1? '' : 's') },
    { title:'Cases by severity', kind:'Case severity', rows:()=> rowsOf(tally(C.D.cases, c=> c[5])).map(r=> Object.assign(r, { sub:C.caseSub(c=> c[5]===r.key), detail:C.caseParts(c=> c[5]===r.key) })), fmt:(v)=> v+' case'+(v===1? '' : 's') } ]);
  A('Regulatory filings', [
    { title:'Late filings by entity, Q2 FY27', kind:'Entity', rows:()=> rowsOf(tally(C.D.filings.late, x=> x[3])).map(r=> Object.assign(r, { label:r.key+' '+C.D.entName[r.key] })), fmt:(v)=> pl(v,'late filing') },
    { title:'Filings on time or late, Q2 FY27', kind:'Filing status', rows:()=> [{ key:'on', label:'On time', val:C.fil.on }, { key:'late', label:'Late', val:C.fil.late }], fmt:(v)=> pl(v,'filing') },
    { title:'Filings due in the next 30 days', kind:'Due return', rows:()=> C.D.filings.next.map(x=> ({ key:x[0], label:x[0]+' · due '+x[1], val:x[2], sub:x[3]+' of '+x[2]+' ready · '+x[4] })), fmt:(v)=> pl(v,'filing') } ]);
  A('Payments against a valid contract', [ { title:'Payments without a valid contract, by entity', kind:'Entity', rows:()=> rowsOf(C.D.contracts.exp.vendors.reduce((m,v)=> (m[v[1]] = (m[v[1]]||0)+v[7].length, m), {})).map(r=> Object.assign(r, { label:r.key+' '+C.D.entName[r.key] })), fmt:(v)=> pl(v,'payment') } ]);
  A('Anomalies to review', [
    { title:'Anomalies 80+ by score band', kind:'Band', rows:()=> [{ key:'90', label:'90–100: act today', val:4 }, { key:'80', label:'80–89: a person reviews', val:7 }], fmt:(v)=> pl(v,'anomaly','anomalies') },
    { title:'Anomalies 80+ by source', kind:'Source', rows:()=> rowsOf(tally(C.D.anomalies, a=> a[6])), fmt:(v)=> pl(v,'anomaly','anomalies') } ]);
  A('Access conflicts', [
    { title:'Access conflicts by process', kind:'Process', rows:()=> rowsOf(tally(C.D.sod, s=> s[5])), fmt:(v)=> v+' conflict'+(v===1? '' : 's') },
    { title:'Access conflicts: used or not', kind:'Usage', rows:()=> rowsOf(tally(C.D.sod, s=> s[4]? 'Used' : 'Not used')), fmt:(v)=> v+' conflict'+(v===1? '' : 's') } ]);
  A('Open findings', [
    { title:'Open findings by status', kind:'Status', rows:()=> rowsOf(tally(C.D.findings, f=> f[5]>0? 'Overdue' : 'In progress')), fmt:(v)=> pl(v,'finding') },
    { title:'Open findings by source', kind:'Source', rows:()=> rowsOf(tally(C.D.findings, f=> f[2])), fmt:(v)=> pl(v,'finding') },
    { title:'Open findings by theme', kind:'Theme', rows:()=> rowsOf(tally(C.D.findings, f=> f[7])), fmt:(v)=> pl(v,'finding') } ]);
  A('Repeat findings', [ { title:'Repeat findings by process', kind:'Process', rows:()=> rowsOf(tally(C.D.findings.filter(f=> f[6]), f=> f[3])), fmt:(v)=> pl(v,'finding') } ]);
  A('Evidence on file', [ { title:'Missing items by owner', kind:'Owner', rows:()=> rowsOf(Object.values(C.D.evDetail).flat().reduce((m,x)=> (m[x[2]] = (m[x[2]]||0)+x[1], m), {})), fmt:(v)=> v+' missing' } ]);
  A('Attestations signed', [ { title:'Outstanding attestations by process', kind:'Process', rows:()=> rowsOf(tally(C.D.attest, a=> a[0].split('-')[1].replace('SC','Supply chain'))), fmt:(v)=> v+' outstanding' } ]);
  C.RCard = ({ k, title, icon, basis, value, tone, chip, viz, note, foot, pick })=>{ if(!pick && C.DEF[title]) pick = ()=> C._open && C._open({ kind:'KPI', label:title, def:C.DEF[title], value, k });
    return html`<section class=${cx('px-kc px-rc px-rc3', k)} onClick=${pick} aria-label=${title}>
    <div class="px-rc-h"><button type="button" class="px-kc-t" onClick=${(e)=>{ e.stopPropagation(); pick && pick(); }}><span class="px-kc-i"><${Icon} n=${icon} size=${15} strokeWidth=${1.6}/></span><span>${title}</span></button><span class="px-basis">${basis}</span></div>
    <div class="px-rc-v"><span class=${cx('v num', tone)}>${value}</span>${chip}</div><div class="px-rc-viz">${viz}</div><${C.AI}>${note}</${C.AI}><${C.Foot} items=${foot}/></section>`; };
  /* granular baseline used by the drill-downs (03-cmp-data §3.3, data/cmp.js evidence and attestations) */
  Object.assign(C.D, {
    checks:[['Evidence on file at 99% or more', true, '99.23%, 42 items missing'], ['Every control owner has signed off', false, '6 attestations outstanding'],
      ['Evidence in the review scope is on file', false, 'Apex call-back log missing (CTL-P2P-009)'], ['Evidence packs ready', false, '1 of 4 ready'], ['Compliance health at 90 or more', false, '85.5']],
    byEnt:{ 'CTL-P2P-001':[96.46,95.96,96.42,96.89,95.82,96.67], 'CTL-P2P-020':[95.22,93.29,93.31,96.51,90.24,91.97], 'CTL-P2P-017':[88.90,90.68,98.94,97.74,98.73,97.04], 'CTL-P2P-022':[96.66,97.30,96.69,97.27,96.99,97.15] },
    evDetail:{ 'Procure to pay':[['Bank-change call-back log, Apex Chem (CTL-P2P-009)',1,'Manish Gupta']], 'Order to cash':[['Credit-limit approval e-mails (CTL-O2C-011)',6,'Tom Brennan']],
      'Record to report':[['Journal supports (CTL-R2R-021)',11,'Arjun Rao'],['Reconciliation sign-offs',7,'Arjun Rao']], 'Supply chain':[['Stock-count sheets with independent counter sign-off (CTL-SC-006)',15,'Vivek Menon']],
      'IT general controls':[['Quarterly user-access review sign-offs',2,'Sameer Khan']] }
  });
  /* control pass rate by tower and entity: P2P = live September tests (03 §3.2); O2C, R2R, Supply chain, Compliance = baseline control-test heat map
     (data/r2r.js controlHeat; R2R IN-08 97 for suspense ageing). Re-validate O2C/R2R rows when those towers' data is merged. */
  C.D.ents = ['IN-01','IN-02','IN-03','IN-04','IN-05','IN-06','IN-07','IN-08','US-01','EU-01'];
  C.D.heat = { 'P2P':[96.93,94.14,95.29,95.22,94.78,96.83,97.00,95.60,96.55,96.07], 'O2C':[100,100,98,100,100,100,100,99,98,100], 'R2R':[99,99,100,99,96,100,95,97,99,100],
    'Supply chain':[100,99,100,100,98,100,null,100,null,null], 'Compliance':[100,100,92,100,100,100,100,100,100,100] };
  C.D.heatSrc = { 'P2P':'live, Sep-26 transactions', 'O2C':'baseline', 'R2R':'baseline', 'Supply chain':'baseline', 'Compliance':'baseline' };
  C.D.policyTowers = [['P2P',36384,2268],['O2C',6200,186],['R2R',9800,245],['Supply chain',4100,164]];
  C.entTowers = (e)=>{ const i = C.D.ents.indexOf(e); return Object.keys(C.D.heat).map(k=> [k, C.D.heat[k][i]]); };
  /* every compliance figure for one entity, against the other entities. dir: 1 higher is better, -1 lower is better, 0 neutral */
  C.FIG = [['Controls and evidence', [[1,1],[2,-1],[9,1]]], ['Risk and audit', [[13,-1],[10,-1],[11,-1],[12,-1],[14,-1]]]];
  C.figFmt = (j,v)=> v==null? 'N/A' : j===0? '₹'+FCT.n(v,1)+' Cr' : j===14? (v? FCT.amt(v) : '—') : /%/.test(C.D.entCols[j])? pc(v,2) : FCT.n(v, v%1? 2 : 0);
  {
  /* one comparison of an entity with the others, used by every entity view (Entity profiles, control and KPI drills) */
    const fmtF = (j,v)=> v==null? 'N/A' : j===0? '₹'+FCT.n(v,1)+' Cr' : j===14? (v? FCT.amt(v) : '—') : /%/.test(C.D.entCols[j])? pc(v,2) : FCT.n(v, v%1? 2 : 0);
    const Strip = ({ x, j, dir })=>{ const E = Object.keys(C.D.ent).map(k=> ({ e:k, v:C.D.ent[k] })), pts = E.filter(y=> y.v[j]!=null), all = pts.map(y=> y.v[j]), v = x.v[j];
      const mn = Math.min(...all), mx = Math.max(...all), flip = dir<0;
      const at = (u)=>{ const t = mx===mn? 50 : (u-mn)/(mx-mn)*100; return flip? 100-t : t; };   /* left = worst, right = best */
      const med = all.slice().sort((a,b)=> a-b)[Math.floor(all.length/2)];
      const beat = v==null || !dir? 0 : all.filter(u=> dir>0? u>v : u<v).length;
      const col = v==null? 'var(--px-ink3)' : !dir? COL.brand2 : beat>=6? COL.crit : beat>=3? 'var(--px-medium)' : COL.pos;
      const say = v==null? 'Not measured here' : !dir? 'Median entity '+fmtF(j,med) : beat? beat+' of '+(all.length-1)+' entities do better' : 'Best or joint best of '+all.length;
      const lo = pts.filter(y=> y.v[j]===(flip? mx : mn)).map(y=> y.e), hi = pts.filter(y=> y.v[j]===(flip? mn : mx)).map(y=> y.e);
      const who = (l)=> l.length>2? l.length+' entities' : l.join(', ');
      return html`<div style=${{display:'grid', gap:'4px', padding:'8px 10px', borderRadius:'8px', border:'1px solid var(--card-line, var(--px-line))', background:'var(--well, transparent)'}} title=${C.D.entCols[j]+': '+fmtF(j,v)+'. '+say}>
        <div style=${{display:'flex', justifyContent:'space-between', gap:'8px', alignItems:'baseline'}}><span class="sub">${C.D.entCols[j]}</span><b class="num" style=${{color:col}}>${fmtF(j,v)}</b></div>
        <div style=${{position:'relative', height:'14px', margin:'0 6px'}} aria-hidden="true">
          <div style=${{position:'absolute', left:0, right:0, top:'6px', height:'2px', background:'var(--px-line)'}}/>
          ${pts.map(y=> y.e===x.e? null : html`<i key=${y.e} title=${y.e+' '+fmtF(j,y.v[j])} style=${{position:'absolute', left:'calc('+at(y.v[j])+'% - 3px)', top:'4px', width:'6px', height:'6px', borderRadius:'50%', background:'var(--px-lowc, var(--px-ink3))'}}/>`)}
          <i style=${{position:'absolute', left:'calc('+at(med)+'% - 1px)', top:'1px', width:'2px', height:'12px', background:'var(--px-ink2)'}}/>
          ${v!=null && html`<i style=${{position:'absolute', left:'calc('+at(v)+'% - 6px)', top:'1px', width:'12px', height:'12px', borderRadius:'50%', background:col, border:'2px solid var(--card, transparent)'}}/>`}</div>
        <div class="sub" style=${{display:'flex', justifyContent:'space-between', gap:'8px', fontSize:'11px'}}><span>${dir? 'Worst' : 'Lowest'}: ${fmtF(j, flip? mx : mn)} · ${who(lo)}</span><span style=${{textAlign:'right'}}>${dir? 'Best' : 'Highest'}: ${fmtF(j, flip? mn : mx)} · ${who(hi)}</span></div>
        <span class="sub">${say}</span></div>`; };
    C.EntFigures = ({ e })=>{ const x = { e, v:C.D.ent[e] };
      return html`${C.FIG.map(([g,fs])=> html`<div key=${g} style=${{marginBottom:'12px'}}><div class="sub" style=${{fontWeight:600, margin:'0 0 6px'}}>${g}</div>
        <div style=${{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(230px, 1fr))', gap:'8px'}}>${fs.map(([j,dir])=> html`<${Strip} key=${j} x=${x} j=${j} dir=${dir}/>`)}</div></div>`)}
        <div class="sub">Each line runs from the worst entity (left) to the best (right). Large dot: ${e}; small dots: the other entities; tick: the median entity. Red means most entities do better.</div>`; };
  }
  C.heatBg = (v)=> v==null? 'transparent' : v>=99? 'color-mix(in srgb, var(--px-pos) 22%, transparent)' : v>=97? 'color-mix(in srgb, var(--px-medium) 22%, transparent)' : v>=94? 'color-mix(in srgb, var(--px-high) 26%, transparent)' : 'color-mix(in srgb, var(--px-crit) 30%, transparent)';
  C.TowerHeat = ({ onEnt })=> html`<div class="px-tbl"><table class="t px-t dense"><thead><tr><th>Tower</th>${C.D.ents.map(e=> html`<th key=${e} class="r">${e}</th>`)}<th class="r">Control library</th></tr></thead>
    <tbody>${Object.keys(C.D.heat).map(k=>{ const p = C.D.procs.find(x=> x.p===k) || {}, tw = p.total? (p.total-p.failing)/p.total*100 : null;
      return html`<tr key=${k}><td>${k}<div class="sub">${C.D.heatSrc[k]}</div></td>${C.D.heat[k].map((v,i)=> html`<td key=${i} class="r num" title=${k+' at '+C.D.ents[i]} style=${{ background:C.heatBg(v), cursor:onEnt? 'pointer' : 'default' }} onClick=${()=> onEnt && onEnt(C.D.ents[i])}>${v==null? '—' : FCT.pct(v, v%1? 1 : 0)}</td>`)}<td class="r num"><b>${tw==null? '—' : FCT.pct(tw,1)}</b><div class="sub">${p.total-p.failing} of ${p.total}</div></td></tr>`; })}</tbody></table></div>
    <div class="px-seglg"><span><i style=${{background:'var(--px-pos)'}}/>99%+</span><span><i style=${{background:'var(--px-medium)'}}/>97–98.9%</span><span><i style=${{background:'var(--px-high)'}}/>94–96.9%</span><span><i style=${{background:'var(--px-crit)'}}/>below 94%</span><span class="faint">Entity cells: share of tests passed at that entity (P2P on live September transactions). Control library: controls passing ÷ controls in that tower's control library. — = tower not run at that entity.</span></div>`;
  const RULE = { npo:'CTL-P2P-020', apr:'CTL-P2P-001', ct:'CTL-P2P-017', retro:'CTL-P2P-022' };
  /* warn threshold per rule (demo values; DoA 96% is the stated one); re-set when the live P2P targets are wired */
  const RULE_T = { npo:95, apr:96, ct:95, retro:97 };
  /* kpi = the KPI the drill started from: the same breakdown kind (e.g. Process) lists different records per KPI */
  const ctlActs = (fl)=> fl.map(x=> ({ ref:x[0], link:C.LINKS[x[0]] && x[0], ent:x[2], decide:x[6] }));
  const fndActs = (fs)=> fs.map(f=> ({ ref:f[0], decide:f[8] }));
  const wrap = (t)=> html`<span style=${{whiteSpace:'normal'}}>${t}</span>`;
  const anmRows = (sel)=> ({ wide:true, cols:['Anomaly','Entity','Amount','Score','Why flagged'],
    rows:sel.map(a=> [a[0]+' '+a[1], a[2], FCT.amt(a[3]), a[4], wrap(html`${C.D.anmWhy[a[0]] || ''}${!a[5] && C.D.anmNext[a[0]]? html`<div class="sub">Next: ${C.D.anmNext[a[0]]}</div>` : ''}`)]),
    acts:sel.map(a=> ({ ref:a[0], decide:a[5] })) });
  const fndOwner = (f)=> C.who(((FCT.ex && FCT.ex(f[8])) || {}).owner);
  C.related = (kind, r, kpi)=>{ const D = C.D, k = r.key, inProc = (f)=> f[3]===k, st = (f)=> f[5]>0? f[5]+' d overdue' : 'In progress';
    if(kind==='Process' && kpi==='Key-control effectiveness'){ const fl = D.failing.filter(x=> x[3]===k && x[7]);
      return { wide:true, title:'Key controls failing in '+k+' ('+fl.length+')', cols:['Control','Entity','Test result','Fixed by'], rows:fl.map(x=> [x[0]+' '+x[1], x[2], x[5], x[6] || 'Owner action plan']), acts:ctlActs(fl) }; }
    if(kind==='Process' && kpi==='Automation'){ const p = D.procs.find(x=> x.p===k) || {};
      return { title:'Automation in '+k, cols:['Measure','Value'], rows:[['Controls in the library', p.total], ['Automated', p.auto], ['Manual', p.total-p.auto], ['Automation rate', FCT.pct(p.auto/p.total*100,1)], ['Key controls', p.key]],
        note:'Automated controls test every transaction; the '+(p.total-p.auto)+' manual ones rely on samples and owner sign-off.' }; }
    if(kind==='Process' && kpi==='Access conflicts'){ const sl = D.sod.filter(s=> s[5]===k);
      return { title:'Access conflicts in '+k, cols:['Conflict','User','Used in a transaction'], rows:sl.map(s=> [s[0]+' '+s[1], s[2]+' · '+s[3], s[4]? 'Yes: pnair.in03 created V-310992 (14-Sep) and approved ₹18.7 L to it (22-Sep)' : 'No, tested 01-Apr to 30-Sep']), acts:sl.map(s=> ({ ref:s[0], decide:s[4]? 'CMP-SOD-01' : '' })) }; }
    if(kind==='Process' && (kpi==='Open findings' || kpi==='Repeat findings')){ const rp = kpi==='Repeat findings', fs = D.findings.filter(f=> inProc(f) && (!rp || f[6]));
      return { wide:true, title:(rp? 'Repeat findings' : 'Open findings')+' in '+k, cols:['Finding','Raised by','Owner','Due','Status','Repeat'], rows:fs.map(f=> [f[0]+' '+f[1], f[2], fndOwner(f), f[4], st(f), f[6]? 'Yes' : 'No']), acts:fndActs(fs) }; }
    if(kind==='Process' && kpi==='Attestations signed'){ const as = D.attest.filter(a=> a[0].split('-')[1].replace('SC','Supply chain')===k);
      return { title:'Outstanding attestations in '+k, cols:['Control','Owner','Days overdue'], rows:as.map(a=> [a[0]+' '+a[1], a[2], a[3]]), acts:as.map(a=> ({ ref:a[0], owner:a[2], open:true })) }; }
    if(kind==='Return'){ const d = D.filings.due.find(x=> x[0]===k) || [];
      return Object.assign({ wide:true, title:'Late '+k+' filings, Q2 FY27 ('+(d[1]-d[2])+' of '+d[1]+')' }, C.lateRows(D.filings.late.filter(x=> x[1]===k))); }
    if(kind==='Filing status'){ if(k==='late') return Object.assign({ wide:true, title:'The '+C.fil.late+' late filings, Q2 FY27' }, C.lateRows(D.filings.late));
      return { title:'Filings made on time, by type', cols:['Filing','On time','Due','Owner'], rows:D.filings.due.map(x=> [x[0], x[2], x[1], x[3]]) }; }
    if(kind==='Due return'){ const x = D.filings.next.find(n=> n[0]===k) || [];
      return { wide:true, title:k+' due '+x[1], cols:['Filing','Due','Filings','Ready','Not ready','Owner','Why not ready'], rows:[[x[0], x[1], x[2], x[3], x[2]-x[3], x[4], x[5] || '—']],
        acts:x[2]>x[3]? [{ ref:k+' '+x[1], owner:x[4], open:true }] : [{ ref:k, open:false }], note:x[2]>x[3]? 'Chase '+x[4]+' to prepare the '+(x[2]-x[3])+' filings not ready.' : 'All filings are ready.' }; }
    if(kind==='Related party'){ const x = D.contracts.rpt.parties.find(q=> q[0]===k) || [];
      return { wide:true, title:x[0]+' · '+x[8], cols:['Field','Value'], rows:[['Relationship',x[1]],['Entity',x[2]],['Nature of transactions',x[3]],['Approval',x[4]==='None'? 'None' : x[4]+' of '+x[5]],
        ['FY27 approved limit',x[6]? '₹'+FCT.n(x[6],2)+' Cr' : 'No approval'],['Used Apr–Sep (this party)','₹'+FCT.n(x[7],2)+' Cr'+(x[6]? ' ('+FCT.pct(x[7]/x[6]*100,0)+')' : '')],
        ...(x[9]? [['Transactions without approval', wrap(D.contracts.rpt.nova.map(t=> t[0]+' PO '+t[1]+' '+t[2]+' ('+t[3]+')').join(' · '))],['Price','Corrugated shipper boxes at ₹18.4 per box; the previous supplier charged ₹16.9 (+9%)']] : [])].concat(x[9]? [['Next action','Sameer Khan: hold new POs, confirm arm’s-length pricing, table for Audit Committee ratification on 30-Oct (R. Shah abstains)']] : x[7]/x[6]>0.9? [['Next action','Sameer Khan: seek an enhanced limit at the 30-Oct Audit Committee before further sales (A. Iyer abstains)']] : []),
        strip:x[9]? { say:'Nova became related on 18-Aug; all 4 POs came after, none approved', marks:[['18-Aug','Became related','crit',1],['28-Aug','MBP-1 declared','ink',1]].concat(D.contracts.rpt.nova.map(t=> [t[0],'PO '+t[1]+' '+t[2]+', '+t[3],'crit'])) } : null,
        link:x[9] || null, decide:x[9], note:x[9]? 'Prior Audit Committee approval is required under s.177(4)(iv) and LODR Reg 23(2); s.188 applies if the terms are not at arm’s length. Ratify within three months, counted conservatively from the date Nova became related (18-Aug → 17-Nov). Reported under CARO 3(xiii) and in the Ind AS 24 disclosure. Case '+x[9]+'.' : null }; }
    if(kind==='Contract vendor'){ const v = D.contracts.exp.vendors.find(q=> q[0]===k) || [];
      const pre = { 'Bharat Electricals':'BE/26-27/', 'Shree Packaging Industries':'SPI-2627-', 'Chetak Logistics':'CL/IN08/', 'Vertex Lab Supplies':'VLS-' }[v[0]] || 'INV-';
      return { wide:true, title:v[0]+' · '+v[2]+(v[3]!=='—'? ' expired '+v[3] : ''), cols:['Paid on','Invoice','Payment run','Amount (this payment)'], rows:v[7].map((p,i)=> [p[0], pre+(412+i*7), p[1], p[2]]),
        strip:{ say:v[3]!=='—'? 'Contract ended '+v[3]+'; every payment shown came after it' : 'No contract at any point; each dot is a spot buy above ₹10 L', marks:(v[3]!=='—'? [[v[3],'Contract expired','ink',1]] : []).concat(v[7].map(p=> [p[0],p[1]+' '+p[2],'crit'])) },
        acts:v[7].map(p=> ({ ref:v[0]+' '+p[1], decide:v[6], link:v[6], ent:v[1] })), note:'Entity '+v[1]+'. Bought: '+v[8]+'. Price: '+v[9]+'. Owner: '+v[4]+'. Why: '+v[5]+'. Case '+v[6]+'.' }; }
    if(kind==='Contract'){ const x = D.contracts.doa.ex.find(q=> q[0]===k) || [];
      return { wide:true, title:x[0]+' '+x[1], cols:['Field','Value'], rows:[['Counterparty',x[2]],['Entity',x[3]],['Contract value','₹'+FCT.n(x[4],1)+' Cr'],['Signed',x[5]+' by '+x[6]],['Signatory’s authority','Up to ₹'+FCT.n(x[7],1)+' Cr'],['Required approver',x[8]],
        ['Root cause',wrap(x[11] || C.rcOf(x[9]))],['Paid since signing',wrap((x[10]||[]).map(p=> p[0]+' '+p[1]+' '+p[2]+' ('+p[3]+')').join(' · ') || 'None')],['Next action',wrap('Sameer Khan: obtain ratification from '+x[8]+' before the next payment')]], decide:x[9],
        strip:{ say:'Signed '+x[5]+' by '+x[6].split(',')[0]+' (limit ₹'+FCT.n(x[7],1)+' Cr); needed '+x[8]+'. Payments began with no ratification on file', marks:[[x[5],'Signed by '+x[6].split(',')[0],'crit',1]].concat((x[10]||[]).map(p=> [p[0],p[3]+' '+p[2],'crit'])) },
        link:x[0].indexOf('LSE')===0? [x[9],'CMP-DOA-17-R2R'] : x[9], note:'Case '+x[9]+'.'+(x[0].indexOf('LSE')===0? ' P2P holds the next payment; R2R books the lease under Ind AS 116.' : '') }; }
    if(kind==='Theme' && kpi==='Repeat findings'){ const fs = D.findings.filter(f=> f[7]===k && f[6]);
      return { wide:true, title:'Repeat findings with theme '+k, cols:['Finding','Process','Owner','Status'], rows:fs.map(f=> [f[0]+' '+f[1], f[3], fndOwner(f), st(f)]), acts:fndActs(fs) }; }
    if(kind==='Process'){ const fl = D.failing.filter(x=> x[3]===k), p = D.procs.find(x=> x.p===k) || {};
      return { wide:true, title:'Failing controls in '+k+' ('+fl.length+' of '+p.total+')', cols:['Control','Entity','Test result','Key','Fixed by'], rows:fl.map(x=> [x[0]+' '+x[1], x[2], x[5], x[7]? 'Key' : 'Non-key', x[6] || 'Owner action plan']), acts:ctlActs(fl),
        note:p.total+' controls, '+p.key+' key, '+p.auto+' automated ('+FCT.pct(p.auto/p.total*100,0)+'). Open findings here: '+(D.findings.filter(f=> f[3]===k).map(f=> f[0]).join(', ')||'none')+'.' }; }
    if(kind==='Rule'){ const id = RULE[k], v = D.byEnt[id] || [], reg = D.failing.find(x=> x[0]===id);
      const t = RULE_T[k], ents = D.focus.concat(['Other 5']), below = ents.filter((e,i)=> v[i]!=null && v[i]<t);
      return { chart:{ t, rows:ents.map((e,i)=> ({ l:e, v:v[i] })),
          say:below.length? (below.length>1? below.slice(0,-1).join(', ')+' and '+below[below.length-1] : below[0])+(below.length===1? ' is' : ' are')+' below the '+t+'% line' : 'Every entity is at or above the '+t+'% line',
          read:'September pass rate by entity. Red = below the '+t+'% warn line.' },
        title:'Pass rate by entity, '+id+', Sep-26', cols:['Entity','Pass %'], rows:D.focus.concat(['Other 5']).map((e,i)=> [e, v[i]==null? 'N/A' : FCT.pct(v[i],2)]),
        note:id+(reg? ' is failing: '+reg[5]+'.' : ' is passing at group level (96.40%, warn below 96%).'), link:id }; }
    if(kind==='Finding' && kpi==='Fixes on time'){ const a = D.fixes[k] || [], x = D.findings.find(f=> f[0]===k) || [];
      return { wide:true, title:'The '+a.length+' late fix actions on '+k, cols:['Fix action','Owner','Due','Status','Why late'],
        rows:a.map(f=> [f[0], f[1], f[2], f[3]? 'Done '+f[3]+', '+f[4]+' d late' : 'Open, '+f[4]+' d late', f[5]]),
        acts:a.map(f=> ({ ref:f[0], owner:f[1], open:!f[3], link:FIXLINK[k] })),
        note:'All three missed their due date in Jul–Sep, so they count as late in Fixes on time. The finding itself is '+x[5]+' days overdue; it closes when the open actions are done (fix case '+(x[8]||'—')+').' }; }
    if(kind==='Finding'){ const x = D.findings.find(f=> f[0]===k) || [];
      const late = (D.fixes[k] || []).length;
      return { title:k+' '+(x[1]||''), cols:['Field','Value'], rows:[['Raised by',x[2]],['Process',x[3]],['Owner',fndOwner(x)],['Due',x[4]],['Status',x[5]>0? x[5]+' days overdue' : 'In progress'],['Repeat',x[6]? 'Yes, raised in an earlier audit' : 'No'],
        ['Root cause',wrap(C.rcOf(x[8]) || '—')],['Fix actions late',late? late+' (see Fixes on time)' : 'None'],['Fix case',x[8]||'Owner action plan']], decide:x[8] }; }
    if(kind==='Theme'){ const fs = D.findings.filter(f=> f[7]===k);
      return { wide:true, title:'Findings with theme '+k, cols:['Finding','Process','Owner','Repeat','Status'], rows:fs.map(f=> [f[0]+' '+f[1], f[3], fndOwner(f), f[6]? 'Yes' : 'No', f[5]>0? f[5]+' d overdue' : 'In progress']), acts:fndActs(fs) }; }
    if(kind==='Area'){ const a = D.evAreas.find(x=> x[0]===k) || [k,0,0], it = D.evDetail[k] || [];
      return { wide:true, groups:C.evGroups(it), title:'The '+(a[1]-a[2])+' missing items in '+k, cols:['Reference','Entity','What is missing','Evidence type','Why missing','Owner'], rows:C.evRows(it), acts:C.evActs(it), note:FCT.n(a[2])+' of '+FCT.n(a[1])+' required items on file ('+FCT.pct(a[2]/a[1]*100,2)+'). Due 09-Oct.' }; }
    if(kind==='Control'){ const a = D.attest.find(x=> x[0]===k) || [];
      return { title:'Attestation '+k+' '+(a[1]||''), cols:['Field','Value'], rows:[['What the owner confirms','That '+a[0]+' operated as designed in Q2 FY27 (Jul–Sep)'],['Owner',a[2]+', '+a[4]],['Due',a[5]+' ('+a[3]+' days overdue)'],
        ['Latest test','Failed'],['Exception to cite',wrap(a[6])]], note:'The control failed its latest test, so the owner must sign "operated with exceptions" and cite the exception; signing moves attestations from 114 to 115 of 120.' }; }
    if(kind==='Pack'){ const p = D.packs.find(x=> x[0]===k) || [];
      const pi = D.packInfo[k] || { items:[] };
      return { wide:true, title:p[0]+' '+p[1], cols:['Item','Status'], rows:pi.items.map(x=> [wrap(x[0]), x[1]]), decide:p[5],
        note:'Requested by '+pi.req+'. '+pi.why+(pi.blocker? ' Blocking: '+pi.blocker : '')+' Owner '+pi.owner+', '+(p[4]==='Ready'? pi.due : 'due '+pi.due)+'.' }; }
    if(kind==='Check'){ const c = D.checks.find(x=> x[0]===k) || [];
      return { title:k, cols:['Field','Value'], rows:[['Result',c[1]? 'Passed' : 'Open'],['Detail',c[2]]] }; }
    const F = D.failing, AN = D.anomalies, FN = D.findings;
    if(kind==='Severity'){ const fl = F.filter(x=> x[4]===k); return { wide:true, title:'Failing controls with severity '+k, cols:['Control','Process','Entity','Test result','Fixed by'], rows:fl.map(x=> [x[0]+' '+x[1], x[3], x[2], x[5], x[6] || 'Owner action plan']), acts:ctlActs(fl) }; }
    const caseRows = (f)=> ({ wide:true, cols:['Case','Entity','Amount (this case only)','Root cause'], rows:D.cases.filter(f).map(c=> [c[0]+' '+c[1], c[2], C.amt(c), wrap(C.rcOf(c[0]))]), acts:D.cases.filter(f).map(c=> ({ ref:c[0], link:C.LINKS[c[0]] && c[0], ent:c[2], decide:c[0] })), note:'Amounts are per case and not added up: one event can surface in more than one case.' });
    if(kind==='Case severity') return Object.assign({ title:'Open '+k+' cases' }, caseRows(c=> c[5]===k));
    if(kind==='Criticality'){ const fl = F.filter(x=> (x[7]? 'Key' : 'Non-key')===k); return { wide:true, title:k+' controls failing', cols:['Control','Process','Entity','Test result','Fixed by'], rows:fl.map(x=> [x[0]+' '+x[1], x[3], x[2], x[5], x[6] || 'Owner action plan']), acts:ctlActs(fl) }; }
    if(kind==='Tower') return Object.assign({ title:'Open cases in '+k }, caseRows(c=> c[3]===k));
    if(kind==='Band' || kind==='Source'){ const sel = kind==='Band'? AN.filter(a=> k==='90'? a[4]>=90 : a[4]<90) : AN.filter(a=> a[6]===k);
      if(sel.length) return { title:kind==='Band'? 'Anomalies scored '+(k==='90'? '90–100' : '80–89') : 'Anomalies 80+ from '+(k==='Baseline'? 'the Compliance baseline' : k), ...anmRows(sel) }; }
    if(kind==='Tower policy'){ const x = D.policyTowers.find(t=> t[0]===k) || [k,0,0]; return { title:'Policy compliance in '+k, cols:['Measure','Value'], rows:[['Checks', FCT.n(x[1])],['Violations', FCT.n(x[2])],['Pass rate', FCT.pct((x[1]-x[2])/x[1]*100,2)],['Source', k==='P2P'? 'Live, Sep-26 P2P transactions' : 'Baseline (re-validated when the '+k+' tower is merged)']], note:k==='P2P'? 'Open the rule breakdown (By: rule) for the four P2P rules.' : null }; }
    if(kind==='Party') return { title:r.label, cols:['Measure','Value'], rows:[['Screened', r.val],['Matches','0'],['Lists','Sanctions lists (OFAC, UN, EU, MHA)']] };
    if(kind==='Usage'){ const sl = D.sod.filter(s=> (s[4]? 'Used' : 'Not used')===k); return { title:k+' access conflicts', cols:['Conflict','User','Process','Evidence'], rows:sl.map(s=> [s[0]+' '+s[1], s[2], s[5], s[4]? 'V-310992 created 14-Sep, ₹18.7 L paid 22-Sep' : 'No conflicting transactions, 01-Apr to 30-Sep']), acts:sl.map(s=> ({ ref:s[0], decide:s[4]? 'CMP-SOD-01' : '' })) }; }
    if(kind==='Status' || kind==='Source'){ const sel = FN.filter(f=> kind==='Status'? (f[5]>0? 'Overdue' : 'In progress')===k : f[2]===k);
      return { wide:true, title:kind==='Status'? k+' findings' : 'Findings raised by '+k, cols:['Finding','Process','Owner','Due','Repeat'], rows:sel.map(f=> [f[0]+' '+f[1], f[3], fndOwner(f), f[4], f[6]? 'Yes' : 'No']), acts:fndActs(sel) }; }
    if(kind==='Owner'){ const ls = Object.values(D.evDetail).flat().filter(x=> x[2]===k), rw = C.evRows(ls);
      return { wide:true, groups:C.evGroups(ls), title:'The '+rw.length+' missing items owned by '+k, cols:['Reference','Entity','What is missing','Evidence type','Why missing','Owner'], rows:rw, acts:C.evActs(ls), note:'Each row is one auditor sample without its document. Due 09-Oct.' }; }
    if(k==='onb') return { title:'Vendors being onboarded', cols:['Vendor','Status','Sanctions'], rows:[['VON-2611','Onboarding','No match'],['VON-2601','Onboarding','No match']] };
    return { title:r.label, cols:['Field','Value'], rows:[['Value', r.val],['Detail', r.sub||'—']] };
  };
  /* ---------- links into the process towers ("Open in P2P ↗") ----------
     One table: control or case → the tower screen that holds its records. P2P links are live (P2P deep links: #kpi=<id> or an encoded nav path;
     entity filter passed through sessionStorage 'fct-p2p-f'). O2C and R2R point to the current (old-style) O2C/R2R screens for now;
     when the new P2P-style towers are merged, re-point each href and confirm kpi ids and screen names against that tower's code. */
  const NAVH = (k, p)=> '#'+encodeURIComponent(JSON.stringify({ k, p }));
  const pcase = (id)=> ({ tower:'P2P', ready:true, href:'screens/p2p/desk.html'+NAVH('exposure', [{ t:'root', label:'Potential Exposure' }, { t:'case', id, label:id }]), what:'case '+id });
  const pkpi = (k, name)=> ({ tower:'P2P', ready:true, href:'screens/p2p/desk.html#kpi='+k, what:name });
  C.LINKS = {
    'CTL-P2P-001':pkpi('approval','Approval Compliance'), 'CTL-P2P-013':pkpi('match','Invoice Match Rate'), 'CTL-P2P-014':pkpi('match','Invoice Match Rate (forced matches)'),
    'CTL-P2P-022':pkpi('match','Invoice Match Rate (PO after invoice)'), 'CTL-P2P-017':pkpi('price','Contract-Price Compliance'), 'CTL-P2P-015':pkpi('grt','Goods Receipt Timeliness'),
    'CTL-P2P-031':pkpi('otp','On-Time Payment Rate'),
    'CTL-P2P-020':{ tower:'P2P', ready:true, href:'screens/p2p/desk.html'+NAVH('exposure', [{ t:'root', label:'Potential Exposure' }, { t:'group', dim:'type', key:'nopo', label:'Type: Spend without a PO' }]), what:'no-PO cases' },
    'CTL-P2P-021':{ tower:'P2P', ready:true, href:'screens/p2p/vendors.html', what:'Vendor profiles' }, 'CTL-P2P-024':{ tower:'P2P', ready:true, href:'screens/p2p/vendors.html', what:'Vendor profiles' },
    'CTL-P2P-009':pcase('PX-26215'), 'CTL-P2P-010':pcase('PX-26207'), 'CTL-CMP-003':pcase('PX-26248'),
    'CMP-SOD-01':pcase('PX-26248'), 'PTP-BNK-05':pcase('PX-26215'), 'PTP-DUP-03':pcase('PX-26207'),
    'CTL-R2R-021':{ tower:'R2R', ready:true, href:'screens/r2r/journals.html', what:'Journals' }, 'CTL-R2R-017':{ tower:'R2R', ready:true, href:'screens/r2r/desk.html#kpi=ic', what:'Consolidation & IC' },
    'CTL-R2R-030':{ tower:'R2R', ready:true, href:'screens/r2r/desk.html#kpi=recs', what:'Reconciliations' }, 'RTR-JNL-02':{ tower:'R2R', ready:true, href:'screens/r2r/journals.html?x=RTR-JNL-02', what:'Journals' },
    'RTR-PER-10':{ tower:'R2R', ready:true, href:'screens/r2r/journals.html?x=RTR-PER-10', what:'Journals' }, 'CMP-ANM-07':{ tower:'P2P', ready:true, href:'screens/p2p/desk.html?x=CMP-ANM-07', what:'P2P control tower with the case open (vendor V-310455 to be added to the P2P data)' },
    'CTL-O2C-011':{ tower:'O2C', ready:true, href:'screens/o2c/desk.html#kpi=credit', what:'Customer & credit' },
    'CTL-SC-006':{ tower:'SC', ready:true, href:'screens/sc/desk.html#kpi=ira', what:'Inventory integrity' }, 'SC-CNT-04':{ tower:'SC', ready:true, href:'screens/sc/desk.html#kpi=ira', what:'Inventory integrity' },
    'SC-ADJ-12':{ tower:'SC', ready:true, href:'screens/sc/desk.html#kpi=ira', what:'Inventory integrity' },
    'CMP-RPT-15':{ tower:'P2P', ready:true, href:'screens/p2p/desk.html?x=CMP-RPT-15', what:'POs to Nova Packaging' },
    'CMP-CON-16':{ tower:'P2P', ready:true, href:'screens/p2p/desk.html?x=CMP-CON-16', what:'payments without a valid contract' },
    'CMP-DOA-17':{ tower:'P2P', ready:true, href:'screens/p2p/desk.html?x=CMP-DOA-17', what:'payments under contracts signed above authority' },
    'CMP-DOA-17-R2R':{ tower:'R2R', ready:true, href:'screens/r2r/journals.html?x=CMP-DOA-17', what:'lease accounting for LSE-IN02-0091 (Ind AS 116)' }
  };
  C.go = (id, ent)=>{ const L = C.LINKS[id]; if(!L || !L.ready) return;
    if(L.tower==='P2P'){ try{ const f = JSON.parse(sessionStorage.getItem('fct-p2p-f')||'{}'); f.period = f.period || 'Sep-26'; f.bu = (ent && C.D.ent[ent])? ent : 'All'; sessionStorage.setItem('fct-p2p-f', JSON.stringify(f)); }catch(e){} }
    location.href = FCT.href(L.href); };
  C.caseSearch = { placeholder:'Search cases, vendors, POs, IDs', find:(q)=>{ const w = q.toLowerCase().split(/\s+/), who = (id)=> (FCT.ui && FCT.ui.who)? FCT.ui.who(id) : id;
    const txt = (x)=> [x.id, x.title, x.subject, x.entity, who(x.owner), x.what, x.rootCause, x.trigger, JSON.stringify(x.evidence||'')].join(' ').toLowerCase();
    return FCT.exFor('CMP').filter(x=> { const t = txt(x); return w.every(k=> t.indexOf(k)>=0); })
      .sort((a,b)=> (b.id.toLowerCase().indexOf(w[0])===0) - (a.id.toLowerCase().indexOf(w[0])===0) || b.priority-a.priority)
      .map(x=> ({ key:x.id, label:x.title, sub:x.severity[0].toUpperCase()+x.severity.slice(1)+' · '+x.entity+' · '+who(x.owner)+' · '+(s=> s[0].toUpperCase()+s.slice(1))(String(FCT.status(x))), go:()=> FCT.openDrawer(x.id) })); } };
  C.towerBtn = (id, ent)=>{ return null;   /* cross-tower "Open in" links removed: tower data is not yet consistent with Compliance */
    const L = C.LINKS[id]; if(!L || !L.ready) return null;
    return html`<button type="button" class="btn sm ghost" title=${'Opens '+L.tower+': '+L.what+(ent? ', filtered to '+ent : '')} onClick=${(e)=>{ e.stopPropagation(); C.go(id, ent); }}>Open in ${L.tower} ↗</button>`; };
  /* KPI detail: definition, inputs, breakdown; a breakdown row drills to that entity / process / item */
  /* one line for a set of cases: severity mix and the largest single case (never a sum) */
  C.caseParts = (f)=>{ const cs = C.D.cases.filter(f), n = (s)=> cs.filter(c=> c[5]===s).length, big = cs.slice().sort((a,b)=> b[4]-a[4])[0];
    return [['Severity', [n('critical')? n('critical')+' critical' : '', n('high')? n('high')+' high' : ''].filter(Boolean).join(', ')], ['Largest case', big? big[0]+', '+C.amt(big) : '—']]; };
  C.caseSub = (f)=> C.caseParts(f).map(x=> x[1]).join(' · largest ');
  /* where a breakdown row stands among the others: rank, and its share when the figure is a count */
  C.standing = (B, r)=>{ const rows = B.rows(), i = rows.findIndex(x=> x.key===r.key), n = rows.length, sum = rows.reduce((t,x)=> t+(+x.val||0), 0);
    const above = rows.filter(x=> x.val>r.val).length, tied = rows.filter(x=> x.val===r.val).length>1, pos = above+1;
    const rank = i<0? '' : (tied? 'Joint ' : '')+(pos===1? 'highest' : pos+(['st','nd','rd'][pos-1]||'th'))+' of '+n;
    return rank.charAt(0).toUpperCase()+rank.slice(1)+(!B.max && rows.every(x=> Number.isInteger(x.val)) && sum? ' · '+r.val+' of '+sum : ''); };
  /* the records behind a KPI at one entity; the last column of each row is the case to open ('' for none) */
  C.ENTITEMS = {
    'Payments against a valid contract':(e)=>{ const vs = C.D.contracts.exp.vendors.filter(v=> v[1]===e), ps = vs.flatMap(v=> v[7].map(p=> [v, p]));
      return { title:'Payments without a valid contract at '+e, cols:['Vendor','Contract','Paid on','Payment run','Amount (this payment)',''], rows:ps.map(([v,p])=> [v[0], v[2]+(v[3]!=='—'? ' (expired '+v[3]+')' : ''), p[0], p[1], p[2], v[6]]),
        note:vs.map(v=> v[0]+': '+v[5]).join(' · ') }; },
    'Regulatory filings':(e)=> Object.assign({ title:'Late filings at '+e+', Q2 FY27' }, (({ cols, rows, note })=> ({ cols:cols.concat(['']), rows:rows.map(rw=> rw.concat([''])), note }))(C.lateRows(C.lateAt(e), true))),
    'Cases with money involved':(e)=> ({ title:'Cases at '+e, cols:['Case','Tower','Amount','Severity'],
      rows:C.D.cases.filter(c=> c[2]===e).sort((a,b)=> b[4]-a[4]).map(c=> [html`${c[1]}<div class="sub">${c[0]}</div>`, c[3], C.amt(c), C.sev(c[5]), c[0]]),
      note:'Each amount belongs to its case alone; amounts are not added up.' }),
    'Failing controls':(e)=> ({ title:'Controls failing worst at '+e, cols:['Control','Process','Test result'],
      rows:C.D.failing.filter(x=> (x[8]||x[2])===e).map(x=> [html`${x[1]}<div class="sub">${x[0]}${x[7]? ' · key' : ''}</div>`, x[3], x[5], x[6]]) }),
    'Anomalies to review':(e)=> ({ title:'Anomalies scored 80+ at '+e, cols:['Anomaly','Score','Amount','Source','Why flagged'],
      rows:C.D.anomalies.filter(a=> a[2]===e).map(a=> [html`${a[1]}<div class="sub">${a[0]}</div>`, a[4], FCT.amt(a[3]), a[6]==='Baseline'? 'Compliance baseline' : a[6], html`<span style=${{whiteSpace:'normal'}}>${C.D.anmWhy[a[0]] || ''}</span>`, a[5]]),
      note:'Rows with Decide already have a case; the others wait for a person to review them on Investigations.' }),
    'Access conflicts':(e)=> ({ title:'Access conflicts at '+e, cols:['Conflict','User','Used'],
      rows:C.D.sod.filter(s=> s[2].indexOf(e)>=0).map(s=> [html`${s[1]}<div class="sub">${s[0]}</div>`, s[2].split(',')[0]+' · '+s[3], s[4]? 'Yes' : 'No', s[4]? 'CMP-SOD-01' : '']) })
  };
  /* ---------- drill charts: each states its answer in words, labels every value, and keeps the clickable list below ---------- */
  const PAL = [COL.crit, COL.high, 'var(--px-medium)', COL.pos, COL.brand2];
  C.Donut = ({ rows, tot, fmt, onPick })=>{ const r = 42, c = 2*Math.PI*r; let off = 0;
    return html`<div style=${{display:'flex', alignItems:'center', gap:'18px', flexWrap:'wrap', marginBottom:'12px'}}>
      <svg viewBox="0 0 110 110" width="130" height="130" role="img" aria-label=${rows.map(x=> x.label+' '+x.val).join(', ')}>
        ${rows.map((x,i)=>{ const len = x.val/tot*c, el = html`<circle key=${i} cx="55" cy="55" r=${r} fill="none" stroke=${PAL[i%PAL.length]} stroke-width="16" stroke-dasharray=${len+' '+(c-len)} stroke-dashoffset=${-off} transform="rotate(-90 55 55)" style=${{cursor:'pointer'}} onClick=${()=> onPick(x)}><title>${x.label}: ${fmt(x.val)}</title></circle>`; off += len; return el; })}
        <text x="55" y="55" text-anchor="middle" style=${{fill:'var(--px-ink)', fontSize:'20px', fontWeight:700}}>${FCT.n(tot)}</text><text x="55" y="70" text-anchor="middle" style=${{fill:'var(--px-ink3)', fontSize:'9px'}}>in all</text></svg>
      <div style=${{display:'grid', gap:'6px'}}>${rows.map((x,i)=> html`<button key=${i} type="button" class="btn sm ghost" style=${{justifyContent:'flex-start', gap:'8px'}} onClick=${()=> onPick(x)}>
        <i style=${{width:'10px', height:'10px', borderRadius:'2px', background:PAL[i%PAL.length]}}/><b class="num">${fmt(x.val)}</b><span>${x.label}</span><span class="faint">${FCT.pct(x.val/tot*100,0)}</span></button>`)}</div></div>`; };
  C.Stack = ({ rows, onPick })=> html`<div style=${{display:'grid', gap:'8px', marginBottom:'12px'}}>${rows.map((x,i)=>{ const t = x.parts.reduce((s,p)=> s+p.v, 0);
    return html`<div key=${i} style=${{display:'grid', gridTemplateColumns:'110px 1fr', gap:'10px', alignItems:'center', cursor:'pointer'}} onClick=${()=> onPick(i)}><span>${x.label}</span>
      <div style=${{display:'flex', height:'22px', borderRadius:'4px', overflow:'hidden'}}>${x.parts.map((p,j)=> html`<span key=${j} title=${p.l+': '+p.v} style=${{flex:p.v/t, background:p.c, color:'#0b1412', fontSize:'11px', fontWeight:600, display:'flex', alignItems:'center', paddingLeft:'6px', whiteSpace:'nowrap', overflow:'hidden'}}>${p.v} ${p.l.toLowerCase()} · ${FCT.pct(p.v/t*100,0)}</span>`)}</div></div>`; })}
    <${C.Legend} items=${rows[0].parts.map(p=> [p.l, p.c])}/></div>`;
  /* date strip for contract drills, Jun-Sep 2026; marks [date 'DD-Mon', label, tone, isEvent]: events draw as a dashed line, payments as dots */
  C.DateStrip = ({ s })=>{ const M = s.months || ['Jun','Jul','Aug','Sep'], span = M.length*30.5, at = (d)=>{ const [dd,mm] = d.split('-'); return Math.max(0, Math.min(100, (M.indexOf(mm)*30.5 + (+dd) - 1)/span*100)); },
      col = (t)=> t==='crit'? 'var(--px-crit, #E5484D)' : 'currentColor';
    return html`<div style=${{margin:'0 0 14px'}}><p style=${{margin:'0 0 6px', fontWeight:600}}>${s.say}</p>
      <div role="img" aria-label=${s.say} style=${{position:'relative', height:'70px', margin:'0 8px'}}>
        <div style=${{position:'absolute', left:0, right:0, top:'42px', height:'2px', background:'var(--px-track, rgba(140,160,155,.35))'}}></div>
        ${M.map((m,i)=> html`<span key=${m} class="faint" style=${{position:'absolute', left:(i*30.5/span*100)+'%', top:'50px', fontSize:'11px'}}>${m}</span>`)}
        ${s.marks.filter(k=> k[3]).map((k,i)=> html`<div key=${'e'+i} title=${k[0]+' '+k[1]} style=${{position:'absolute', left:at(k[0])+'%', top:(i%2? 18 : 0)+'px', height:(i%2? 32 : 50)+'px', borderLeft:'2px dashed '+col(k[2])}}><span style=${{position:'absolute', ...(at(k[0])>75? { right:'4px' } : { left:'4px' }), top:'-2px', fontSize:'11px', whiteSpace:'nowrap', fontWeight:600, color:col(k[2])}}>${k[1]} · ${k[0]}</span></div>`)}
        ${s.marks.filter(k=> !k[3]).map((k,i)=> html`<span key=${'p'+i} title=${k[0]+' · '+k[1]} style=${{position:'absolute', left:'calc('+at(k[0])+'% - 5px)', top:'38px', width:'10px', height:'10px', borderRadius:'50%', background:col(k[2])}}></span>`)}
      </div><p class="sub" style=${{margin:'2px 0 0'}}>${s.legend || 'Dashed line = event · dot = one payment or PO (hover for date and amount)'}</p></div>`; };
  C.TargetBars = ({ c })=>{ const vs = c.rows.filter(x=> x.v!=null).map(x=> x.v), lo = Math.floor(Math.min(c.t, ...vs) - 2), at = (v)=> (v-lo)/(100-lo)*100;
    return html`<div style=${{display:'grid', gap:'6px', marginBottom:'12px'}}>${c.rows.map(x=> html`<div key=${x.l} style=${{display:'grid', gridTemplateColumns:'70px 1fr 70px', gap:'10px', alignItems:'center'}}><span>${x.l}</span>
        <div style=${{position:'relative', height:'18px', background:'var(--px-track)', borderRadius:'3px'}}>${x.v!=null && html`<i style=${{position:'absolute', left:0, top:0, bottom:0, width:at(x.v)+'%', borderRadius:'3px', background:x.v<c.t? COL.crit : COL.pos}}/>`}
          <i style=${{position:'absolute', left:at(c.t)+'%', top:'-3px', bottom:'-3px', borderLeft:'2px dashed '+COL.brass}}/></div>
        <b class="num" style=${{textAlign:'right', color:x.v==null? 'var(--px-ink3)' : x.v<c.t? COL.crit : 'inherit'}}>${x.v==null? 'not tested' : FCT.pct(x.v,1)}</b></div>`)}
      <div class="sub">Axis runs from ${lo}% to 100% so small gaps show. Dashed line: ${c.t}%.</div></div>`; };
  const cnt = (rows, k)=> (rows.find(r=> r.key===k) || {}).val || 0;
  /* per breakdown: the chart, the sentence that answers it, and how to read it (others get a computed sentence and bars) */
  C.VIZ = {
    'Failing controls: key or non-key':{ chart:'donut', say:(r,t)=> cnt(r,'Key')+' of '+t+' failing controls are key controls', read:'Key controls are the ones the auditor relies on.' },
    'Cases by severity':{ chart:'donut', say:(r,t)=> cnt(r,'critical')+' of '+t+' cases are critical', read:'Open cases by severity. Counts only, never amounts.' },
    'Open findings by status':{ chart:'donut', say:(r,t)=> cnt(r,'Overdue')+' of '+t+' open findings are overdue', read:'Overdue vs in progress.' },
    'Parties screened by type':{ chart:'donut', say:(r,t)=> FCT.n(t)+' parties screened, 0 matches', read:'Vendors and customers screened against sanctions lists.' },
    'Automation rate by process':{ chart:'stack', parts:(rows)=> rows.map(r=>{ const p = C.D.procs.find(x=> x.p===r.key); return { label:r.key, parts:[{ l:'Automated', v:p.auto, c:COL.pos }, { l:'Manual', v:p.total-p.auto, c:'var(--px-medium)' }] }; }),
      say:(r)=>{ const s = r.slice().sort((a,b)=> a.val-b.val); return s[0].label+' is least automated ('+FCT.pct(s[0].val,0)+'); '+s[s.length-1].label+' most ('+FCT.pct(s[s.length-1].val,0)+')'; },
      read:'Each bar is one process: automated vs manual controls.' },
    'Late filings by type, Q2 FY27':{ say:(r,t)=> t+' of '+FCT.n(C.fil.due)+' filings were late; '+r[0].label+' had the most ('+r[0].val+')', read:'Late filings by type; the line under each bar shows filings on time against filings due.' },
    'Filings on time or late, Q2 FY27':{ chart:'donut', say:()=> FCT.pct(C.fil.rate,1)+' filed on time, above the '+C.D.filings.target+'% target', read:'Every statutory filing due in Jul–Sep.' },
    'Filings due in the next 30 days':{ say:()=> C.fil.notReady+' of '+C.fil.next+' filings due by 04-Nov are not ready yet', read:'Filings due 06-Oct to 04-Nov; the line under each bar shows how many are ready.' },
    'Related parties by approved limit used':{ say:()=> 'Nova Packaging has no approval (ratify by 17-Nov); SP Agro Ltd has used 94% of its limit', read:'Each bar is one related party: share of its FY27 approved limit used Apr–Sep. Click a party for its approval and transactions.' },
    'Payments without a valid contract, by vendor':{ say:(r,t)=> t+' payments to '+r.length+' vendors after the contract expired or with none; '+r[0].label+' had the most ('+r[0].val+')', read:'Each bar is a vendor; length = payments made without a valid contract. Click a vendor for each payment.' },
    'Contracts signed above authority':{ say:(r)=> r.length+' of '+C.D.contracts.doa.signed+' contracts were signed above the signatory’s authority', read:'Each bar is a contract; length = contract value. Click for who signed and who should have.' },
    'Anomalies 80+ by score band':{ say:(r,t)=> cnt(r,'90')+' of '+t+' scored 90 or more and are acted on today', read:'Anomalies needing a person, by score band.' },
    'Overdue findings by days':{ say:(r)=> r[0].label.split(' ')[0]+' is the most overdue: '+r[0].val+' days', read:'Bar length = days past due.' },
    'Late fix actions by finding, Q2 FY27':{ say:(r,t)=> t+' late fix actions, all on the '+r.length+' overdue findings', read:'Late fix actions per finding, Jul–Sep.' }
  };
  C.KpiDetail = ({ path, open })=>{
    const top = path[0], d = top.def, last = path[path.length-1], [bi, setBi] = React.useState(0), [ch, setCh] = React.useState({});
    const toast = (m)=> FCT.ui && FCT.ui.toast && FCT.ui.toast(m);
    const chase = (list)=>{ const n = {}; list.forEach(a=> n[a.ref] = 1); setCh((prev)=> Object.assign({}, prev, n)); const who = [...new Set(list.map(a=> a.owner))];
      toast('Reminder sent to '+who.join(', ')+' for '+(list.length===1? list[0].ref : list.length+' items')+' (simulated)'); };
    if(path.length>1){ const r = last.row, ent = C.D.ent[r.key], B1 = last.by||d.by, items = ent && C.ENTITEMS[top.label]? C.ENTITEMS[top.label](r.key) : null;
      return html`<${C.Sec} c="vendor" icon=${ent? 'Building2' : 'Layers'} title=${r.label} sub=${top.label+' · '+last.kind}><div class="px-brow">
        <${C.Card} k="k-amber" icon="Target" title=${top.label+' here'}><div class="px-split">${[[top.label, B1.fmt(r.val, r)]].concat(r.detail || [r.sub && r.sub!=='Focus entity'? ['Detail', r.sub] : ['Standing', C.standing(B1, r)]]).map(([l,x])=> html`<div key=${l}><span>${l}</span><b class="num">${x}</b></div>`)}</div>
          ${ent? html`<${C.AI}>Open the entity profile for every compliance figure at ${r.key}.</${C.AI}><a class="btn sm" href=${'entities.html#'+r.key}>Open entity profile</a>` : null}</${C.Card}>
        ${items && html`<div style=${{gridColumn:'1 / -1'}}><${C.Card} k="k-amber" icon="ListChecks" title=${items.title}><div class="px-tbl"><table class="t px-t dense"><thead><tr>${items.cols.map((c,i)=> html`<th key=${i} class=${C.isNum(items.rows, i)? 'r' : ''}>${c}</th>`)}<th><span class="sr">Action</span></th></tr></thead>
          <tbody>${items.rows.map((rw,i)=> html`<tr key=${i}>${rw.slice(0,-1).map((c,j)=> html`<td key=${j} class=${C.isNum(items.rows, j)? 'r num' : ''}>${c}</td>`)}<td class="r">${rw[rw.length-1]? html`${C.towerBtn(rw[rw.length-1], r.key)}${C.decide(rw[rw.length-1])}` : ''}</td></tr>`)}</tbody></table></div>${items.note && html`<${C.AI}>${items.note}</${C.AI}>`}</${C.Card}></div>`}
        ${ent? html`<${C.Card} k="k-amber" icon="ShieldCheck" title=${'Control pass rate by tower at '+r.key}><div class="px-tbl"><table class="t px-t dense"><tbody>${C.entTowers(r.key).map(([k,v])=> html`<tr key=${k}><td>${k} <span class="faint">(${C.D.heatSrc[k]})</span></td><td class="r num" style=${{ background:C.heatBg(v) }}>${v==null? 'not run' : FCT.pct(v, v%1? 1 : 0)}</td></tr>`)}</tbody></table></div></${C.Card}>` : null}
        ${ent? html`<${C.Card} k="k-amber" icon="ListChecks" title=${'How '+r.key+' compares with the other entities'}><${C.EntFigures} e=${r.key}/></${C.Card}>`
          : (()=>{ const x = C.related(last.kind, r, top.label); return html`<div style=${{gridColumn:x.wide? '1 / -1' : 'auto', display:'grid'}}><${C.Card} k="k-amber" icon="ListChecks" title=${x.title} right=${x.acts && !x.groups && (()=>{ const op = x.acts.filter(a=> a.open && !ch[a.ref]); return op.length>1? html`<button type="button" class="btn sm" onClick=${()=> chase(op)}>Chase all open (${op.length})</button>` : null; })()}>${x.strip && html`<${C.DateStrip} s=${x.strip}/>`}${x.chart && html`<p style=${{margin:'0 0 2px', fontWeight:600}}>${x.chart.say}</p><p class="sub" style=${{margin:'0 0 10px'}}>${x.chart.read}</p><${C.TargetBars} c=${x.chart}/>`}${x.groups? html`<${C.EvGroups} groups=${x.groups} ch=${ch} chase=${chase}/>` : html`<div class="px-tbl"><table class="t px-t dense"><thead><tr>${x.cols.map((c,i)=> html`<th key=${i} class=${C.isNum(x.rows, i)? 'r' : ''}>${c}</th>`)}${x.acts && html`<th><span class="sr">Action</span></th>`}</tr></thead>
              <tbody>${x.rows.map((rw,i)=> html`<tr key=${i}>${rw.map((c,j)=> html`<td key=${j} class=${C.isNum(x.rows, j)? 'r num' : ''}>${c}</td>`)}${x.acts && (()=>{ const a = x.acts[i]; return html`<td class="r" style=${{whiteSpace:'nowrap'}}>
                ${a.link && C.towerBtn(a.link, a.ent)}${a.decide && C.decide(a.decide)}${a.open && (ch[a.ref]? html`<${C.Pill} tone="g">Chased today</${C.Pill}>` : html`<button type="button" class="btn sm" onClick=${()=> chase([a])}>Chase</button>`)}</td>`; })()}</tr>`)}</tbody></table></div>`}${x.note && html`<${C.AI}>${x.note}</${C.AI}>`}${x.link && [].concat(x.link).map(l=> C.towerBtn(l))}${x.decide && C.decide(x.decide)}</${C.Card}></div>`; })()}</div></${C.Sec}>`; }
    const opts = d.by? [d.by].concat(d.alt||[]) : [], B = opts[bi] || opts[0], rows = B? B.rows() : [];
    const go = (r)=> open({ kind:B.kind, label:C.D.ent[r.key]? r.key : r.label, row:r, by:B });
    return html`<${C.Sec} c="kpi" icon="Gauge" title=${top.label} sub=${d.why} right=${html`<${C.Pill} tone="n">${top.value}</${C.Pill}>`}><div class="px-brow">
      <${C.Card} k=${top.k||'k-teal'} icon="Info" title="How it is calculated"><p style=${{margin:'0 0 10px'}}>${d.f}</p>
        <div class="px-tbl"><table class="t px-t dense"><tbody>${d.inputs.map(([l,v])=> html`<tr key=${l}><td>${l}</td><td class="r num">${v}</td></tr>`)}</tbody></table></div></${C.Card}>
      ${B? html`<${C.Card} k=${top.k||'k-teal'} icon="Layers" title=${B.title} right=${opts.length>1 && html`<span onClick=${(e)=> e.stopPropagation()}><${P.Pick} label="Break down by" value=${String(bi)} options=${opts.map((o,i)=> [String(i), 'By: '+o.kind.toLowerCase()])} onChange=${(v)=> setBi(+v)}/></span>`}>
        ${(()=>{ const V = C.VIZ[B.title] || {}, tot = rows.reduce((t,r)=> t+(+r.val||0), 0), top1 = rows[0];
          const say = V.say? V.say(rows, tot) : top1 && (B.max? top1.label+' is highest at '+B.fmt(top1.val) : top1.label+' is largest: '+B.fmt(top1.val)+(rows.every(r=> Number.isInteger(r.val))? ' of '+FCT.n(tot) : ''));
          return html`<p style=${{margin:'0 0 2px', fontWeight:600}}>${say}</p><p class="sub" style=${{margin:'0 0 10px'}}>${V.read || 'Each bar is one '+B.kind.toLowerCase()+', largest first. Click a bar to drill in.'}</p>
            ${V.chart==='donut'? html`<${C.Donut} rows=${rows} tot=${tot} fmt=${B.fmt} onPick=${go}/>` : V.chart==='stack'? html`<${C.Stack} rows=${V.parts(rows)} onPick=${(i)=> go(rows[i])}/>` : null}`; })()}
        ${!(C.VIZ[B.title] || {}).chart && html`<${P.BarList} key=${bi} label=${B.title} rows=${rows} fmt=${B.fmt} max=${B.max} limit=${12} onSelect=${go} onOpen=${go}/>`}</${C.Card}>` : html`<${C.Card} k=${top.k||'k-teal'} icon="Layers" title="Breakdown"><${P.Empty} text="This KPI has no further breakdown."/></${C.Card}>`}
    </div></${C.Sec}>`;
  };
  C.Card = ({ k, icon, title, children, right })=> html`<section class=${cx('px-kc', k)} aria-label=${title}><div class="px-kc-h"><span class="px-kc-t static"><span class="px-kc-i"><${Icon} n=${icon} size=${15}/></span><span>${title}</span></span>${right}</div>${children}</section>`;
  C.SegBar = ({ parts, label })=>{ const t = parts.reduce((s,p)=> s+p.v, 0) || 1;
    return html`<div class="px-segbar" role="img" aria-label=${label}>${parts.map((p,i)=> p.v>0? html`<i key=${i} style=${{ flex:p.v/t, background:p.c }} title=${p.l+': '+p.v}/>` : null)}</div>
      <div class="px-seglg">${parts.map((p,i)=> html`<span key=${i}><i style=${{background:p.c}}/>${p.l} <b>${p.f? p.f(p.v) : p.v}</b></span>`)}</div>`; };
  C.Legend = ({ items })=> html`<div class="px-seglg">${items.map(([l,c],i)=> html`<span key=${i}><i style=${{background:c}}/>${l}</span>`)}</div>`;
  C.axis = { tick:{ fill:'var(--px-ink3)', fontSize:11 }, tickLine:false, axisLine:false };
  C.Tip = (fmt)=> React.createElement(P.Tip, { fmt });
  C.prio = (pr)=> html`<span class=${'px-prio p-'+(pr>=70? 'high' : pr>=45? 'medium' : 'low')}>${pr}</span>`;
  C.sev = (s)=> html`<span class=${'px-risk r-'+({critical:'Critical',high:'High',medium:'Medium',low:'Low'}[s]||'Low')}>${s}</span>`;
  C.decide = (id)=> id? html`<button type="button" class="btn sm cmp-decide" onClick=${(e)=>{ e.stopPropagation(); FCT.openDrawer(id); }}>Decide</button>` : null;

  /* ---------- page frame: command bar, breadcrumb, step strip ---------- */
  const STEPS = [['executive','1','Compliance health'],['controls','2','Controls'],['investigation','3','Investigations'],['issues','4','Findings'],['audit','5','Evidence pack']];
  const Tabs = ({ on, right })=>{ useEffect(()=>{ document.body.classList.add('px-full'); return ()=> document.body.classList.remove('px-full'); }, []);
    return html`<header class="px-cmd"><button type="button" class="px-railbtn" aria-label="Collapse or expand the tower navigation" onClick=${()=> FCT.railMin(!document.body.classList.contains('rail-min'))}><${Icon} n="Menu" size=${16}/></button>
      <span class="px-brandmark"><b>CMP</b><small>Compliance</small></span>
      <nav class="px-tabs" aria-label="Compliance screens">${[['entities','Entity profiles','Building2','entities.html'],['story','Compliance story','ListChecks','executive.html']].map(([k,t,ic,href])=>
        html`<a key=${k} class=${on===k? 'on' : ''} aria-current=${on===k? 'page' : undefined} href=${href}>${on===k && html`<span class="px-tab-bg"/>`}<${Icon} n=${ic} size=${15}/><span>${t}</span></a>`)}</nav>
      <div class="px-cmd-r">${right}<${P.ThemeToggle}/><${P.UserMenu}/></div></header>`; };
  C.Steps = ({ step })=> html`<div class="px-steptabs" role="navigation" aria-label="Compliance story steps">
    ${STEPS.map(([f,i,q])=> html`<button key=${i} type="button" class=${i===step? 'on' : ''} aria-current=${i===step? 'step' : undefined} onClick=${()=> i!==step && (location.href = f+'.html')}>${q}</button>`)}
    <span>${+step>1 && html`<a class="btn sm ghost" href=${STEPS[+step-2][0]+'.html'}>← Previous</a>`}${+step<5 && html`<a class="btn sm" href=${STEPS[+step][0]+'.html'}>Next →</a>`}</span></div>`;

  /* page(cfg): cfg = { tab, step, root:{kind,label,icon}, accent, Board:({open})=>, Detail:({path, open})=> }.
     path = the drill levels [{kind, label, ...data}]; open(level) drills one level; a breadcrumb click goes back to that level. */
  C.page = (cfg)=>{
    /* Compliance cases per entity = the open-items list itself, on every page */
    Object.keys(C.D.ent).forEach(e=>{ const cs = C.entOpen(e).filter(it=> it.type==='Case'); C.D.ent[e][13] = cs.length; C.D.ent[e][14] = cs.reduce((m,it)=> Math.max(m, it.money||0), 0); });
    function App(){
      const [f, setF, pending] = P.useFilters('f');
      const [path, setPath] = useState([]);
      const open = (lv)=> setPath(path.concat([lv]));
      const board = (lv)=> setPath([lv]);
      C._open = board;
      useEffect(()=>{ const m = decodeURIComponent(location.hash).match(/^#kpi=([^&]+)(?:&row=(.+))?$/);
        /* #kpi=<KPI>&row=<key> opens that KPI and drills straight into the row (used by the Compliance health area links) */
        if(m && C.DEF[m[1]]){ const def = C.DEF[m[1]], top = { kind:'KPI', label:m[1], def, value:'' }, B = def.by, r = m[2] && B && B.rows().find(x=> x.key===m[2]);
          setPath(r? [top, { kind:B.kind, label:C.D.ent[r.key]? r.key : r.label, row:r, by:B }] : [top]); } else if(cfg.hash && location.hash.length>1){ const lv = cfg.hash(location.hash.slice(1)); if(lv) setPath([lv]); } }, []);
      path.forEach((l,i)=>{ P2PM.dimName['cmp'+i] = l.kind; });
      const nav = { kpi:'health', path:[{ t:'root', label:'' }].concat(path.map((l,i)=> l.kind==='Entity'? { t:'entity', label:l.label } : { t:'group', dim:'cmp'+i, label:l.kind+': '+l.label })) };
      const dispatch = (a)=>{ if(a.t==='crumb') setPath(path.slice(0, a.i)); };
      useEffect(()=>{ const el = document.querySelector('.px-ws1'); el && el.scrollTo && el.scrollTo(0,0); window.scrollTo(0,0); }, [path.length]);
      return html`<div class=${'px-scr '+(cfg.accent||'k-teal')}><${Tabs} on=${cfg.tab} right=${html`<${P.FilterBar} f=${f} setF=${setF} pending=${pending} compact=${true} search=${C.caseSearch}/>`}/>
        ${(path.length>0 || !cfg.bare) && html`<${P.GlobalCrumb} root=${Object.assign({ go:()=> setPath([]) }, cfg.root)} nav=${nav} dispatch=${dispatch} from=${1} show=${path.length>0}/>`}
        <div class="px-ws1"><div class="px-board"><div class="px-board-in">${cfg.step && !path.length && html`<${C.Steps} step=${cfg.step}/>`}
          ${path.length? (path[0].def? html`<${C.KpiDetail} path=${path} open=${open}/>` : html`<${cfg.Detail} path=${path} open=${open}/>`) : html`<${cfg.Board} open=${board}/>`}</div></div></div></div>`;
    }
    P.mount(App);
  };
})();
