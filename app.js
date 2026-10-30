
const $ = id => document.getElementById(id);
const config = window.UNIMARKET_CONFIG || {};
const configured = config.SUPABASE_URL && config.SUPABASE_ANON_KEY &&
  !config.SUPABASE_URL.includes("ใส่_") &&
  !config.SUPABASE_ANON_KEY.includes("ใส่_");

const db = configured && window.supabase
  ? window.supabase.createClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY)
  : null;

let currentUser = null;
let products = [];
let activeCategory = "ทั้งหมด";
let authMode = "login";

const demoProducts = [
  {id:"d1",title:"เสื้อยืดมินิมอล",price:120,category:"เสื้อผ้า",description:"เสื้อยืดสภาพดี ใส่สบาย",seller_contact:"LINE: demo",seller_name:"Demo Shop",image_url:null},
  {id:"d2",title:"หูฟังไร้สาย",price:350,category:"อุปกรณ์ไอที",description:"หูฟังใช้งานได้ปกติ",seller_contact:"LINE: demo",seller_name:"Tech Store",image_url:null},
  {id:"d3",title:"หนังสือเตรียมสอบ",price:85,category:"หนังสือ",description:"หนังสือสภาพดี",seller_contact:"LINE: demo",seller_name:"Book Corner",image_url:null},
  {id:"d4",title:"กระเป๋าผ้าแฮนด์เมด",price:199,category:"งานแฮนด์เมด",description:"ทำมือ มีใบเดียว",seller_contact:"LINE: demo",seller_name:"Handmade",image_url:null}
];

function toast(message){
  const el=$("toast");
  el.textContent=message;
  el.classList.add("show");
  setTimeout(()=>el.classList.remove("show"),2600);
}

function money(value){
  return Number(value).toLocaleString("th-TH",{maximumFractionDigits:2})+" บาท";
}

function safe(value){
  return String(value??"").replace(/[&<>"']/g,char=>({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  }[char]));
}

async function loadSession(){
  if(!db){
    products=demoProducts;
    renderProducts();
    $("loginBtn").textContent="เข้าสู่ระบบ";
    return;
  }

  const {data}=await db.auth.getSession();
  currentUser=data.session?.user||null;
  updateHeader();

  db.auth.onAuthStateChange((_event,session)=>{
    currentUser=session?.user||null;
    updateHeader();
  });

  await loadProducts();
}

function updateHeader(){
  $("loginBtn").classList.toggle("hidden",!!currentUser);
  $("logoutBtn").classList.toggle("hidden",!currentUser);
  $("sellBtn").textContent=currentUser?"＋ ลงขายสินค้า":"＋ ลงขายสินค้า";
}

async function loadProducts(){
  if(!db){
    products=demoProducts;
    renderProducts();
    return;
  }

  $("productGrid").innerHTML='<div class="loading-state">กำลังโหลดสินค้า…</div>';

  const {data,error}=await db
    .from("products")
    .select("*, profiles(display_name)")
    .eq("status","active")
    .order("created_at",{ascending:false});

  if(error){
    $("productGrid").innerHTML='<div class="loading-state">โหลดสินค้าไม่สำเร็จ: '+safe(error.message)+'</div>';
    return;
  }

  products=(data||[]).map(item=>({
    ...item,
    seller_name:item.profiles?.display_name||"สมาชิก UniMarket"
  }));

  renderProducts();
}

function renderProducts(){
  const keyword=$("searchInput").value.trim().toLowerCase();
  let list=products.filter(item=>{
    const matchCategory=activeCategory==="ทั้งหมด"||item.category===activeCategory;
    const text=(item.title+" "+item.description+" "+item.category).toLowerCase();
    return matchCategory&&text.includes(keyword);
  });

  const sort=$("sortSelect").value;
  if(sort==="price-low")list.sort((a,b)=>Number(a.price)-Number(b.price));
  if(sort==="price-high")list.sort((a,b)=>Number(b.price)-Number(a.price));

  $("resultCount").textContent="พบสินค้า "+list.length+" รายการ";
  $("emptyState").classList.toggle("hidden",list.length>0);

  $("productGrid").innerHTML=list.map(item=>`
    <article class="product-card" data-id="${safe(item.id)}">
      <div class="product-image">
        ${item.image_url
          ? `<img src="${safe(item.image_url)}" alt="${safe(item.title)}">`
          : "🛍️"}
      </div>
      <div class="product-info">
        <span class="product-category">${safe(item.category)}</span>
        <h3>${safe(item.title)}</h3>
        <div class="product-price">${money(item.price)}</div>
        <div class="product-seller">ผู้ขาย: ${safe(item.seller_name)}</div>
      </div>
    </article>
  `).join("");

  document.querySelectorAll(".product-card").forEach(card=>{
    card.addEventListener("click",()=>showDetail(card.dataset.id));
  });
}

function showDetail(id){
  const item=products.find(product=>String(product.id)===String(id));
  if(!item)return;

  $("detailContent").innerHTML=`
    <div class="detail-layout">
      <div>
        ${item.image_url
          ? `<img class="detail-image" src="${safe(item.image_url)}" alt="${safe(item.title)}">`
          : `<div class="detail-image" style="display:grid;place-items:center;font-size:65px">🛍️</div>`}
      </div>
      <div class="detail-info">
        <span class="product-category">${safe(item.category)}</span>
        <h2>${safe(item.title)}</h2>
        <div class="detail-price">${money(item.price)}</div>
        <p>${safe(item.description||"ไม่มีรายละเอียดเพิ่มเติม")}</p>
        <div class="detail-contact">
          <b>ผู้ขาย:</b> ${safe(item.seller_name)}<br>
          <b>ช่องทางติดต่อ:</b> ${safe(item.seller_contact)}
        </div>
        <div class="detail-actions">
          ${db&&currentUser?`<button class="btn btn-primary" id="favoriteBtn">♡ รายการโปรด</button>`:""}
          ${currentUser&&item.seller_id===currentUser.id?`<button class="btn btn-ghost" id="deleteProductBtn">ลบประกาศ</button>`:""}
        </div>
      </div>
    </div>
  `;

  $("detailDialog").showModal();

  if($("favoriteBtn")){
    $("favoriteBtn").onclick=()=>toggleFavorite(item.id);
  }

  if($("deleteProductBtn")){
    $("deleteProductBtn").onclick=()=>deleteProduct(item.id);
  }
}

async function toggleFavorite(productId){
  const {data:existing,error:findError}=await db
    .from("favorites")
    .select("product_id")
    .eq("user_id",currentUser.id)
    .eq("product_id",productId)
    .maybeSingle();

  if(findError)return toast(findError.message);

  if(existing){
    const {error}=await db.from("favorites")
      .delete()
      .eq("user_id",currentUser.id)
      .eq("product_id",productId);
    if(error)return toast(error.message);
    toast("นำออกจากรายการโปรดแล้ว");
  }else{
    const {error}=await db.from("favorites")
      .insert({user_id:currentUser.id,product_id:productId});
    if(error)return toast(error.message);
    toast("เพิ่มรายการโปรดแล้ว");
  }
}

async function deleteProduct(id){
  if(!confirm("ต้องการลบประกาศสินค้านี้ใช่ไหม?"))return;

  const {error}=await db.from("products")
    .delete().eq("id",id);

  if(error)return toast(error.message);

  $("detailDialog").close();
  toast("ลบประกาศแล้ว");
  await loadProducts();
}

function openAuth(mode){
  authMode=mode;
  $("authTitle").textContent=mode==="signup"?"สร้างบัญชี UniMarket":"ยินดีต้อนรับกลับมา";
  $("authSubtitle").textContent=mode==="signup"?"สมัครสมาชิกเพื่อเริ่มซื้อขาย":"เข้าสู่ระบบเพื่อเริ่มซื้อขาย";
  $("authSubmit").textContent=mode==="signup"?"สมัครสมาชิก":"เข้าสู่ระบบ";
  $("nameLabel").classList.toggle("hidden",mode!=="signup");
  $("authSwitch").innerHTML=mode==="signup"
    ? 'มีบัญชีแล้ว? <button type="button" class="text-button" id="switchAuthBtn">เข้าสู่ระบบ</button>'
    : 'ยังไม่มีบัญชี? <button type="button" class="text-button" id="switchAuthBtn">สมัครสมาชิก</button>';

  $("switchAuthBtn").onclick=()=>openAuth(mode==="signup"?"login":"signup");
  $("authMessage").textContent="";
  $("authDialog").showModal();
}

$("loginBtn").onclick=()=>openAuth("login");

$("logoutBtn").onclick=async()=>{
  if(!db)return;
  const {error}=await db.auth.signOut();
  if(error)return toast(error.message);
  currentUser=null;
  updateHeader();
  toast("ออกจากระบบแล้ว");
};

$("sellBtn").onclick=()=>{
  if(!db)return toast("กรุณาตั้งค่า Supabase ก่อนใช้งานระบบลงขาย");
  if(!currentUser)return openAuth("login");
  $("sellMessage").textContent="";
  $("sellDialog").showModal();
};

$("authForm").addEventListener("submit",async event=>{
  event.preventDefault();
  if(!db)return $("authMessage").textContent="กรุณาตั้งค่า Supabase ในไฟล์ config.js ก่อน";

  const email=$("authEmail").value.trim();
  const password=$("authPassword").value;

  $("authSubmit").disabled=true;
  $("authMessage").textContent="กำลังดำเนินการ…";

  try{
    if(authMode==="signup"){
      const name=$("displayName").value.trim();
      const {data,error}=await db.auth.signUp({
        email,password,
        options:{data:{display_name:name}}
      });
      if(error)throw error;

      $("authMessage").textContent=data.session
        ?"สมัครสมาชิกสำเร็จ"
        :"สมัครสำเร็จ กรุณาตรวจสอบอีเมลเพื่อยืนยันบัญชี";

      if(data.session)$("authDialog").close();
    }else{
      const {error}=await db.auth.signInWithPassword({email,password});
      if(error)throw error;
      $("authDialog").close();
      toast("เข้าสู่ระบบสำเร็จ");
    }
  }catch(error){
    $("authMessage").textContent=error.message;
  }finally{
    $("authSubmit").disabled=false;
  }
});

$("sellForm").addEventListener("submit",async event=>{
  event.preventDefault();

  if(!db||!currentUser){
    return $("sellMessage").textContent="กรุณาตั้งค่า Supabase และเข้าสู่ระบบก่อน";
  }

  const btn=$("publishBtn");
  btn.disabled=true;
  btn.textContent="กำลังเผยแพร่…";

  try{
    let image_url=null;
    const file=$("productImage").files[0];

    if(file){
      if(file.size>5*1024*1024)throw new Error("รูปภาพต้องมีขนาดไม่เกิน 5 MB");
      if(!["image/jpeg","image/png","image/webp"].includes(file.type)){
        throw new Error("รองรับเฉพาะ JPG, PNG และ WEBP");
      }

      const ext=file.name.split(".").pop().toLowerCase();
      const path=`${currentUser.id}/${crypto.randomUUID()}.${ext}`;

      const {error:uploadError}=await db.storage
        .from("product-images")
        .upload(path,file,{contentType:file.type,upsert:false});

      if(uploadError)throw uploadError;

      const {data}=db.storage.from("product-images").getPublicUrl(path);
      image_url=data.publicUrl;
    }

    const payload={
      seller_id:currentUser.id,
      title:$("productTitle").value.trim(),
      price:Number($("productPrice").value),
      category:$("productCategory").value,
      description:$("productDescription").value.trim(),
      seller_contact:$("sellerContact").value.trim(),
      image_url
    };

    const {error}=await db.from("products").insert(payload);
    if(error)throw error;

    $("sellDialog").close();
    $("sellForm").reset();
    toast("ลงประกาศสินค้าสำเร็จ!");
    await loadProducts();
  }catch(error){
    $("sellMessage").textContent=error.message;
  }finally{
    btn.disabled=false;
    btn.textContent="เผยแพร่ประกาศ";
  }
});

$("searchInput").addEventListener("input",renderProducts);
$("sortSelect").addEventListener("change",renderProducts);

$("categoryRow").addEventListener("click",event=>{
  const btn=event.target.closest("[data-category]");
  if(!btn)return;

  activeCategory=btn.dataset.category;

  document.querySelectorAll(".category-chip").forEach(chip=>{
    chip.classList.toggle("active",chip===btn);
  });

  renderProducts();
});

if(!db){
  $("resultCount").textContent="โหมดตัวอย่าง — ยังไม่ได้เชื่อมฐานข้อมูล";
}

loadSession();
