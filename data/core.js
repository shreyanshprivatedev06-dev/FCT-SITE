/* FCT demo data — core universe shared by every tower.
   Source of truth: fct details/FCT_Financial_Controller_Technical_Manifest.md (App. C) and 5_Supply_Chain.md.
   All names, entities, people and figures are fictional demo values. */
window.FCT_DATA = window.FCT_DATA || {};
Object.assign(window.FCT_DATA, {
  meta:{ client:'Jubilant (demo)', period:'Sep-26', fyLabel:'Q2 FY27', demoNow:'Mon 05-Oct-2026 09:10 IST', todayWD:2, closeTargetWD:4,
    calendar:{ 'WD0':'30-Sep','WD+1':'01-Oct','WD+2':'05-Oct','WD+3':'06-Oct','WD+4':'07-Oct','WD+5':'08-Oct','WD+6':'09-Oct' },
    paymentRunIn:'26h', paymentRun:'PR-20261006', materiality:{ groupCr:5, entityCr:1 }, stage:{ id:1, label:'Human led, AI assisted', human:80, ai:20 } },
  persona:{ id:'PR', initials:'PR', name:'Priya Raman', firstName:'Priya', title:'Group Financial Controller', reportsTo:'Group CFO' },
  users:[
    {id:'PR',name:'Priya Raman',role:'Group Financial Controller'},
    {id:'VS',name:'Vikram Shah',role:'AP Lead'},
    {id:'NI',name:'Neha Iyer',role:'AR & Credit Lead'},
    {id:'AR',name:'Arjun Rao',role:'GL & Close Lead'},
    {id:'MG',name:'Manish Gupta',role:'Treasury Manager'},
    {id:'SK',name:'Sameer Khan',role:'Compliance Lead'},
    {id:'RM',name:'Rohan Mehta',role:'Accountant IN-07',availability:{status:'On leave',from:'01-Oct',to:'09-Oct',source:'HRMS'}},
    {id:'AK',name:'Anjali Kulkarni',role:'Senior Accountant IN-07',availability:{status:'Available'}},
    {id:'KS',name:'Kavita Sen',role:'FP&A Manager'},
    {id:'DB',name:'Deepak Bansal',role:'Billing Lead'},
    {id:'RS',name:'Ritu Sharma',role:'Commercial Head'},
    {id:'AM',name:'Amit Malhotra',role:'MDM Lead'},
    {id:'SD',name:'Shalini Desai',role:'Head of Procurement'},
    {id:'VM',name:'Vivek Menon',role:'Head of Supply Chain'},
    {id:'KP',name:'Kiran Patel',role:'Plant Controller IN-02'},
    {id:'SPL',name:'Suresh Pillai',role:'DC Manager IN-08'},
    {id:'MJ',name:'Meera Joshi',role:'Indirect Tax Lead'},
    {id:'PJ',name:'Pooja Jain',role:'Internal Audit Manager'},
    {id:'HV',name:'Harish Verma',role:'Group Reporting Lead'},
    {id:'IN05C',name:'Farhan Qureshi',role:'Plant Controller IN-05'},
    {id:'IN08C',name:'Lata Krishnan',role:'Entity Controller IN-08'},
    {id:'US01C',name:'Tom Brennan',role:'Entity Controller US-01'},
    {id:'PH',name:'Plant heads (3)',role:'IN-02 Plant A, IN-04, IN-05'},
    {id:'CFO',name:'Group CFO',role:'CFO'}
  ],
  entities:[
    {id:'IN-01',name:'Corporate Office',type:'Holding / HQ',tasks:62,done:41,plan:40,recs:190,cert:168,open:0,je:92,readiness:97,forecast:4,lik:94,region:'North India',cls:'Services and trading',site:{city:'Noida',state:'Uttar Pradesh',lat:28.5355,lng:77.391}},
    {id:'IN-02',name:'API Manufacturing',type:'Manufacturing',tasks:58,done:34,plan:36,recs:186,cert:152,open:2,je:85,readiness:76,forecast:4,lik:71,region:'North India',cls:'Manufacturing',site:{city:'Gajraula',state:'Uttar Pradesh',lat:28.8457,lng:78.2396}},
    {id:'IN-03',name:'Formulations',type:'Manufacturing',tasks:54,done:31,plan:34,recs:162,cert:128,open:1,je:80,readiness:82,forecast:4,lik:78,region:'North India',cls:'Manufacturing',site:{city:'Roorkee',state:'Uttarakhand',lat:29.8543,lng:77.888}},
    {id:'IN-04',name:'Life Science Ingredients',type:'Manufacturing',tasks:50,done:32,plan:31,recs:140,cert:121,open:1,je:90,readiness:88,forecast:4,lik:86,region:'West India',cls:'Manufacturing',site:{city:'Ambernath',state:'Maharashtra',lat:19.2094,lng:73.1868}},
    {id:'IN-05',name:'Specialty Chemicals',type:'Manufacturing',tasks:46,done:25,plan:29,recs:128,cert:98,open:2,je:70,readiness:70,forecast:4,lik:55,region:'West India',cls:'Manufacturing',site:{city:'Bharuch',state:'Gujarat',lat:21.7051,lng:72.9959}},
    {id:'IN-06',name:'Nutrition',type:'Manufacturing',tasks:38,done:26,plan:24,recs:92,cert:86,open:0,je:95,readiness:99,forecast:3,lik:92,region:'West India',cls:'Manufacturing',site:{city:'Nashik',state:'Maharashtra',lat:19.9975,lng:73.7898}},
    {id:'IN-07',name:'Contract Research Services',type:'Services',tasks:48,done:17,plan:31,recs:104,cert:64,open:1,je:40,readiness:59,forecast:6,lik:82,region:'South India',cls:'Services and trading',site:{city:'Bengaluru',state:'Karnataka',lat:12.9716,lng:77.5946}},
    {id:'IN-08',name:'Distribution & Trading',type:'Trading',tasks:40,done:26,plan:25,recs:108,cert:92,open:0,je:88,readiness:96,forecast:4,lik:90,region:'South India',cls:'Services and trading',site:{city:'Chennai',state:'Tamil Nadu',lat:13.0827,lng:80.2707}},
    {id:'US-01',name:'North America Sales',type:'Sales subsidiary',tasks:44,done:27,plan:28,recs:86,cert:64,open:1,je:82,readiness:82,forecast:4,lik:80,region:'North America',cls:'Overseas sales',site:{city:'Bedminster',state:'New Jersey, USA',lat:40.6807,lng:-74.6454}},
    {id:'EU-01',name:'Europe Sales',type:'Sales subsidiary',tasks:46,done:30,plan:29,recs:88,cert:67,open:0,je:86,readiness:93,forecast:4,lik:88,region:'Europe',cls:'Overseas sales',site:{city:'Frankfurt',state:'Hesse, Germany',lat:50.1109,lng:8.6821}}
  ],
  /* shared geography: cities by region (lat/lng). Entities carry their own site above; customers, vendors and other
     records are placed in a city of their business unit's region, picked from their id. Illustrative locations. */
  places:{
    'North India': [
      { city:'Delhi', lat:28.6139, lng:77.2090 }, { city:'Gurugram', lat:28.4595, lng:77.0266 },
      { city:'Noida', lat:28.5355, lng:77.3910 }, { city:'Chandigarh', lat:30.7333, lng:76.7794 },
      { city:'Lucknow', lat:26.8467, lng:80.9462 }, { city:'Jaipur', lat:26.9124, lng:75.7873 },
      { city:'Ludhiana', lat:30.9010, lng:75.8573 }, { city:'Dehradun', lat:30.3165, lng:78.0322 }
    ],
    'West India': [
      { city:'Mumbai', lat:19.0760, lng:72.8777 }, { city:'Pune', lat:18.5204, lng:73.8567 },
      { city:'Ahmedabad', lat:23.0225, lng:72.5714 }, { city:'Vadodara', lat:22.3072, lng:73.1812 },
      { city:'Surat', lat:21.1702, lng:72.8311 }, { city:'Nagpur', lat:21.1458, lng:79.0882 },
      { city:'Indore', lat:22.7196, lng:75.8577 }, { city:'Panaji', lat:15.4909, lng:73.8278 }
    ],
    'South India': [
      { city:'Bengaluru', lat:12.9716, lng:77.5946 }, { city:'Chennai', lat:13.0827, lng:80.2707 },
      { city:'Hyderabad', lat:17.3850, lng:78.4867 }, { city:'Kochi', lat:9.9312, lng:76.2673 },
      { city:'Coimbatore', lat:11.0168, lng:76.9558 }, { city:'Visakhapatnam', lat:17.6868, lng:83.2185 },
      { city:'Mysuru', lat:12.2958, lng:76.6394 }, { city:'Thiruvananthapuram', lat:8.5241, lng:76.9366 }
    ],
    'North America': [
      { city:'Newark', lat:40.7357, lng:-74.1724 }, { city:'Chicago', lat:41.8781, lng:-87.6298 },
      { city:'Houston', lat:29.7604, lng:-95.3698 }, { city:'Los Angeles', lat:34.0522, lng:-118.2437 },
      { city:'Toronto', lat:43.6532, lng:-79.3832 }, { city:'Boston', lat:42.3601, lng:-71.0589 }
    ],
    'Asia Pacific': [
      { city:'Shanghai', lat:31.2304, lng:121.4737 }, { city:'Qingdao', lat:36.0671, lng:120.3826 },
      { city:'Hangzhou', lat:30.2741, lng:120.1551 }, { city:'Jinan', lat:36.6512, lng:117.1201 },
      { city:'Singapore', lat:1.3521, lng:103.8198 }
    ],
    'Europe': [
      { city:'Basel', lat:47.5596, lng:7.5886 }, { city:'Zurich', lat:47.3769, lng:8.5417 },
      { city:'Frankfurt', lat:50.1109, lng:8.6821 }, { city:'London', lat:51.5074, lng:-0.1278 },
      { city:'Amsterdam', lat:52.3676, lng:4.9041 }, { city:'Paris', lat:48.8566, lng:2.3522 },
      { city:'Milan', lat:45.4642, lng:9.1900 }
    ]
  },
  /* base values for every metric that a decision can move; read via FCT.v(key) */
  metrics:{
    'close.forecastWD':5, 'close.readiness':84, 'close.p50':'WD+5',
    'in07.readiness':59, 'in07.forecastWD':6, 'in07.lik':82, 'in07.done':17, 'in07.je':40, 'close.lateTasks':31,
    'recs.cert':1040, 'recs.total':1284,
    'pay.pendingCr':1.61, 'pay.pendingCount':2, 'pay.runCr':186.4, 'pay.invoices':1128,
    'dup.preventedCr':2.61, 'audit.readiness':87, 'sod.open':3, 'var.signed':21, 'var.total':34,
    'ai.decisions':22231, 'ai.accepted':20655, 'ai.overrides':0,
    'value.identified':48.70, 'value.realised':21.91,
    'grni.unaccruedCr':4.10, 'cutoff.count':37, 'cutoff.cr':6.3, 'ecl.gapCr':1.50,
    'controls.failing':9, 'findings.overdue':4
  },
  connectors:[
    {id:'C-01',system:'ERP (FI/CO, MM, SD)',scope:'10 entities',status:'Live',sync:'05-Oct 09:02',freq:'15 min',data:'GL, AP, AR, GR/IR, POs, journals, users and roles'},
    {id:'C-02',system:'Bank host-to-host (6 banks)',scope:'Treasury',status:'Live',sync:'05-Oct 08:45',freq:'Hourly',data:'Statements, receipts'},
    {id:'C-03',system:'Workflow engine',scope:'All towers',status:'Live',sync:'Streaming',freq:'Events',data:'Approvals, tasks, timestamps'},
    {id:'C-04',system:'Invoice capture (IDP)',scope:'P2P',status:'Live',sync:'05-Oct 07:55',freq:'30 min',data:'Invoice images, extracted fields'},
    {id:'C-05',system:'GSTN and e-invoice IRP',scope:'P2P, O2C',status:'Live',sync:'05-Oct 08:00',freq:'Daily',data:'GSTIN, legal name, IRN'},
    {id:'C-06',system:'MCA21 and PAN validation',scope:'Master data',status:'Live',sync:'05-Oct 06:00',freq:'Daily',data:'Company status'},
    {id:'C-07',system:'Sanctions and watchlists',scope:'Master data',status:'Live',sync:'05-Oct 06:00',freq:'Daily',data:'Screening hits'},
    {id:'C-08',system:'Credit bureau',scope:'O2C',status:'Live',sync:'05-Oct 05:00',freq:'Weekly',data:'Customer scores'},
    {id:'C-09',system:'HRMS',scope:'People',status:'Live',sync:'05-Oct 07:30',freq:'Daily',data:'Leave and availability'},
    {id:'C-10',system:'Transport management (TMS)',scope:'O2C, SC',status:'Live',sync:'05-Oct 08:50',freq:'15 min',data:'Dispatch, proof of delivery, freight'},
    {id:'C-11',system:'PMO timesheets (IN-07)',scope:'R2R',status:'Degraded',sync:'02-Oct 18:00',freq:'Daily',data:'Project hours for revenue POC'},
    {id:'C-12',system:'Email and Microsoft Teams',scope:'Notifications',status:'Live',sync:'Streaming',freq:'—',data:'Nudges, assignments'},
    {id:'C-13',system:'Warehouse management (WMS)',scope:'SC',status:'Live',sync:'05-Oct 08:30',freq:'30 min',data:'Bins, counts, batch expiry'},
    {id:'C-14',system:'Gate entry and ASN hub',scope:'SC, P2P',status:'Live',sync:'05-Oct 08:40',freq:'15 min',data:'Gate inwards, supplier ASNs'},
    {id:'C-15',system:'Manufacturing execution (MES)',scope:'SC',status:'Live',sync:'05-Oct 06:00',freq:'Shift',data:'Batch yields, consumption'}
  ],
  codes:{
    override:[['OVR-01','AI evidence incomplete or incorrect'],['OVR-02','Business context not in data'],['OVR-03','Amount or basis edited'],['OVR-04','Approved policy exception'],['OVR-05','Timing: defer to next period'],['OVR-06','Legitimate item (not duplicate or anomaly)'],['OVR-07','Alternative action preferred'],['OVR-99','Other (comment required)']],
    hold:[['HLD-01','Awaiting supporting documents'],['HLD-02','Awaiting third-party confirmation'],['HLD-03','Awaiting owner availability'],['HLD-04','Second opinion needed'],['HLD-99','Other']]
  },
  events:[
    {t:'05-Oct 08:52',tower:'P2P',sev:'critical',ai:true,text:'Bank-change request for Apex Chem Intermediates surfaced: risk 91, payment run in 26h',link:'PTP-BNK-05'},
    {t:'05-Oct 08:50',tower:'O2C',sev:'high',ai:true,text:'TMS sync: 37 dispatches without invoice at cut-off (₹6.3 Cr)',link:'O2C-BILL-04'},
    {t:'05-Oct 08:45',tower:'O2C',sev:'low',ai:true,text:'Bank statements loaded from 6 banks: 1,904 receipts, 138 match suggestions',link:'O2C-CASH-03'},
    {t:'05-Oct 08:40',tower:'R2R',sev:'critical',ai:true,text:'IN-07 close predicted WD+6 (82%)',link:'RTR-CLS-01'},
    {t:'05-Oct 08:31',tower:'P2P',sev:'critical',ai:true,text:'Duplicate invoice flagged: Shree Packaging Industries ₹48.6 L (96%)',link:'PTP-DUP-03'},
    {t:'05-Oct 08:20',tower:'SC',sev:'high',ai:true,text:'Gate-entry vs GR match: ₹6.4 Cr received by 30-Sep without goods receipt',link:'SC-GRL-10'},
    {t:'05-Oct 08:02',tower:'R2R',sev:'low',ai:true,text:'61 low-risk reconciliations pre-matched to zero, awaiting reviewer sign-off'},
    {t:'05-Oct 07:55',tower:'P2P',sev:'low',ai:true,text:'Invoice capture processed 214 invoices overnight; 19 low-confidence fields flagged'},
    {t:'05-Oct 07:30',tower:'R2R',sev:'medium',ai:false,text:'HRMS: 3 close-task owners on leave this week, including R. Mehta (IN-07)'},
    {t:'05-Oct 06:00',tower:'CMP',sev:'low',ai:false,text:'Sanctions screening: 0 hits across 4,812 active vendors'},
    {t:'04-Oct 22:00',tower:'CMP',sev:'medium',ai:true,text:'Controls monitoring run: 9 controls failing; three-way-match override spike at IN-05',link:'CMP-CTL-02'},
    {t:'03-Oct 16:43',tower:'P2P',sev:'critical',ai:true,text:'Bank-change request received and scored 91',link:'PTP-BNK-05'},
    {t:'02-Oct 18:00',tower:'R2R',sev:'medium',ai:false,text:'PMO timesheet feed failed; connector degraded'},
    {t:'02-Oct 14:10',tower:'R2R',sev:'low',ai:true,text:'14 accrual journals drafted for IN-07 (₹2.71 Cr)'},
    {t:'01-Oct 23:15',tower:'R2R',sev:'critical',ai:true,text:'Journal anomaly JE-IN05-0930-7781 flagged (score 0.93)',link:'RTR-JNL-02'}
  ],
  /* decisions made before the demo morning (shown under today's live decisions) */
  history:[
    {t:'02-Oct 17:40',id:'PTP-ACR-0930',tower:'P2P',title:'Freight accrual September, IN-02',action:'TAKE',status:'resolved',by:'PR',aiRec:'Accrue ₹1.86 Cr freight on 412 shipments with POD',conf:0.92,model:'LIA-v1.4',reason:'',comment:''},
    {t:'02-Oct 16:05',id:'O2C-CRL-0931',tower:'O2C',title:'Credit limit increase, Medilink Distributors',action:'OVERRIDE',status:'resolved-overridden',by:'PR',aiRec:'Approve increase to ₹12 Cr',conf:0.74,model:'CRS-v2.0',reason:'OVR-03',option:'Approved ₹10 Cr with 30-day review',comment:'Hold ₹2 Cr until Q3 payments confirm the trend'},
    {t:'01-Oct 19:22',id:'RTR-REC-0929',tower:'R2R',title:'Bank rec HDFC ****8812 IN-01: 3 unmatched items',action:'TAKE',status:'resolved',by:'AR',aiRec:'Match 3 items to bank charges and interest',conf:0.97,model:'REC-v3.1',reason:'',comment:''},
    {t:'01-Oct 11:10',id:'SC-PPV-0930',tower:'SC',title:'Contract price deviation, Coastal Packaging',action:'TAKE',status:'resolved',by:'PR',aiRec:'Raise debit note ₹14.2 L for over-billing',conf:0.88,model:'PPV-v1.2',reason:'',comment:''},
    {t:'30-Sep 18:55',id:'CMP-POL-0930',tower:'CMP',title:'PO raised after invoice, IN-03 (6 cases)',action:'HOLD',status:'held',by:'SK',aiRec:'Reject 6 after-the-fact POs',conf:0.81,model:'POL-v1.0',reason:'HLD-01',comment:'Waiting for buyer explanations'},
    {t:'30-Sep 15:30',id:'PTP-DUP-0927',tower:'P2P',title:'Duplicate invoice, Rajdhani Logistics ₹6.1 L',action:'TAKE',status:'resolved',by:'VS',aiRec:'Block duplicate',conf:0.98,model:'DUP-v4.1',reason:'',comment:''},
    {t:'29-Sep 12:15',id:'O2C-DED-0926',tower:'O2C',title:'Shortage deduction, NutriBlend Foods ₹3.4 L',action:'OVERRIDE',status:'resolved-overridden',by:'NI',aiRec:'Reject deduction (POD shows full delivery)',conf:0.79,model:'DED-v1.1',reason:'OVR-02',option:'Accept deduction as goodwill',comment:'Damage confirmed on customer photos'}
  ],
  /* screens already built (rail shows all; unbuilt screens render a holding page) */
  built:[]
});
