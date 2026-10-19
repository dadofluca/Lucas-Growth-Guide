/* Luca Family Sync — device join, no email/browser handoff */
(function(){
  const badge=document.getElementById("patchBadge");
  if(badge && !/^P(?:4[8-9]|[5-9]\d|\d{3,})$/.test(badge.textContent||"")) badge.textContent="P49";

  const form=document.getElementById("authForm");
  if(!form) return;

  form.innerHTML=`
    <div class="field">
      <label>Family code</label>
      <input id="deviceFamilyCode" type="text" inputmode="text" autocapitalize="characters" autocomplete="off" placeholder="Enter family code">
    </div>
    <div class="field">
      <label>Who's using this phone?</label>
      <select id="deviceCaregiver" style="width:100%;border:1px solid #bda991;background:#f2e9dd;color:#303832;border-radius:15px;padding:12px;font:inherit">
        <option value="Sam">Sam</option>
        <option value="Maddie">Maddie</option>
        <option value="Nona">Nona</option>
        <option value="Boppa">Boppa</option>
        <option value="Jay">Jay</option>
        <option value="Yolanda">Yolanda</option>
        <option value="Lindsay">Lindsay</option>
        <option value="KJ">KJ</option>
        <option value="Luca">Luca</option>
        <option value="Other">Other</option>
      </select>
    </div>
    <div class="field" id="otherCaregiverWrap" style="display:none">
      <label>Name</label>
      <input id="otherCaregiver" type="text" autocomplete="name" placeholder="Caregiver name">
    </div>
    <button id="deviceJoin" class="confirm">Connect this phone</button>
    <div class="why" style="margin-top:8px">No email or browser link. Enter the family code once and this phone stays connected.</div>
  `;

  const oldJoin=document.getElementById("joinForm");
  if(oldJoin) oldJoin.style.display="none";

  const select=document.getElementById("deviceCaregiver");
  const otherWrap=document.getElementById("otherCaregiverWrap");
  select.addEventListener("change",()=>{otherWrap.style.display=select.value==="Other"?"block":"none"});

  const saved=localStorage.getItem("luca-caregiver");
  if(saved){
    if([...select.options].some(option=>option.value===saved))select.value=saved;
    else{select.value="Other";document.getElementById("otherCaregiver").value=saved;otherWrap.style.display="block";}
  }

  document.getElementById("deviceJoin").addEventListener("click",async()=>{
    if(!sb) return toast("Family Sync unavailable");
    const code=document.getElementById("deviceFamilyCode").value.trim();
    let caregiver=select.value;
    if(caregiver==="Other") caregiver=document.getElementById("otherCaregiver").value.trim();
    if(!code) return toast("Enter the family code");
    if(!caregiver) return toast("Enter the caregiver name");

    const btn=document.getElementById("deviceJoin");
    btn.disabled=true; btn.textContent="Connecting…";
    try{
      const {data,error}=await sb.functions.invoke("join-family-device",{body:{code,caregiver}});
      if(error) throw error;
      if(!data || data.error) throw new Error(data?.error||"Join failed");

      const signed=await sb.auth.signInWithPassword({email:data.email,password:data.password});
      if(signed.error) throw signed.error;

      localStorage.setItem("luca-caregiver",caregiver);
      document.getElementById("authStatus").textContent="Connected as "+caregiver+" ✓";
      const connected=await setupSync();
      if(!connected){document.getElementById("authStatus").textContent="Sign-in completed. Tap Family sync to retry loading the family timeline.";return;}
      toast("Family Sync connected ✓");
    }catch(err){
      console.error("P32 device join",err);
      document.getElementById("authStatus").textContent="Couldn't connect. Check the family code and your connection, then try again.";
      toast("Couldn't connect — check the family code");
    }finally{
      btn.disabled=false; btn.textContent="Connect this phone";
    }
  });

  // The old join screen is no longer needed: a valid family code creates
  // this device's private Supabase account and membership in one step.
  const originalShowSync=showSync;
  showSync=function(mode,msg){
    if(mode==="join") mode="login";
    if(mode==="login" && (!msg || /sign in|signed in/i.test(msg))) msg="Enter the family code once to connect this phone.";
    originalShowSync(mode,msg);
    if(oldJoin) oldJoin.style.display="none";
  };
})();
