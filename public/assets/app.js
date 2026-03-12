"use strict";(()=>{var x=(i,e)=>()=>(i&&(e=i(i=0)),e);var j=(i,e)=>()=>(e||i((e={exports:{}}).exports,e),e.exports);function q(){return localStorage.getItem("tec_token")}function w(i){localStorage.setItem("tec_token",i)}function S(){localStorage.removeItem("tec_token")}async function d(i,e={}){let t=q(),n={"Content-Type":"application/json",...e.headers||{}};t&&(n.Authorization=`Bearer ${t}`);let a=await fetch(`${F}${i}`,{...e,headers:n}),o=await a.json().catch(()=>({}));if(!a.ok)throw new Error(o.error||"API request failed");return o}function f(i){if(!i)return"-";let e;if(typeof i=="string"){let t=i;t.includes(" ")&&!t.includes("T")&&(t=t.replace(" ","T")),!t.endsWith("Z")&&!t.includes("+")&&(t+="Z"),e=new Date(t)}else e=i;return isNaN(e.getTime())?"-":new Intl.DateTimeFormat("en-IN",{timeZone:"Asia/Kolkata",year:"numeric",month:"numeric",day:"numeric",hour:"2-digit",minute:"2-digit",second:"2-digit",hour12:!0}).format(e)}function E(i){if(!i)return"";let e=typeof i=="string"?new Date(i):i;if(isNaN(e.getTime()))return"";let t={timeZone:"Asia/Kolkata",year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",hour12:!1},a=new Intl.DateTimeFormat("en-CA",t).formatToParts(e),o=c=>a.find(r=>r.type===c)?.value;return`${o("year")}-${o("month")}-${o("day")}T${o("hour")}:${o("minute")}`}function u(){return`
    <header class="header" onclick="navigate('/')">
      <img src="/assets/logo.png" alt="TEC EC Logo" class="logo" />
    </header>
  `}var F,b=x(()=>{"use strict";F="/api"});var k,l,$=x(()=>{"use strict";b();k=class{routes=[];constructor(){window.addEventListener("popstate",()=>this.route())}add(e,t){let n=e.replace(/:[a-zA-Z]+/g,"([^/]+)"),a=new RegExp(`^${n}$`);this.routes.push({path:a,handler:t})}navigate(e){window.history.pushState({},"",e),this.route()}route(){let e=window.location.pathname,t=document.getElementById("app");if(t){for(let n of this.routes){let a=e.match(n.path);if(a){let o=a.slice(1);t.innerHTML="Loading...",n.handler(o);return}}t.innerHTML='<h1>404 Not Found</h1><button onclick="window.history.back()">Go Back</button>'}}},l=new k;window.navigate=i=>l.navigate(i);window.logout=()=>{S(),l.navigate("/")}});function H(){let i=document.getElementById("app");i.innerHTML=`
    ${u()}
    <div class="card" style="max-width: 400px; margin: 0 auto 4rem auto;">
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
  `,window.requestAdminOTP=async()=>{let e=document.getElementById("admin-email").value;try{await d("/auth/otp/request",{method:"POST",body:JSON.stringify({email:e,isAdminLogin:!0})}),document.getElementById("login-step-1").style.display="none",document.getElementById("login-step-2").style.display="block",document.getElementById("login-error").innerText="OTP sent to email. Please check your inbox.",document.getElementById("login-error").className="success"}catch(t){document.getElementById("login-error").innerText=t.message,document.getElementById("login-error").className="error"}},window.verifyAdminOTP=async()=>{let e=document.getElementById("admin-email").value,t=document.getElementById("admin-otp").value;try{let n=await d("/auth/otp/verify",{method:"POST",body:JSON.stringify({email:e,code:t,isAdminLogin:!0})});w(n.token),l.navigate("/admin")}catch(n){document.getElementById("login-error").innerText=n.message,document.getElementById("login-error").className="error"}}}async function I(){let i=document.getElementById("app");i.innerHTML="<div>Loading...</div>";try{let t=(await d("/elections")).elections||[],n=t.map(a=>`
      <div class="card flex justify-between items-center">
        <div>
          <h3>${a.title}</h3>
          <p class="text-muted">Status: <strong>${a.status}</strong></p>
        </div>
        <button onclick="navigate('/admin/elections/${a.id}')">Manage</button>
      </div>
    `).join("");t.length===0&&(n="<p>No elections found.</p>"),i.innerHTML=`
      ${u()}
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
        ${n}
      </div>
    `,window.createElection=async()=>{let a=document.getElementById("new-election-title").value;if(!a)return;let o=await d("/elections",{method:"POST",body:JSON.stringify({title:a})});o.election&&o.election.id?l.navigate(`/admin/elections/${o.election.id}`):I()}}catch(e){e.message.includes("Unauthorized")||e.message.includes("Forbidden")?l.navigate("/admin/login"):i.innerHTML=`<div class="error">${e.message}</div>`}}async function h(i){let e=i[0],t=document.getElementById("app");t.innerHTML="<div>Loading...</div>";try{let[n,a,o,c]=await Promise.all([d(`/elections/${e}`),d(`/elections/${e}/candidates`),d(`/elections/${e}/participation`),d(`/elections/${e}/internal-results`)]),r=n.election,m=a.candidates,g=o.participation,v=c.results,y=r.status==="draft",T=window.location.origin+"/vote/"+r.id;t.innerHTML=`
      ${u()}
      <button onclick="navigate('/admin')" style="background:var(--text-muted);margin-bottom:1rem;">&larr; Back to Dashboard</button>
      <div class="card">
        <h2>${r.title} </h2>
        <p>Status: <strong>${r.status}</strong></p>
        ${y?`
          <button class="mt-2" onclick="openElection('${r.id}')">Open Election</button>
        `:""}
        ${r.status==="open"?`
          <button class="mt-2" onclick="closeElection('${r.id}')" style="background:var(--danger)">Close Election</button>
        `:""}
        ${r.status==="closed"?`
          <button class="mt-2" onclick="finalizeElection('${r.id}')" style="background:var(--success)">Finalize Results</button>
        `:""}
      </div>

      <div class="card">
        <h3>Share Election</h3>
        <p class="text-sm text-muted mb-2">Share this link with voters to allow them to participate.</p>
        <div class="flex gap-2" style="display:flex; gap:0.5rem; align-items:center;">
          <input type="text" id="share-link" value="${T}" readonly style="flex:1; background:#f3f4f6; color:#555;" />
          <button onclick="copyShareLink()">Copy</button>
        </div>
      </div>

      <div class="card">
        <h3>Settings</h3>
        <label>Panel Size (Number of candidate choices required)</label>
        <input type="number" id="edit-panel" value="${r.panel_size}" ${y?"":"disabled"} />
        
        <div class="flex gap-4 mt-2">
          <div style="flex:1">
            <label>Voting Window Start</label>
            <input type="datetime-local" id="edit-start" value="${E(r.voting_window_start)}" ${y?"":"disabled"} />
          </div>
          <div style="flex:1">
            <label>Voting Window End (Deadline)</label>
            <input type="datetime-local" id="edit-end" value="${E(r.voting_window_end)}" ${y?"":"disabled"} />
          </div>
        </div>

        ${y?`<button class="mt-4" onclick="updateSettings('${r.id}')">Save Settings</button>`:""}
      </div>

      <div class="flex gap-4" style="display:flex; gap: 1rem; align-items: flex-start;">
        <div class="card" style="flex:1;">
          <h3>Candidates (${m.length})</h3>
          ${y?`
            <div class="flex gap-2">
              <input type="text" id="new-candidate" placeholder="Candidate Name" />
              <button onclick="addCandidate('${r.id}')">Add</button>
            </div>
          `:""}
          <ul style="padding-left:0;list-style:none;">
            ${m.map(s=>`
              <li class="candidate-item justify-between">
                <span>${s.name}</span>
                ${y?`<button style="background:var(--danger)" onclick="removeCandidate('${r.id}', '${s.id}')">X</button>`:""}
              </li>
            `).join("")}
          </ul>
        </div>

        <div class="card" style="flex:1;">
          <h3>Live Results</h3>
          <ul style="padding-left:0;list-style:none;">
            ${v.map(s=>`
              <li class="candidate-item justify-between">
                <span>${s.name}</span>
                <span class="badge">${s.votes} votes</span>
              </li>
            `).join("")}
          </ul>
        </div>
      </div>

      <div class="card">
        <h3>Voter Participation (${g.length} total)</h3>
        <p class="text-muted text-sm" style="margin-bottom: 1rem;">The following users have successfully cast their ballots.</p>
        <div style="max-height: 200px; overflow-y: auto; background: #fafafa; border-radius: 4px; padding: 0.5rem;">
          <table style="width: 100%; text-align: left; border-collapse: collapse;">
            <thead>
              <tr style="border-bottom: 2px solid #eee;">
                <th style="padding: 0.5rem;">Voter Email</th>
                <th style="padding: 0.5rem;">Timestamp</th>
              </tr>
            </thead>
            <tbody>
              ${g.map(s=>`
                <tr style="border-bottom: 1px solid #eee;">
                  <td style="padding: 0.5rem;">${s.email}</td>
                  <td style="padding: 0.5rem; font-size: 0.8rem; color: #666;">${f(s.voted_at)}</td>
                </tr>
              `).join("")}
              ${g.length===0?'<tr><td colspan="2" style="padding: 1rem; text-align: center; color: #999;">No votes cast yet</td></tr>':""}
            </tbody>
          </table>
        </div>
      </div>
    `,window.copyShareLink=()=>{let s=document.getElementById("share-link");s.select(),s.setSelectionRange(0,99999),navigator.clipboard.writeText(s.value).then(()=>{alert("Copied to clipboard")}).catch(()=>{alert("Failed to copy")})},y&&(window.updateSettings=async s=>{let p=parseInt(document.getElementById("edit-panel").value,10),L=document.getElementById("edit-start").value,B=document.getElementById("edit-end").value,R=L?new Date(L+":00+05:30").toISOString():null,z=B?new Date(B+":00+05:30").toISOString():null;await d(`/elections/${s}`,{method:"PATCH",body:JSON.stringify({panel_size:p,voting_window_start:R,voting_window_end:z})}),h([s])},window.addCandidate=async s=>{let p=document.getElementById("new-candidate").value;p&&(await d(`/elections/${s}/candidates`,{method:"POST",body:JSON.stringify({name:p})}),h([s]))},window.removeCandidate=async(s,p)=>{await d(`/elections/${s}/candidates/${p}`,{method:"DELETE"}),h([s])},window.openElection=async s=>{confirm("Are you sure you want to open this election? No more changes to candidates can be made.")&&(await d(`/elections/${s}/open`,{method:"POST"}).catch(p=>alert(p.message)),h([s]))}),window.closeElection=async s=>{confirm("Close election? Voters will no longer be able to vote.")&&(await d(`/elections/${s}/close`,{method:"POST"}).catch(p=>alert(p.message)),h([s]))},window.finalizeElection=async s=>{confirm("Finalize election? Results will be made public.")&&(await d(`/elections/${s}/finalize`,{method:"POST"}).catch(p=>alert(p.message)),h([s]))}}catch(n){n.message.includes("Unauthorized")||n.message.includes("Forbidden")?l.navigate("/admin/login"):t.innerHTML=`<div class="error">${n.message}</div>`}}var M=x(()=>{"use strict";b();$()});function O(i){let e=i[0],t=document.getElementById("app");t.innerHTML=`
    ${u()}
    <div class="card" style="max-width: 400px; margin: 0 auto 4rem auto;">
      <h2>Voter Login</h2>
      <p class="text-muted text-sm">Enter your email address to receive a verification code and cast your vote.</p>
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
  `,window.requestVoterOTP=async n=>{let a=document.getElementById("voter-email").value;try{await d("/auth/otp/request",{method:"POST",body:JSON.stringify({email:a,electionId:n})}),document.getElementById("login-step-1").style.display="none",document.getElementById("login-step-2").style.display="block",document.getElementById("login-error").innerText="OTP sent to email. Please check your inbox.",document.getElementById("login-error").className="success"}catch(o){document.getElementById("login-error").innerText=o.message,document.getElementById("login-error").className="error"}},window.verifyVoterOTP=async n=>{let a=document.getElementById("voter-email").value,o=document.getElementById("voter-otp").value;try{let c=await d("/auth/otp/verify",{method:"POST",body:JSON.stringify({email:a,code:o,electionId:n})});w(c.token),l.navigate(`/vote/${n}/ballot`)}catch(c){document.getElementById("login-error").innerText=c.message,document.getElementById("login-error").className="error"}}}async function P(i){let e=i[0],t=document.getElementById("app");t.innerHTML="<div>Loading Ballot...</div>";try{let n=await d(`/elections/${e}/public`),a=n.election,o=n.candidates,c=a.panel_size,r=[];t.innerHTML=`
      ${u()}
      <div class="card">
        <h2>${a.title} - Official Ballot</h2>
        <p>Instructions: You must select exactly <strong>${c}</strong> candidates.</p>
        <p>Selected: <span id="selection-count">0</span> / ${c}</p>
      </div>
      <div id="candidates-list">
        ${o.map(m=>`
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
    `,window.toggleCandidate=m=>{let g=r.indexOf(m),v=document.getElementById(`candidate-${m}`),y=document.getElementById(`checkbox-${m}`);g>-1?(r.splice(g,1),v.classList.remove("selected"),y.checked=!1):r.length<c&&(r.push(m),v.classList.add("selected"),y.checked=!0),document.getElementById("selection-count").innerText=r.length.toString();let T=document.getElementById("submit-ballot");T.disabled=r.length!==c},window.submitBallot=async m=>{let g=document.getElementById("submit-ballot");g.disabled=!0,g.innerText="Submitting...";try{let v=await d(`/elections/${m}/ballots`,{method:"POST",body:JSON.stringify({selections:r})});localStorage.setItem(`receipt_${m}`,JSON.stringify(v.receipt)),l.navigate(`/vote/${m}/confirm`)}catch(v){document.getElementById("ballot-error").innerText=v.message,g.disabled=!1,g.innerText="Cast Ballot"}}}catch(n){n.message.includes("Unauthorized")?l.navigate(`/vote/${e}`):t.innerHTML=`<div class="error">${n.message}</div>`}}function A(i){let e=i[0],t=document.getElementById("app"),n=localStorage.getItem(`receipt_${e}`);if(!n){l.navigate("/");return}let a=JSON.parse(n);t.innerHTML=`
    ${u()}
    <div class="card" style="text-align:center; max-width:600px; margin: 0 auto 4rem auto;">
      <h2 class="success">Vote Cast Successfully</h2>
      <p>Thank you for participating.</p>
      
      <div id="receipt-details" style="text-align:left; background:#f3f4f6; padding:1rem; border-radius:8px; margin-top:2rem; word-break:break-all; font-family:monospace; font-size:0.875rem;">
        <strong>Your Selections:</strong><br/>
        <ul style="padding-left:1.5rem; margin:0.5rem 0;">
          ${(a.selections||[]).map(o=>`<li>${o}</li>`).join("")}
        </ul>
        <br/>
        <strong>Ballot Hash (Save this for verification):</strong><br/>
        ${a.ballotHash}
        <br/><br/>
        <strong>Timestamp:</strong><br/>
        ${f(a.timestamp)}
      </div>

      <div class="mt-4 flex gap-2 justify-center" style="display:flex; gap:0.5rem; justify-content:center; margin-top:1.5rem;">
        <button onclick="copyReceipt('${e}')">Copy Full Receipt</button>
        <button style="background:var(--text-muted)" onclick="navigate('/')">Return Home</button>
      </div>

      <p class="text-sm text-muted mt-4" style="max-width: 500px; margin-left:auto; margin-right:auto;">
        <strong>Privacy Note:</strong> To ensure your vote remains truly private, your choices were <u>not</u> included in your confirmation email (it only contains the Ballot Hash). Please copy or save this screen if you need a permanent record of your selections.
      </p>
    </div>
  `,window.copyReceipt=o=>{let c=document.getElementById("receipt-details").innerText;navigator.clipboard.writeText(c).then(()=>{alert("Receipt copied to clipboard!")}).catch(()=>{alert("Failed to copy receipt.")})}}var C=x(()=>{"use strict";b();$()});async function N(i){let e=i[0],t=document.getElementById("app");t.innerHTML="<div>Loading Results...</div>";try{let n=await d(`/elections/${e}/results`),a=n.election,o=n.results;t.innerHTML=`
      ${u()}
      <div class="card">
        <h2>${a.title} - Official Results</h2>
        <p>Status: ${a.status}</p>
      </div>
      <div class="card">
        <h3>Vote Tally</h3>
        <table style="width:100%; text-align:left; border-collapse:collapse;">
          <tr style="border-bottom: 2px solid var(--border);">
            <th style="padding:0.5rem;">Candidate</th>
            <th style="padding:0.5rem;">Votes</th>
          </tr>
          ${o.map(c=>`
            <tr style="border-bottom: 1px solid var(--border);">
              <td style="padding:0.5rem;">${c.name}</td>
              <td style="padding:0.5rem;"><strong>${c.votes}</strong></td>
            </tr>
          `).join("")}
        </table>
      </div>
      <button onclick="navigate('/')">Back Home</button>
      <button style="background:var(--text-muted); margin-left:1rem;" onclick="navigate('/audit/${e}')">View Audit Log</button>
    `}catch(n){t.innerHTML=`<div class="error card">${n.message}</div><button onclick="navigate('/')">Back Home</button>`}}async function V(i){let e=i[0],t=document.getElementById("app");t.innerHTML="<div>Loading Audit Log...</div>";try{let a=(await d(`/audit/${e}`)).logs||[];t.innerHTML=`
      ${u()}
      <div class="card">
        <div class="flex justify-between items-center mb-4">
          <h2>Election Audit Log</h2>
          <button onclick="navigate('/results/${e}')">View Results</button>
        </div>
        <p class="text-muted text-sm border-b pb-2">Cryptographically verifiable append-only log of election events.</p>
        <div style="max-height: 500px; overflow-y:auto; font-family:monospace; font-size: 0.8rem; background:#111827; color:#10b981; padding: 1rem; border-radius: 4px;">
          ${a.map(o=>`
            <div style="margin-bottom: 1rem; border-bottom: 1px dashed #374151; padding-bottom: 0.5rem;">
              <span style="color:#60a5fa">${f(o.timestamp)}</span> 
              <span style="color:#f59e0b">[${o.action}]</span>
              <br/>
              <span style="color:#f3f4f6">${o.details?o.details:""}</span>
            </div>
          `).join("")}
          ${a.length===0?"No logs found":""}
        </div>
      </div>
      <button onclick="navigate('/')">Back Home</button>
    `}catch(n){t.innerHTML=`<div class="error card">${n.message}</div><button onclick="navigate('/')">Back Home</button>`}}function D(){let i=document.getElementById("app");i.innerHTML=`
    ${u()}
    <div class="card" style="max-width: 600px; margin: 0 auto 4rem auto;">
      <h2>Verify Ballot</h2>
      <p>Enter your Ballot Hash to verify it was recorded in the database chain.</p>
      <input type="text" id="verify-hash" placeholder="e.g. 8f4c...a1b2" />
      <button onclick="verifyHash()">Verify</button>
      <div id="verify-result" class="mt-4"></div>
    </div>
    <div style="text-align:center;"><button onclick="navigate('/')">Back Home</button></div>
  `,window.verifyHash=async()=>{let e=document.getElementById("verify-hash").value.trim();if(!e)return;let t=document.getElementById("verify-result");t.innerHTML="Verifying...";try{let a=(await d(`/verify/${e}`)).ballot;t.innerHTML=`
        <div class="success" style="padding: 1rem; background: #ecfdf5; border-radius: 4px; border: 1px solid var(--success);">
          <h3>Valid Ballot Found \u2713</h3>
          <p><strong>Election ID:</strong> ${a.election_id}</p>
          <p><strong>Cast Timestamp:</strong> ${f(a.timestamp)}</p>
          <p style="word-break:break-all;"><strong>Previous Link:</strong> <br/>${a.previous_hash}</p>
        </div>
      `}catch(n){t.innerHTML=`
        <div class="error" style="padding: 1rem; background: #fef2f2; border-radius: 4px; border: 1px solid var(--danger);">
          <h3>Verification Failed \u2717</h3>
          <p>${n.message}</p>
        </div>
      `}}}var _=x(()=>{"use strict";b()});var J=j(()=>{$();b();M();C();_();l.add("/",()=>{let i=document.getElementById("app");i&&(i.innerHTML=`
      ${u()}
    <div style="text-align: center; max-width: 600px; margin: 0 auto 4rem auto;" class="card">
      <h1>TEC EC Election</h1>
      <p>Welcome to the secure, anonymous election system.</p>
      <div class="flex flex-col gap-4 mt-4">
        <button onclick="navigate('/verify')">Verify a Ballot</button>
        <button onclick="navigate('/admin/login')" style="background-color: var(--text-muted);">Admin Login</button>
      </div>
    </div>
  `)});l.add("/admin/login",H);l.add("/admin",I);l.add("/admin/elections/:id",h);l.add("/vote/:id",O);l.add("/vote/:id/ballot",P);l.add("/vote/:id/confirm",A);l.add("/results/:id",N);l.add("/audit/:id",V);l.add("/verify",D);l.route()});J();})();
