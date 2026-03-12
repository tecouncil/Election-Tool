"use strict";(()=>{var x=(i,e)=>()=>(i&&(e=i(i=0)),e);var j=(i,e)=>()=>(e||i((e={exports:{}}).exports,e),e.exports);function q(){return localStorage.getItem("tec_token")}function $(i){localStorage.setItem("tec_token",i)}function S(){localStorage.removeItem("tec_token")}async function d(i,e={}){let t=q(),n={"Content-Type":"application/json",...e.headers||{}};t&&(n.Authorization=`Bearer ${t}`);let a=await fetch(`${F}${i}`,{...e,headers:n}),o=await a.json().catch(()=>({}));if(!a.ok)throw new Error(o.error||"API request failed");return o}function b(i){if(!i)return"-";let e;if(typeof i=="string"){let t=i;t.includes(" ")&&!t.includes("T")&&(t=t.replace(" ","T")),!t.endsWith("Z")&&!t.includes("+")&&(t+="Z"),e=new Date(t)}else e=i;return isNaN(e.getTime())?"-":new Intl.DateTimeFormat("en-IN",{timeZone:"Asia/Kolkata",year:"numeric",month:"numeric",day:"numeric",hour:"2-digit",minute:"2-digit",second:"2-digit",hour12:!0}).format(e)}function E(i){if(!i)return"";let e=typeof i=="string"?new Date(i):i;if(isNaN(e.getTime()))return"";let t={timeZone:"Asia/Kolkata",year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",hour12:!1},a=new Intl.DateTimeFormat("en-CA",t).formatToParts(e),o=m=>a.find(r=>r.type===m)?.value;return`${o("year")}-${o("month")}-${o("day")}T${o("hour")}:${o("minute")}`}function p(){return`
    <header class="header" onclick="navigate('/')">
      <img src="/assets/logo.png" alt="TEC EC Logo" class="logo" />
    </header>
  `}var F,f=x(()=>{"use strict";F="/api"});var k,l,w=x(()=>{"use strict";f();k=class{routes=[];constructor(){window.addEventListener("popstate",()=>this.route())}add(e,t){let n=e.replace(/:[a-zA-Z]+/g,"([^/]+)"),a=new RegExp(`^${n}$`);this.routes.push({path:a,handler:t})}navigate(e){window.history.pushState({},"",e),this.route()}route(){let e=window.location.pathname,t=document.getElementById("app");if(t){for(let n of this.routes){let a=e.match(n.path);if(a){let o=a.slice(1);t.innerHTML="Loading...",n.handler(o);return}}t.innerHTML='<h1>404 Not Found</h1><button onclick="window.history.back()">Go Back</button>'}}},l=new k;window.navigate=i=>l.navigate(i);window.logout=()=>{S(),l.navigate("/")}});function H(){let i=document.getElementById("app");i.innerHTML=`
    ${p()}
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
  `,window.requestAdminOTP=async()=>{let e=document.getElementById("admin-email").value;try{await d("/auth/otp/request",{method:"POST",body:JSON.stringify({email:e,isAdminLogin:!0})}),document.getElementById("login-step-1").style.display="none",document.getElementById("login-step-2").style.display="block",document.getElementById("login-error").innerText="OTP sent to email. Please check your inbox.",document.getElementById("login-error").className="success"}catch(t){document.getElementById("login-error").innerText=t.message,document.getElementById("login-error").className="error"}},window.verifyAdminOTP=async()=>{let e=document.getElementById("admin-email").value,t=document.getElementById("admin-otp").value;try{let n=await d("/auth/otp/verify",{method:"POST",body:JSON.stringify({email:e,code:t,isAdminLogin:!0})});$(n.token),l.navigate("/admin")}catch(n){document.getElementById("login-error").innerText=n.message,document.getElementById("login-error").className="error"}}}async function I(){let i=document.getElementById("app");i.innerHTML="<div>Loading...</div>";try{let t=(await d("/elections")).elections||[],n=t.map(a=>`
      <div class="card flex justify-between items-center">
        <div>
          <h3>${a.title}</h3>
          <p class="text-muted">Status: <strong>${a.status}</strong></p>
        </div>
        <button onclick="navigate('/admin/elections/${a.id}')">Manage</button>
      </div>
    `).join("");t.length===0&&(n="<p>No elections found.</p>"),i.innerHTML=`
      ${p()}
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
    `,window.createElection=async()=>{let a=document.getElementById("new-election-title").value;if(!a)return;let o=await d("/elections",{method:"POST",body:JSON.stringify({title:a})});o.election&&o.election.id?l.navigate(`/admin/elections/${o.election.id}`):I()}}catch(e){e.message.includes("Unauthorized")||e.message.includes("Forbidden")?l.navigate("/admin/login"):i.innerHTML=`<div class="error">${e.message}</div>`}}async function h(i){let e=i[0],t=document.getElementById("app");t.innerHTML="<div>Loading...</div>";try{let[n,a,o,m]=await Promise.all([d(`/elections/${e}`),d(`/elections/${e}/candidates`),d(`/elections/${e}/participation`),d(`/elections/${e}/internal-results`)]),r=n.election,c=a.candidates,u=o.participation,g=m.results,v=r.status==="draft",T=window.location.origin+"/vote/"+r.id;t.innerHTML=`
      ${p()}
      <button onclick="navigate('/admin')" style="background:var(--text-muted);margin-bottom:1rem;">&larr; Back to Dashboard</button>
      <div class="card">
        <h2>${r.title} </h2>
        <p>Status: <strong>${r.status}</strong></p>
        ${v?`
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
        <input type="number" id="edit-panel" value="${r.panel_size}" ${v?"":"disabled"} />
        
        <div class="flex gap-4 mt-2">
          <div style="flex:1">
            <label>Voting Window Start</label>
            <input type="datetime-local" id="edit-start" value="${E(r.voting_window_start)}" ${v?"":"disabled"} />
          </div>
          <div style="flex:1">
            <label>Voting Window End (Deadline)</label>
            <input type="datetime-local" id="edit-end" value="${E(r.voting_window_end)}" ${v?"":"disabled"} />
          </div>
        </div>

        ${v?`<button class="mt-4" onclick="updateSettings('${r.id}')">Save Settings</button>`:""}
      </div>

      <div class="flex gap-4" style="display:flex; gap: 1rem; align-items: flex-start;">
        <div class="card" style="flex:1;">
          <h3>Candidates (${c.length})</h3>
          ${v?`
            <div class="flex gap-2">
              <input type="text" id="new-candidate" placeholder="Candidate Name" />
              <button onclick="addCandidate('${r.id}')">Add</button>
            </div>
          `:""}
          <ul style="padding-left:0;list-style:none;">
            ${c.map(s=>`
              <li class="candidate-item justify-between">
                <span>${s.name}</span>
                ${v?`<button style="background:var(--danger)" onclick="removeCandidate('${r.id}', '${s.id}')">X</button>`:""}
              </li>
            `).join("")}
          </ul>
        </div>

        <div class="card" style="flex:1;">
          <h3>Live Results</h3>
          <ul style="padding-left:0;list-style:none;">
            ${g.map(s=>`
              <li class="candidate-item justify-between">
                <span>${s.name}</span>
                <span class="badge">${s.votes} votes</span>
              </li>
            `).join("")}
          </ul>
        </div>
      </div>

      <div class="card">
        <h3>Voter Participation (${u.length} total)</h3>
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
              ${u.map(s=>`
                <tr style="border-bottom: 1px solid #eee;">
                  <td style="padding: 0.5rem;">${s.email}</td>
                  <td style="padding: 0.5rem; font-size: 0.8rem; color: #666;">${b(s.voted_at)}</td>
                </tr>
              `).join("")}
              ${u.length===0?'<tr><td colspan="2" style="padding: 1rem; text-align: center; color: #999;">No votes cast yet</td></tr>':""}
            </tbody>
          </table>
        </div>
      </div>
    `,window.copyShareLink=()=>{let s=document.getElementById("share-link");s.select(),s.setSelectionRange(0,99999),navigator.clipboard.writeText(s.value).then(()=>{alert("Copied to clipboard")}).catch(()=>{alert("Failed to copy")})},v&&(window.updateSettings=async s=>{let y=parseInt(document.getElementById("edit-panel").value,10),L=document.getElementById("edit-start").value,B=document.getElementById("edit-end").value,z=L?new Date(L+":00+05:30").toISOString():null,_=B?new Date(B+":00+05:30").toISOString():null;await d(`/elections/${s}`,{method:"PATCH",body:JSON.stringify({panel_size:y,voting_window_start:z,voting_window_end:_})}),h([s])},window.addCandidate=async s=>{let y=document.getElementById("new-candidate").value;y&&(await d(`/elections/${s}/candidates`,{method:"POST",body:JSON.stringify({name:y})}),h([s]))},window.removeCandidate=async(s,y)=>{await d(`/elections/${s}/candidates/${y}`,{method:"DELETE"}),h([s])},window.openElection=async s=>{confirm("Are you sure you want to open this election? No more changes to candidates can be made.")&&(await d(`/elections/${s}/open`,{method:"POST"}).catch(y=>alert(y.message)),h([s]))}),window.closeElection=async s=>{confirm("Close election? Voters will no longer be able to vote.")&&(await d(`/elections/${s}/close`,{method:"POST"}).catch(y=>alert(y.message)),h([s]))},window.finalizeElection=async s=>{confirm("Finalize election? Results will be made public.")&&(await d(`/elections/${s}/finalize`,{method:"POST"}).catch(y=>alert(y.message)),h([s]))}}catch(n){n.message.includes("Unauthorized")||n.message.includes("Forbidden")?l.navigate("/admin/login"):t.innerHTML=`<div class="error">${n.message}</div>`}}var M=x(()=>{"use strict";f();w()});async function O(i){let e=i[0],t=document.getElementById("app");t.innerHTML="<div>Loading...</div>";try{let{election:n}=await d(`/elections/${e}/public`);if(n.status==="closed"||n.status==="finalized"){l.navigate(`/results/${e}`);return}t.innerHTML=`
      ${p()}
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
    `}catch(n){t.innerHTML=`<div class="error card">${n.message}</div>`}window.requestVoterOTP=async n=>{let a=document.getElementById("voter-email").value;try{await d("/auth/otp/request",{method:"POST",body:JSON.stringify({email:a,electionId:n})}),document.getElementById("login-step-1").style.display="none",document.getElementById("login-step-2").style.display="block",document.getElementById("login-error").innerText="OTP sent to email. Please check your inbox.",document.getElementById("login-error").className="success"}catch(o){document.getElementById("login-error").innerText=o.message,document.getElementById("login-error").className="error"}},window.verifyVoterOTP=async n=>{let a=document.getElementById("voter-email").value,o=document.getElementById("voter-otp").value;try{let m=await d("/auth/otp/verify",{method:"POST",body:JSON.stringify({email:a,code:o,electionId:n})});$(m.token),l.navigate(`/vote/${n}/ballot`)}catch(m){document.getElementById("login-error").innerText=m.message,document.getElementById("login-error").className="error"}}}async function P(i){let e=i[0],t=document.getElementById("app");t.innerHTML="<div>Loading Ballot...</div>";try{let n=await d(`/elections/${e}/public`),a=n.election,o=n.candidates,m=a.panel_size,r=[];t.innerHTML=`
      ${p()}
      <div class="card">
        <h2>${a.title} - Official Ballot</h2>
        <p>Instructions: You must select exactly <strong>${m}</strong> candidates.</p>
        <p>Selected: <span id="selection-count">0</span> / ${m}</p>
      </div>
      <div id="candidates-list">
        ${o.map(c=>`
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
    `,window.toggleCandidate=c=>{let u=r.indexOf(c),g=document.getElementById(`candidate-${c}`),v=document.getElementById(`checkbox-${c}`);u>-1?(r.splice(u,1),g.classList.remove("selected"),v.checked=!1):r.length<m&&(r.push(c),g.classList.add("selected"),v.checked=!0),document.getElementById("selection-count").innerText=r.length.toString();let T=document.getElementById("submit-ballot");T.disabled=r.length!==m},window.submitBallot=async c=>{let u=document.getElementById("submit-ballot");u.disabled=!0,u.innerText="Submitting...";try{let g=await d(`/elections/${c}/ballots`,{method:"POST",body:JSON.stringify({selections:r})});localStorage.setItem(`receipt_${c}`,JSON.stringify(g.receipt)),l.navigate(`/vote/${c}/confirm`)}catch(g){document.getElementById("ballot-error").innerText=g.message,u.disabled=!1,u.innerText="Cast Ballot"}}}catch(n){n.message.includes("Unauthorized")?l.navigate(`/vote/${e}`):t.innerHTML=`<div class="error">${n.message}</div>`}}function C(i){let e=i[0],t=document.getElementById("app"),n=localStorage.getItem(`receipt_${e}`);if(!n){l.navigate("/");return}let a=JSON.parse(n);t.innerHTML=`
    ${p()}
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
        ${b(a.timestamp)}
      </div>

      <div class="mt-4 flex gap-2 justify-center" style="display:flex; gap:0.5rem; justify-content:center; margin-top:1.5rem;">
        <button onclick="copyReceipt('${e}')">Copy Full Receipt</button>
        <button style="background:var(--text-muted)" onclick="navigate('/')">Return Home</button>
      </div>

      <p class="text-sm text-muted mt-4" style="max-width: 500px; margin-left:auto; margin-right:auto;">
        <strong>Privacy Note:</strong> To ensure your vote remains truly private, your choices were <u>not</u> included in your confirmation email (it only contains the Ballot Hash). Please copy or save this screen if you need a permanent record of your selections.
      </p>
    </div>
  `,window.copyReceipt=o=>{let m=document.getElementById("receipt-details").innerText;navigator.clipboard.writeText(m).then(()=>{alert("Receipt copied to clipboard!")}).catch(()=>{alert("Failed to copy receipt.")})}}var A=x(()=>{"use strict";f();w()});async function D(i){let e=i[0],t=document.getElementById("app");t.innerHTML="<div>Loading Results...</div>";try{let n=await d(`/elections/${e}/results`),a=n.election,o=n.results||[],m=a.panel_size||5,r=o.slice(0,m),c=o.slice(m);t.innerHTML=`
      ${p()}
      <div class="card">
        <h2>${a.title} - Official Results</h2>
        <p>Status: <strong style="text-transform: capitalize;">${a.status}</strong></p>
      </div>

      <div class="card">
        <h3>Top Results (Winners)</h3>
        <p class="text-sm text-muted mb-4">Displaying the top ${m} candidates based on total votes.</p>
        <table style="width:100%; text-align:left; border-collapse:collapse;">
          <thead>
            <tr style="border-bottom: 2px solid var(--border);">
              <th style="padding:0.75rem;">Rank</th>
              <th style="padding:0.75rem;">Candidate</th>
              <th style="padding:0.75rem; text-align:right;">Votes</th>
            </tr>
          </thead>
          <tbody>
            ${r.map((u,g)=>`
              <tr style="border-bottom: 1px solid var(--border); background: ${g<m?"#fdfdfd":"transparent"};">
                <td style="padding:0.75rem; width: 50px;">#${g+1}</td>
                <td style="padding:0.75rem;"><strong>${u.name}</strong></td>
                <td style="padding:0.75rem; text-align:right;">${u.votes}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>

      ${c.length>0?`
        <div id="other-results-container" style="display:none; margin-top: -1rem;">
          <div class="card">
            <h3>Other Candidates</h3>
            <table style="width:100%; text-align:left; border-collapse:collapse;">
              <tbody>
                ${c.map((u,g)=>`
                  <tr style="border-bottom: 1px solid var(--border);">
                    <td style="padding:0.75rem; width: 50px;">#${m+g+1}</td>
                    <td style="padding:0.75rem;">${u.name}</td>
                    <td style="padding:0.75rem; text-align:right;">${u.votes}</td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
          </div>
        </div>
        <div style="text-align:center; margin-bottom: 2rem;">
          <button id="btn-load-more" onclick="showOtherResults()">Load More Candidates (+${c.length})</button>
        </div>
      `:""}

      <div class="flex gap-4" style="margin-top:2rem;">
        <button onclick="navigate('/')">Back Home</button>
        <button style="background:var(--text-muted);" onclick="navigate('/audit/${e}')">View Audit Log</button>
      </div>
    `,window.showOtherResults=()=>{document.getElementById("other-results-container").style.display="block",document.getElementById("btn-load-more").style.display="none"}}catch(n){t.innerHTML=`<div class="error card">${n.message}</div><button onclick="navigate('/')">Back Home</button>`}}async function N(i){let e=i[0],t=document.getElementById("app");t.innerHTML="<div>Loading Audit Log...</div>";try{let a=(await d(`/audit/${e}`)).logs||[];t.innerHTML=`
      ${p()}
      <div class="card">
        <div class="flex justify-between items-center mb-4">
          <h2>Election Audit Log</h2>
          <button onclick="navigate('/results/${e}')">View Results</button>
        </div>
        <p class="text-muted text-sm border-b pb-2">Cryptographically verifiable append-only log of election events.</p>
        <div style="max-height: 500px; overflow-y:auto; font-family:monospace; font-size: 0.8rem; background:#111827; color:#10b981; padding: 1rem; border-radius: 4px;">
          ${a.map(o=>`
            <div style="margin-bottom: 1rem; border-bottom: 1px dashed #374151; padding-bottom: 0.5rem;">
              <span style="color:#60a5fa">${b(o.timestamp)}</span> 
              <span style="color:#f59e0b">[${o.action}]</span>
              <br/>
              <span style="color:#f3f4f6">${o.details?o.details:""}</span>
            </div>
          `).join("")}
          ${a.length===0?"No logs found":""}
        </div>
      </div>
      <button onclick="navigate('/')">Back Home</button>
    `}catch(n){t.innerHTML=`<div class="error card">${n.message}</div><button onclick="navigate('/')">Back Home</button>`}}function V(){let i=document.getElementById("app");i.innerHTML=`
    ${p()}
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
          <p><strong>Cast Timestamp:</strong> ${b(a.timestamp)}</p>
          <p style="word-break:break-all;"><strong>Previous Link:</strong> <br/>${a.previous_hash}</p>
        </div>
      `}catch(n){t.innerHTML=`
        <div class="error" style="padding: 1rem; background: #fef2f2; border-radius: 4px; border: 1px solid var(--danger);">
          <h3>Verification Failed \u2717</h3>
          <p>${n.message}</p>
        </div>
      `}}}var R=x(()=>{"use strict";f()});var J=j(()=>{w();f();M();A();R();l.add("/",()=>{let i=document.getElementById("app");i&&(i.innerHTML=`
      ${p()}
    <div style="text-align: center; max-width: 600px; margin: 0 auto 4rem auto;" class="card">
      <h1>TEC EC Election</h1>
      <p>Welcome to the secure, anonymous election system.</p>
      <div class="flex flex-col gap-4 mt-4">
        <button onclick="navigate('/verify')">Verify a Ballot</button>
        <button onclick="navigate('/admin/login')" style="background-color: var(--text-muted);">Admin Login</button>
      </div>
    </div>
  `)});l.add("/admin/login",H);l.add("/admin",I);l.add("/admin/elections/:id",h);l.add("/vote/:id",O);l.add("/vote/:id/ballot",P);l.add("/vote/:id/confirm",C);l.add("/results/:id",D);l.add("/audit/:id",N);l.add("/verify",V);l.route()});J();})();
