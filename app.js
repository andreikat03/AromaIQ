const TAGS=[["vară","Vară"],["iarnă","Iarnă"],["primăvară","Primăvară"],["toamnă","Toamnă"],["nuntă","Nuntă"],["eveniment","Eveniment"],["birou","Birou"],["seară","Seară"],["dulce","Dulce"],["fresh","Fresh"],["elegant","Elegant"],["intens","Intens"],["discret","Discret"],["cadou","Cadou"],["femei","Femei"],["bărbați","Bărbați"],["unisex","Unisex"]];

const DEMO_PRODUCTS=[
{id:1,name:"Velvet Vanilla",brand:"Maison Demo",sku:"VV-100",barcode:"594000000001",price:289,gender:"Femei",family:"Gurmand",notes:["Vanilie","Ambră","Tonka"],longevity:8,desc:"Vanilie, ambră și tonka. Cald și elegant.",image:"",tags:["iarnă","nuntă","eveniment","seară","dulce","elegant","intens","femei"],stocks:{"Insula principală":4,"Mall Nord":1}},
{id:2,name:"Azure Citrus",brand:"Maison Demo",sku:"AC-200",barcode:"594000000002",price:249,gender:"Unisex",family:"Citric",notes:["Bergamotă","Neroli","Mosc"],longevity:6,desc:"Citrice, neroli și mosc curat.",image:"",tags:["vară","primăvară","birou","fresh","discret","unisex"],stocks:{"Insula principală":6,"Mall Nord":3}},
{id:3,name:"Midnight Oud",brand:"Noir Atelier",sku:"MO-300",barcode:"594000000003",price:349,gender:"Bărbați",family:"Oriental",notes:["Oud","Ambră","Condimente"],longevity:9,desc:"Oud, lemn, condimente și ambră.",image:"",tags:["iarnă","eveniment","seară","elegant","intens","bărbați"],stocks:{"Insula principală":2,"Mall Nord":4}},
{id:4,name:"Rose Ceremony",brand:"Lumière",sku:"RC-400",barcode:"594000000004",price:319,gender:"Femei",family:"Floral",notes:["Trandafir","Bujor","Mosc"],longevity:7,desc:"Trandafir, bujor și mosc fin.",image:"",tags:["primăvară","nuntă","eveniment","elegant","cadou","femei"],stocks:{"Insula principală":3,"Mall Nord":0}},
{id:5,name:"Ocean Linen",brand:"Lumière",sku:"OL-500",barcode:"594000000005",price:229,gender:"Bărbați",family:"Acvatic",notes:["Citrice","Note marine","Mosc"],longevity:6,desc:"Acvatic, citric și curat.",image:"",tags:["vară","birou","fresh","discret","bărbați"],stocks:{"Insula principală":5,"Mall Nord":2}},
{id:6,name:"Amber Signature",brand:"Noir Atelier",sku:"AS-600",barcode:"594000000006",price:379,gender:"Unisex",family:"Oriental",notes:["Ambră","Tonka","Șofran"],longevity:9,desc:"Ambră, tonka, șofran și lemn.",image:"",tags:["toamnă","iarnă","nuntă","eveniment","seară","dulce","elegant","intens","cadou","unisex"],stocks:{"Insula principală":1,"Mall Nord":2}}
];

const STORE_KEY="aromaiqRetailV8";
const DEFAULT_STATE={
  version:8,
  products:DEMO_PRODUCTS,
  locations:["Insula principală","Mall Nord"],
  currentLocation:"Insula principală",
  users:[{id:1,name:"Vânzător demo",role:"seller"},{id:2,name:"Manager demo",role:"manager"}],
  currentUserId:1,
  sales:[],
  interactions:[],
  lostDemand:[],
  cloud:{url:"",key:""},
};
const deepClone=x=>JSON.parse(JSON.stringify(x));
let state=loadState();
let selected=new Set();
let compareSelection=[];
let editingId=null;
let imageDataPending="";
let scanStream=null,scanTimer=null,cloudClient=null;

function loadState(){try{const x=JSON.parse(localStorage.getItem(STORE_KEY));return x?migrateState(x):deepClone(DEFAULT_STATE);}catch{return deepClone(DEFAULT_STATE)}}
function migrateState(s){
  const x={...deepClone(DEFAULT_STATE),...s};
  x.locations=Array.isArray(x.locations)&&x.locations.length?x.locations:["Insula principală"];
  x.products=(x.products||[]).map(p=>{
    const stocks=p.stocks&&typeof p.stocks==="object"?p.stocks:{[x.locations[0]]:Number(p.stock||0)};
    x.locations.forEach(l=>{if(stocks[l]==null)stocks[l]=0});
    return {id:Number(p.id)||Date.now()+Math.random(),name:String(p.name||""),brand:String(p.brand||""),sku:String(p.sku||""),barcode:String(p.barcode||""),price:Number(p.price||0),gender:String(p.gender||"Unisex"),family:String(p.family||""),notes:Array.isArray(p.notes)?p.notes:String(p.notes||"").split(",").map(z=>z.trim()).filter(Boolean),longevity:Number(p.longevity||0),desc:String(p.desc||p.description||""),image:String(p.image||""),tags:Array.isArray(p.tags)?p.tags:[],stocks};
  });
  x.users=Array.isArray(x.users)&&x.users.length?x.users:deepClone(DEFAULT_STATE.users);
  if(!x.currentUserId||!x.users.some(u=>u.id===x.currentUserId))x.currentUserId=x.users[0].id;
  if(!x.locations.includes(x.currentLocation))x.currentLocation=x.locations[0];
  x.sales=Array.isArray(x.sales)?x.sales:[];x.interactions=Array.isArray(x.interactions)?x.interactions:[];x.lostDemand=Array.isArray(x.lostDemand)?x.lostDemand:[];
  x.cloud=x.cloud||{url:"",key:""};
  return x;
}
function saveState(){localStorage.setItem(STORE_KEY,JSON.stringify(state))}
function norm(s){return String(s??"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[șş]/g,"s").replace(/[țţ]/g,"t")}
function esc(s){return String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[m]))}
function money(v){return new Intl.NumberFormat("ro-RO",{style:"currency",currency:"RON",maximumFractionDigits:2}).format(Number(v||0))}
function toast(t){const x=document.getElementById("toast");x.textContent=t;x.classList.add("show");setTimeout(()=>x.classList.remove("show"),1800)}
function currentUser(){return state.users.find(u=>u.id===state.currentUserId)||state.users[0]}
function isManager(){return currentUser()?.role==="manager"}
function getStock(p,loc=state.currentLocation){return Number(p.stocks?.[loc]||0)}
function setStock(p,val,loc=state.currentLocation){p.stocks=p.stocks||{};p.stocks[loc]=Math.max(0,Number(val||0))}
function stockClass(n){return n===0?"zero":n<=2?"low":""}
function productImg(p,cls="pimg"){return `<div class="${cls}">${p.image?`<img src="${esc(p.image)}" alt="">`:`<span>${esc(p.brand||"Parfum")}</span>`}</div>`}
function criteriaText(c){const a=[...c.tags];if(c.family)a.push(c.family);if(c.note)a.push(c.note);if(c.longevity)a.push("persistent");if(c.budgetMax)a.push("≤ "+c.budgetMax+" lei");return a.join(", ")||"cerere generală"}

function renderTop(){
  const ls=document.getElementById("locationSelect");ls.innerHTML=state.locations.map(l=>`<option ${l===state.currentLocation?"selected":""}>${esc(l)}</option>`).join("");
  const us=document.getElementById("userSelect");us.innerHTML=state.users.map(u=>`<option value="${u.id}" ${u.id===state.currentUserId?"selected":""}>${esc(u.name)} · ${u.role==="manager"?"Manager":"Vânzător"}</option>`).join("");
  document.body.classList.toggle("role-manager",isManager());document.body.classList.toggle("role-seller",!isManager());
  document.getElementById("roleLabel").textContent=isManager()?"Manager":"Vânzător";
}
function renderChips(){document.getElementById("chips").innerHTML=TAGS.map(([k,l])=>`<button class="chip ${selected.has(k)?"active":""}" data-tag="${k}">${l}</button>`).join("");document.querySelectorAll(".chip").forEach(b=>b.onclick=()=>{selected.has(b.dataset.tag)?selected.delete(b.dataset.tag):selected.add(b.dataset.tag);renderChips()})}
function currentCriteria(){return{tags:new Set(selected),budgetMax:Number(document.getElementById("budgetMax").value||0),family:document.getElementById("familyFilter").value,note:document.getElementById("noteFilter").value.trim(),longevity:Number(document.getElementById("longevityFilter").value||0)}}
function hasCriteria(c){return c.tags.size||c.budgetMax||c.family||c.note||c.longevity}
function scoreProduct(p,c){let score=0,reasons=[];c.tags.forEach(t=>{if(p.tags.includes(t)){score+=3;reasons.push(t)}});if(c.family&&norm(p.family)===norm(c.family)){score+=2;reasons.push(p.family)};if(c.note&&norm([...(p.notes||[]),p.desc].join(" ")).includes(norm(c.note))){score+=2;reasons.push(c.note)};if(c.longevity&&p.longevity>=c.longevity){score+=1;reasons.push("persistență")};return{score,reasons:[...new Set(reasons)]}}
function recommend(c,limit=6){
  let list=state.products.filter(p=>getStock(p)>0).filter(p=>!c.budgetMax||p.price<=c.budgetMax).filter(p=>!c.family||norm(p.family)===norm(c.family)).filter(p=>!c.longevity||p.longevity>=c.longevity).filter(p=>!c.note||norm([...(p.notes||[]),p.desc].join(" ")).includes(norm(c.note))).map(p=>({p,...scoreProduct(p,c)})).filter(x=>c.tags.size?x.score>0:!!(c.budgetMax||c.family||c.note||c.longevity));
  const s=document.getElementById("recommendSort").value,co=new Intl.Collator("ro",{sensitivity:"base"});
  if(s==="name-asc")list.sort((a,b)=>co.compare(a.p.name,b.p.name));else if(s==="price-asc")list.sort((a,b)=>a.p.price-b.p.price);else if(s==="price-desc")list.sort((a,b)=>b.p.price-a.p.price);else if(s==="stock-desc")list.sort((a,b)=>getStock(b.p)-getStock(a.p));else if(s==="longevity-desc")list.sort((a,b)=>b.p.longevity-a.p.longevity);else list.sort((a,b)=>b.score-a.score||b.p.longevity-a.p.longevity||getStock(b.p)-getStock(a.p));
  return list.slice(0,limit);
}
function track(type,p,extra={}){state.interactions.push({id:Date.now()+Math.random(),type,productId:p.id,location:state.currentLocation,userId:state.currentUserId,date:new Date().toISOString(),...extra});saveState()}
function recordLost(c,source="buttons",query=""){state.lostDemand.push({id:Date.now()+Math.random(),location:state.currentLocation,userId:state.currentUserId,date:new Date().toISOString(),criteria:criteriaText(c),source,query});saveState()}
function renderRecommendations(trackNow=false,c=currentCriteria()){
  const box=document.getElementById("recommendations");if(!hasCriteria(c)){box.innerHTML='<div class="notice">Alege cel puțin un criteriu.</div>';return}
  const res=recommend(c);if(!res.length){box.innerHTML='<div class="notice">Nu avem o potrivire disponibilă în această locație. Cererea a fost înregistrată pentru manager.</div>';if(trackNow)recordLost(c);return}
  if(trackNow)res.forEach(x=>track("recommended",x.p,{criteria:criteriaText(c)}));
  box.innerHTML=res.map(({p,reasons},i)=>{const st=getStock(p);return `<div class="perfume">${productImg(p)}<div><div class="rank">${i===0?"Recomandarea principală":"Alternativa "+(i+1)}</div><div class="pname">${esc(p.name)}</div><div class="brand">${esc(p.brand)}</div><div class="meta">${[p.family,...p.tags.slice(0,4)].filter(Boolean).map(t=>`<span class="tag">${esc(t)}</span>`).join("")}</div><div class="why"><b>De ce:</b> ${esc(reasons.length?reasons.join(", "):p.desc||"se încadrează în criteriile selectate")}${p.notes?.length?` · Note: ${esc(p.notes.slice(0,3).join(", "))}`:""}${p.longevity?` · Persistență ${p.longevity}/10`:""}</div><div class="pbottom"><span class="stock-pill ${stockClass(st)}">Stoc ${st}</span><div class="small-actions"><button class="mini test" onclick="tested(${p.id})">Testat</button><button class="mini" onclick="addCompare(${p.id})">Compară</button><button class="mini dark" onclick="sold(${p.id},'recommend')">Vândut</button></div></div></div><div class="price">${money(p.price)}</div></div>`}).join("");
}
function parseChat(text){
  const s=norm(text),tags=new Set(),dict={"vara":"vară","iarna":"iarnă","primavara":"primăvară","toamna":"toamnă","nunta":"nuntă","mireasa":"nuntă","eveniment":"eveniment","petrecere":"eveniment","birou":"birou","seara":"seară","dulce":"dulce","fresh":"fresh","proaspat":"fresh","elegant":"elegant","intens":"intens","puternic":"intens","discret":"discret","cadou":"cadou","femei":"femei","femeie":"femei","barbati":"bărbați","barbat":"bărbați","unisex":"unisex"};
  Object.entries(dict).forEach(([k,v])=>{if(s.includes(k))tags.add(v)});
  let budgetMax=0;const m=s.match(/(?:sub|pana(?:\s+la)?|max(?:im)?|buget)[^\d]{0,10}(\d{2,5})/)||s.match(/(\d{2,5})\s*(?:lei|ron)/);if(m)budgetMax=Number(m[1]);
  let family="";["Citric","Floral","Gurmand","Lemnos","Oriental","Acvatic","Aromatic","Mosc"].some(f=>s.includes(norm(f))?(family=f,true):false);
  let note="";[...new Set(state.products.flatMap(p=>p.notes||[]))].sort((a,b)=>b.length-a.length).some(n=>s.includes(norm(n))?(note=n,true):false);
  let longevity=s.includes("foarte persistent")?9:s.includes("persistent")?8:0;return{tags,budgetMax,family,note,longevity}
}
function sendChat(){
  const input=document.getElementById("chatText"),text=input.value.trim();if(!text)return;const msgs=document.getElementById("messages");msgs.insertAdjacentHTML("beforeend",`<div class="msg user">${esc(text)}</div>`);
  const c=parseChat(text),res=recommend(c,3);let ans;if(!hasCriteria(c))ans="Spune-mi un stil, o ocazie, un buget sau o notă olfactivă.";else if(!res.length){ans="Nu avem acum o potrivire în această locație. Am înregistrat cererea pentru manager.";recordLost(c,"chat",text)}else{res.forEach(x=>track("recommended",x.p,{criteria:criteriaText(c),source:"chat"}));ans=`Aș începe cu <b>${esc(res[0].p.name)}</b>${res[1]?`, apoi ${esc(res[1].p.name)}`:""}${res[2]?` și ${esc(res[2].p.name)}`:""}.`};msgs.insertAdjacentHTML("beforeend",`<div class="msg bot">${ans}</div>`);input.value="";msgs.scrollTop=msgs.scrollHeight
}
window.tested=id=>{const p=state.products.find(x=>x.id===id);if(!p)return;track("tested",p);toast("Marcat ca testat: "+p.name)}
window.sold=(id,source="manual")=>{const p=state.products.find(x=>x.id===id);if(!p||getStock(p)<1)return;setStock(p,getStock(p)-1);state.sales.push({id:Date.now()+Math.random(),productId:p.id,name:p.name,brand:p.brand,price:p.price,location:state.currentLocation,userId:state.currentUserId,source,date:new Date().toISOString()});track("sold",p,{source});saveState();renderStock();renderRecommendations(false);toast("Vândut: "+p.name)}
window.addCompare=id=>{if(!compareSelection.includes(id)){if(compareSelection.length>=2)compareSelection.shift();compareSelection.push(id)}renderCompareSelectors();nav("compare");renderCompare()}
function renderStock(){
  const q=norm(document.getElementById("stockSearch").value),f=document.getElementById("stockFilter").value,s=document.getElementById("stockSort").value,co=new Intl.Collator("ro",{sensitivity:"base"});let list=state.products.filter(p=>norm([p.name,p.brand,p.sku,p.barcode,p.family,...p.notes].join(" ")).includes(q));
  if(f==="in")list=list.filter(p=>getStock(p)>0);if(f==="low")list=list.filter(p=>getStock(p)>0&&getStock(p)<=2);if(f==="out")list=list.filter(p=>getStock(p)===0);
  if(s==="name-asc")list.sort((a,b)=>co.compare(a.name,b.name));else if(s==="name-desc")list.sort((a,b)=>co.compare(b.name,a.name));else if(s==="stock-desc")list.sort((a,b)=>getStock(b)-getStock(a));else if(s==="stock-asc")list.sort((a,b)=>getStock(a)-getStock(b));else if(s==="price-asc")list.sort((a,b)=>a.price-b.price);else if(s==="price-desc")list.sort((a,b)=>b.price-a.price);else if(s==="brand-asc")list.sort((a,b)=>co.compare(a.brand,b.brand));
  document.getElementById("stockBody").innerHTML=list.map(p=>{const st=getStock(p),mgr=isManager();return `<tr><td><b>${esc(p.name)}</b><br><span style="color:#888">${esc(p.brand)}</span></td><td>${esc(p.sku||p.barcode||"—")}</td><td>${esc(p.family||"—")}</td><td>${money(p.price)}</td><td><span class="stock-pill ${stockClass(st)}">${st}</span></td><td><div class="small-actions"><button class="mini test" onclick="tested(${p.id})">Testat</button><button class="mini" onclick="addCompare(${p.id})">Compară</button><button class="mini dark" onclick="sold(${p.id},'stock')" ${st<1?"disabled":""}>Vândut</button>${mgr?`<button class="mini" onclick="changeStock(${p.id},1)">+1</button><button class="mini" onclick="openEdit(${p.id})">Editează</button>`:""}</div></td></tr>`}).join("");
  const total=state.products.reduce((a,p)=>a+getStock(p),0),value=state.products.reduce((a,p)=>a+getStock(p)*p.price,0),low=state.products.filter(p=>getStock(p)>0&&getStock(p)<=2).length;
  document.getElementById("stats").innerHTML=`<div class="stat"><div class="n">${state.products.length}</div><div class="l">Produse</div></div><div class="stat"><div class="n">${total}</div><div class="l">Bucăți în locație</div></div><div class="stat"><div class="n">${low}</div><div class="l">Stoc mic</div></div><div class="stat"><div class="n">${money(value)}</div><div class="l">Valoare stoc</div></div>`
}
window.changeStock=(id,d)=>{if(!isManager())return;const p=state.products.find(x=>x.id===id);if(!p)return;setStock(p,getStock(p)+d);saveState();renderStock();renderManage();toast("Stoc actualizat")}
function renderCompareSelectors(){const opts=`<option value="">Alege parfum</option>`+state.products.map(p=>`<option value="${p.id}">${esc(p.brand)} — ${esc(p.name)}</option>`).join("");document.getElementById("compareA").innerHTML=opts;document.getElementById("compareB").innerHTML=opts;if(compareSelection[0])document.getElementById("compareA").value=compareSelection[0];if(compareSelection[1])document.getElementById("compareB").value=compareSelection[1]}
function compareCard(p){if(!p)return`<div class="notice">Alege un parfum.</div>`;return `<div class="compare-card"><div class="compare-hero">${productImg(p)}<div><div class="pname">${esc(p.name)}</div><div class="brand">${esc(p.brand)}</div><div class="price" style="margin-top:6px">${money(p.price)}</div><div style="margin-top:8px"><span class="stock-pill ${stockClass(getStock(p))}">Stoc ${getStock(p)}</span></div></div></div><div class="compare-list"><div class="compare-row"><b>Familie</b><span>${esc(p.family||"—")}</span></div><div class="compare-row"><b>Note</b><span>${esc(p.notes.join(", ")||"—")}</span></div><div class="compare-row"><b>Persistență</b><span>${p.longevity?`${p.longevity}/10`:"—"}</span></div><div class="compare-row"><b>Gen</b><span>${esc(p.gender)}</span></div><div class="compare-row"><b>Ocazii / stil</b><span>${esc(p.tags.join(", "))}</span></div><div class="compare-row"><b>Descriere</b><span>${esc(p.desc||"—")}</span></div></div></div>`}
function renderCompare(){const a=state.products.find(p=>String(p.id)===document.getElementById("compareA").value),b=state.products.find(p=>String(p.id)===document.getElementById("compareB").value);compareSelection=[a?.id,b?.id].filter(Boolean);document.getElementById("compareResult").innerHTML=compareCard(a)+compareCard(b)}
function findByCode(code){const c=norm(code.trim());return state.products.find(p=>norm(p.barcode)===c||norm(p.sku)===c)}
function renderScanProduct(p){document.getElementById("scanResult").innerHTML=p?`<div class="perfume">${productImg(p)}<div><div class="pname">${esc(p.name)}</div><div class="brand">${esc(p.brand)}</div><div class="why">${esc(p.family)} · ${money(p.price)}</div><div class="pbottom"><span class="stock-pill ${stockClass(getStock(p))}">Stoc ${getStock(p)}</span><div class="small-actions"><button class="mini test" onclick="tested(${p.id})">Testat</button><button class="mini dark" onclick="sold(${p.id},'scan')">Vândut</button></div></div></div><div></div></div>`:`<div class="notice">Codul nu a fost găsit.</div>`}
async function startScanner(){
  if(!("mediaDevices" in navigator)||!navigator.mediaDevices.getUserMedia){toast("Camera nu este disponibilă");return}
  try{scanStream=await navigator.mediaDevices.getUserMedia({video:{facingMode:"environment"}});const v=document.getElementById("scanVideo");v.srcObject=scanStream;await v.play();document.getElementById("scanPlaceholder").style.display="none";
    if("BarcodeDetector" in window){const detector=new BarcodeDetector({formats:["ean_13","ean_8","code_128","upc_a","upc_e"]});const loop=async()=>{if(!scanStream)return;try{const codes=await detector.detect(v);if(codes[0]){document.getElementById("barcodeInput").value=codes[0].rawValue;renderScanProduct(findByCode(codes[0].rawValue));stopScanner();return}}catch{}scanTimer=setTimeout(loop,350)};loop()}else toast("Browserul nu suportă scanarea automată. Folosește câmpul manual.");
  }catch{toast("Nu am putut porni camera")}
}
function stopScanner(){if(scanTimer)clearTimeout(scanTimer);scanTimer=null;if(scanStream){scanStream.getTracks().forEach(t=>t.stop());scanStream=null}document.getElementById("scanPlaceholder").style.display="block"}

function renderChecks(){document.getElementById("tagChecks").innerHTML=TAGS.map(([k,l])=>`<label class="check"><input type="checkbox" value="${k}"> ${l}</label>`).join("")}
async function readImageFile(file){if(!file)return"";return new Promise(resolve=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.readAsDataURL(file)})}
function notes(v){return String(v||"").split(",").map(x=>x.trim()).filter(Boolean)}
async function addProduct(){
  if(!isManager())return;const name=pName.value.trim(),brand=pBrand.value.trim();if(!name||!brand){toast("Completează numele și brandul");return}
  const file=pImageFile.files[0];if(file)imageDataPending=await readImageFile(file);const tags=[...document.querySelectorAll("#tagChecks input:checked")].map(x=>x.value),gender=pGender.value,gTag=gender==="Femei"?"femei":gender==="Bărbați"?"bărbați":"unisex";if(!tags.includes(gTag))tags.push(gTag);
  const p={id:Date.now(),name,brand,sku:pSku.value.trim(),barcode:pBarcode.value.trim(),price:Number(pPrice.value||0),gender,family:pFamily.value,notes:notes(pNotes.value),longevity:Number(pLongevity.value||0),desc:pDesc.value.trim(),image:imageDataPending||pImage.value.trim(),tags,stocks:Object.fromEntries(state.locations.map(l=>[l,l===state.currentLocation?Number(pStock.value||0):0]))};
  state.products.push(p);saveState();renderManage();renderCompareSelectors();["pName","pBrand","pSku","pBarcode","pPrice","pNotes","pDesc","pImage"].forEach(id=>document.getElementById(id).value="");pStock.value=1;pImageFile.value="";imageDataPending="";document.querySelectorAll("#tagChecks input").forEach(x=>x.checked=false);toast("Produs adăugat")
}
function renderManage(){const box=document.getElementById("manageList");if(!box)return;box.innerHTML=state.products.map(p=>`<div class="manage-item">${productImg(p,"thumb")}<div><b>${esc(p.name)}</b><div style="font-size:9px;color:#888;margin-top:2px">${esc(p.brand)} · ${esc(p.sku||p.barcode||"fără cod")} · stoc ${getStock(p)}</div></div><div class="small-actions"><button class="mini" onclick="openEdit(${p.id})">Editează</button><button class="mini delete" onclick="deleteProduct(${p.id})">Șterge</button></div></div>`).join("")}
window.deleteProduct=id=>{if(!isManager())return;const p=state.products.find(x=>x.id===id);if(p&&confirm(`Ștergi ${p.name}?`)){state.products=state.products.filter(x=>x.id!==id);saveState();renderManage();renderStock();toast("Produs șters")}}
window.openEdit=id=>{const p=state.products.find(x=>x.id===id);if(!p)return;editingId=id;eName.value=p.name;eBrand.value=p.brand;eSku.value=p.sku;eBarcode.value=p.barcode;ePrice.value=p.price;eStock.value=getStock(p);eGender.value=p.gender;eFamily.value=p.family;eNotes.value=p.notes.join(", ");eLongevity.value=p.longevity;eDesc.value=p.desc;eImage.value=p.image;editTagChecks.innerHTML=TAGS.map(([k,l])=>`<label class="check"><input type="checkbox" value="${k}" ${p.tags.includes(k)?"checked":""}> ${l}</label>`).join("");editModal.classList.add("open")}
function saveEdit(){const p=state.products.find(x=>x.id===editingId);if(!p)return;p.name=eName.value.trim();p.brand=eBrand.value.trim();p.sku=eSku.value.trim();p.barcode=eBarcode.value.trim();p.price=Number(ePrice.value||0);setStock(p,Number(eStock.value||0));p.gender=eGender.value;p.family=eFamily.value;p.notes=notes(eNotes.value);p.longevity=Number(eLongevity.value||0);p.desc=eDesc.value.trim();p.image=eImage.value.trim();p.tags=[...document.querySelectorAll("#editTagChecks input:checked")].map(x=>x.value);saveState();editModal.classList.remove("open");renderManage();renderStock();renderCompareSelectors();toast("Produs actualizat")}

function normalizeHeader(s){return norm(s).replace(/[^a-z0-9]+/g,"")}
function valBy(row,aliases){const keys=Object.keys(row);for(const a of aliases){const k=keys.find(k=>normalizeHeader(k)===normalizeHeader(a));if(k!=null&&row[k]!=null&&row[k]!=="")return row[k]}return""}
function parseTags(v){if(Array.isArray(v))return v;return String(v||"").split(/[,;|]/).map(x=>x.trim().toLowerCase()).filter(Boolean)}
function upsertRows(rows){
  let added=0,updated=0,skipped=0;
  for(const r of rows){
    const name=String(valBy(r,["nume","name","parfum","produs"])).trim(),brand=String(valBy(r,["brand","marca"])).trim();if(!name){skipped++;continue}
    const sku=String(valBy(r,["sku","cod","codprodus"])).trim(),barcode=String(valBy(r,["barcode","codbare","ean","ean13"])).trim(),loc=String(valBy(r,["locatie","location","magazin"])).trim()||state.currentLocation;
    if(!state.locations.includes(loc))state.locations.push(loc);
    let p=state.products.find(x=>(sku&&x.sku===sku)||(barcode&&x.barcode===barcode)||(norm(x.name)===norm(name)&&norm(x.brand)===norm(brand)));
    const price=Number(String(valBy(r,["pret","price","pretvanzare"])).replace(",",".")||0),stock=Number(String(valBy(r,["stoc","stock","cantitate","qty"])).replace(",",".")||0);
    const data={name,brand,sku,barcode,price,gender:String(valBy(r,["gen","gender"])||"Unisex"),family:String(valBy(r,["familie","family","familieolfactiva"])),notes:notes(valBy(r,["note","notes","noteprincipale"])),longevity:Number(valBy(r,["persistenta","longevity"])||0),desc:String(valBy(r,["descriere","description"])),image:String(valBy(r,["imagine","image","imageurl","poza"])),tags:parseTags(valBy(r,["categorii","tags","ocazii"]))};
    if(p){Object.assign(p,{...data,id:p.id,stocks:p.stocks});setStock(p,stock,loc);updated++}else{p={id:Date.now()+Math.random(),...data,stocks:Object.fromEntries(state.locations.map(l=>[l,0]))};setStock(p,stock,loc);state.products.push(p);added++}
  }
  state.products.forEach(p=>state.locations.forEach(l=>{if(p.stocks[l]==null)p.stocks[l]=0}));saveState();renderAll();return{added,updated,skipped}
}
async function importCatalog(){
  const f=catalogFile.files[0];if(!f){toast("Alege un fișier");return}
  try{let rows=[];const ext=f.name.split(".").pop().toLowerCase();
    if(ext==="json"){const d=JSON.parse(await f.text());rows=Array.isArray(d)?d:(d.products||[])}
    else if(ext==="csv"){const text=await f.text(),lines=text.split(/\r?\n/).filter(Boolean),sep=(lines[0].match(/;/g)||[]).length>(lines[0].match(/,/g)||[]).length?";":",";const headers=lines[0].split(sep).map(x=>x.replace(/^"|"$/g,"").trim());rows=lines.slice(1).map(line=>{const vals=line.match(/(".*?"|[^",;]+)(?=\s*[,;]|\s*$)/g)||line.split(sep);return Object.fromEntries(headers.map((h,i)=>[h,String(vals[i]||"").replace(/^"|"$/g,"").trim()]))})}
    else{if(typeof XLSX==="undefined")throw new Error("Biblioteca Excel nu s-a încărcat");const buf=await f.arrayBuffer(),wb=XLSX.read(buf,{type:"array"}),ws=wb.Sheets[wb.SheetNames[0]];rows=XLSX.utils.sheet_to_json(ws,{defval:""})}
    const r=upsertRows(rows);importStatus.innerHTML=`Import finalizat: <b>${r.added}</b> produse noi, <b>${r.updated}</b> actualizate, <b>${r.skipped}</b> ignorate.`;
  }catch(e){importStatus.textContent="Eroare la import: "+e.message}
}

function renderManager(){
  const rec=state.interactions.filter(x=>x.type==="recommended").length,test=state.interactions.filter(x=>x.type==="tested").length,sold=state.sales.length,revenue=state.sales.reduce((a,s)=>a+s.price,0);
  managerStats.innerHTML=`<div class="stat"><div class="n">${rec}</div><div class="l">Recomandări</div></div><div class="stat"><div class="n">${test}</div><div class="l">Testate</div></div><div class="stat"><div class="n">${sold}</div><div class="l">Vândute</div></div><div class="stat"><div class="n">${money(revenue)}</div><div class="l">Vânzări înregistrate</div></div>`;
  const mx=Math.max(rec,test,sold,1);funnelBox.innerHTML=[["Recomandat",rec],["Testat",test],["Vândut",sold]].map(([n,v])=>`<div style="font-size:10px;margin:10px 0"><div style="display:flex;justify-content:space-between"><span>${n}</span><b>${v}</b></div><div class="bar"><span style="width:${v/mx*100}%"></span></div></div>`).join("");
  const counts={};state.sales.forEach(s=>counts[s.productId]=(counts[s.productId]||0)+1);topProducts.innerHTML=Object.entries(counts).sort((a,b)=>b[1]-a[1]).slice(0,8).map(([id,c])=>{const p=state.products.find(x=>x.id==id);return`<div class="list-item"><span>${esc(p?.name||"Produs șters")}</span><b>${c} vânzări</b></div>`}).join("")||'<div class="notice">Încă nu există vânzări.</div>';
  const lost={};state.lostDemand.forEach(x=>lost[x.criteria]=(lost[x.criteria]||0)+1);lostDemandBox.innerHTML=Object.entries(lost).sort((a,b)=>b[1]-a[1]).slice(0,10).map(([k,v])=>`<div class="list-item"><span>${esc(k)}</span><b>${v}×</b></div>`).join("")||'<div class="notice">Nu există cereri pierdute.</div>';
  locationSummary.innerHTML=state.locations.map(l=>{const units=state.products.reduce((a,p)=>a+getStock(p,l),0),val=state.products.reduce((a,p)=>a+getStock(p,l)*p.price,0);return`<div class="list-item"><span><b>${esc(l)}</b><br><span style="color:#888">${units} bucăți</span></span><b>${money(val)}</b></div>`}).join("")
}
function addLocation(){const n=newLocationName.value.trim();if(!n||state.locations.includes(n))return;state.locations.push(n);state.products.forEach(p=>p.stocks[n]=0);newLocationName.value="";saveState();renderAll();toast("Locație adăugată")}

function renderUsers(){usersList.innerHTML=state.users.map(u=>`<div class="list-item"><span>${esc(u.name)} · ${u.role==="manager"?"Manager":"Vânzător"}</span>${state.users.length>1?`<button class="mini delete" onclick="deleteUser(${u.id})">Șterge</button>`:""}</div>`).join("");supabaseUrl.value=state.cloud.url||"";supabaseKey.value=state.cloud.key||"";updateCloudStatus()}
window.deleteUser=id=>{if(id===state.currentUserId){toast("Nu poți șterge utilizatorul activ");return}state.users=state.users.filter(u=>u.id!==id);saveState();renderTop();renderUsers()}
function addUser(){const n=newUserName.value.trim();if(!n)return;state.users.push({id:Date.now(),name:n,role:newUserRole.value});newUserName.value="";saveState();renderTop();renderUsers();toast("Utilizator adăugat")}
function initCloud(){cloudClient=null;if(state.cloud.url&&state.cloud.key&&window.supabase){cloudClient=window.supabase.createClient(state.cloud.url,state.cloud.key)}updateCloudStatus()}
function updateCloudStatus(){const on=!!cloudClient;cloudDot.classList.toggle("on",on);cloudText.textContent=on?"Conexiune configurată":"Neconfigurat"}
function saveCloud(){state.cloud.url=supabaseUrl.value.trim();state.cloud.key=supabaseKey.value.trim();saveState();initCloud();toast("Setări cloud salvate")}
async function pushCloud(){if(!cloudClient){toast("Configurează Supabase");return}try{const payload={...state,cloud:{url:state.cloud.url,key:""}};const {error}=await cloudClient.from("aromaiq_state").upsert({id:"main",payload,updated_at:new Date().toISOString()});if(error)throw error;toast("Date trimise în cloud")}catch(e){alert("Eroare cloud: "+e.message)}}
async function pullCloud(){if(!cloudClient){toast("Configurează Supabase");return}try{const {data,error}=await cloudClient.from("aromaiq_state").select("payload").eq("id","main").single();if(error)throw error;const cloudCfg=state.cloud;state=migrateState(data.payload);state.cloud=cloudCfg;saveState();renderAll();toast("Date descărcate din cloud")}catch(e){alert("Eroare cloud: "+e.message)}}

function exportBackup(){const blob=new Blob([JSON.stringify(state,null,2)],{type:"application/json"}),a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="aromaiq-backup.json";a.click();URL.revokeObjectURL(a.href)}
function importBackup(file){const r=new FileReader();r.onload=()=>{try{state=migrateState(JSON.parse(r.result));saveState();renderAll();toast("Backup importat")}catch{alert("Backup invalid")}};r.readAsText(file)}

function clearRec(){selected.clear();renderChips();budgetMax.value="";familyFilter.value="";noteFilter.value="";longevityFilter.value="";recommendations.innerHTML=""}
function nav(view){
  if(!isManager()&&["add","import","manager","cloud","backup"].includes(view))view="recommend";
  document.querySelectorAll(".view").forEach(x=>x.classList.toggle("active",x.id===view));document.querySelectorAll("[data-view]").forEach(x=>x.classList.toggle("active",x.dataset.view===view));
  const t={recommend:["Recomandă un parfum","Recomandări rapide din stocul locației."],stock:["Stoc","Inventarul locației selectate."],compare:["Compară","Ajută clientul să aleagă între două parfumuri."],scan:["Scanare","Găsește produsul după cod de bare sau SKU."],add:["Produse","Catalog și administrare produse."],import:["Import catalog","Încarcă rapid nomenclatorul magazinului."],manager:["Manager","Vânzări, funnel, cereri pierdute și stoc central."],cloud:["Cloud & conturi","Utilizatori și sincronizare Supabase."],backup:["Backup","Export și restaurare completă."]};pageTitle.textContent=t[view][0];pageDesc.textContent=t[view][1];
  if(view==="stock")renderStock();if(view==="compare"){renderCompareSelectors();renderCompare()}if(view==="add")renderManage();if(view==="manager")renderManager();if(view==="cloud")renderUsers();if(view!=="scan")stopScanner()
}
function renderAll(){renderTop();renderChips();renderStock();renderCompareSelectors();renderManage();renderManager();renderUsers();initCloud()}

document.querySelectorAll("[data-view]").forEach(b=>b.onclick=()=>nav(b.dataset.view));
locationSelect.onchange=()=>{state.currentLocation=locationSelect.value;saveState();renderAll();if(document.querySelector(".view.active")?.id==="recommend")recommendations.innerHTML=""};
userSelect.onchange=()=>{state.currentUserId=Number(userSelect.value);saveState();renderAll();nav("recommend")};
recommendBtn.onclick=()=>renderRecommendations(true);clearBtn.onclick=clearRec;sendBtn.onclick=sendChat;chatText.addEventListener("keydown",e=>{if(e.key==="Enter")sendChat()});
document.querySelectorAll("[data-budget]").forEach(b=>b.onclick=()=>{document.querySelectorAll("[data-budget]").forEach(x=>x.classList.remove("active"));b.classList.add("active");budgetMax.value=b.dataset.budget});
recommendSort.onchange=()=>{if(hasCriteria(currentCriteria()))renderRecommendations(false)};
stockSearch.oninput=renderStock;stockFilter.onchange=renderStock;stockSort.onchange=renderStock;
compareBtn.onclick=renderCompare;clearCompareBtn.onclick=()=>{compareSelection=[];renderCompareSelectors();compareResult.innerHTML=""};
startScanBtn.onclick=startScanner;stopScanBtn.onclick=stopScanner;barcodeSearchBtn.onclick=()=>renderScanProduct(findByCode(barcodeInput.value));barcodeInput.addEventListener("keydown",e=>{if(e.key==="Enter")renderScanProduct(findByCode(barcodeInput.value))});
addBtn.onclick=addProduct;pImageFile.onchange=async()=>{if(pImageFile.files[0])imageDataPending=await readImageFile(pImageFile.files[0])};
cancelEdit.onclick=()=>editModal.classList.remove("open");saveEdit.onclick=saveEdit;editModal.onclick=e=>{if(e.target===editModal)editModal.classList.remove("open")};
importCatalogBtn.onclick=importCatalog;addLocationBtn.onclick=addLocation;addUserBtn.onclick=addUser;saveCloudBtn.onclick=saveCloud;pushCloudBtn.onclick=pushCloud;pullCloudBtn.onclick=pullCloud;
exportBtn.onclick=exportBackup;importFile.onchange=e=>{if(e.target.files[0])importBackup(e.target.files[0])};resetBtn.onclick=()=>{if(confirm("Resetezi toate datele demo?")){state=deepClone(DEFAULT_STATE);saveState();renderAll();nav("recommend");toast("Reset efectuat")}};

renderChecks();renderAll();nav("recommend");
