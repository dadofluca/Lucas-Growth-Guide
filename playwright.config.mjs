import {defineConfig} from "@playwright/test";
export default defineConfig({
 testDir:"./agents",
 testMatch:["browser-smoke.spec.mjs","spark-ui.spec.mjs"],
 timeout:30000,
 retries:1,
 use:{browserName:"chromium",headless:true,serviceWorkers:"block"},
 webServer:{
  command:"python3 -m http.server 8765 --bind 127.0.0.1",
  url:"http://127.0.0.1:8765/index.html",
  reuseExistingServer:false,
  timeout:15000
 },
 reporter:[["list"],["html",{outputFolder:"artifacts/playwright-report",open:"never"}]]
});
