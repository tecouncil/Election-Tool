"use strict";(()=>{var v=(a,e)=>()=>(a&&(e=a(a=0)),e);var P=(a,e)=>()=>(e||a((e={exports:{}}).exports,e),e.exports);function V(){return localStorage.getItem("tec_token")}function h(a){localStorage.setItem("tec_token",a)}function $(){localStorage.removeItem("tec_token")}async function r(a,e={}){let n=V(),t={"Content-Type":"application/json",...e.headers||{}};n&&(t.Authorization=`Bearer ${n}`);let o=await fetch(`${A}${a}`,{...e,headers:t}),c=await o.json().catch(()=>({}));if(!o.ok)throw new Error(c.error||"API request failed");return c}var A,b=v(()=>{"use strict";A="/api"});var w,l,f=v(()=>{"use strict";b();w=class{routes=[];constructor(){window.addEventListener("popstate",()=>this.route())}add(e,n){let t=e.replace(/:[a-zA-Z]+/g,"([^/]+)"),o=new RegExp(`^${t}$`);this.routes.push({path:o,handler:n})}navigate(e){window.history.pushState({},"",e),this.route()}route(){let e=window.location.pathname,n=document.getElementById("app");if(n){for(let t of this.routes){let o=e.match(t.path);if(o){let c=o.slice(1);n.innerHTML="Loading...",t.handler(c);return}}n.innerHTML='<h1>404 Not Found</h1><button onclick="window.history.back()">Go Back</button>'}}},l=new w;window.navigate=a=>l.navigate(a);window.logout=()=>{$(),l.navigate("/")}});function E(){let a=document.getElementById("app");a.innerHTML=`
    <div class="card" style="max-width: 400px; margin: 4rem auto;">
      <h2>Admin Login</h2>
      <div id="login-error" class="error"></div>
      <div id="login-step-1">
        <label>Email Address</label>
        <input type="email" id="admin-email" placeholder="admin@example.com" />
        <button onclick="requestAdminOTP()">Send OTP</button>
      </div>
      <div id="login-step-2" style="display:none;">
        <label>Verification Code</label>
        <input type="text" id="admin-otp" placeholder="123456" />
        <button onclick="verifyAdminOTP()">Verify & Login</button>
      </div>
    </div>
  `,window.requestAdminOTP=async()=>{let e=document.getElementById("admin-email").value;try{await r("/auth/otp/request",{method:"POST",body:JSON.stringify({email:e,isAdminLogin:!0})}),document.getElementById("login-step-1").style.display="none",document.getElementById("login-step-2").style.display="block",document.getElementById("login-error").innerText="OTP sent to email. Please check your inbox.",document.getElementById("login-error").className="success"}catch(n){document.getElementById("login-error").innerText=n.message,document.getElementById("login-error").className="error"}},window.verifyAdminOTP=async()=>{let e=document.getElementById("admin-email").value,n=document.getElementById("admin-otp").value;try{let t=await r("/auth/otp/verify",{method:"POST",body:JSON.stringify({email:e,code:n,isAdminLogin:!0})});h(t.token),l.navigate("/admin")}catch(t){document.getElementById("login-error").innerText=t.message,document.getElementById("login-error").className="error"}}}async function x(){let a=document.getElementById("app");a.innerHTML="<div>Loading...</div>";try{let n=(await r("/elections")).elections||[],t=n.map(o=>`
      <div class="card flex justify-between items-center">
        <div>
          <h3>${o.title}</h3>
          <p class="text-muted">Status: <strong>${o.status}</strong></p>
        </div>
        <button onclick="navigate('/admin/elections/${o.id}')">Manage</button>
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
    `,window.createElection=async()=>{let o=document.getElementById("new-election-title").value;o&&(await r("/elections",{method:"POST",body:JSON.stringify({title:o})}),x())}}catch(e){e.message.includes("Unauthorized")||e.message.includes("Forbidden")?l.navigate("/admin/login"):a.innerHTML=`<div class="error">${e.message}</div>`}}async function g(a){let e=a[0],n=document.getElementById("app");n.innerHTML="<div>Loading...</div>";try{let[t,o,c]=await Promise.all([r(`/elections/${e}`),r(`/elections/${e}/candidates`),r(`/elections/${e}/voters`)]),s=t.election,p=o.candidates,m=c.roll,u=s.status==="draft";n.innerHTML=`
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
        <h3>Settings</h3>
        <label>Panel Size (Number of candidate choices required)</label>
        <input type="number" id="edit-panel" value="${s.panel_size}" ${u?"":"disabled"} />
        ${u?`<button onclick="updateSettings('${s.id}')">Save Settings</button>`:""}
      </div>

      <div class="flex gap-4" style="display:flex; gap: 1rem;">
        <div class="card" style="flex:1;">
          <h3>Candidates (${p.length})</h3>
          ${u?`
            <div class="flex gap-2">
              <input type="text" id="new-candidate" placeholder="Candidate Name" />
              <button onclick="addCandidate('${s.id}')">Add</button>
            </div>
          `:""}
          <ul style="padding-left:0;list-style:none;">
            ${p.map(i=>`
              <li class="candidate-item justify-between">
                <span>${i.name}</span>
                ${u?`<button style="background:var(--danger)" onclick="removeCandidate('${s.id}', '${i.id}')">X</button>`:""}
              </li>
            `).join("")}
          </ul>
        </div>
        <div class="card" style="flex:1;">
          <h3>Voter Roll (${m.length})</h3>
          ${u?`
            <div class="flex gap-2">
              <input type="email" id="new-voter" placeholder="voter@example.com" />
              <button onclick="addVoter('${s.id}')">Add</button>
            </div>
            <p class="text-muted mt-2">Bulk Import (Emails on new lines)</p>
            <textarea id="bulk-voter" rows="4"></textarea>
            <button onclick="importVoters('${s.id}')">Import</button>
          `:""}
          <ul style="padding-left:0;list-style:none;max-height:300px;overflow-y:auto;" class="mt-4">
            ${m.map(i=>`
              <li class="flex justify-between mt-2">
                <span>${i.email}</span>
                ${u?`<button style="background:var(--danger);padding:0.2rem 0.5rem;" onclick="removeVoter('${s.id}', '${encodeURIComponent(i.email)}')">X</button>`:""}
              </li>
            `).join("")}
          </ul>
        </div>
      </div>
    `,u&&(window.updateSettings=async i=>{let d=parseInt(document.getElementById("edit-panel").value,10);await r(`/elections/${i}`,{method:"PATCH",body:JSON.stringify({panel_size:d})}),g([i])},window.addCandidate=async i=>{let d=document.getElementById("new-candidate").value;d&&(await r(`/elections/${i}/candidates`,{method:"POST",body:JSON.stringify({name:d})}),g([i]))},window.removeCandidate=async(i,d)=>{await r(`/elections/${i}/candidates/${d}`,{method:"DELETE"}),g([i])},window.addVoter=async i=>{let d=document.getElementById("new-voter").value;d&&(await r(`/elections/${i}/voters`,{method:"POST",body:JSON.stringify({email:d})}).catch(y=>alert(y.message)),g([i]))},window.importVoters=async i=>{let d=document.getElementById("bulk-voter").value;d&&(await r(`/elections/${i}/voters/import`,{method:"POST",body:d}).catch(y=>alert(y.message)),g([i]))},window.removeVoter=async(i,d)=>{await r(`/elections/${i}/voters/${d}`,{method:"DELETE"}),g([i])},window.openElection=async i=>{confirm("Are you sure you want to open this election? No more changes to candidates or voters can be made.")&&(await r(`/elections/${i}/open`,{method:"POST"}).catch(d=>alert(d.message)),g([i]))}),window.closeElection=async i=>{confirm("Close election? Voters will no longer be able to vote.")&&(await r(`/elections/${i}/close`,{method:"POST"}).catch(d=>alert(d.message)),g([i]))},window.finalizeElection=async i=>{confirm("Finalize election? Results will be made public.")&&(await r(`/elections/${i}/finalize`,{method:"POST"}).catch(d=>alert(d.message)),g([i]))}}catch(t){t.message.includes("Unauthorized")||t.message.includes("Forbidden")?l.navigate("/admin/login"):n.innerHTML=`<div class="error">${t.message}</div>`}}var T=v(()=>{"use strict";b();f()});function k(a){let e=a[0],n=document.getElementById("app");n.innerHTML=`
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
  `,window.requestVoterOTP=async t=>{let o=document.getElementById("voter-email").value;try{await r("/auth/otp/request",{method:"POST",body:JSON.stringify({email:o,electionId:t})}),document.getElementById("login-step-1").style.display="none",document.getElementById("login-step-2").style.display="block",document.getElementById("login-error").innerText="OTP sent to email. Please check your inbox.",document.getElementById("login-error").className="success"}catch(c){document.getElementById("login-error").innerText=c.message,document.getElementById("login-error").className="error"}},window.verifyVoterOTP=async t=>{let o=document.getElementById("voter-email").value,c=document.getElementById("voter-otp").value;try{let s=await r("/auth/otp/verify",{method:"POST",body:JSON.stringify({email:o,code:c,electionId:t})});h(s.token),l.navigate(`/vote/${t}/ballot`)}catch(s){document.getElementById("login-error").innerText=s.message,document.getElementById("login-error").className="error"}}}async function I(a){let e=a[0],n=document.getElementById("app");n.innerHTML="<div>Loading Ballot...</div>";try{let t=await r(`/elections/${e}/public`),o=t.election,c=t.candidates,s=o.panel_size,p=[];n.innerHTML=`
      <div class="card">
        <h2>${o.title} - Official Ballot</h2>
        <p>Instructions: You must select exactly <strong>${s}</strong> candidates.</p>
        <p>Selected: <span id="selection-count">0</span> / ${s}</p>
      </div>
      <div id="candidates-list">
        ${c.map(m=>`
          <div class="candidate-item" id="candidate-${m.id}" onclick="toggleCandidate('${m.id}')">
            <input type="checkbox" id="checkbox-${m.id}" />
            <div>
              <strong>${m.name}</strong>
              <div class="text-sm text-muted">${m.description||""}</div>
            </div>
          </div>
        `).join("")}
      </div>
      <div class="card mt-4">
        <button id="submit-ballot" disabled onclick="submitBallot('${e}')">Cast Ballot</button>
        <div id="ballot-error" class="error mt-2"></div>
      </div>
    `,window.toggleCandidate=m=>{let u=p.indexOf(m),i=document.getElementById(`candidate-${m}`),d=document.getElementById(`checkbox-${m}`);u>-1?(p.splice(u,1),i.classList.remove("selected"),d.checked=!1):p.length<s&&(p.push(m),i.classList.add("selected"),d.checked=!0),document.getElementById("selection-count").innerText=p.length.toString();let y=document.getElementById("submit-ballot");y.disabled=p.length!==s},window.submitBallot=async m=>{let u=document.getElementById("submit-ballot");u.disabled=!0,u.innerText="Submitting...";try{let i=await r(`/elections/${m}/ballots`,{method:"POST",body:JSON.stringify({selections:p})});localStorage.setItem(`receipt_${m}`,JSON.stringify(i.receipt)),l.navigate(`/vote/${m}/confirm`)}catch(i){document.getElementById("ballot-error").innerText=i.message,u.disabled=!1,u.innerText="Cast Ballot"}}}catch(t){t.message.includes("Unauthorized")?l.navigate(`/vote/${e}`):n.innerHTML=`<div class="error">${t.message}</div>`}}function B(a){let e=a[0],n=document.getElementById("app"),t=localStorage.getItem(`receipt_${e}`);if(!t){l.navigate("/");return}let o=JSON.parse(t);n.innerHTML=`
    <div class="card" style="text-align:center; max-width:600px; margin: 4rem auto;">
      <h2 class="success">Vote Cast Successfully</h2>
      <p>Thank you for participating.</p>
      
      <div style="text-align:left; background:#f3f4f6; padding:1rem; border-radius:8px; margin-top:2rem; word-break:break-all; font-family:monospace; font-size:0.875rem;">
        <strong>Your Ballot Hash (Save this for verification):</strong><br/>
        ${o.ballotHash}
        <br/><br/>
        <strong>Timestamp:</strong><br/>
        ${new Date(o.timestamp).toLocaleString()}
      </div>

      <button style="margin-top:2rem;" onclick="navigate('/')">Return Home</button>
    </div>
  `}var L=v(()=>{"use strict";b();f()});async function S(a){let e=a[0],n=document.getElementById("app");n.innerHTML="<div>Loading Results...</div>";try{let t=await r(`/elections/${e}/results`),o=t.election,c=t.results;n.innerHTML=`
      <div class="card">
        <h2>${o.title} - Official Results</h2>
        <p>Status: ${o.status}</p>
      </div>
      <div class="card">
        <h3>Vote Tally</h3>
        <table style="width:100%; text-align:left; border-collapse:collapse;">
          <tr style="border-bottom: 2px solid var(--border);">
            <th style="padding:0.5rem;">Candidate</th>
            <th style="padding:0.5rem;">Votes</th>
          </tr>
          ${c.map(s=>`
            <tr style="border-bottom: 1px solid var(--border);">
              <td style="padding:0.5rem;">${s.name}</td>
              <td style="padding:0.5rem;"><strong>${s.votes}</strong></td>
            </tr>
          `).join("")}
        </table>
      </div>
      <button onclick="navigate('/')">Back Home</button>
      <button style="background:var(--text-muted); margin-left:1rem;" onclick="navigate('/audit/${e}')">View Audit Log</button>
    `}catch(t){n.innerHTML=`<div class="error card">${t.message}</div><button onclick="navigate('/')">Back Home</button>`}}async function H(a){let e=a[0],n=document.getElementById("app");n.innerHTML="<div>Loading Audit Log...</div>";try{let o=(await r(`/audit/${e}`)).logs||[];n.innerHTML=`
      <div class="card">
        <div class="flex justify-between items-center mb-4">
          <h2>Election Audit Log</h2>
          <button onclick="navigate('/results/${e}')">View Results</button>
        </div>
        <p class="text-muted text-sm border-b pb-2">Cryptographically verifiable append-only log of election events.</p>
        <div style="max-height: 500px; overflow-y:auto; font-family:monospace; font-size: 0.8rem; background:#111827; color:#10b981; padding: 1rem; border-radius: 4px;">
          ${o.map(c=>`
            <div style="margin-bottom: 1rem; border-bottom: 1px dashed #374151; padding-bottom: 0.5rem;">
              <span style="color:#60a5fa">${new Date(c.timestamp).toISOString()}</span> 
              <span style="color:#f59e0b">[${c.action}]</span>
              <br/>
              <span style="color:#f3f4f6">${c.details?c.details:""}</span>
            </div>
          `).join("")}
          ${o.length===0?"No logs found":""}
        </div>
      </div>
      <button onclick="navigate('/')">Back Home</button>
    `}catch(t){n.innerHTML=`<div class="error card">${t.message}</div><button onclick="navigate('/')">Back Home</button>`}}function M(){let a=document.getElementById("app");a.innerHTML=`
    <div class="card" style="max-width: 600px; margin: 4rem auto;">
      <h2>Verify Ballot</h2>
      <p>Enter your Ballot Hash to verify it was recorded in the database chain.</p>
      <input type="text" id="verify-hash" placeholder="e.g. 8f4c...a1b2" />
      <button onclick="verifyHash()">Verify</button>
      <div id="verify-result" class="mt-4"></div>
    </div>
    <div style="text-align:center;"><button onclick="navigate('/')">Back Home</button></div>
  `,window.verifyHash=async()=>{let e=document.getElementById("verify-hash").value.trim();if(!e)return;let n=document.getElementById("verify-result");n.innerHTML="Verifying...";try{let o=(await r(`/verify/${e}`)).ballot;n.innerHTML=`
        <div class="success" style="padding: 1rem; background: #ecfdf5; border-radius: 4px; border: 1px solid var(--success);">
          <h3>Valid Ballot Found \u2713</h3>
          <p><strong>Election ID:</strong> ${o.election_id}</p>
          <p><strong>Cast Timestamp:</strong> ${new Date(o.timestamp).toLocaleString()}</p>
          <p style="word-break:break-all;"><strong>Previous Link:</strong> <br/>${o.previous_hash}</p>
        </div>
      `}catch(t){n.innerHTML=`
        <div class="error" style="padding: 1rem; background: #fef2f2; border-radius: 4px; border: 1px solid var(--danger);">
          <h3>Verification Failed \u2717</h3>
          <p>${t.message}</p>
        </div>
      `}}}var O=v(()=>{"use strict";b()});var C=P(()=>{f();T();L();O();l.add("/",()=>{let a=document.getElementById("app");a&&(a.innerHTML=`
    <div style="text-align: center; max-width: 600px; margin: 4rem auto;" class="card">
      <h1>TEC EC Election</h1>
      <p>Welcome to the secure, anonymous election system.</p>
      <div class="flex flex-col gap-4 mt-4">
        <button onclick="navigate('/verify')">Verify a Ballot</button>
        <button onclick="navigate('/admin/login')" style="background-color: var(--text-muted);">Admin Login</button>
      </div>
    </div>
  `)});l.add("/admin/login",E);l.add("/admin",x);l.add("/admin/elections/:id",g);l.add("/vote/:id",k);l.add("/vote/:id/ballot",I);l.add("/vote/:id/confirm",B);l.add("/results/:id",S);l.add("/audit/:id",H);l.add("/verify",M);l.route()});C();})();
