"use strict";(()=>{var g=(a,e)=>()=>(a&&(e=a(a=0)),e);var P=(a,e)=>()=>(e||a((e={exports:{}}).exports,e),e.exports);function C(){return localStorage.getItem("tec_token")}function v(a){localStorage.setItem("tec_token",a)}function x(){localStorage.removeItem("tec_token")}async function d(a,e={}){let n=C(),t={"Content-Type":"application/json",...e.headers||{}};n&&(t.Authorization=`Bearer ${n}`);let i=await fetch(`${A}${a}`,{...e,headers:t}),s=await i.json().catch(()=>({}));if(!i.ok)throw new Error(s.error||"API request failed");return s}var A,y=g(()=>{"use strict";A="/api"});var h,r,b=g(()=>{"use strict";y();h=class{routes=[];constructor(){window.addEventListener("popstate",()=>this.route())}add(e,n){let t=e.replace(/:[a-zA-Z]+/g,"([^/]+)"),i=new RegExp(`^${t}$`);this.routes.push({path:i,handler:n})}navigate(e){window.history.pushState({},"",e),this.route()}route(){let e=window.location.pathname,n=document.getElementById("app");if(n){for(let t of this.routes){let i=e.match(t.path);if(i){let s=i.slice(1);n.innerHTML="Loading...",t.handler(s);return}}n.innerHTML='<h1>404 Not Found</h1><button onclick="window.history.back()">Go Back</button>'}}},r=new h;window.navigate=a=>r.navigate(a);window.logout=()=>{x(),r.navigate("/")}});function E(){let a=document.getElementById("app");a.innerHTML=`
    <div class="card" style="max-width: 400px; margin: 4rem auto;">
      <h2>Admin Login</h2>
      <div id="login-error" class="error"></div>
      <div id="login-step-1">
        <label>Email Address</label>
        <input type="email" id="admin-email" placeholder="admin@example.com" value="tecouncil.org@gmail.com" />
        <button onclick="requestAdminOTP()">Send OTP</button>
      </div>
      <div id="login-step-2" style="display:none;">
        <label>Verification Code</label>
        <input type="text" id="admin-otp" placeholder="123456" />
        <button onclick="verifyAdminOTP()">Verify & Login</button>
      </div>
    </div>
  `,window.requestAdminOTP=async()=>{let e=document.getElementById("admin-email").value;try{await d("/auth/otp/request",{method:"POST",body:JSON.stringify({email:e,isAdminLogin:!0})}),document.getElementById("login-step-1").style.display="none",document.getElementById("login-step-2").style.display="block",document.getElementById("login-error").innerText="OTP sent to email. Please check your inbox.",document.getElementById("login-error").className="success"}catch(n){document.getElementById("login-error").innerText=n.message,document.getElementById("login-error").className="error"}},window.verifyAdminOTP=async()=>{let e=document.getElementById("admin-email").value,n=document.getElementById("admin-otp").value;try{let t=await d("/auth/otp/verify",{method:"POST",body:JSON.stringify({email:e,code:n,isAdminLogin:!0})});v(t.token),r.navigate("/admin")}catch(t){document.getElementById("login-error").innerText=t.message,document.getElementById("login-error").className="error"}}}async function f(){let a=document.getElementById("app");a.innerHTML="<div>Loading...</div>";try{let n=(await d("/elections")).elections||[],t=n.map(i=>`
      <div class="card flex justify-between items-center">
        <div>
          <h3>${i.title}</h3>
          <p class="text-muted">Status: <strong>${i.status}</strong></p>
        </div>
        <button onclick="navigate('/admin/elections/${i.id}')">Manage</button>
      </div>
    `).join("");n.length===0&&(t="<p>No elections found.</p>"),a.innerHTML=`
      <div class="flex justify-between items-center mb-4">
        <h2>Admin Dashboard</h2>
        <button onclick="logout()">Logout</button>
      </div>
      <div class="card">
        <h3>Create Election</h3>
        <input type="text" id="new-election-title" placeholder="Election Title" />
        <button onclick="createElection()">Create</button>
      </div>
      <div>
        ${t}
      </div>
    `,window.createElection=async()=>{let i=document.getElementById("new-election-title").value;i&&(await d("/elections",{method:"POST",body:JSON.stringify({title:i})}),f())}}catch(e){e.message.includes("Unauthorized")||e.message.includes("Forbidden")?r.navigate("/admin/login"):a.innerHTML=`<div class="error">${e.message}</div>`}}async function p(a){let e=a[0],n=document.getElementById("app");n.innerHTML="<div>Loading...</div>";try{let[t,i]=await Promise.all([d(`/elections/${e}`),d(`/elections/${e}/candidates`)]),s=t.election,m=i.candidates,u=s.status==="draft",c=window.location.origin+"/vote/"+s.id;n.innerHTML=`
      <button onclick="navigate('/admin')" style="background:var(--text-muted);margin-bottom:1rem;">&larr; Back to Dashboard</button>
      <div class="card">
        <h2>${s.title} </h2>
        <p>Status: <strong>${s.status}</strong></p>
        ${u?`
          <button class="mt-2" onclick="openElection('${s.id}')">Open Election</button>
        `:""}
        ${s.status==="open"?`
          <button class="mt-2" onclick="closeElection('${s.id}')" style="background:var(--danger)">Close Election</button>
        `:""}
        ${s.status==="closed"?`
          <button class="mt-2" onclick="finalizeElection('${s.id}')" style="background:var(--success)">Finalize Results</button>
        `:""}
      </div>

      <div class="card">
        <h3>Share Election</h3>
        <p class="text-sm text-muted mb-2">Share this link with voters to allow them to participate.</p>
        <div class="flex gap-2" style="display:flex; gap:0.5rem; align-items:center;">
          <input type="text" id="share-link" value="${c}" readonly style="flex:1; background:#f3f4f6; color:#555;" />
          <button onclick="copyShareLink()">Copy</button>
        </div>
      </div>

      <div class="card">
        <h3>Settings</h3>
        <label>Panel Size (Number of candidate choices required)</label>
        <input type="number" id="edit-panel" value="${s.panel_size}" ${u?"":"disabled"} />
        ${u?`<button onclick="updateSettings('${s.id}')">Save Settings</button>`:""}
      </div>

      <div class="flex gap-4" style="display:flex; gap: 1rem;">
        <div class="card" style="flex:1;">
          <h3>Candidates (${m.length})</h3>
          ${u?`
            <div class="flex gap-2">
              <input type="text" id="new-candidate" placeholder="Candidate Name" />
              <button onclick="addCandidate('${s.id}')">Add</button>
            </div>
          `:""}
          <ul style="padding-left:0;list-style:none;">
            ${m.map(o=>`
              <li class="candidate-item justify-between">
                <span>${o.name}</span>
                ${u?`<button style="background:var(--danger)" onclick="removeCandidate('${s.id}', '${o.id}')">X</button>`:""}
              </li>
            `).join("")}
          </ul>
        </div>
      </div>
    `,window.copyShareLink=()=>{let o=document.getElementById("share-link");o.select(),o.setSelectionRange(0,99999),navigator.clipboard.writeText(o.value).then(()=>{alert("Copied to clipboard")}).catch(()=>{alert("Failed to copy")})},u&&(window.updateSettings=async o=>{let l=parseInt(document.getElementById("edit-panel").value,10);await d(`/elections/${o}`,{method:"PATCH",body:JSON.stringify({panel_size:l})}),p([o])},window.addCandidate=async o=>{let l=document.getElementById("new-candidate").value;l&&(await d(`/elections/${o}/candidates`,{method:"POST",body:JSON.stringify({name:l})}),p([o]))},window.removeCandidate=async(o,l)=>{await d(`/elections/${o}/candidates/${l}`,{method:"DELETE"}),p([o])},window.openElection=async o=>{confirm("Are you sure you want to open this election? No more changes to candidates can be made.")&&(await d(`/elections/${o}/open`,{method:"POST"}).catch(l=>alert(l.message)),p([o]))}),window.closeElection=async o=>{confirm("Close election? Voters will no longer be able to vote.")&&(await d(`/elections/${o}/close`,{method:"POST"}).catch(l=>alert(l.message)),p([o]))},window.finalizeElection=async o=>{confirm("Finalize election? Results will be made public.")&&(await d(`/elections/${o}/finalize`,{method:"POST"}).catch(l=>alert(l.message)),p([o]))}}catch(t){t.message.includes("Unauthorized")||t.message.includes("Forbidden")?r.navigate("/admin/login"):n.innerHTML=`<div class="error">${t.message}</div>`}}var T=g(()=>{"use strict";y();b()});function $(a){let e=a[0],n=document.getElementById("app");n.innerHTML=`
    <div class="card" style="max-width: 400px; margin: 4rem auto;">
      <h2>Voter Login</h2>
      <p class="text-muted text-sm">You must enter the email address authorized for this election.</p>
      <div id="login-error" class="error"></div>
      <div id="login-step-1">
        <label>Email Address</label>
        <input type="email" id="voter-email" placeholder="voter@example.com" />
        <button onclick="requestVoterOTP('${e}')">Send OTP</button>
      </div>
      <div id="login-step-2" style="display:none;">
        <label>Verification Code</label>
        <input type="text" id="voter-otp" placeholder="123456" />
        <button onclick="verifyVoterOTP('${e}')">Login & Vote</button>
      </div>
    </div>
  `,window.requestVoterOTP=async t=>{let i=document.getElementById("voter-email").value;try{await d("/auth/otp/request",{method:"POST",body:JSON.stringify({email:i,electionId:t})}),document.getElementById("login-step-1").style.display="none",document.getElementById("login-step-2").style.display="block",document.getElementById("login-error").innerText="OTP sent to email. Please check your inbox.",document.getElementById("login-error").className="success"}catch(s){document.getElementById("login-error").innerText=s.message,document.getElementById("login-error").className="error"}},window.verifyVoterOTP=async t=>{let i=document.getElementById("voter-email").value,s=document.getElementById("voter-otp").value;try{let m=await d("/auth/otp/verify",{method:"POST",body:JSON.stringify({email:i,code:s,electionId:t})});v(m.token),r.navigate(`/vote/${t}/ballot`)}catch(m){document.getElementById("login-error").innerText=m.message,document.getElementById("login-error").className="error"}}}async function k(a){let e=a[0],n=document.getElementById("app");n.innerHTML="<div>Loading Ballot...</div>";try{let t=await d(`/elections/${e}/public`),i=t.election,s=t.candidates,m=i.panel_size,u=[];n.innerHTML=`
      <div class="card">
        <h2>${i.title} - Official Ballot</h2>
        <p>Instructions: You must select exactly <strong>${m}</strong> candidates.</p>
        <p>Selected: <span id="selection-count">0</span> / ${m}</p>
      </div>
      <div id="candidates-list">
        ${s.map(c=>`
          <div class="candidate-item" id="candidate-${c.id}" onclick="toggleCandidate('${c.id}')">
            <input type="checkbox" id="checkbox-${c.id}" />
            <div>
              <strong>${c.name}</strong>
              <div class="text-sm text-muted">${c.description||""}</div>
            </div>
          </div>
        `).join("")}
      </div>
      <div class="card mt-4">
        <button id="submit-ballot" disabled onclick="submitBallot('${e}')">Cast Ballot</button>
        <div id="ballot-error" class="error mt-2"></div>
      </div>
    `,window.toggleCandidate=c=>{let o=u.indexOf(c),l=document.getElementById(`candidate-${c}`),w=document.getElementById(`checkbox-${c}`);o>-1?(u.splice(o,1),l.classList.remove("selected"),w.checked=!1):u.length<m&&(u.push(c),l.classList.add("selected"),w.checked=!0),document.getElementById("selection-count").innerText=u.length.toString();let O=document.getElementById("submit-ballot");O.disabled=u.length!==m},window.submitBallot=async c=>{let o=document.getElementById("submit-ballot");o.disabled=!0,o.innerText="Submitting...";try{let l=await d(`/elections/${c}/ballots`,{method:"POST",body:JSON.stringify({selections:u})});localStorage.setItem(`receipt_${c}`,JSON.stringify(l.receipt)),r.navigate(`/vote/${c}/confirm`)}catch(l){document.getElementById("ballot-error").innerText=l.message,o.disabled=!1,o.innerText="Cast Ballot"}}}catch(t){t.message.includes("Unauthorized")?r.navigate(`/vote/${e}`):n.innerHTML=`<div class="error">${t.message}</div>`}}function I(a){let e=a[0],n=document.getElementById("app"),t=localStorage.getItem(`receipt_${e}`);if(!t){r.navigate("/");return}let i=JSON.parse(t);n.innerHTML=`
    <div class="card" style="text-align:center; max-width:600px; margin: 4rem auto;">
      <h2 class="success">Vote Cast Successfully</h2>
      <p>Thank you for participating.</p>
      
      <div style="text-align:left; background:#f3f4f6; padding:1rem; border-radius:8px; margin-top:2rem; word-break:break-all; font-family:monospace; font-size:0.875rem;">
        <strong>Your Ballot Hash (Save this for verification):</strong><br/>
        ${i.ballotHash}
        <br/><br/>
        <strong>Timestamp:</strong><br/>
        ${new Date(i.timestamp).toLocaleString()}
      </div>

      <button style="margin-top:2rem;" onclick="navigate('/')">Return Home</button>
    </div>
  `}var B=g(()=>{"use strict";y();b()});async function L(a){let e=a[0],n=document.getElementById("app");n.innerHTML="<div>Loading Results...</div>";try{let t=await d(`/elections/${e}/results`),i=t.election,s=t.results;n.innerHTML=`
      <div class="card">
        <h2>${i.title} - Official Results</h2>
        <p>Status: ${i.status}</p>
      </div>
      <div class="card">
        <h3>Vote Tally</h3>
        <table style="width:100%; text-align:left; border-collapse:collapse;">
          <tr style="border-bottom: 2px solid var(--border);">
            <th style="padding:0.5rem;">Candidate</th>
            <th style="padding:0.5rem;">Votes</th>
          </tr>
          ${s.map(m=>`
            <tr style="border-bottom: 1px solid var(--border);">
              <td style="padding:0.5rem;">${m.name}</td>
              <td style="padding:0.5rem;"><strong>${m.votes}</strong></td>
            </tr>
          `).join("")}
        </table>
      </div>
      <button onclick="navigate('/')">Back Home</button>
      <button style="background:var(--text-muted); margin-left:1rem;" onclick="navigate('/audit/${e}')">View Audit Log</button>
    `}catch(t){n.innerHTML=`<div class="error card">${t.message}</div><button onclick="navigate('/')">Back Home</button>`}}async function S(a){let e=a[0],n=document.getElementById("app");n.innerHTML="<div>Loading Audit Log...</div>";try{let i=(await d(`/audit/${e}`)).logs||[];n.innerHTML=`
      <div class="card">
        <div class="flex justify-between items-center mb-4">
          <h2>Election Audit Log</h2>
          <button onclick="navigate('/results/${e}')">View Results</button>
        </div>
        <p class="text-muted text-sm border-b pb-2">Cryptographically verifiable append-only log of election events.</p>
        <div style="max-height: 500px; overflow-y:auto; font-family:monospace; font-size: 0.8rem; background:#111827; color:#10b981; padding: 1rem; border-radius: 4px;">
          ${i.map(s=>`
            <div style="margin-bottom: 1rem; border-bottom: 1px dashed #374151; padding-bottom: 0.5rem;">
              <span style="color:#60a5fa">${new Date(s.timestamp).toISOString()}</span> 
              <span style="color:#f59e0b">[${s.action}]</span>
              <br/>
              <span style="color:#f3f4f6">${s.details?s.details:""}</span>
            </div>
          `).join("")}
          ${i.length===0?"No logs found":""}
        </div>
      </div>
      <button onclick="navigate('/')">Back Home</button>
    `}catch(t){n.innerHTML=`<div class="error card">${t.message}</div><button onclick="navigate('/')">Back Home</button>`}}function H(){let a=document.getElementById("app");a.innerHTML=`
    <div class="card" style="max-width: 600px; margin: 4rem auto;">
      <h2>Verify Ballot</h2>
      <p>Enter your Ballot Hash to verify it was recorded in the database chain.</p>
      <input type="text" id="verify-hash" placeholder="e.g. 8f4c...a1b2" />
      <button onclick="verifyHash()">Verify</button>
      <div id="verify-result" class="mt-4"></div>
    </div>
    <div style="text-align:center;"><button onclick="navigate('/')">Back Home</button></div>
  `,window.verifyHash=async()=>{let e=document.getElementById("verify-hash").value.trim();if(!e)return;let n=document.getElementById("verify-result");n.innerHTML="Verifying...";try{let i=(await d(`/verify/${e}`)).ballot;n.innerHTML=`
        <div class="success" style="padding: 1rem; background: #ecfdf5; border-radius: 4px; border: 1px solid var(--success);">
          <h3>Valid Ballot Found \u2713</h3>
          <p><strong>Election ID:</strong> ${i.election_id}</p>
          <p><strong>Cast Timestamp:</strong> ${new Date(i.timestamp).toLocaleString()}</p>
          <p style="word-break:break-all;"><strong>Previous Link:</strong> <br/>${i.previous_hash}</p>
        </div>
      `}catch(t){n.innerHTML=`
        <div class="error" style="padding: 1rem; background: #fef2f2; border-radius: 4px; border: 1px solid var(--danger);">
          <h3>Verification Failed \u2717</h3>
          <p>${t.message}</p>
        </div>
      `}}}var M=g(()=>{"use strict";y()});var V=P(()=>{b();T();B();M();r.add("/",()=>{let a=document.getElementById("app");a&&(a.innerHTML=`
    <div style="text-align: center; max-width: 600px; margin: 4rem auto;" class="card">
      <h1>TEC EC Election</h1>
      <p>Welcome to the secure, anonymous election system.</p>
      <div class="flex flex-col gap-4 mt-4">
        <button onclick="navigate('/verify')">Verify a Ballot</button>
        <button onclick="navigate('/admin/login')" style="background-color: var(--text-muted);">Admin Login</button>
      </div>
    </div>
  `)});r.add("/admin/login",E);r.add("/admin",f);r.add("/admin/elections/:id",p);r.add("/vote/:id",$);r.add("/vote/:id/ballot",k);r.add("/vote/:id/confirm",I);r.add("/results/:id",L);r.add("/audit/:id",S);r.add("/verify",H);r.route()});V();})();
