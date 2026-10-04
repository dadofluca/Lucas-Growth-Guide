/* Native iOS session bridge. No-op in Safari/PWA. */
(function(){
  async function publishNativeSession(){
    try{
      if(!window.webkit || !window.webkit.messageHandlers || !window.webkit.messageHandlers.lucaSession) return;
      if(!window.sb || !sb.auth) return;
      const result=await sb.auth.getSession();
      const session=result && result.data && result.data.session;
      if(!session) return;
      const caregiver=localStorage.getItem("luca-caregiver")||"Caregiver";
      let familyID="",babyID="";
      try{
        const member=await sb.from("family_members").select("family_id").eq("user_id",session.user.id).limit(1).maybeSingle();
        familyID=member.data && member.data.family_id || "";
        if(familyID){
          const baby=await sb.from("babies").select("id").eq("family_id",familyID).limit(1).maybeSingle();
          babyID=baby.data && baby.data.id || "";
        }
      }catch(e){}
      if(!familyID||!babyID) return;
      window.webkit.messageHandlers.lucaSession.postMessage({
        accessToken:session.access_token,
        refreshToken:session.refresh_token,
        expiresAt:session.expires_at,
        userID:session.user.id,
        familyID:familyID,
        babyID:babyID,
        caregiver:caregiver
      });
    }catch(e){ console.warn("Native session bridge unavailable",e); }
  }
  window.publishNativeLucaSession=publishNativeSession;
  addEventListener("load",()=>setTimeout(publishNativeSession,1800));
  addEventListener("luca-sync-ready",publishNativeSession);
  setTimeout(publishNativeSession,4000);
})();
