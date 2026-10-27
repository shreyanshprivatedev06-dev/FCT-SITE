/* FCT demo data — Compliance tower (source: fct details/0_compliance.docx, shared universe). */
(function(){
const D = window.FCT_DATA;
D.metrics = Object.assign(D.metrics, {
  'cmp.cri':22, 'cmp.ctlEff':94, 'cmp.policy':96.0, 'cmp.failRate':2.2, 'cmp.autoCov':61, 'cmp.evidence':99.0, 'cmp.attest':95,
  'cmp.repeat':8, 'cmp.overdueRem':12, 'cmp.closure':92, 'cmp.anom':47, 'cmp.highRisk':11, 'cmp.regDays':5
});
D.cmp = {
  criTrend:{ months:['Apr','May','Jun','Jul','Aug','Sep'], cri:[31,29,28,26,24,22], ready:[79,80,81,83,85,87] },
  readiness:[ ['Control effectiveness',30,29.3],['Evidence completeness',25,24.8],['Open findings',20,14.0],['Segregation of duties',15,9.0],['Remediation on time',10,10.0] ],
  library:{ total:412, automated:251, key:138, policies:38 },
  byProcess:[ ['P2P',118,96,3],['O2C',84,52,1],['R2R',102,61,3],['SC',58,24,1],['CMP and IT',50,18,1] ],
  attest:[ ['CTL-P2P-009','Bank-change call-back evidence','Manish Gupta','Overdue 6 days'],['CTL-R2R-017','IC confirmation','Anjali Kulkarni','Overdue 4 days'],['CTL-SC-006','Inventory count variance','Farhan Qureshi','Overdue 3 days'],['CTL-O2C-011','Credit-limit override','Tom Brennan','Overdue 3 days'],['CTL-R2R-030','Suspense ageing','Lata Krishnan','Overdue 2 days'],['CTL-P2P-022','PO after invoice','Shalini Desai','Overdue 1 day'] ],
  evidenceAreas:[ ['Procure to pay',98.7,'C-P2P (38 controls)'],['Order to cash',99.4,'C-O2C (26)'],['Record to report',98.9,'C-RTR (41)'],['Supply chain',98.1,'C-SC (19)'],['IT general controls',99.6,'C-ITGC (14)'] ],
  findings:[
    {id:'F-2026-031',title:'GRNI review evidence incomplete',src:'Statutory auditor, FY26',process:'P2P',owner:'VS',due:'25-Aug',status:'Overdue',days:41,repeat:true,theme:'Evidence',ex:'CMP-REM-06'},
    {id:'F-2026-034',title:'Vendor creation and payment rights held by one user, IN-03',src:'Internal audit, Q1',process:'CMP',owner:'SK',due:'15-Sep',status:'Overdue',days:20,repeat:true,theme:'Access (SoD)',ex:'CMP-SOD-01'},
    {id:'F-2026-038',title:'Intercompany confirmations not obtained',src:'Statutory auditor, FY26',process:'R2R',owner:'HV',due:'20-Sep',status:'Overdue',days:15,repeat:true,theme:'Evidence',ex:'CMP-FND-09'},
    {id:'F-2026-041',title:'Manual journals without support',src:'Internal audit, Q1',process:'R2R',owner:'AR',due:'30-Sep',status:'Overdue',days:5,repeat:true,theme:'Evidence',ex:'CMP-FND-10'},
    {id:'F-2026-044',title:'Inventory count not independent of custodian, IN-05',src:'Internal audit, Q2',process:'SC',owner:'IN05C',due:'31-Oct',status:'In progress',days:0,repeat:false,theme:'Segregation',ex:'CMP-FND-13'},
    {id:'F-2026-046',title:'Credit limits overridden without approval, US-01',src:'Internal audit, Q2',process:'O2C',owner:'US01C',due:'15-Oct',status:'In progress',days:0,repeat:true,theme:'Approval',ex:'CMP-FND-11'},
    {id:'F-2026-047',title:'Three-way-match tolerance changed without approval',src:'Controls monitoring',process:'P2P',owner:'VS',due:'31-Oct',status:'In progress',days:0,repeat:false,theme:'Approval',ex:'CMP-FND-14'},
    {id:'F-2026-049',title:'Job-work challans over 365 days not tracked',src:'Indirect tax review',process:'SC',owner:'MJ',due:'25-Oct',status:'In progress',days:0,repeat:false,theme:'Evidence',ex:'CMP-FND-12'} ],
  closure:{ months:['Apr','May','Jun','Jul','Aug','Sep'], opened:[9,7,11,6,8,5], closed:[6,8,9,10,9,7] },
  themes:[ ['Evidence not retained',4,'Evidence filed by hand, after the event'],['Approval bypassed or missing',2,'Overrides and tolerance changes without maker-checker'],['Access and segregation',1,'Role design allows conflicting rights'],['Segregation in operations',1,'Custodian also counts'] ],
  anomalies:[
    {id:'ANM-2026-0912',what:'Vendor bank account matches an employee salary account',ent:'IN-05',amt:0.062,score:94,status:'Open',ex:'CMP-ANM-07'},
    {id:'ANM-2026-0908',what:'Round-sum manual journal at period end',ent:'IN-05',amt:2.40,score:93,status:'Open',ex:'RTR-JNL-02'},
    {id:'ANM-2026-0905',what:'Write-offs split under approval limit',ent:'IN-08',amt:1.10,score:91,status:'Open',ex:'SC-ADJ-12'},
    {id:'ANM-2026-0901',what:'Purchase orders split to stay under DoA',ent:'IN-03',amt:0.294,score:84,status:'Open',ex:'CMP-POL-04'},
    {id:'ANM-2026-0897',what:'Payment to a vendor created 8 days earlier',ent:'IN-03',amt:0.187,score:82,status:'Open',ex:'CMP-SOD-01'},
    {id:'ANM-2026-0890',what:'Credit note issued after period lock',ent:'US-01',amt:0.71,score:77,status:'Open'},
    {id:'ANM-2026-0884',what:'Weekend posting to inventory adjustment',ent:'IN-02',amt:0.31,score:82,status:'Open'},
    {id:'ANM-2026-0871',what:'Duplicate invoice across two vendor codes',ent:'IN-04',amt:0.486,score:96,status:'Open',ex:'PTP-DUP-03'} ],
  reg:[ {id:'REG-2026-019',title:'GST: e-invoices must be reported within 30 days of the invoice date',src:'GST draft notification',eff:'01-Nov-2026',impact:'3 O2C controls, 2 entities above threshold',status:'Assessment due',ex:'CMP-REG-08'},
        {id:'REG-2026-017',title:'MSME payments: disallowance for dues beyond 45 days',src:'Income-tax Act s.43B(h)',eff:'In force',impact:'1 P2P control; 38 MSME invoices monitored',status:'Controls updated'},
        {id:'REG-2026-014',title:'CARO 2020: quarterly returns to banks to agree with books',src:'CARO 2020 clause 3(ii)(b)',eff:'In force',impact:'Stock statement reconciliation added (SC)',status:'Controls updated'} ]
};
D.exceptions.push(
{ id:'CMP-POL-04', rootCause:'The approval workflow checks each PO alone; it has no rule that adds up POs to the same vendor for the same work on the same day.', tower:'CMP', also:['P2P'], entity:'IN-03', severity:'medium', priority:44,
  title:'Purchase orders split to stay under the approval limit', subject:'3 POs of ₹9.8 L to Bharat Electricals on one day',
  impact:{valueCr:0.294, short:'₹29.4 L', label:'Combined value'}, due:'09-Oct', owner:'SK',
  trigger:'Policy rule CMP-01: same vendor, same requester, same day, each just under a DoA level',
  what:'On 24-Sep maint.eng03 raised three POs of ₹9.8 L each to Bharat Electricals for one job, rewiring the IN-03 utilities block. Each PO sat just under the ₹10 L limit of the cost-centre owner (L1), so the maintenance manager approved all three; together the ₹29.4 L needed the function head (L2). Bharat’s contract MSA-IN03-0712 had also expired on 30-Jun (see CMP-CON-16).',
  evidence:{ table:{cols:['PO','Amount','Approver'], right:[1], rows:[['4500187561','₹9.8 L','Maintenance manager IN-03, cost-centre owner (L1)'],['4500187562','₹9.8 L','Maintenance manager IN-03, cost-centre owner (L1)'],['4500187563','₹9.8 L','Maintenance manager IN-03, cost-centre owner (L1)']], foot:['Combined','₹29.4 L','Required: function head (L2)']} },
  ai:{ confidence:0.89, short:'Route for L2 approval; add aggregation rule', text:'Route the three POs together to the function head for retrospective approval and add a same-day aggregation rule to the approval workflow.' },
  override:[{label:'Accept as separate jobs (document reason)'}],
  onTake:[{add:'cmp.policy',v:0.2},{event:'Split POs routed for L2 approval; aggregation rule proposed',tower:'CMP'}], takeToast:'Routed to the function head; aggregation rule proposed',
  links:[['Controls monitoring','screens/cmp/controls.html']] },
{ id:'CMP-EVD-05', evidence:{table:{cols:['Item','Detail'],rows:[['Change','Apex Chem Intermediates V-301776, bank HDFC ****4471 to Emirates NBD ****0932'],['Requested','03-Oct 16:42 by e-mail (PTP-BNK-05)'],['Decision','Rejected; payment of ₹1.12 Cr held'],['Missing','Call-back log to the master-data number +91 265 xxx 4410'],['Owner','Manish Gupta, treasury'],['Auditor sample','CTL-P2P-009, limited review 12-Oct']]}}, rootCause:'The call-back is logged by treasury outside the vendor-master workflow, so a change can be decided without the log being attached.', tower:'CMP', also:['P2P'], entity:'IN-02', severity:'medium', priority:40,
  title:'Audit evidence missing: bank-change call-backs', subject:'Control CTL-P2P-009, Apex Chem change of 03-Oct',
  impact:{valueCr:null, short:'1 call-back log', label:'Missing evidence'}, due:'09-Oct', owner:'MG',
  what:'The Apex Chem bank-detail change requested on 03-Oct was rejected, but the call-back that should support the decision is not on file. The statutory auditor samples CTL-P2P-009 in the limited review starting 12-Oct.',
  ai:{ confidence:0.90, short:'Obtain call-back evidence or re-verify', text:'Treasury (Manish Gupta) to make the call-back to the number on the vendor master and attach the log to PTP-BNK-05 by 09-Oct.' },
  takeLabel:'Request evidence', onTake:[{add:'cmp.evidence',v:0.4},{event:'Call-back evidence requested from treasury for 2 changes',tower:'CMP'}], takeToast:'Evidence request sent to Manish Gupta',
  links:[['Audit & evidence','screens/cmp/audit.html']] },
{ id:'CMP-REM-06', evidence:{table:{cols:['Fix action','Owner','Due','Status'],rows:[['Agree the GRNI review template and who signs it','Manish Gupta','31-Jul','Done 22-Aug, 22 d late'],['File the July GRNI review with sign-off','Manish Gupta','15-Aug','Open, 51 d late'],['File the August GRNI review with sign-off','Manish Gupta','15-Sep','Open, 20 d late']]}}, rootCause:'No reviewer was named when the fix was agreed, the review template was agreed 22 days late, and the monthly sign-off was never added to the close calendar.', tower:'CMP', entity:'Group', severity:'high', priority:50,
  title:'Repeat audit finding overdue by 41 days', subject:'F-2026-031 GRNI review evidence',
  impact:{valueCr:null, short:'41 days', label:'Overdue'}, due:'08-Oct', owner:'VS',
  what:'The statutory auditor raised this in FY26 and it is now a repeat finding. The fix is a signed monthly review of GRNI (goods received, not invoiced). The tower captures the review data automatically from July, but the July and August reviews are not yet signed by Manish Gupta, so the finding cannot be closed.',
  ai:{ confidence:0.85, short:'Close with system evidence; send to auditor', text:'Close F-2026-031 using the GRNI review evidence the tower captured for July to September, and send the pack to the auditor.' },
  override:[{label:'Extend the due date to 31-Oct (reason required)'}],
  takeLabel:'Close with evidence', onTake:[{add:'cmp.overdueRem',v:-1},{add:'findings.overdue',v:-1},{add:'audit.readiness',v:1},{event:'F-2026-031 closed with system evidence and sent to the auditor',tower:'CMP'}], takeToast:'Finding closed; evidence pack sent to the auditor',
  links:[['Issues & remediation','screens/cmp/issues.html']] },
{ id:'CMP-ANM-07', rootCause:'Vendor onboarding checks PAN and GST but not the bank account against the employee master, and the same supervisor requested the vendor and approved its payments.', tower:'CMP', also:['P2P'], entity:'IN-05', severity:'high', priority:60,
  title:'Vendor bank account matches an employee\'s salary account', subject:'V-310455 Shree Ganesh Services, 4 payments',
  impact:{valueCr:0.062, short:'₹6.2 L', label:'Paid in Sep'}, due:'Today 17:00', owner:'SK',
  trigger:'Anomaly model ANM-v1.2 (score 94) cross-matching vendor and payroll bank accounts',
  what:'The bank account of vendor V-310455 is the salary account of storekeeper stk.in05.07 (employee E-50417) at IN-05. The vendor was created on 02-Aug by mdm.in05.01 at the request of supervisor msharma.in05, who also approved all four September payments for "housekeeping services": 08-Sep ₹1.4 L, 15-Sep ₹1.6 L, 22-Sep ₹1.5 L and 29-Sep ₹1.7 L.',
  evidence:{ kv:[['Vendor','V-310455 Shree Ganesh Services, created 02-Aug'],['Match','Account ****6631, IFSC same branch'],['Payments','4 in Sep, ₹6.2 L total'],['Approver','msharma.in05, stores supervisor IN-05'],['Other links','Same employee handles CAT-09 catalyst (see SC-CNT-04)']] },
  ai:{ model:'ANM-v1.2', confidence:0.94, short:'Block vendor; investigate', text:'Block V-310455 for payment, preserve the vendor-creation and payment records, and open an Internal Audit investigation. Review it with SC-CNT-04 (₹1.86 Cr count shortage at IN-05), where the same storekeeper, stk.in05.07, handles the CAT-09 catalyst.' },
  gate:'Fraud cases are always handled by people; the controller cannot close them alone.',
  override:[{label:'Release: legitimate related-party arrangement (attach approval)'}],
  takeLabel:'Block vendor and investigate', onTake:[{add:'cmp.highRisk',v:-1},{event:'V-310455 blocked; IA investigation opened',tower:'CMP'}], takeToast:'Vendor blocked and Internal Audit case opened',
  escalateCase:'FRD-2026-012', links:[['Risk investigation desk','screens/cmp/investigation.html']] },
{ id:'CMP-REG-08', rootCause:'E-invoices are generated in a nightly batch only after dispatch is confirmed; at IN-02 and IN-04 dispatch is often confirmed late, so IRNs reach the portal after day 25.', tower:'CMP', also:['O2C'], entity:'Group', severity:'medium', priority:36,
  title:'New rule: e-invoices must be reported within 30 days', subject:'Effective 01-Nov-2026 (draft notification)',
  impact:{valueCr:null, short:'3 controls', label:'Impacted'}, due:'10-Oct', owner:'SK',
  what:'Invoices not reported to the IRP within 30 days will be rejected, so the customer cannot claim credit. It applies to taxpayers with turnover of ₹10 Cr or more. In September, 41 invoices were reported to the IRP after day 25: 24 at IN-02 and 17 at IN-04.',
  evidence:{ table:{cols:['Control','Change needed'], rows:[['CTL-O2C-005 e-invoice generation','Block posting after day 25 without IRN'],['CTL-O2C-008 credit-note IRN','Same window for credit notes'],['CTL-R2R-040 cut-off review','Flag late IRNs at month end']]} },
  ai:{ confidence:0.82, short:'Assign assessment; update 3 controls', text:'Assign the impact assessment to the indirect tax lead by 10-Oct and update the three controls before 01-Nov.' },
  gate:'Regulatory interpretation is always made by a person.',
  takeLabel:'Assign assessment', onTake:[{event:'E-invoice 30-day rule assessment assigned to Meera Joshi',tower:'CMP'}], takeToast:'Assessment assigned to Meera Joshi, due 10-Oct',
  links:[['Compliance overview','screens/cmp/executive.html']] },
{ id:'CMP-FND-09', evidence:{table:{cols:['Month','Balance to confirm (IN-07 with IN-01)','Sent','Status on 05-Oct'],rows:[['August','IC balances, 8 items','24-Sep (due 10-Sep)','Agreed, 14 days late'],['September','₹6.42 Cr IC receivable, 8 items','Not sent (due WD+2)','Not confirmed; blocks the IN-07 close (RTR-CLS-01)']]}}, rootCause:'Confirmations are sent manually by Anjali Kulkarni (IN-07) two to three weeks into the next month (July on 28-Aug, August on 24-Sep), after the counterparties have closed their own books, and there is no follow-up step.', tower:'CMP', entity:'Group', severity:'high', priority:48,
  title:'Repeat audit finding overdue by 15 days', subject:'F-2026-038 Intercompany confirmations not obtained',
  impact:{valueCr:null, short:'15 days', label:'Overdue'}, due:'08-Oct', owner:'HV',
  what:'The statutory auditor raised this in FY26 and it is now a repeat finding. IN-07 sends its intercompany (IC) confirmations by hand weeks after month end: the August confirmation with IN-01 went out on 24-Sep, 14 days late. The September confirmation of the ₹6.42 Cr IC receivable from IN-01 (8 items) has not been sent, so CTL-R2R-017 is failing and the IN-07 close is blocked (RTR-CLS-01).',
  ai:{ confidence:0.84, short:'Send the Sep confirmation; schedule WD+2', text:'Send the September confirmation of the ₹6.42 Cr receivable to IN-01 today, agree the 8 items, and schedule IC confirmations for WD+2 every month so F-2026-038 can close.' },
  override:[{label:'Extend the due date to 31-Oct (reason required)'}],
  takeLabel:'Send confirmation', onTake:[{event:'IN-07 September IC confirmation sent to IN-01 for F-2026-038',tower:'CMP'}], takeToast:'Confirmation sent to IN-01; Harish Verma owns the close',
  links:[['Findings register','screens/cmp/issues.html']] },
{ id:'CMP-FND-10', evidence:{table:{cols:['Type','Journals','Example'],right:[1],rows:[['Accrual','4','JE-26-091402 accrual reversal ₹4.2 L, no invoice copy'],['Reclass','3','JE-26-091417 ₹1.8 L, no approval mail'],['Provision','2','JE-26-091496 bonus provision ₹7.2 L, no HR sheet'],['Prepaid release','1','JE-26-091479 ₹3.1 L, no schedule'],['Write-back','1','JE-26-091524 ₹1.5 L, no workings']]}}, rootCause:'The journal workflow allows posting without an attachment, and the monthly review checks only journals above ₹10 L.', tower:'CMP', entity:'Group', severity:'medium', priority:42,
  title:'Repeat audit finding overdue by 5 days', subject:'F-2026-041 Manual journals without support',
  impact:{valueCr:null, short:'5 days', label:'Overdue'}, due:'08-Oct', owner:'AR',
  what:'Internal audit found manual journals posted without supporting documents. CTL-R2R-021 is failing at 97.40%: 11 September journals at IN-07 have no support (accruals, reclasses, provisions, a prepaid release and a write-back).',
  ai:{ confidence:0.86, short:'Block posting without attachment; close', text:'Make an attachment mandatory for manual journals above ₹5 L and close F-2026-041 with September as the first clean month.' },
  override:[{label:'Extend the due date to 31-Oct (reason required)'}],
  takeLabel:'Close with evidence', onTake:[{add:'findings.overdue',v:-1},{add:'audit.readiness',v:0.5},{event:'F-2026-041 closed; attachment made mandatory for manual journals',tower:'CMP'}], takeToast:'Finding closed; journal attachment rule switched on',
  links:[['Findings register','screens/cmp/issues.html']] },
{ id:'CMP-FND-11', evidence:{table:{cols:['Override','Customer','Date','Limit raised','Raised by'],rows:[['CL-OVR-2611','Helios Supply LLP','03-Jul','₹38 Cr → ₹43 Cr','tbrown.us01'],['CL-OVR-2614','Indigo Chem LLP','22-Jul','₹34 Cr → ₹38.5 Cr','tbrown.us01'],['CL-OVR-2618','Stonegate Labs AG','11-Aug','₹31 Cr → ₹36 Cr','tbrown.us01'],['CL-OVR-2620','Helios Supply LLP','29-Aug','₹43 Cr → ₹47 Cr','tbrown.us01'],['CL-OVR-2623','Maple Supply LLP','12-Sep','₹42 Cr → ₹57 Cr','tbrown.us01'],['CL-OVR-2627','Indigo Chem LLP','26-Sep','₹38.5 Cr → ₹41 Cr','tbrown.us01']]}}, rootCause:'The US-01 credit-limit screen allows a single billing analyst to raise a limit; the second-approval step was never configured after go-live.', tower:'CMP', entity:'US-01', severity:'medium', priority:40,
  title:'Repeat finding due 15-Oct: credit-limit overrides', subject:'F-2026-046 Credit limits overridden without approval, US-01',
  impact:{valueCr:null, short:'Repeat', label:'Due 15-Oct'}, due:'15-Oct', owner:'US01C',
  what:'Internal audit found credit-limit overrides at US-01 without a second approval: 6 in Q2, all raised by tbrown.us01 (billing analyst), each by ₹2.5 Cr to ₹15 Cr. CTL-O2C-011 is failing at 96.20%.',
  ai:{ confidence:0.83, short:'Add maker-checker on overrides', text:'Add a second approver for every credit-limit override at US-01 and review the Q2 overrides before closing F-2026-046.' },
  override:[{label:'Extend the due date to 31-Oct (reason required)'}],
  takeLabel:'Add approval step', onTake:[{event:'Maker-checker added to credit-limit overrides at US-01 (F-2026-046)',tower:'CMP'}], takeToast:'Approval step added; Tom Brennan reviews Q2 overrides',
  links:[['Findings register','screens/cmp/issues.html']] },
{ id:'CMP-FND-12', evidence:{table:{cols:['Job worker','Challans over 365 days','Goods value','Entity'],right:[1,2],rows:[['Deccan Pharma Services','17','₹0.4 Cr','IN-04'],['Sai Process Works','10','₹0.2 Cr','IN-03']]}}, rootCause:'Job-work challans are tracked in a spreadsheet at each plant; nobody owns the ageing, and the ITC-04 return is prepared from the ledger, not the challans.', tower:'CMP', entity:'Group', severity:'medium', priority:34,
  title:'Finding due 25-Oct: job-work challans not tracked', subject:'F-2026-049 Job-work challans over 365 days not tracked',
  impact:{valueCr:null, short:'New', label:'Due 25-Oct'}, due:'25-Oct', owner:'MJ',
  what:'The indirect tax review found 27 job-work challans older than 365 days (₹0.6 Cr of goods at Deccan Pharma Services and Sai Process Works, see SC-JWK-05) with no tracking. Goods not returned within a year are treated as supplied, so GST becomes payable.',
  ai:{ confidence:0.81, short:'Start an ageing report; clear old challans', text:'Run a monthly challan ageing report and clear or pay GST on challans over 365 days before closing F-2026-049.' },
  takeLabel:'Assign clean-up', onTake:[{event:'Job-work challan ageing and clean-up assigned to Meera Joshi (F-2026-049)',tower:'CMP'}], takeToast:'Clean-up assigned to Meera Joshi',
  links:[['Findings register','screens/cmp/issues.html']] },
{ id:'CMP-FND-13', evidence:{table:{cols:['Count','Counted by','Sheets','Independent counter'],rows:[['Cycle count 28–30 Sep','stk.in05.07 (custodian)','CNT-26-09-031 to 045','None']]}}, rootCause:'IN-05 has one storekeeper per store and no rota for an independent counter from finance.', tower:'CMP', entity:'IN-05', severity:'medium', priority:36,
  title:'Finding due 31-Oct: count not independent of custodian', subject:'F-2026-044 Inventory count not independent of custodian, IN-05',
  impact:{valueCr:null, short:'New', label:'Due 31-Oct'}, due:'31-Oct', owner:'IN05C',
  what:'Internal audit found that storekeeper stk.in05.07, the custodian at IN-05, also counted the stock in the 28–30 Sep cycle count (see SC-CNT-04). CTL-SC-006 is failing at 96.90%.',
  ai:{ confidence:0.85, short:'Independent counter for the October count', text:'Assign an independent counter from finance for the October cycle count at IN-05 and file the count sheets to close F-2026-044.' },
  takeLabel:'Assign counter', onTake:[{event:'Independent counter assigned for the October count at IN-05 (F-2026-044)',tower:'CMP'}], takeToast:'Independent counter assigned; Farhan Qureshi notified',
  links:[['Findings register','screens/cmp/issues.html']] },
{ id:'CMP-FND-14', evidence:{table:{cols:['Date','Change','Document','User'],rows:[['01-Sep 19:20','IN-05 price tolerance ±2% → ±5%','Config log CFG-26-0901-14','sys.admin02'],['01-Sep','No change ticket or finance approver','—','—'],['Sep','8 invoices force-matched above ±2% (₹3.15 L)','CMP-CTL-02','vkulkarni.in05, rnair.in05']]}}, rootCause:'Tolerance settings can be changed by an IT administrator without a change ticket or a finance approver (no maker-checker on match configuration).', tower:'CMP', entity:'Group', severity:'medium', priority:38,
  title:'Finding due 31-Oct: match tolerance changed without approval', subject:'F-2026-047 Three-way-match tolerance changed without approval',
  impact:{valueCr:null, short:'New', label:'Due 31-Oct'}, due:'31-Oct', owner:'VS',
  what:'Controls monitoring found the IN-05 three-way-match tolerance widened from ±2% to ±5% on 01-Sep by sys.admin02 without a change ticket. 8 invoices were force-matched under it in September (14 in Q2).',
  ai:{ confidence:0.87, short:'Restore tolerance; lock config changes', text:'Restore the approved tolerance, put tolerance changes under maker-checker, and review the 14 Q2 overrides before closing F-2026-047.' },
  takeLabel:'Restore and lock', onTake:[{event:'Match tolerance restored and locked under maker-checker (F-2026-047)',tower:'CMP'}], takeToast:'Tolerance restored; change control switched on',
  links:[['Findings register','screens/cmp/issues.html']] }
);
})();

/* Process chain per Compliance case: [step, when, document · who, broken (1) or not], shown in the case drawer.
   Built from the facts in each case record; the flagged step is where the control broke. */
(function(){
const CH = {
 'PTP-BNK-05':{ note:'The change reached approval before any call-back, while ₹1.12 Cr sat in the next payment run.', steps:[
   ['Change requested','03-Oct 16:42','E-mail from apexchem-in.co (master domain apexchem.in)',1],['Logged in vendor master','03-Oct','V-301776 · mdm.in02',0],
   ['Call-back to master number','Not done','+91 265 xxx 4410 · treasury',1],['Payment run','06-Oct','PR-20261006 · ₹1.12 Cr held',0],['Decision','Pending','PTP-BNK-05 · Manish Gupta',0]] },
 'PTP-DUP-03':{ note:'A second vendor code for the same vendor let invoice B match on its own.', steps:[
   ['Duplicate vendor created','11-Sep','V-207115 · no PAN / GSTIN check',1],['Invoice A paid','30-Sep','V-100482 · SPI/2526/0918',0],
   ['Invoice B booked','Sep','V-207115 · SPI-2526-918, same IRN, PO, GRN',1],['Payment run','06-Oct','PR-20261006 · invoice B blocked',0]] },
 'RTR-JNL-02':{ note:'Posted and approved within four minutes, without a document, eleven minutes before the period lock.', steps:[
   ['Journal posted','30-Sep 23:48','JE-IN05-0930-7781 · kverma.in05 · no attachment',1],['Approved','30-Sep 23:52','mdesai.in05',1],
   ['Period locked','30-Sep 23:59','September close',0],['Auto-reverses','01-Oct','Reversal of ₹2.40 Cr',0]] },
 'CMP-SOD-01':{ note:'The same user created the vendor and approved the payment to it.', steps:[
   ['Vendor created','14-Sep 10:12','VMR-26-4471 · pnair.in03',1],['PO raised','16-Sep','4500188210 · purch.in03',0],['Goods receipt','18-Sep','5000771120 · st.in03.02',0],
   ['Invoice posted','19-Sep','5105562301 · pnair.in03',0],['Payment approved','22-Sep 17:40','PR-20260922 · pnair.in03 · ₹18.7 L',1]] },
 'CMP-CTL-02':{ note:'The tolerance was widened without a change ticket, so the overrides needed no second approval.', steps:[
   ['Tolerance widened ±2% → ±5%','01-Sep 19:20','CFG-26-0901-14 · sys.admin02',1],['Invoices force-matched','04–29 Sep','8 invoices · vkulkarni.in05, rnair.in05',1],
   ['Paid','Sep payment runs','₹3.15 L variance accepted',0],['Detected','30-Sep','Controls monitoring',0]] },
 'CMP-ATT-03':{ note:'No reminder or escalation between the request and the due dates.', steps:[
   ['Attestation requested','15-Sep','E-mail to 6 control owners',0],['Reminder','None','No workflow step',1],['Due','29-Sep to 04-Oct','Q2 FY27',0],['Outstanding','05-Oct','6 of 120 unsigned',1]] },
 'RTR-PER-10':{ note:'Emergency access without finance sign-off opened a closed period.', steps:[
   ['Freight invoice','12-Sep','FRT-SEP-2231',0],['August closed and reported','Early Sep','Aug management pack',0],['Emergency access raised','01-Oct 17:05','EAR-0412 · vjain.in08',0],
   ['Approved without finance','01-Oct 17:30','EAR-0412 · it.ops03',1],['Posted into August','02-Oct 18:41','JE-IN08-1002-0071 · fin_admin (vjain.in08) · ₹0.42 Cr',1]] },
 'SC-CNT-04':{ note:'The storekeeper who holds the stock also counted it and posted the scrap.', steps:[
   ['Scrap posted','Sep','2 SKUs, no QA rejection note · stk.in05.07',1],['Cycle count','28–30 Sep','CNT-26-09-031 to 045 · stk.in05.07 alone',1],
   ['Variance found','30-Sep','₹1.86 Cr short, 72% in 3 SKUs',0],['Write-off proposed','Oct','Held pending recount',0]] },
 'SC-ADJ-12':{ note:'The ₹5 L limit applies per line, so 23 lines under it passed the control.', steps:[
   ['Adjustments posted','05–28 Sep','23 × ₹4.6–4.9 L · dc.sup04, 19 on Saturdays',1],['QA / insurance reference','None','"Damaged in handling"',1],
   ['Approval check','Passed','Each line under ₹5 L',0],['Flagged','Sep','Anomaly ANM-2026-0905, score 91',0]] },
 'SC-NPO-09':{ note:'With no framework PO, sites raise the PO after the invoice to get it paid.', steps:[
   ['Service delivered','Sep','Maintenance, logistics, lab',0],['Invoice received','Sep','₹14.7 Cr without a PO',1],['PO raised after invoice','Sep','384 invoices, most at IN-02',1],['Paid','Sep payment runs','No-PO-no-pay not enforced for services',0]] },
 'CMP-POL-04':{ note:'Splitting one job into three POs kept each under the L1 limit.', steps:[
   ['Requisition','24-Sep','Rewiring, IN-03 utilities block · maint.eng03',0],['Three POs raised','24-Sep','4500187561, 562, 563 · ₹9.8 L each',1],
   ['Approved at L1','24-Sep','Maintenance manager IN-03',1],['Required','—','Function head (L2) for ₹29.4 L',0]] },
 'CMP-EVD-05':{ note:'The decision was taken without the call-back log the auditor will sample.', steps:[
   ['Change requested','03-Oct 16:42','Apex Chem V-301776',0],['Change rejected','03-Oct','PTP-BNK-05',0],['Call-back log','Not on file','Manish Gupta, treasury',1],['Auditor sample','12-Oct','CTL-P2P-009',0]] },
 'CMP-REM-06':{ note:'The review data exists, but no one signs it.', steps:[
   ['Finding raised','FY26 audit','F-2026-031 · statutory auditor',0],['Template agreed','22-Aug (due 31-Jul)','Manish Gupta',1],
   ['Jul–Sep review data','Captured','Tower, automatically',0],['Monthly sign-off','Not done','Jul and Aug · Manish Gupta',1],['Finding due','25-Aug','41 days overdue',0]] },
 'CMP-ANM-07':{ note:'The supervisor who requested the vendor approved every payment to it.', steps:[
   ['Vendor requested','Aug','msharma.in05, stores supervisor',1],['Vendor created','02-Aug','V-310455 · mdm.in05.01 · account ****6631 = salary account of stk.in05.07',1],
   ['Payments approved','08, 15, 22, 29 Sep','₹1.4, 1.6, 1.5, 1.7 L · msharma.in05',1],['Flagged','Sep','Anomaly ANM-2026-0912, score 94',0]] },
 'CMP-REG-08':{ note:'Late dispatch confirmation delays the IRN past the new 30-day limit.', steps:[
   ['Dispatch confirmed','Late at IN-02, IN-04','Sales operations',1],['IRN generated','Nightly batch','After dispatch',0],['Reported after day 25','Sep','41 invoices: 24 IN-02, 17 IN-04',1],['New rule effective','01-Nov-2026','Assessment due 10-Oct',0]] },
 'CMP-FND-09':{ note:'Requests go out after the counterparties have closed their books.', steps:[
   ['Month end','31-Aug','IN-07 intercompany',0],['Requests sent','24-Sep (due 10-Sep)','Anjali Kulkarni',1],['Follow-up','None','No step in the close',1],['Missing on 05-Oct','Aug','EU-01, US-01, IN-06',0]] },
 'CMP-FND-10':{ note:'The workflow lets a journal post without its support.', steps:[
   ['Journals posted','03–30 Sep','11 at IN-07 · rkapoor.in07, akumar.in07',1],['Attachment check','None','Workflow allows posting',1],['Monthly review','Only > ₹10 L','None of the 11 reviewed',0],['Finding','Internal audit Q1','F-2026-041',0]] },
 'CMP-FND-11':{ note:'One analyst can raise a limit with no second approval.', steps:[
   ['Limit raised','03-Jul to 26-Sep','6 overrides · tbrown.us01',1],['Second approval','Not configured','US-01 credit screen',1],['Orders shipped','Q2','Against the higher limits',0],['Finding','Internal audit Q2','F-2026-046',0]] },
 'CMP-FND-12':{ note:'Nobody owns the challan ageing, so goods past one year were not chased.', steps:[
   ['Goods sent','Over 365 days ago','27 challans · Deccan Pharma Services, Sai Process Works',0],['Tracking','Spreadsheet per plant','No owner',1],['ITC-04','From the ledger','Not from the challans',1],['Finding','Indirect tax review','F-2026-049',0]] },
 'CMP-FND-13':{ note:'The custodian counted their own stock.', steps:[
   ['Stock held','IN-05 stores','stk.in05.07',0],['Count','28–30 Sep','stk.in05.07 alone, no independent counter',1],['Shortage','30-Sep','₹1.86 Cr (SC-CNT-04)',0],['Finding','Internal audit Q2','F-2026-044',0]] },
 'CMP-FND-14':{ note:'Configuration changed without maker-checker.', steps:[
   ['Tolerance changed','01-Sep 19:20','±2% → ±5% · sys.admin02',1],['Change ticket','None','No finance approver',1],['Force-matched','Sep','8 invoices, ₹3.15 L',0],['Finding','Controls monitoring','F-2026-047',0]] }
};
Object.keys(CH).forEach(id=>{ const x = (window.FCT_DATA.exceptions||[]).find(e=> e.id===id); if(x){ x.chain = CH[id].steps; x.chainNote = CH[id].note; } });
})();

/* Contract compliance cases (Controls › Contract compliance) */
(function(){
const D = window.FCT_DATA;
D.exceptions.push(
{ id:'CMP-RPT-15', tower:'CMP', also:['P2P'], entity:'IN-03', severity:'high', priority:57,
  title:'Related-party purchases without approval: Nova Packaging', subject:'4 POs since 21-Aug · related from 18-Aug',
  impact:{valueCr:1.36, short:'₹1.36 Cr', label:'Without approval'}, due:'17-Nov', owner:'SK',
  what:'On 18-Aug the spouse of director R. Shah acquired 26% of Nova Packaging Pvt Ltd, which supplies corrugated shipper boxes to IN-03, making it a related party (Ind AS 24). IN-03 then raised 4 POs to Nova (21-Aug ₹38.0 L and 04-Sep ₹31.5 L, both paid; 17-Sep ₹36.2 L, received not paid; 29-Sep ₹30.3 L, open) at ₹18.4 per box against ₹16.9 from the previous supplier (+9%), with no Audit Committee approval (s.177(4)(iv), LODR Reg 23(2)); s.188 applies only if the terms are not at arm’s length.',
  rootCause:'The related-party register is updated once a year from director declarations. R. Shah disclosed the change in interest to the company under s.184 (Form MBP-1) on 28-Aug, but the disclosure was not passed to procurement or to the vendor master.',
  trigger:'Related-party screening on 30-Sep matched Nova Packaging’s shareholders to the MBP-1 disclosure received on 28-Aug',
  evidence:{table:{cols:['Date','Event','Document','By'],rows:[['18-Aug','Spouse of R. Shah acquires 26% of Nova Packaging','Share-transfer record (disclosed 28-Aug)','—'],['21-Aug','PO 4500188020, ₹38.0 L (paid 20-Sep)','PO','purch.in03'],['28-Aug','Change in interest disclosed to the company (s.184)','Form MBP-1','R. Shah'],['04-Sep','PO 4500188144, ₹31.5 L (paid 30-Sep)','PO','purch.in03'],['17-Sep','PO 4500188251, ₹36.2 L (received, not paid)','PO','purch.in03'],['29-Sep','PO 4500188377, ₹30.3 L (open)','PO','purch.in03']]}},
  ai:{ confidence:0.9, short:'Hold new POs; table for ratification', text:'Sameer Khan to hold new POs to Nova Packaging, confirm arm’s-length pricing against two other packaging bids, and table the 4 transactions at the 30-Oct Audit Committee for ratification (R. Shah to abstain), before 17-Nov (three months from the date Nova became related, counted conservatively).' },
  gate:'Related-party approval and ratification sit with the Audit Committee; the controller cannot approve them.',
  takeLabel:'Hold and table for ratification', onTake:[{event:'Nova Packaging POs held; 4 transactions tabled for Audit Committee ratification',tower:'CMP'}], takeToast:'POs held; tabled for the 30-Oct Audit Committee',
  towers:[['CMP','Detects the related party and takes the 4 POs to the Audit Committee for ratification','screens/cmp/controls.html'],['P2P','Raised and paid the POs at IN-03; holds new POs to Nova Packaging','screens/p2p/desk.html?x=CMP-RPT-15']],
  links:[['Contract compliance','screens/cmp/controls.html']] },
{ id:'CMP-CON-16', tower:'CMP', also:['P2P'], entity:'Group', severity:'medium', priority:46,
  title:'Payments made without a valid contract', subject:'23 payments to 4 vendors, Q2 FY27',
  impact:{valueCr:null, short:'23 payments', label:'No valid contract'}, due:'31-Oct', owner:'VS',
  what:'In Q2, 23 payments went to 4 vendors whose contract had expired or did not exist: Bharat Electricals, electrical spares at IN-03 (MSA-IN03-0712 expired 30-Jun, 9 payments, billed 6% above the old rates), Shree Packaging Industries, cartons at IN-04 (RC-IN04-0441 expired 31-Jul, 6 payments at old rates), Chetak Logistics, freight at IN-08 (RC-IN08-0219 expired 15-Aug, 5 payments with a 4% fuel surcharge the contract does not allow) and Vertex Lab Supplies, lab reagents at IN-07 (no contract, 3 spot buys above ₹10 L on single quotes).',
  rootCause:'Contract end dates are kept by Legal and are not linked to the vendor master, so the payment run does not check contract validity; renewals were left to the buying sites.',
  trigger:'Contract-validity test of Q2 payments against the contract register',
  evidence:{table:{cols:['Vendor','Bought','Entity','Contract','Expired','Payments since','Price','Owner','Why'],rows:[['Bharat Electricals','Electrical spares, motor rewinding','IN-03','MSA-IN03-0712','30-Jun','9','+6% on old rates','K. Pillai','Renewal draft with Legal since 12-Jun'],['Shree Packaging Industries','Corrugated cartons','IN-04','RC-IN04-0441','31-Jul','6','Old rates','D. Rao','New tender not concluded'],['Chetak Logistics','Outbound freight','IN-08','RC-IN08-0219','15-Aug','5','+4% fuel surcharge','P. Das','Extension letter requested 10-Aug, not signed'],['Vertex Lab Supplies','Lab reagents','IN-07','No contract','—','3','Single quote','S. Nair','Spot buys above the ₹10 L threshold']]}},
  ai:{ confidence:0.86, short:'Block until renewed; link expiry to vendor master', text:'Block further payments to the 4 vendors until a valid contract or a signed extension is on file, and load contract end dates into the vendor master so the payment run stops at expiry.' },
  gate:'Blocking a vendor sits with Procurement; release needs Legal’s confirmation of a valid contract.',
  takeLabel:'Block until renewed', onTake:[{event:'Payments to 4 vendors blocked pending valid contracts',tower:'CMP'}], takeToast:'4 vendors blocked until contracts are renewed',
  towers:[['CMP','Runs the contract-validity test on every payment','screens/cmp/controls.html'],['P2P','Vendor master and payment runs; blocks the 4 vendors until contracts are renewed','screens/p2p/desk.html?x=CMP-CON-16']],
  links:[['Contract compliance','screens/cmp/controls.html']] },
{ id:'CMP-DOA-17', tower:'CMP', also:['P2P','R2R'], entity:'Group', severity:'medium', priority:44,
  title:'Contracts signed above the signatory’s authority', subject:'2 of 120 contracts, Q2 FY27',
  impact:{valueCr:null, short:'2 contracts', label:'Above authority'}, due:'31-Oct', owner:'SK',
  what:'Two contracts were signed above the signatory’s delegated authority: SVC-IN05-2207 (3-year reactor maintenance, Precision Engineering Works, ₹2.4 Cr) signed on 12-Aug by vkapoor.in05, plant head IN-05, whose limit is ₹1 Cr (CFO required); and LSE-IN02-0091 (3-year warehouse lease, Ganesh Estates, ₹1.8 Cr) signed on 03-Sep by rjoshi.in02, GM administration IN-02, whose limit is ₹0.5 Cr (CFO and Board required under the DoA matrix). Payments have already started: ₹20.0 L on SVC-IN05-2207 (16-Sep) and ₹15.0 L deposit plus ₹5.0 L rent on LSE-IN02-0091 (09-Sep, 30-Sep).',
  rootCause:'Contract signing is outside the approval workflow: signatories sign paper contracts against a DoA matrix in a PDF. The lease was drafted by IN-02 administration and went straight to the GM without a finance value check, and the reactor contract was judged on its annual amount (₹0.8 Cr) instead of the ₹2.4 Cr full term.',
  trigger:'Delegation-of-authority test of Q2 contracts against the signatory matrix',
  evidence:{table:{cols:['Contract','Counterparty','Value','Signed','Signatory limit','Required'],rows:[['SVC-IN05-2207','Precision Engineering Works','₹2.4 Cr (3 yrs)','12-Aug, vkapoor.in05','₹1 Cr','CFO'],['LSE-IN02-0091','Ganesh Estates','₹1.8 Cr (3 yrs)','03-Sep, rjoshi.in02','₹0.5 Cr','CFO and Board, per DoA matrix']]}},
  ai:{ confidence:0.84, short:'Ratify both; move signing into workflow', text:'Get CFO ratification for SVC-IN05-2207 and CFO plus Board ratification for LSE-IN02-0091 before the next payments, and route contract signing through the approval workflow using the full-term value.' },
  gate:'Ratification above the signatory’s authority sits with the CFO and, for the lease, the Board.',
  takeLabel:'Seek ratification', onTake:[{event:'Ratification requested for SVC-IN05-2207 and LSE-IN02-0091',tower:'CMP'}], takeToast:'Ratification requested from the CFO (and Board for the lease)',
  towers:[['CMP','Runs the delegation-of-authority test on signed contracts','screens/cmp/controls.html'],['P2P','Paid ₹20.0 L on SVC-IN05-2207 and ₹15.0 L deposit plus ₹5.0 L rent on LSE-IN02-0091; holds further payments until ratified','screens/p2p/desk.html?x=CMP-DOA-17'],['R2R','Books LSE-IN02-0091 as a lease (right-of-use asset and lease liability, Ind AS 116)','screens/r2r/journals.html?x=CMP-DOA-17']],
  links:[['Contract compliance','screens/cmp/controls.html']] },
/* Vendor master cases (Controls › failing controls CTL-P2P-021, CTL-P2P-024) */
{ id:'CMP-VMD-18', tower:'CMP', also:['P2P'], entity:'IN-03', severity:'medium', priority:45,
  title:'Vendor master checks failing at IN-03', subject:'62 of 888 vendors, re-validation run of 30-Sep',
  impact:{valueCr:null, short:'62 vendors', label:'Failing checks'}, due:'31-Oct', owner:'VS',
  what:'The 30-Sep re-validation of IN-03’s 888 active vendors against the GST portal, the income-tax PAN service and the Udyam (MSME) register failed 62 vendors on five checks: 14 GSTINs cancelled or suspended, 11 PANs inoperative, 19 vendor names not matching the PAN, 12 Udyam certificates missing or not re-verified and 6 bank accounts failing the penny-drop test. The two that cost money now: invoices from a cancelled GSTIN carry no input tax credit, and payments to an inoperative PAN need TDS at 20% (s.206AA) where IN-03 deducted the normal rate.',
  rootCause:'Vendor data is validated only when a vendor is created. The quarterly re-validation was not run at IN-03 after vendor master maintenance moved to the shared service centre on 01-Jun; the job stayed with the old site role, which was closed. 41 of the 62 failures arose after 01-Jun.',
  trigger:'Vendor master re-validation, 30-Sep, control CTL-P2P-021',
  evidence:{table:{cols:['Check','Vendors','Example','Since','Effect'],rows:[
    ['GSTIN cancelled or suspended','14','V-204118 Sai Krupa Traders, GSTIN cancelled 12-Aug','Jul–Sep','2 invoices since cancellation (₹3.4 L, ₹2.9 L): no input tax credit'],
    ['PAN inoperative (not linked to Aadhaar)','11','V-205541 R.K. Transport, inoperative from 01-Jul','01-Jul','TDS deducted at 2%, 20% required (s.206AA) on 5 payments'],
    ['Vendor name ≠ name on PAN','19','V-201902 “Laxmi Engg Works” vs PAN “Lakshmi Engineering Works Pvt Ltd”','Since creation','TDS and GST returns filed under the wrong name'],
    ['Udyam (MSME) not re-verified','12','V-203310 Kaveri Polymers, last verified Mar-24','FY25','45-day payment rule may be applied wrongly (CTL-P2P-031)'],
    ['Bank account fails penny-drop','6','V-208812 Nirmal Supplies, account name “N. Kumar”','Aug–Sep','Payment may reach a person, not the vendor']]}},
  ai:{ confidence:0.88, short:'Block the 31 tax-risk vendors; correct the rest', text:'Block payment to the 14 cancelled-GSTIN and 11 inoperative-PAN vendors and the 6 failed bank accounts until corrected; recover the TDS shortfall on R.K. Transport and the other inoperative-PAN payments before the Q3 TDS return; correct the 19 names and refresh the 12 Udyam certificates; and give the quarterly re-validation job to the shared service centre.' },
  gate:'Vendor master changes go through MDM maker-checker; blocking a vendor sits with Procurement IN-03.',
  takeLabel:'Block and correct', onTake:[{event:'31 IN-03 vendors blocked pending master-data correction; re-validation job reassigned to the shared service centre',tower:'CMP'}], takeToast:'31 vendors blocked; corrections assigned',
  towers:[['CMP','Runs the re-validation test and tracks the corrections','screens/cmp/controls.html'],['P2P','Vendor master (MDM) and payment blocks at IN-03','screens/p2p/vendors.html?x=CMP-VMD-18'],['R2R','TDS shortfall on inoperative PANs and input tax credit on cancelled GSTINs','screens/r2r/journals.html?x=CMP-VMD-18']],
  links:[['Control library','screens/cmp/controls.html']] },
{ id:'CMP-DUP-19', tower:'CMP', also:['P2P'], entity:'IN-04', severity:'medium', priority:43,
  title:'Duplicate vendor records active at IN-04', subject:'3 pairs; one pair shares a bank account across two different PANs',
  impact:{valueCr:null, short:'3 pairs', label:'Duplicate vendors'}, due:'31-Oct', owner:'VS',
  what:'Three vendors at IN-04 each have a second, active vendor code. Sharda Chemicals (V-401122 and V-409870, same PAN and bank account): the same invoice SC/2627/118 for ₹2.6 L was posted under both codes, and the second posting was stopped by the duplicate-invoice check on 22-Aug. Balaji Transport (V-402455 and V-410203, same GSTIN and address): only the new code is paid. Unity Packaging (V-403318) and Unity Pack Solutions (V-410577) have different PANs but the same bank account ****5520, so two legal entities are being paid into one account.',
  rootCause:'The duplicate check at vendor creation compares names only, not PAN, GSTIN or bank account, so a small change in the name (“Chemical Co”, “Shri”, “Pack Solutions”) creates a new code without a warning.',
  trigger:'Duplicate-vendor test on PAN, GSTIN and bank account, 30-Sep, control CTL-P2P-024',
  evidence:{table:{cols:['Original code','Second code','What matches','Second code created','Paid in Q2'],rows:[
    ['V-401122 Sharda Chemicals','V-409870 Sharda Chemical Co','PAN and bank ****2207','14-Jul, mdm.in04.02 (request: purch.in04.03)','Both; invoice SC/2627/118 ₹2.6 L posted twice, second blocked 22-Aug'],
    ['V-402455 Balaji Transport','V-410203 Shri Balaji Transport Co','GSTIN and address','02-Aug, mdm.in04.01','New code only, 3 payments'],
    ['V-403318 Unity Packaging','V-410577 Unity Pack Solutions','Bank ****5520 only; PANs differ','19-Sep, mdm.in04.01','New code, 1 payment of ₹1.9 L on 26-Sep']]}},
  ai:{ confidence:0.85, short:'Merge two pairs; verify Unity before paying', text:'Block the second codes V-409870 and V-410203 and move open items to the original codes; hold V-410577 and verify with Unity Packaging, by call-back, why a different company is paid into the same account ****5520; and add PAN, GSTIN and bank-account matching to the vendor-creation check.' },
  gate:'Merging or blocking vendor codes sits with MDM and Procurement IN-04; the Unity verification goes to Treasury.',
  takeLabel:'Block duplicates and verify', onTake:[{event:'V-409870 and V-410203 blocked; V-410577 held for bank-account verification',tower:'CMP'}], takeToast:'2 duplicate codes blocked; Unity held for verification',
  towers:[['CMP','Runs the duplicate-vendor test','screens/cmp/controls.html'],['P2P','Vendor master (MDM) at IN-04: blocks and merges the codes','screens/p2p/vendors.html?x=CMP-DUP-19']],
  links:[['Control library','screens/cmp/controls.html']] }
);
const CH = {
 'CMP-RPT-15':{ note:'The change in interest never reached procurement, so POs continued without approval.', steps:[['Became related','18-Aug','Spouse of R. Shah acquires 26%',1],['First PO','21-Aug','4500188020 · ₹38.0 L · purch.in03',1],['Interest declared','28-Aug','Form MBP-1 · R. Shah',0],['Register not updated','—','Procurement and vendor master not told',1],['Three more POs','04, 17, 29 Sep','₹31.5 L, ₹36.2 L, ₹30.3 L',1]] },
 'CMP-CON-16':{ note:'The payment run cannot see contract end dates.', steps:[['Contract expires','30-Jun to 15-Aug','3 contracts; 1 vendor never had one',0],['Vendor stays active','—','Vendor master not linked to Legal',1],['Invoices posted','Jul–Sep','Against expired terms',0],['Paid','Jul–Sep payment runs','23 payments, 4 vendors',1]] },
 'CMP-VMD-18':{ note:'Re-validation stopped when the job’s owner role was closed on 01-Jun.', steps:[['Vendor created','Before Jun','Checked once at creation',0],['Role moved','01-Jun','Vendor master to shared service centre',0],['Re-validation','Jul–Sep','Not run: owner role closed',1],['Vendor data goes stale','Jul–Sep','41 new failures',1],['Paid','Jul–Sep','Wrong TDS, no input tax credit',1]] },
 'CMP-DUP-19':{ note:'The creation check matches names only.', steps:[['New code requested','14-Jul, 02-Aug, 19-Sep','Name slightly changed',0],['Duplicate check','At creation','Name only; PAN, GSTIN, bank not compared',1],['Second code active','Jul–Sep','3 pairs',1],['Paid','Q2','Sharda invoice posted twice (second blocked); Unity paid into a shared account',1]] },
 'CMP-DOA-17':{ note:'Contracts are signed outside the workflow and checked on their annual value, not the full-term value.', steps:[['Contract drafted','Aug–Sep','3-year terms',0],['Value check','Lease: none · reactor: annual ₹0.8 Cr only','Not on the full term',1],['Signed above authority','12-Aug, 03-Sep','vkapoor.in05, rjoshi.in02',1],['Payments started','Sep','No ratification on file',0]] } };
Object.keys(CH).forEach(id=>{ const x = D.exceptions.find(e=> e.id===id); if(x){ x.chain = CH[id].steps; x.chainNote = CH[id].note; } });
/* every Compliance case: how it was detected, an exact due date, and the towers that act on it ([tower, role, screen]) */
const CMPX = 'screens/cmp/controls.html', P2PD = (id)=> 'screens/p2p/desk.html?x='+id;
const PATCH = {
  'CMP-SOD-01':{ due:'08-Oct', whatFix:['No other fraud indicators were found.','Other fraud checks were clear: the vendor’s bank account, PAN and address match no employee, and pnair.in03 made no other vendor changes in Q2.'],
    towers:[['CMP','Monitors segregation of duties and decides risk acceptance',CMPX],['P2P','Vendor V-310992 and the ₹18.7 L payment ran through P2P; removes Payment run approve (ACR-2291)',P2PD('CMP-SOD-01')]] },
  'CMP-CTL-02':{ due:'09-Oct', impact:{valueCr:0.0315, short:'₹3.15 L', label:'Sep variance above ±2%'}, trigger:'Controls monitoring of CTL-P2P-014, 30-Sep: invoices force-matched above the approved ±2% tolerance',
    towers:[['CMP','Tests CTL-P2P-014 and tracks the fix',CMPX],['P2P','IN-05 accounts payable force-matched the 8 invoices; restores ±2% and restricts the override role',P2PD('CMP-CTL-02')]] },
  'CMP-ATT-03':{ due:'07-Oct', trigger:'Attestation tracker, 05-Oct: 6 of 120 Q2 attestations unsigned after their due date',
    towers:[['CMP','Runs the Q2 attestation cycle and escalates to the CFO after 48 hours',CMPX],['P2P','CTL-P2P-009 (Manish Gupta), CTL-P2P-022 (Shalini Desai)',P2PD('CMP-ATT-03')],['R2R','CTL-R2R-017 (Anjali Kulkarni), CTL-R2R-030 (Lata Krishnan)','screens/r2r/desk.html?x=CMP-ATT-03#kpi=progress'],['SC','CTL-SC-006 (Farhan Qureshi)','screens/sc/desk.html?x=CMP-ATT-03#kpi=ira'],['O2C','CTL-O2C-011 (Tom Brennan)','screens/o2c/desk.html?x=CMP-ATT-03#kpi=credit']] },
  'CMP-POL-04':{ towers:[['CMP','Policy rule CMP-01 found the split',CMPX],['P2P','Raised and approved the 3 POs; routes them to the function head and adds the aggregation rule',P2PD('CMP-POL-04')]] },
  'CMP-EVD-05':{ trigger:'Evidence-pack check, 05-Oct: the CTL-P2P-009 decision on Apex Chem has no call-back log attached',
    towers:[['CMP','Holds the evidence pack the auditor samples on 12-Oct',CMPX],['P2P','Treasury makes the call-back and attaches the log to PTP-BNK-05',P2PD('PTP-BNK-05')]] },
  'CMP-REM-06':{ trigger:'Findings tracker: F-2026-031 past its 25-Aug due date',
    towers:[['CMP','Tracks F-2026-031 and sends the closure pack to the auditor',CMPX],['R2R','Signs the July and August GRNI reviews in the month-end close','screens/r2r/desk.html?x=CMP-REM-06#kpi=progress']] },
  'CMP-ANM-07':{ towers:[['CMP','Anomaly model found the match; Internal Audit investigates',CMPX],['P2P','Blocks V-310455 and holds its payments','screens/p2p/desk.html?x=CMP-ANM-07'],['SC','Same storekeeper, stk.in05.07, in the ₹1.86 Cr count shortage (SC-CNT-04)','screens/sc/desk.html?x=SC-CNT-04#kpi=ira']] },
  'CMP-REG-08':{ trigger:'Regulatory watch: GST draft notification REG-2026-019, effective 01-Nov-2026',
    towers:[['CMP','Assesses the rule and updates the 3 controls',CMPX],['O2C','Generates e-invoices; fixes late dispatch confirmation at IN-02 and IN-04','screens/o2c/desk.html?x=CMP-REG-08#kpi=billing'],['R2R','Flags late IRNs in the month-end cut-off review (CTL-R2R-040)','screens/r2r/desk.html?x=CMP-REG-08#kpi=progress']] },
  'CMP-FND-09':{ trigger:'Findings tracker: F-2026-038 past its 20-Sep due date',
    towers:[['CMP','Tracks F-2026-038 to closure',CMPX],['R2R','Sends and follows up the IC confirmations','screens/r2r/desk.html?x=CMP-FND-09#kpi=ic']] },
  'CMP-FND-10':{ trigger:'Findings tracker: F-2026-041 past its 30-Sep due date',
    towers:[['CMP','Tracks F-2026-041 to closure',CMPX],['R2R','Attaches support to the 11 journals and makes attachments mandatory','screens/r2r/journals.html?x=CMP-FND-10']] },
  'CMP-FND-11':{ trigger:'Internal audit Q2 review of US-01 credit-limit overrides (F-2026-046)',
    towers:[['CMP','Tracks F-2026-046 to closure',CMPX],['O2C','Adds the second approver on the US-01 credit-limit screen','screens/o2c/desk.html?x=CMP-FND-11#kpi=credit']] },
  'CMP-FND-12':{ trigger:'Indirect tax review of job-work challan ageing for the ITC-04 return (F-2026-049)',
    towers:[['CMP','Tracks F-2026-049 to closure',CMPX],['SC','Recovers or clears the 27 challans at Deccan Pharma Services and Sai Process Works','screens/sc/desk.html?x=SC-JWK-05#kpi=ira'],['R2R','Pays GST on goods treated as supplied and files ITC-04 from the challans','screens/r2r/desk.html?x=CMP-FND-12#kpi=progress']] },
  'CMP-FND-13':{ trigger:'Internal audit Q2 observation of the 28–30 Sep cycle count at IN-05 (F-2026-044)',
    towers:[['CMP','Tracks F-2026-044 to closure',CMPX],['SC','Names a finance counter for the October count at IN-05','screens/sc/desk.html?x=CMP-FND-13#kpi=ira']] },
  'CMP-FND-14':{ trigger:'Controls monitoring: configuration change CFG-26-0901-14 with no change ticket (F-2026-047)',
    towers:[['CMP','Tracks F-2026-047 to closure',CMPX],['P2P','Restores the ±2% tolerance and puts match configuration under maker-checker',P2PD('CMP-FND-14')]] } };
/* headline figure on every case states its base ("out of what") */
const IMP = { 'CMP-SOD-01':['₹18.7 L','1 payment to V-310992 through the conflict'], 'CMP-CTL-02':['₹3.15 L','Variance above ±2% on 8 invoices in September'],
  'CMP-ATT-03':['6 of 120','Q2 attestations overdue'], 'CMP-POL-04':['₹29.4 L','3 POs of ₹9.8 L; L1 limit ₹10 L each'],
  'CMP-EVD-05':['1 of 1','Call-back log missing (Apex Chem, 03-Oct)'], 'CMP-REM-06':['41 days','Overdue (due 25-Aug)'],
  'CMP-ANM-07':['₹6.2 L','4 payments in Sep to V-310455'], 'CMP-REG-08':['3 controls','To change before 01-Nov'],
  'CMP-FND-09':['15 days','Overdue (due 20-Sep)'], 'CMP-FND-10':['5 days','Overdue (due 30-Sep)'],
  'CMP-FND-11':['6 overrides','Q2, none with a second approval'], 'CMP-FND-12':['27 challans','Over 365 days, ₹0.6 Cr of goods'],
  'CMP-FND-13':['1 of 1','Q2 count at IN-05 not independent'], 'CMP-FND-14':['1 change','±2% → ±5% with no change ticket'],
  'CMP-RPT-15':['₹1.36 Cr','4 of 4 POs to Nova without approval'], 'CMP-CON-16':['23 of 3,412','Q2 payments without a valid contract'],
  'CMP-DOA-17':['2 of 120','Q2 contracts signed above authority'], 'CMP-VMD-18':['62 of 888','IN-03 vendors failing checks'],
  'CMP-DUP-19':['3 pairs','6 active codes for 3 vendors'] };
Object.keys(IMP).forEach(id=>{ const x = D.exceptions.find(e=> e.id===id); if(x) x.impact = Object.assign({}, x.impact, { short:IMP[id][0], label:IMP[id][1] }); });
const ANM = D.exceptions.find(e=> e.id==='CMP-ANM-07'); if(ANM) ANM.due = '05-Oct 17:00';
Object.keys(PATCH).forEach(id=>{ const x = D.exceptions.find(e=> e.id===id), p = PATCH[id]; if(!x) return;
  if(p.whatFix && x.what) x.what = x.what.replace(p.whatFix[0], p.whatFix[1]);
  ['due','impact','trigger','towers'].forEach(k=> { if(p[k]) x[k] = p[k]; }); });
})();
