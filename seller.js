const _vs=document.getElementById("viewStore");if(_vs&&typeof STORE_URL!=="undefined")_vs.href=STORE_URL;
const $=i=>document.getElementById(i);
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const money=n=>"₦"+Number(n).toLocaleString("en-NG");
const root=document.documentElement;
function setTheme(t){root.dataset.theme=t;try{localStorage.setItem("theme",t);}catch(e){}$("themeBtn").textContent=t==="dark"?"☀":"◐";}
$("themeBtn").onclick=()=>setTheme(root.dataset.theme==="dark"?"light":"dark");
setTheme(root.dataset.theme||"light");

if(!sb){$("login").innerHTML="<h2>Almost there</h2><p>Add your Supabase URL and anon key in <b>shared/supabase.js</b>, then reload this page.</p>";throw new Error("Supabase not configured");}

let editing=null,PRODS=[];
function show(on){$("login").hidden=on;$("dash").hidden=!on;$("out").hidden=!on;if(on){loadProducts();loadOrders();loadBookings();}}
sb.auth.getSession().then(({data})=>show(!!data.session));
$("lf").onsubmit=async e=>{e.preventDefault();$("lmsg").textContent="Signing in…";
  const {error}=await sb.auth.signInWithPassword({email:$("em").value,password:$("pw").value});
  if(error)$("lmsg").textContent=error.message;else{$("lmsg").textContent="";show(true);}};
$("out").onclick=async()=>{await sb.auth.signOut();show(false);};
document.querySelectorAll("[data-tab]").forEach(b=>b.onclick=()=>{
  document.querySelectorAll("[data-tab]").forEach(x=>x.setAttribute("aria-pressed",x===b));
  ["products","orders","bookings"].forEach(t=>$("t-"+t).hidden=t!==b.dataset.tab);
});

/* Products */
async function loadProducts(){
  const {data}=await sb.from("products").select("*").order("created_at",{ascending:false});
  PRODS=data||[];
  $("plist").innerHTML=PRODS.map(p=>`<div class="ri">${p.image_url?`<img src="${esc(p.image_url)}" alt="">`:'<div class="ph"></div>'}<div class="n"><b>${esc(p.name)}</b><div class="meta">${esc(p.style)} · ${money(p.price)} · ${p.in_stock?"In stock":"Sold out"} · ${p.active?"Live":"Hidden"}</div></div><button class="chip" data-e="${p.id}">Edit</button><button class="chip" data-d="${p.id}">Delete</button></div>`).join("")||'<p class="meta">No wigs yet. Add your first one above.</p>';
  $("plist").querySelectorAll("[data-e]").forEach(b=>b.onclick=()=>edit(b.dataset.e));
  $("plist").querySelectorAll("[data-d]").forEach(b=>b.onclick=async()=>{if(confirm("Delete this wig?")){await sb.from("products").delete().eq("id",b.dataset.d);loadProducts();}});
}
function edit(id){
  const p=PRODS.find(x=>x.id==id),f=$("pf");editing=p.id;f.dataset.img=p.image_url||"";
  ["name","style","price","hair_length","color","hair_type","density","cap","lifespan"].forEach(k=>f.elements[k].value=p[k]??"");
  f.elements.in_stock.checked=!!p.in_stock;f.elements.active.checked=!!p.active;
  $("pft").textContent="Edit wig";$("cancel").hidden=false;f.scrollIntoView({behavior:"smooth"});
}
function reset(){editing=null;$("pf").reset();$("pf").dataset.img="";$("pft").textContent="Add a wig";$("cancel").hidden=true;}
$("cancel").onclick=reset;
$("pf").onsubmit=async e=>{
  e.preventDefault();const f=$("pf"),v=Object.fromEntries(new FormData(f));$("pmsg").textContent="Saving…";
  let image_url=f.dataset.img||null;const file=$("file").files[0];
  if(file){
    const path=Date.now()+"-"+file.name.replace(/[^\w.]/g,"_");
    const up=await sb.storage.from("product-images").upload(path,file);
    if(up.error){$("pmsg").textContent="Photo upload failed: "+up.error.message;return;}
    image_url=sb.storage.from("product-images").getPublicUrl(path).data.publicUrl;
  }
  const row={name:v.name,style:v.style,price:+v.price,hair_length:v.hair_length,color:v.color,hair_type:v.hair_type,density:v.density,cap:v.cap,lifespan:v.lifespan,image_url,in_stock:!!v.in_stock,active:!!v.active};
  const {error}=editing?await sb.from("products").update(row).eq("id",editing):await sb.from("products").insert(row);
  if(error){$("pmsg").textContent="Could not save: "+error.message;return;}
  $("pmsg").textContent="Saved. It is now on the store.";reset();loadProducts();
};

/* Orders and bookings */
const sel=(table,id,cur,opts)=>`<select data-t="${table}" data-id="${id}">${opts.map(o=>`<option${o===cur?" selected":""}>${o}</option>`).join("")}</select>`;
function wireStatus(box){box.querySelectorAll("select[data-t]").forEach(s=>s.onchange=()=>sb.from(s.dataset.t).update({status:s.value}).eq("id",s.dataset.id));}
async function loadOrders(){
  const {data}=await sb.from("orders").select("*").order("created_at",{ascending:false});
  $("t-orders").innerHTML=(data||[]).map(o=>`<div class="ri"><div class="n"><b>${esc(o.customer_name)}</b> · ${money(o.total)}<div class="meta">${(o.items||[]).map(i=>esc(i.qty+"× "+i.name)).join(", ")}</div><div class="meta">${esc(o.email)} · ${esc(o.address)}, ${esc(o.city)} ${esc(o.postcode||"")}</div></div>${sel("orders",o.id,o.status,["new","paid","shipped","delivered","cancelled"])}</div>`).join("")||'<p class="meta">No orders yet.</p>';
  wireStatus($("t-orders"));
}
async function loadBookings(){
  const {data}=await sb.from("bookings").select("*").order("created_at",{ascending:false});
  $("t-bookings").innerHTML=(data||[]).map(b=>`<div class="ri"><div class="n"><b>${esc(b.name)}</b> · ${esc(b.service)}<div class="meta">${esc(b.booking_date)} at ${esc(b.booking_time)} · ${esc(b.phone)}</div>${b.notes?`<div class="meta">${esc(b.notes)}</div>`:""}</div>${sel("bookings",b.id,b.status,["pending","confirmed","done","cancelled"])}</div>`).join("")||'<p class="meta">No bookings yet.</p>';
  wireStatus($("t-bookings"));
}