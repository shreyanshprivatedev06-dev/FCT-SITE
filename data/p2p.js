/* FCT demo data — Procure to Pay tower (source: fct details/4_P2P.docx, values in the shared universe). */
(function(){
const D = window.FCT_DATA;
D.metrics = Object.assign(D.metrics, {
  'p2p.pot':87.0, 'p2p.riskScore':34, 'p2p.apprCycle':3.8, 'p2p.apprCompliance':96.4, 'p2p.onbCycle':9.5, 'p2p.ftr':72, 'p2p.dupVendors':18,
  'p2p.dq':91.2, 'p2p.excRate':18.6, 'p2p.touchless':61.4, 'p2p.autoMatch':74.2, 'p2p.procDays':4.6, 'p2p.liabScore':82, 'p2p.closeReady':78,
  'p2p.auditReady':89, 'p2p.evidence':98.7, 'p2p.slaAdh':91, 'p2p.opps':14, 'p2p.valueId':12.50, 'p2p.valueReal':5.81, 'p2p.apprPending':42,
  'p2p.lpr.risk':82, 'p2p.auditPack':0
});
D.p2p = {
  invoicesSep:14620, touchlessSep:8977,
  trend:{ months:['Apr','May','Jun','Jul','Aug','Sep'], touchless:[48.2,51.0,53.9,56.8,59.1,61.4], autoMatch:[63.0,65.8,68.1,70.4,72.6,74.2], excRate:[26.4,25.1,23.0,21.7,20.2,18.6], pot:[82,83,84,85,86,87], blockedCr:[24.1,26.3,27.9,29.4,30.6,32.0] },
  /* invoice funnel, September (counts) */
  /* where September invoices leave the touchless path: 14,620 − 2,719 exceptions − 2,924 manual approvals = 8,977 touchless */
  funnel:[ ['Capture: low-confidence field',412], ['Coding: GL or cost centre unclear',388], ['Matching: price, quantity or GR',1633], ['Approval: SLA breached',286], ['Manual approval above auto-limit',2924] ],
  excTotal:2719,
  clusters:[
    {cause:'GR not posted at 3 plants',share:42,count:1136,cr:18.6,trend:'Rising',rc:'RC-01',owner:'Plant heads'},
    {cause:'Price per unit differs from PO (unit of measure)',share:19,count:528,cr:2.3,trend:'Stable',rc:'RC-08',owner:'Buyers'},
    {cause:'PO raised after invoice',share:13,count:362,cr:4.4,trend:'Falling',rc:'RC-03',owner:'Procurement'},
    {cause:'Freight GL mis-coding',share:11,count:304,cr:1.9,trend:'Rising',rc:'RC-06',owner:'AP and GL'},
    {cause:'Duplicate submission across channels',share:4,count:112,cr:0.9,trend:'Stable',rc:'RC-02',owner:'MDM lead'},
    {cause:'Other',share:10,count:277,cr:3.9,trend:'Stable',rc:'',owner:'AP'}
  ],
  duplicatesPrevented:[
    {d:'05-Oct',vendor:'Shree Packaging Industries',inv:'SPI-2526-918',amt:0.486,score:96,ex:'PTP-DUP-03',status:'Open'},
    {d:'30-Sep',vendor:'Rajdhani Logistics',inv:'RL/0926/4412',amt:0.061,score:98,status:'Blocked'},
    {d:'18-Sep',vendor:'Coastal Packaging Pvt Ltd',inv:'CP-88120',amt:0.212,score:91,status:'Blocked'},
    {d:'04-Sep',vendor:'Mehta Instruments',inv:'MI/2526/301',amt:0.094,score:88,status:'Blocked'},
    {d:'21-Aug',vendor:'Sai Industrial Gases',inv:'SIG-7731',amt:0.387,score:95,status:'Blocked'}
  ],
  /* approval requests (non-exception workflow items) */
  approvals:[
    {id:'APR-88412',type:'Invoice',ref:'Sterling Gases Ltd INV-SG-2209',entity:'IN-02',amt:2.14,level:'Plant head (L3)',approver:'Plant head IN-02',age:6,sla:3,stage:3,status:'Pending'},
    {id:'APR-88405',type:'Payment',ref:'Narmada Organics Ltd, PR-20261006',entity:'IN-02',amt:7.80,level:'CFO (L5)',approver:'Group CFO',age:0,sla:1,stage:4,status:'Pending'},
    {id:'APR-88398',type:'Purchase order',ref:'PO 4500188102, reactor lining',entity:'IN-05',amt:3.40,level:'Entity head (L4)',approver:'IN-05 entity head',age:4,sla:3,stage:3,status:'Pending'},
    {id:'APR-88390',type:'Bank change',ref:'Apex Chem Intermediates V-301776',entity:'IN-02',amt:1.124,level:'Treasury + controller',approver:'Manish Gupta',age:2,sla:1,stage:2,status:'Pending'},
    {id:'APR-88371',type:'Invoice',ref:'Deccan Pharma Services INV-4471',entity:'IN-04',amt:0.94,level:'Function head (L2)',approver:'Ops head IN-04',age:5,sla:3,stage:2,status:'Pending'},
    {id:'APR-88366',type:'Invoice',ref:'Coastal Freight Carriers CFC-9921',entity:'IN-02',amt:0.62,level:'Function head (L2)',approver:'Logistics head',age:1,sla:3,stage:2,status:'Pending'},
    {id:'APR-88355',type:'Purchase order',ref:'PO 4500188044, IT licences',entity:'IN-01',amt:0.48,level:'Function head (L2)',approver:'CIO',age:2,sla:3,stage:2,status:'Pending'},
    {id:'APR-88349',type:'Vendor onboarding',ref:'Gujarat Chem Traders',entity:'IN-03',amt:null,level:'MDM + Procurement',approver:'Amit Malhotra',age:3,sla:5,stage:2,status:'Pending'},
    {id:'APR-88340',type:'Invoice',ref:'Mehta Instruments MI/2526/322',entity:'IN-03',amt:0.18,level:'Cost-centre owner (L1)',approver:'QC manager IN-03',age:8,sla:3,stage:1,status:'Pending'},
    {id:'APR-88331',type:'Invoice',ref:'Bharat Electricals BE-1102',entity:'IN-03',amt:0.07,level:'Cost-centre owner (L1)',approver:'QC manager IN-03',age:7,sla:3,stage:1,status:'Pending'}
  ],
  apprSteps:['Requested','Validated','Level 1–2','Level 3–4','Final'],
  doa:[ ['Cost-centre owner (L1)','Up to ₹10 L','Invoices, POs'],['Function head (L2)','₹10 L to ₹1 Cr','Invoices, POs'],['Plant or entity head (L3–L4)','₹1 Cr to ₹5 Cr','Invoices, POs, capex'],['CFO (L5)','Above ₹5 Cr','Payments, POs'],['Treasury and controller','Any amount','Bank-detail changes (dual approval, permanent)'] ],
  onboarding:[
    {id:'VON-2611',name:'Gujarat Chem Traders',entity:'IN-03',cat:'Raw material',stage:2,days:3,checks:'PAN matches existing vendor V-118802',risk:'High',status:'Duplicate check'},
    {id:'VON-2609',name:'Vasudha Bio Labs',entity:'IN-07',cat:'Clinical services',stage:3,days:6,checks:'All documents valid',risk:'Low',status:'Approval'},
    {id:'VON-2604',name:'Orion Process Equipment',entity:'IN-05',cat:'Capex',stage:2,days:9,checks:'MSME certificate missing',risk:'Medium',status:'Documents'},
    {id:'VON-2601',name:'Kaveri Intermediates (2nd plant)',entity:'IN-02',cat:'KSM',stage:1,days:12,checks:'Insolvency petition on MCA21',risk:'High',status:'Compliance review'},
    {id:'VON-2598',name:'BluePeak Logistics',entity:'IN-08',cat:'Logistics',stage:4,days:4,checks:'All documents valid',risk:'Low',status:'Activated'},
    {id:'VON-2595',name:'Sai Enterprises',entity:'IN-03',cat:'Packing material',stage:4,days:1,checks:'Created by user with payment rights (SoD)',risk:'High',status:'Activated'}
  ],
  onbSteps:['Request','Documents','Duplicate and compliance checks','Approval','Activated'],
  dupPairs:[
    {id:'DVP-118',a:'V-100482 Shree Packaging Industries',b:'V-207115 Shree Packaging Inds.',score:97,match:'PAN, GSTIN, bank ****2210, address',open:1,status:'Merge requested'},
    {id:'DVP-121',a:'V-118802 Gujarat Chemicals & Traders',b:'VON-2611 Gujarat Chem Traders (new)',score:93,match:'PAN, phone, address',open:0,status:'Open',ex:'PTP-VDU-11'},
    {id:'DVP-109',a:'V-104410 Coastal Freight Carriers',b:'V-209981 Coastal Freight Carrier',score:89,match:'GSTIN, bank account',open:2,status:'Open'},
    {id:'DVP-102',a:'V-101773 Mehta Instruments',b:'V-206602 Mehta Instrument Co',score:84,match:'PAN, email domain',open:0,status:'Open'},
    {id:'DVP-097',a:'V-103320 Bharat Electricals',b:'V-205514 Bharat Electrical Works',score:71,match:'Address only',open:0,status:'Not a duplicate'}
  ],
  dqDims:[ ['Bank details verified',97.8],['GSTIN active and matched',98.9],['PAN valid',99.4],['MSME status current',86.2],['Contact details complete',88.0],['Payment terms standard',78.6] ],
  /* invoices in the automation hub */
  invoices:[
    {id:'INV-26-118204',vendor:'Coastal Packaging Pvt Ltd',entity:'IN-03',amt:0.0412,po:'4500187711',match:'Price variance',conf:0.62,status:'Exception',channel:'Email',received:'03-Oct',fields:[['Invoice number','CP-88341',0.99],['Invoice date','29-Sep-2026',0.98],['GSTIN','27AACCC4412P1Z5',0.99],['Unit price','₹41.20 per kg',0.58],['Quantity','10,000 kg',0.97],['Taxable value','₹4,12,000',0.96]]},
    {id:'INV-26-118199',vendor:'Sterling Gases Ltd',entity:'IN-02',amt:2.14,po:'4500186650',match:'Three-way matched',conf:0.98,status:'Awaiting approval',channel:'Portal',received:'29-Sep'},
    {id:'INV-26-118187',vendor:'Deccan Pharma Services',entity:'IN-04',amt:0.94,po:'4500186120',match:'SES missing',conf:0.91,status:'Exception',channel:'Email',received:'02-Oct'},
    {id:'INV-26-118176',vendor:'Rajdhani Logistics',entity:'IN-08',amt:0.088,po:'4500187002',match:'Two-way matched',conf:0.97,status:'Touchless',channel:'e-invoice',received:'02-Oct'},
    {id:'INV-26-118160',vendor:'Mehta Instruments',entity:'IN-03',amt:0.18,po:'4500185980',match:'Three-way matched',conf:0.95,status:'Awaiting approval',channel:'Email',received:'24-Sep'},
    {id:'INV-26-118152',vendor:'Narmada Organics Ltd',entity:'IN-02',amt:7.80,po:'4500184410',match:'Three-way matched',conf:0.99,status:'Scheduled',channel:'e-invoice',received:'21-Sep'},
    {id:'INV-26-118140',vendor:'Bharat Electricals',entity:'IN-03',amt:0.07,po:'—',match:'No PO',conf:0.88,status:'Exception',channel:'Paper scan',received:'01-Oct'},
    {id:'INV-26-118133',vendor:'BluePeak Logistics',entity:'IN-08',amt:0.212,po:'4500186655',match:'Three-way matched',conf:0.96,status:'Touchless',channel:'Portal',received:'30-Sep'},
    {id:'INV-26-118121',vendor:'Shree Packaging Inds.',entity:'IN-04',amt:0.486,po:'4500183321',match:'Duplicate suspected',conf:0.96,status:'Blocked',channel:'Portal',received:'16-Sep'},
    {id:'INV-26-118110',vendor:'Orion Process Equipment',entity:'IN-05',amt:1.36,po:'4500182001',match:'GR missing',conf:0.94,status:'Exception',channel:'Email',received:'27-Sep'}
  ],
  invTimeline:{ 'INV-26-118199':[['29-Sep 10:12','Received through vendor portal'],['29-Sep 10:13','Captured, 12 of 12 fields above 95% confidence'],['29-Sep 10:14','Coded to 5210 Utilities, cost centre IN02-UTL'],['29-Sep 10:20','Three-way matched to PO 4500186650 and GR 5000921144'],['29-Sep 10:21','Routed to Plant head IN-02 (L3, ₹1–5 Cr)'],['05-Oct 09:10','Still pending: approver on leave since 29-Sep']] },
  /* upcoming payments with predicted risk of missing due date */
  payments:[
    {id:'PAY-50281',vendor:'Sterling Gases Ltd',entity:'IN-02',amt:2.14,due:'08-Oct',risk:82,delay:'4–6 days',driver:'Approval pending 6 days; approver on leave',crit:'Critical (sole nitrogen supply)',ex:'PTP-LPR-09'},
    {id:'PAY-50277',vendor:'Orion Process Equipment',entity:'IN-05',amt:1.36,due:'09-Oct',risk:71,delay:'3–5 days',driver:'GR not posted',crit:'High'},
    {id:'PAY-50266',vendor:'Deccan Pharma Services',entity:'IN-04',amt:0.94,due:'10-Oct',risk:64,delay:'2–4 days',driver:'Service entry sheet missing',crit:'High'},
    {id:'PAY-50250',vendor:'Mehta Instruments',entity:'IN-03',amt:0.18,due:'07-Oct',risk:58,delay:'1–3 days',driver:'L1 approval 8 days old',crit:'Medium'},
    {id:'PAY-50241',vendor:'Coastal Packaging Pvt Ltd',entity:'IN-03',amt:0.41,due:'12-Oct',risk:47,delay:'0–2 days',driver:'Price variance unresolved',crit:'Medium'},
    {id:'PAY-50233',vendor:'Narmada Organics Ltd',entity:'IN-02',amt:7.80,due:'06-Oct',risk:22,delay:'On time',driver:'CFO authorisation routed',crit:'Critical (KSM)'},
    {id:'PAY-50219',vendor:'Coastal Freight Carriers',entity:'IN-02',amt:1.12,due:'14-Oct',risk:18,delay:'On time',driver:'—',crit:'High'},
    {id:'PAY-50207',vendor:'BluePeak Logistics',entity:'IN-08',amt:0.21,due:'06-Oct',risk:9,delay:'On time',driver:'—',crit:'Low'}
  ],
  liab:{ grniAge:[['0–30 days',9.6],['31–60 days',3.9],['61–90 days',1.3],['Over 90 days',9.2]], grniByEntity:[['IN-02',7.8],['IN-05',5.2],['IN-04',4.0],['IN-03',2.6],['IN-01',1.7],['IN-08',1.2],['Others',1.5]],
    blocked:[['GR missing',18.6],['Price variance',7.0],['Quantity variance',3.5],['Other',2.9]],
    advances:[ ['Prakash Engineering Works','IN-05',0.42,'14 months','No supply in 11 months; GST registration cancelled','Provide'],['Lotus Lab Supplies','IN-07',0.28,'10 months','No supply in 9 months','Provide'],['Aditya Civil Contractors','IN-02',0.20,'9 months','No supply in 9 months','Provide'],['Orion Process Equipment','IN-05',0.96,'7 months','Equipment delivery due Nov','Recover'],['Others (7 vendors)','Various',1.74,'6–9 months','Supplies continuing','Recover'] ],
    completeness:[ ['GRNI aged and validated',70],['Accruals booked for consumption',58],['Blocked invoices with owner',92],['Advances reviewed',85],['Vendor statements reconciled (top 50)',96] ] },
  /* audit requests and evidence */
  auditReq:{ id:'IA-REQ-2026-044', from:'Pooja Jain, Internal Audit', received:'05-Oct 08:15', scope:'Q2 vendor payments above ₹50 L: sample of 25 payments', due:'09-Oct',
    items:[ ['Payment approval trail','25 of 25'],['Three-way match evidence','25 of 25'],['Vendor master and bank verification','25 of 25'],['Invoice image and IRN','24 of 25'],['Contract or rate card','23 of 25'] ],
    gaps:[ ['PAY-49812 Orion Process Equipment','Invoice image missing for advance payment','Upload'],['PAY-49790 Kaveri Intermediates','Rate contract expired 31-Aug; extension letter not filed','Upload'],['PAY-49755 Lotus Lab Supplies','Rate card not on file','Upload'] ] },
  evidenceAreas:[ ['Invoice approvals',99.2,'C-P2P-001'],['Three-way match',99.6,'C-P2P-014'],['Bank-detail changes',96.0,'C-P2P-009'],['Vendor onboarding',97.9,'C-P2P-021'],['Payment runs',100,'C-P2P-030'],['GRNI review',94.1,'C-P2P-041'] ],
  opps:[
    {id:'OPP-P2P-07',title:'Auto-post GR from gate entry at 3 plants',area:'Goods receipt',vol:1136,hours:1420,value:3.20,effort:'Medium',roi:'5.1×',stage:'Proposed',owner:'Plant heads',rc:'RC-01'},
    {id:'OPP-P2P-03',title:'Touchless matching for low-value invoices under ₹50,000',area:'Invoice matching',vol:6210,hours:2070,value:1.10,effort:'Low',roi:'8.4×',stage:'Proposed',owner:'AP lead'},
    {id:'OPP-P2P-05',title:'Unit-of-measure conversion rule for 4 packaging vendors',area:'Matching',vol:528,hours:440,value:0.40,effort:'Low',roi:'6.0×',stage:'Approved',owner:'Buyers',rc:'RC-08'},
    {id:'OPP-P2P-02',title:'Freight auto-coding from TMS lane',area:'Coding',vol:3040,hours:760,value:0.55,effort:'Medium',roi:'3.2×',stage:'In delivery',owner:'AP and GL',rc:'RC-06'},
    {id:'OPP-P2P-01',title:'Vendor portal mandatory for top 200 vendors',area:'Invoice intake',vol:4100,hours:980,value:0.90,effort:'Medium',roi:'2.9×',stage:'Live',owner:'Procurement',realised:0.62},
    {id:'OPP-P2P-04',title:'PO compliance block: no invoice without PO for 10 vendors',area:'PO compliance',vol:362,hours:300,value:1.80,effort:'Low',roi:'7.5×',stage:'In delivery',owner:'Procurement',rc:'RC-03'}
  ]
};

/* tower-specific exceptions (P2P drill-down scenarios) */
D.exceptions.push(
{ id:'PTP-LPR-09', tower:'P2P', also:['SC'], entity:'IN-02', severity:'high', priority:66,
  title:'Critical vendor payment likely to miss due date', subject:'Sterling Gases Ltd, INV-SG-2209, sole nitrogen vendor to IN-02',
  impact:{valueCr:2.14, short:'₹2.14 Cr', label:'Due Thu 08-Oct'}, due:'Today 17:00', owner:'VS',
  trigger:'Payment risk model PRP-v1.3 (risk 82, threshold 70)',
  what:'The invoice was three-way matched on 29-Sep but has waited <b>6 days</b> for level-3 approval: the IN-02 plant head has been on leave since 29-Sep and no delegate is set. Sterling has written that it will pause nitrogen deliveries if payment is late again, which would stop two API reactor lines.',
  evidence:{ kv:[['Matched','Three-way, PO 4500186650, GR 5000921144'],['Approval level','Plant head (L3, ₹1–5 Cr)'],['Approver status','On leave 29-Sep to 09-Oct (HRMS)'],['Predicted payment','12–14 Oct (4–6 days late)'],['Vendor history','2 late payments in Q1; supply-pause letter dated 01-Oct'],['Contract penalty','1.5% per month, plus supply risk']] },
  ai:{ model:'PRP-v1.3', confidence:0.86, short:'Route to delegate approver; include in Tue run',
    text:'Route the approval to the delegate for the IN-02 plant head (Operations head, L3 authority) under DoA clause 4.2 and include the invoice in Tuesday\'s payment run. Set a standing delegate for approvers on leave over 3 days.',
    reasoning:['Approver on leave beyond the 3-day SLA','Vendor marked critical: sole source of nitrogen','Invoice fully matched, so no accounting risk in paying'] },
  gate:'Re-routing changes the approver, not the approval: a person with L3 authority still approves.',
  takeLabel:'Route to delegate and add to run', onTake:[{set:'p2p.lpr.risk',v:12},{add:'p2p.apprPending',v:-1},{event:'Sterling Gases approval routed to delegate; added to PR-20261006',tower:'P2P'}],
  takeToast:'Approval routed to the IN-02 operations head; invoice added to Tuesday\'s run',
  activity:[{t:'29-Sep 10:21',text:'Routed to Plant head IN-02'},{t:'01-Oct 11:30',text:'Vendor supply-pause letter received'},{t:'05-Oct 07:40',text:'Risk 82: likely to miss 08-Oct',ai:true}],
  links:[['On-Time Payment Rate','screens/p2p/desk.html#kpi=otp'],['Approval Compliance','screens/p2p/desk.html#kpi=approval']] },
{ id:'PTP-APR-07', tower:'P2P', entity:'IN-03', severity:'medium', priority:49,
  title:'Approval bottleneck: 42 invoices waiting more than 5 days', subject:'One cost-centre approver at IN-03 holds 31 of them',
  impact:{valueCr:6.80, short:'₹6.80 Cr', label:'Waiting approval'}, due:'WD+3', owner:'VS',
  trigger:'Approval SLA monitor (3 days)',
  what:'42 invoices worth ₹6.8 Cr are past the 3-day approval SLA. 31 sit with the QC manager at IN-03, who approves 4 times more invoices than the next approver because QC consumables are coded to one cost centre.',
  evidence:{ table:{cols:['Approver','Invoices','₹ Cr','Oldest'], right:[1,2], rows:[['QC manager IN-03','31','1.92','8 days'],['Plant head IN-02','4','2.61','6 days'],['Ops head IN-04','5','1.84','5 days'],['Others','2','0.43','5 days']], foot:['Total','42','6.80','']}},
  ai:{ confidence:0.84, short:'Escalate to next authority; split QC cost centre', text:'Escalate the 31 QC invoices to the IN-03 plant controller for this cycle, and split the QC consumables cost centre so approvals spread across three lab heads.' },
  onTake:[{add:'p2p.apprPending',v:-31},{event:'31 IN-03 invoices escalated to plant controller',tower:'P2P'}], takeToast:'31 invoices escalated to the IN-03 plant controller',
  links:[['Approval Compliance','screens/p2p/desk.html#kpi=approval']] },
{ id:'PTP-MAT-08', tower:'P2P', entity:'IN-03', severity:'medium', priority:43,
  title:'Matching failures: 61 invoices from 4 packaging vendors', subject:'Price per kg on invoice, price per bag on PO',
  impact:{valueCr:2.30, short:'₹2.30 Cr', label:'Stuck in matching'}, due:'WD+4', owner:'VS',
  trigger:'Exception clustering on matching failures',
  what:'Four packaging vendors invoice per kilogram while their POs are raised per 25 kg bag. Every invoice fails the price check and is cleared by hand.',
  ai:{ confidence:0.90, short:'Add unit-of-measure conversion; release 61 invoices', text:'Add a kg-to-bag conversion rule for the 4 vendors (OPP-P2P-05) and re-run matching; 58 of 61 invoices then match within tolerance.' },
  onTake:[{event:'Unit conversion applied: 58 of 61 packaging invoices matched',tower:'P2P'}], takeToast:'Conversion rule applied: 58 invoices now match',
  links:[['Invoice Match Rate','screens/p2p/desk.html#kpi=match'],['P2P process chain','screens/p2p/process.html']] },
{ id:'PTP-VDU-11', tower:'P2P', entity:'IN-03', severity:'medium', priority:38,
  title:'New vendor duplicates an existing vendor', subject:'Gujarat Chem Traders (VON-2611) vs V-118802',
  impact:{valueCr:null, short:'93% match', label:'Duplicate score'}, due:'WD+4', owner:'AM',
  trigger:'Duplicate vendor detection at onboarding',
  what:'The onboarding request uses the same PAN, phone number and address as active vendor V-118802 Gujarat Chemicals & Traders, which has ₹0.38 Cr of open invoices.',
  evidence:{ compare:{ a:{title:'Existing V-118802'}, b:{title:'New request VON-2611'}, rows:[['Name','Gujarat Chemicals & Traders','Gujarat Chem Traders'],['PAN','AAKFG4471Q','AAKFG4471Q'],['GSTIN','24AAKFG4471Q1Z2','24AAKFG4471Q2Z1'],['Bank','SBI ****7712','Axis ****0943'],['Address','Plot 14, GIDC Ankleshwar','Plot 14, GIDC Ankleshwar']]} },
  ai:{ confidence:0.93, short:'Reject request; add GSTIN to existing vendor', text:'Reject the new vendor and add the second GSTIN as an additional registration on V-118802. The new bank account goes through bank-change control.' },
  onTake:[{add:'p2p.dupVendors',v:-1},{event:'VON-2611 rejected; GSTIN added to V-118802',tower:'P2P'}], takeToast:'Onboarding rejected; GSTIN added to the existing vendor',
  links:[['Vendor profiles','screens/p2p/vendors.html']] }
);

D.searchExtra = (D.searchExtra||[]).concat([
  {k:'sterling gases nitrogen',label:'Sterling Gases Ltd',sub:'Vendor, IN-02, payment risk 82',href:'screens/p2p/vendors.html'},
  {k:'narmada organics',label:'Narmada Organics Ltd',sub:'Vendor, ₹7.8 Cr in payment run',href:'screens/p2p/vendors.html'},
  {k:'gujarat chem traders',label:'Gujarat Chem Traders',sub:'Vendor onboarding VON-2611',href:'screens/p2p/vendors.html'},
  {k:'audit request IA-REQ-2026-044 internal audit',label:'IA-REQ-2026-044',sub:'Internal Audit request: Q2 vendor payments',href:'screens/p2p/desk.html#kpi=otp'}
]);
})();
