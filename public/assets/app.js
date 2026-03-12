"use strict";(()=>{var w=(n,e)=>()=>(n&&(e=n(n=0)),e);var F=(n,e)=>()=>(e||n((e={exports:{}}).exports,e),e.exports);function L(){return localStorage.getItem("tec_token")}function E(n){localStorage.setItem("tec_token",n)}function z(){localStorage.removeItem("tec_token")}async function l(n,e={}){let i=L(),t={"Content-Type":"application/json",...e.headers||{}};i&&(t.Authorization=`Bearer ${i}`);let o=await fetch(`${q}${n}`,{...e,headers:t}),r=await o.json().catch(()=>({}));if(!o.ok)throw new Error(r.error||"API request failed");return r}function h(n){if(!n)return"-";let e;if(typeof n=="string"){let i=n;i.includes(" ")&&!i.includes("T")&&(i=i.replace(" ","T")),!i.endsWith("Z")&&!i.includes("+")&&(i+="Z"),e=new Date(i)}else e=n;return isNaN(e.getTime())?"-":new Intl.DateTimeFormat("en-IN",{timeZone:"Asia/Kolkata",year:"numeric",month:"numeric",day:"numeric",hour:"2-digit",minute:"2-digit",second:"2-digit",hour12:!0}).format(e)}function I(n){if(!n)return"";let e=typeof n=="string"?new Date(n):n;if(isNaN(e.getTime()))return"";let i={timeZone:"Asia/Kolkata",year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",hour12:!1},o=new Intl.DateTimeFormat("en-CA",i).formatToParts(e),r=p=>o.find(s=>s.type===p)?.value;return`${r("year")}-${r("month")}-${r("day")}T${r("hour")}:${r("minute")}`}function y(){return`
    <nav class="header-nav">
      <div class="logo-container" onclick="navigate('/')">
        <img src="/assets/logo.png" alt="TEC Logo" class="logo-img" />
      </div>
      <div class="flex gap-4 items-center">
        ${location.pathname.startsWith("/admin")&&L()?`<button class="secondary" onclick="navigate('/admin')" style="padding: 0.4rem 0.8rem; font-size: 0.8rem;">Admin Dashboard</button>`:""}
        <button class="secondary" onclick="navigate('/verify')" style="padding: 0.4rem 0.8rem; font-size: 0.8rem;">Verify Vote</button>
      </div>
    </nav>
  `}var q,x=w(()=>{"use strict";q="/api"});var B,d,T=w(()=>{"use strict";x();B=class{routes=[];constructor(){window.addEventListener("popstate",()=>this.route())}add(e,i){let t=e.replace(/:[a-zA-Z]+/g,"([^/]+)"),o=new RegExp(`^${t}$`);this.routes.push({path:o,handler:i})}navigate(e){window.history.pushState({},"",e),this.route()}route(){let e=window.location.pathname,i=document.getElementById("app");if(i){for(let t of this.routes){let o=e.match(t.path);if(o){let r=o.slice(1);i.innerHTML="Loading...",t.handler(r);return}}i.innerHTML='<h1>404 Not Found</h1><button onclick="window.history.back()">Go Back</button>'}}},d=new B;window.navigate=n=>d.navigate(n);window.logout=()=>{z(),d.navigate("/")}});function S(){let n=document.getElementById("app");n.innerHTML=`
    ${y()}
    <div class="card animate-fade-in" style="max-width: 440px; margin: 2rem auto;">
      <h1 class="text-center" style="font-size: 1.75rem;">Admin Access</h1>
      <p class="text-muted text-center" style="margin-bottom: 2.5rem;">Secure administrative portal for election management.</p>
      
      <div id="login-error" class="error text-center" style="min-height: 1.5rem;"></div>
      
      <div id="login-step-1">
        <label for="admin-email">Administrator Email</label>
        <input type="email" id="admin-email" placeholder="admin@organization.com" value="tecouncil.org@gmail.com" autofocus />
        <button style="width: 100%;" onclick="requestAdminOTP()">Request Authorization Code</button>
      </div>

      <div id="login-step-2" style="display:none;">
        <label for="admin-otp">Verification Code</label>
        <input type="text" id="admin-otp" placeholder="Enter 6-digit code" maxlength="6" style="text-align: center; letter-spacing: 0.5em; font-family: 'Fira Code', monospace; font-size: 1.25rem;" />
        <button style="width: 100%;" onclick="verifyAdminOTP()">Verify & Authenticate</button>
        <p class="text-center mt-4">
          <a href="javascript:void(0)" onclick="location.reload()" style="font-size: 0.8rem; color: var(--text-muted);">Back to email input</a>
        </p>
      </div>
    </div>
  `,window.requestAdminOTP=async()=>{let e=document.getElementById("admin-email").value;try{await l("/auth/otp/request",{method:"POST",body:JSON.stringify({email:e,isAdminLogin:!0})}),document.getElementById("login-step-1").style.display="none",document.getElementById("login-step-2").style.display="block",document.getElementById("login-error").innerText="OTP sent to email. Please check your inbox.",document.getElementById("login-error").className="success"}catch(i){document.getElementById("login-error").innerText=i.message,document.getElementById("login-error").className="error"}},window.verifyAdminOTP=async()=>{let e=document.getElementById("admin-email").value,i=document.getElementById("admin-otp").value;try{let t=await l("/auth/otp/verify",{method:"POST",body:JSON.stringify({email:e,code:i,isAdminLogin:!0})});E(t.token),d.navigate("/admin")}catch(t){document.getElementById("login-error").innerText=t.message,document.getElementById("login-error").className="error"}}}async function C(){let n=document.getElementById("app");n.innerHTML="<div>Loading...</div>";try{let i=(await l("/elections")).elections||[],t=i.map(o=>`
      <div class="card flex justify-between items-center animate-fade-in">
        <div>
          <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.25rem;">
            <h3 style="margin:0;">${o.title}</h3>
            <span class="badge badge-${o.status}">${o.status}</span>
          </div>
          <p class="text-muted text-sm">Created: ${h(o.created_at)}</p>
        </div>
        <button class="secondary" onclick="navigate('/admin/elections/${o.id}')">
          Manage
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
        </button>
      </div>
    `).join("");i.length===0&&(t=`
        <div class="card text-center text-muted" style="padding: 4rem 2rem;">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" style="margin-bottom: 1rem; opacity: 0.5;"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
          <p>No elections have been created yet.</p>
        </div>
      `),n.innerHTML=`
      ${y()}
      <div class="animate-fade-in">
        <div class="flex justify-between items-end mb-4">
          <div>
            <h1>Admin Dashboard</h1>
            <p class="text-muted">Overview of all active and pending elections.</p>
          </div>
          <button class="danger" onclick="logout()" style="padding: 0.5rem 1rem; font-size: 0.8rem;">Terminate Session</button>
        </div>
        
        <div class="card" style="background: var(--primary); color: white; border: none;">
          <h3 style="color: white; margin-bottom: 1rem;">Launch New Election</h3>
          <div class="flex gap-2">
            <input type="text" id="new-election-title" placeholder="Enter Descriptive Title (e.g. Student Council 2026)" style="margin-bottom: 0; background: rgba(255,255,255,0.15); border-color: rgba(255,255,255,0.2); color: white;" />
            <button onclick="createElection()" style="background: white; color: var(--primary); min-width: 120px;">Initialize</button>
          </div>
        </div>

        <div style="margin-top: 2rem;">
          <h2 style="margin-bottom: 1.5rem; font-size: 1.25rem; text-transform: uppercase; letter-spacing: 0.1em; color: var(--text-muted);">Active Records</h2>
          ${t}
        </div>
      </div>
    `,window.createElection=async()=>{let o=document.getElementById("new-election-title").value;if(!o)return;let r=await l("/elections",{method:"POST",body:JSON.stringify({title:o})});r.election&&r.election.id?d.navigate(`/admin/elections/${r.election.id}`):C()}}catch(e){e.message.includes("Unauthorized")||e.message.includes("Forbidden")?d.navigate("/admin/login"):n.innerHTML=`<div class="error">${e.message}</div>`}}async function b(n){let e=n[0],i=document.getElementById("app");i.innerHTML="<div>Loading...</div>";try{let[t,o,r,p]=await Promise.all([l(`/elections/${e}`),l(`/elections/${e}/candidates`),l(`/elections/${e}/participation`),l(`/elections/${e}/internal-results`)]),s=t.election,c=o.candidates,m=r.participation,g=p.results,v=s.status==="draft",f=window.location.origin+"/vote/"+s.id;i.innerHTML=`
      ${y()}
      <div class="animate-fade-in">
        <div class="flex justify-between items-center mb-4">
          <button class="secondary" onclick="navigate('/admin')" style="padding: 0.5rem 1rem;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
            Dashboard
          </button>
          <div style="display: flex; gap: 0.5rem;">
            ${v?`
              <button onclick="openElection('${s.id}')">Activate Election</button>
            `:""}
            ${s.status==="open"?`
              <button class="danger" onclick="closeElection('${s.id}')">Deactivate (Close)</button>
            `:""}
            ${s.status==="closed"?`
              <button style="background:var(--success)" onclick="finalizeElection('${s.id}')">Publish Results</button>
            `:""}
          </div>
        </div>

        <div class="card" style="border-left: 4px solid var(--primary);">
          <div style="display: flex; justify-content: space-between; align-items: flex-start;">
            <div>
              <h1 style="margin: 0;">${s.title}</h1>
              <div style="margin-top: 0.5rem; display: flex; gap: 1rem; align-items: center;">
                <span class="badge badge-${s.status}">${s.status}</span>
                <span class="text-sm text-muted">ID: ${s.id}</span>
              </div>
            </div>
            <div style="text-align: right;">
              <small class="text-muted uppercase bold" style="font-size: 0.7rem;">Share Link</small>
              <div class="flex gap-2 mt-1">
                <input type="text" id="share-link" value="${f}" readonly style="margin:0; padding: 0.4rem 0.75rem; font-size: 0.8rem; background: var(--bg);" />
                <button class="secondary" onclick="copyShareLink()" style="padding: 0.4rem 0.75rem;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg></button>
              </div>
            </div>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 1.5rem; margin-top: 1.5rem;">
          <div class="flex-col gap-4">
            <!-- Settings Block -->
            <div class="card">
              <h3>Configuration</h3>
              <div style="margin-bottom: 1.5rem;">
                <label>Panel Size (Candidate count per ballot)</label>
                <input type="number" id="edit-panel" value="${s.panel_size}" ${v?"":"disabled"} />
              </div>
              
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                <div>
                  <label>Start Window</label>
                  <input type="datetime-local" id="edit-start" value="${I(s.voting_window_start)}" ${v?"":"disabled"} />
                </div>
                <div>
                  <label>End Window</label>
                  <input type="datetime-local" id="edit-end" value="${I(s.voting_window_end)}" ${v?"":"disabled"} />
                </div>
              </div>

              ${v?`<button class="mt-4" style="width: 100%;" onclick="updateSettings('${s.id}')">Update Core Settings</button>`:""}
            </div>

            <!-- Candidates Block -->
            <div class="card">
              <div class="flex justify-between items-center mb-4">
                <h3 style="margin:0;">Nominees (${c.length})</h3>
                ${v?`<button class="secondary" style="padding: 0.4rem 0.8rem; font-size: 0.8rem;" onclick="document.getElementById('candidate-form').style.display = 'flex'">+ Add New</button>`:""}
              </div>

              <div id="candidate-form" style="display: none; gap: 0.5rem; margin-bottom: 1rem;">
                <input type="text" id="new-candidate" placeholder="Candidate Full Name" style="margin-bottom:0;" />
                <button onclick="addCandidate('${s.id}')">Confirm</button>
              </div>

              <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                ${c.map(a=>`
                  <div class="flex justify-between items-center" style="padding: 0.75rem; border: 1px solid var(--border); border-radius: 8px; background: white;">
                    <span style="font-weight: 500;">${a.name}</span>
                    ${v?`<button style="padding: 0.25rem 0.5rem; background: #fee2e2; color: #dc2626;" onclick="removeCandidate('${s.id}', '${a.id}')">Remove</button>`:""}
                  </div>
                `).join("")}
                ${c.length===0?'<p class="text-center text-muted py-4">No candidates nominated.</p>':""}
              </div>
            </div>
          </div>

          <div class="flex-col gap-4">
            <!-- Analytics Block -->
            <div class="card">
              <h3>Live Tally</h3>
              <div style="display: flex; flex-direction: column; gap: 1rem; margin-top: 1rem;">
                ${g.map(a=>{let u=Math.max(...g.map($=>$.votes),1),k=a.votes/u*100;return`
                    <div>
                      <div class="flex justify-between text-sm mb-1">
                        <span style="font-weight: 600;">${a.name}</span>
                        <span class="font-mono">${a.votes}</span>
                      </div>
                      <div style="height: 6px; background: var(--bg); border-radius: 3px; overflow: hidden;">
                        <div style="height: 100%; background: var(--primary); width: ${k}%; transition: width 0.5s ease-out;"></div>
                      </div>
                    </div>
                  `}).join("")}
                ${g.length===0?'<p class="text-center text-muted">Tally will appear once votes are cast.</p>':""}
              </div>
            </div>

            <!-- Participation Block -->
            <div class="card">
              <h3>Participation</h3>
              <div style="font-size: 2rem; font-family: 'Fira Code', monospace; font-weight: 700; margin: 0.5rem 0;">
                ${m.length} <span style="font-size: 0.8rem; font-weight: 400; color: var(--text-muted);">Voters</span>
              </div>
              <div style="max-height: 250px; overflow-y: auto; font-size: 0.8rem;">
                ${m.map(a=>`
                  <div style="padding: 0.4rem 0; border-bottom: 1px solid var(--bg); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                    <span class="text-muted" style="font-size: 0.7rem;">${h(a.voted_at)}</span><br/>
                    ${a.email}
                  </div>
                `).join("")}
                ${m.length===0?'<p class="text-muted">No interactions recorded.</p>':""}
              </div>
            </div>
          </div>
        </div>
      </div>
    `,window.copyShareLink=()=>{let a=document.getElementById("share-link");a.select(),a.setSelectionRange(0,99999),navigator.clipboard.writeText(a.value).then(()=>{alert("Copied to clipboard")}).catch(()=>{alert("Failed to copy")})},v&&(window.updateSettings=async a=>{let u=parseInt(document.getElementById("edit-panel").value,10),k=document.getElementById("edit-start").value,$=document.getElementById("edit-end").value,R=k?new Date(k+":00+05:30").toISOString():null,_=$?new Date($+":00+05:30").toISOString():null;await l(`/elections/${a}`,{method:"PATCH",body:JSON.stringify({panel_size:u,voting_window_start:R,voting_window_end:_})}),b([a])},window.addCandidate=async a=>{let u=document.getElementById("new-candidate").value;u&&(await l(`/elections/${a}/candidates`,{method:"POST",body:JSON.stringify({name:u})}),b([a]))},window.removeCandidate=async(a,u)=>{await l(`/elections/${a}/candidates/${u}`,{method:"DELETE"}),b([a])},window.openElection=async a=>{confirm("Are you sure you want to open this election? No more changes to candidates can be made.")&&(await l(`/elections/${a}/open`,{method:"POST"}).catch(u=>alert(u.message)),b([a]))}),window.closeElection=async a=>{confirm("Close election? Voters will no longer be able to vote.")&&(await l(`/elections/${a}/close`,{method:"POST"}).catch(u=>alert(u.message)),b([a]))},window.finalizeElection=async a=>{confirm("Finalize election? Results will be made public.")&&(await l(`/elections/${a}/finalize`,{method:"POST"}).catch(u=>alert(u.message)),b([a]))}}catch(t){t.message.includes("Unauthorized")||t.message.includes("Forbidden")?d.navigate("/admin/login"):i.innerHTML=`<div class="error">${t.message}</div>`}}var H=w(()=>{"use strict";x();T()});async function A(n){let e=n[0],i=document.getElementById("app");i.innerHTML="<div>Loading...</div>";try{let{election:t}=await l(`/elections/${e}/public`);if(t.status==="closed"||t.status==="finalized"){d.navigate(`/results/${e}`);return}i.innerHTML=`
      ${y()}
      <div class="card animate-fade-in" style="max-width: 480px; margin: 2rem auto;">
        <h1 class="text-center" style="font-size: 1.75rem;">Voter Access</h1>
        <p class="text-muted text-center" style="margin-bottom: 2.5rem;">Secure authentication via OTP. Please enter your registered email address to proceed.</p>
        
        <div id="login-error" class="error text-center" style="min-height: 1.5rem;"></div>
        
        <div id="login-step-1">
          <label for="voter-email">Email Address</label>
          <input type="email" id="voter-email" placeholder="name@organization.com" autofocus />
          <button style="width: 100%;" onclick="requestVoterOTP('${e}')">Generate Verification Code</button>
        </div>
        
        <div id="login-step-2" style="display:none;">
          <label for="voter-otp">Verification Code</label>
          <input type="text" id="voter-otp" placeholder="Enter 6-digit code" maxlength="6" style="text-align: center; letter-spacing: 0.5em; font-family: 'Fira Code', monospace; font-size: 1.25rem;" />
          <button style="width: 100%;" onclick="verifyVoterOTP('${e}')">Verify & Enter Ballot</button>
          <p class="text-center mt-4">
            <a href="javascript:void(0)" onclick="location.reload()" style="font-size: 0.8rem; color: var(--text-muted);">Entered wrong email? Restart</a>
          </p>
        </div>
      </div>
    `}catch(t){i.innerHTML=`<div class="error card">${t.message}</div>`}window.requestVoterOTP=async t=>{let o=document.getElementById("voter-email").value;try{await l("/auth/otp/request",{method:"POST",body:JSON.stringify({email:o,electionId:t})}),document.getElementById("login-step-1").style.display="none",document.getElementById("login-step-2").style.display="block",document.getElementById("login-error").innerText="OTP sent to email. Please check your inbox.",document.getElementById("login-error").className="success"}catch(r){document.getElementById("login-error").innerText=r.message,document.getElementById("login-error").className="error"}},window.verifyVoterOTP=async t=>{let o=document.getElementById("voter-email").value,r=document.getElementById("voter-otp").value;try{let p=await l("/auth/otp/verify",{method:"POST",body:JSON.stringify({email:o,code:r,electionId:t})});E(p.token),d.navigate(`/vote/${t}/ballot`)}catch(p){document.getElementById("login-error").innerText=p.message,document.getElementById("login-error").className="error"}}}async function M(n){let e=n[0],i=document.getElementById("app");i.innerHTML="<div>Loading Ballot...</div>";try{let t=await l(`/elections/${e}/public`),o=t.election,r=t.candidates,p=o.panel_size,s=[];i.innerHTML=`
      ${y()}
      <div class="animate-fade-in">
        <div class="card" style="display: flex; justify-content: space-between; align-items: flex-end; flex-wrap: wrap; gap: 1rem;">
          <div>
            <h1 style="margin-bottom: 0.5rem;">${o.title}</h1>
            <p class="text-muted">Instructions: Carefully select exactly <strong>${p}</strong> candidates from the list below.</p>
          </div>
          <div style="background: var(--bg); padding: 1rem 1.5rem; border-radius: var(--radius); border: 1px solid var(--border); text-align: right;">
            <div class="text-sm text-muted font-mono uppercase bold" style="margin-bottom: 0.25rem;">Selection Count</div>
            <div style="font-size: 1.5rem; font-family: 'Fira Code', monospace; font-weight: 700;">
              <span id="selection-count" style="color: var(--primary);">0</span> <span style="color: var(--text-muted); font-size: 1rem; font-weight: 400;">/ ${p}</span>
            </div>
          </div>
        </div>

        <div class="candidate-grid" id="candidates-list">
          ${r.map((c,m)=>`
            <div class="candidate-item" id="candidate-${c.id}" onclick="toggleCandidate('${c.id}')">
              <div class="candidate-number">${m+1}</div>
              <div style="flex: 1;">
                <div style="font-weight: 600; font-size: 1.1rem; margin-bottom: 0.25rem;">${c.name}</div>
                <div class="text-sm text-muted">${c.description||"No description provided."}</div>
              </div>
              <div class="checkbox-indicator" style="width: 20px; height: 20px; border: 2px solid var(--border); border-radius: 4px; display: flex; align-items: center; justify-content: center; transition: all 0.2s;">
                <svg id="check-${c.id}" style="display: none;" width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="2 6 5 9 10 3"></polyline></svg>
              </div>
            </div>
          `).join("")}
        </div>

        <div class="card mt-4" style="display: flex; justify-content: space-between; align-items: center;">
          <p class="text-sm text-muted" style="max-width: 400px;">
            By clicking "Cast Secure Ballot", your vote will be cryptographically hashed and added to the immutable audit chain.
          </p>
          <button id="submit-ballot" disabled onclick="submitBallot('${e}')" style="min-width: 200px; padding: 1rem 2rem;">
            Cast Secure Ballot
          </button>
        </div>
        <div id="ballot-error" class="error text-center mt-2"></div>
      </div>
    `,window.toggleCandidate=c=>{let m=s.indexOf(c),g=document.getElementById(`candidate-${c}`),v=document.getElementById(`check-${c}`),f=g.querySelector(".checkbox-indicator");m>-1?(s.splice(m,1),g.classList.remove("selected"),v.style.display="none",f.style.background="transparent",f.style.borderColor="var(--border)"):s.length<p&&(s.push(c),g.classList.add("selected"),v.style.display="block",f.style.background="var(--primary)",f.style.borderColor="var(--primary)",f.style.color="white"),document.getElementById("selection-count").innerText=s.length.toString();let a=document.getElementById("submit-ballot");a.disabled=s.length!==p},window.submitBallot=async c=>{let m=document.getElementById("submit-ballot");m.disabled=!0,m.innerText="Submitting...";try{let g=await l(`/elections/${c}/ballots`,{method:"POST",body:JSON.stringify({selections:s})});localStorage.setItem(`receipt_${c}`,JSON.stringify(g.receipt)),d.navigate(`/vote/${c}/confirm`)}catch(g){document.getElementById("ballot-error").innerText=g.message,m.disabled=!1,m.innerText="Cast Ballot"}}}catch(t){t.message.includes("Unauthorized")?d.navigate(`/vote/${e}`):i.innerHTML=`<div class="error">${t.message}</div>`}}function j(n){let e=n[0],i=document.getElementById("app"),t=localStorage.getItem(`receipt_${e}`);if(!t){d.navigate("/");return}let o=JSON.parse(t);i.innerHTML=`
    ${y()}
    <div class="card animate-fade-in" style="text-align:center; max-width:640px; margin: 2rem auto;">
      <div style="width: 64px; height: 64px; background: #e8f5e9; color: #2e7d32; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.5rem auto;">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
      </div>
      <h1 style="color: var(--success); margin-bottom: 0.5rem;">Ballot Cast Successfully</h1>
      <p class="text-muted">Your contribution to <strong>${o.electionTitle||"the election"}</strong> has been securely recorded.</p>
      
      <div id="receipt-details" style="text-align:left; background: var(--bg); padding: 2rem; border-radius: var(--radius); border: 1px solid var(--border); margin-top:2.5rem; position: relative;">
        <div style="position: absolute; top: -12px; left: 24px; background: var(--primary); color: white; padding: 2px 12px; border-radius: 4px; font-size: 0.75rem; font-weight: 700; font-family: 'Fira Code';">OFFICIAL RECEIPT</div>
        
        <div style="margin-bottom: 1.5rem;">
          <label style="margin-bottom: 0.25rem;">Your Selections</label>
          <div style="font-weight: 600; color: var(--text);">
            ${(o.selections||[]).slice(0,5).join(", ")}${o.selections?.length>5?"...":""}
          </div>
        </div>

        <div style="margin-bottom: 1.5rem;">
          <label style="margin-bottom: 0.25rem;">Ballot Hash (Verification Key)</label>
          <div class="font-mono" style="font-size: 0.8rem; background: rgba(0,0,0,0.03); padding: 0.75rem; border-radius: 4px; word-break: break-all; border: 1px dashed var(--border);">
            ${o.ballotHash}
          </div>
        </div>
        
        <div style="display: flex; justify-content: space-between;">
          <div>
            <label style="margin-bottom: 0.25rem;">Timestamp</label>
            <div class="text-sm font-mono">${h(o.timestamp)}</div>
          </div>
          <div style="text-align: right;">
            <label style="margin-bottom: 0.25rem;">Status</label>
            <div class="text-sm success" style="font-weight: 700;">VERIFIED</div>
          </div>
        </div>
      </div>

      <div class="mt-4 flex gap-4 justify-center" style="margin-top:2.5rem;">
        <button onclick="copyReceipt('${e}')" style="flex: 1;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
          Copy Full Receipt
        </button>
        <button class="secondary" onclick="navigate('/')" style="flex: 1;">
          Return to Hub
        </button>
      </div>

      <p class="text-sm text-muted mt-4" style="background: #fff9db; padding: 1rem; border-radius: 8px; color: #856404; font-size: 0.8rem; border: 1px solid #ffeeba; margin-top: 2rem;">
        <strong>Privacy Assurance:</strong> Your specific choices are <u>not</u> included in the automated confirmation email to preserve ballot secrecy. Please copy this receipt now if you require a local record of your selections.
      </p>
    </div>
  `,window.copyReceipt=r=>{let p=document.getElementById("receipt-details").innerText;navigator.clipboard.writeText(p).then(()=>{alert("Receipt copied to clipboard!")}).catch(()=>{alert("Failed to copy receipt.")})}}var O=w(()=>{"use strict";x();T()});async function P(n){let e=n[0],i=document.getElementById("app");i.innerHTML="<div>Loading Results...</div>";try{let t=await l(`/elections/${e}/results`),o=t.election,r=t.results||[],p=o.panel_size||5,s=r.slice(0,p),c=r.slice(p);i.innerHTML=`
      ${y()}
      <div class="animate-fade-in">
        <div class="card" style="border-bottom: 4px solid var(--primary);">
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
            <div>
              <h1 style="margin: 0; font-size: 2rem;">Official Results</h1>
              <p class="text-muted" style="margin-top: 0.25rem;">${o.title}</p>
            </div>
            <div style="display: flex; flex-direction: column; align-items: flex-end;">
              <span class="badge badge-${o.status}" style="font-size: 0.8rem; padding: 0.4rem 1rem;">${o.status}</span>
              <span class="text-sm text-muted mt-1">Verified on chain</span>
            </div>
          </div>
        </div>

        <div class="card">
          <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 1.5rem;">
            <h2 style="margin: 0;">Election Outcome</h2>
            <div class="text-muted text-sm font-mono">Panel Size: ${p}</div>
          </div>
          
          <div style="display: grid; grid-template-columns: 1fr; gap: 0.5rem;">
            ${s.map((m,g)=>{let v=Math.max(...r.map(u=>u.votes),1),f=m.votes/v*100,a=g<p;return`
                <div style="padding: 1rem; border: 1px solid ${a?"rgba(34, 197, 94, 0.2)":"var(--border)"}; border-radius: 8px; background: ${a?"rgba(34, 197, 94, 0.03)":"white"};">
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
                    <div style="display: flex; align-items: center; gap: 0.75rem;">
                      <div style="width: 24px; height: 24px; background: ${a?"var(--success)":"var(--bg)"}; color: ${a?"white":"var(--text-muted)"}; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: 700; font-family: 'Fira Code';">
                        ${g+1}
                      </div>
                      <span style="font-weight: 600; font-size: 1.1rem; color: var(--text);">${m.name}</span>
                      ${a?'<span style="color: var(--success); font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">\u2605 Elected</span>':""}
                    </div>
                    <div class="font-mono" style="font-weight: 700;">${m.votes} <span style="font-weight: 400; color: var(--text-muted); font-size: 0.8rem;">votes</span></div>
                  </div>
                  <div style="height: 4px; background: var(--bg); border-radius: 2px; overflow: hidden;">
                    <div style="height: 100%; background: ${a?"var(--success)":"var(--primary)"}; width: ${f}%; transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);"></div>
                  </div>
                </div>
              `}).join("")}
          </div>
        </div>

        ${c.length>0?`
          <div id="other-results-container" style="display:none; margin-top: -1rem; animation: fadeIn 0.4s ease-out;">
            <div class="card">
              <h3>Additional Contenders</h3>
              <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                ${c.map((m,g)=>`
                  <div class="flex justify-between items-center" style="padding: 0.75rem; border-bottom: 1px solid var(--bg);">
                    <div style="display: flex; align-items: center; gap: 0.75rem;">
                      <span class="text-muted font-mono" style="width: 24px; font-size: 0.8rem;">#${p+g+1}</span>
                      <span>${m.name}</span>
                    </div>
                    <span class="font-mono">${m.votes}</span>
                  </div>
                `).join("")}
              </div>
            </div>
          </div>
          <div style="text-align:center; margin-bottom: 2rem;">
            <button class="secondary" id="btn-load-more" onclick="showOtherResults()" style="width: 100%;">
              Show All Candidates (+${c.length} more)
            </button>
          </div>
        `:""}

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem;">
          <div class="card">
            <h3>Participation Audit</h3>
            <div style="font-size: 2.25rem; font-family: 'Fira Code', monospace; font-weight: 700; margin-bottom: 0.5rem;">
              ${t.voterCount||0} <span style="font-size: 0.9rem; font-weight: 400; color: var(--text-muted);">Verifiable Votes</span>
            </div>
            <p class="text-sm text-muted mb-4">Total number of unique eligible voters who cast a ballot.</p>
            
            <div style="max-height: 150px; overflow-y: auto; background: var(--bg); border-radius: 8px; padding: 1rem; font-size: 0.8rem;">
              <label style="font-size: 0.65rem; color: var(--text-muted); margin-bottom: 0.5rem;">Voter Roster (Public view)</label>
              <div style="display: flex; flex-direction: column; gap: 0.25rem;">
                ${(t.participation||[]).map(m=>`
                  <div style="color: var(--text);">${m}</div>
                `).join("")}
                ${!t.participation||t.participation.length===0?'<div class="text-muted">No entries found.</div>':""}
              </div>
            </div>
          </div>

          <div class="card" style="display: flex; flex-direction: column; justify-content: space-between;">
            <div>
              <h3>Security Evidence</h3>
              <p class="text-sm text-muted">This election uses a cryptographic Merkle-inspired chain for ballot integrity. You can view the full append-only audit log below.</p>
            </div>
            <div class="flex flex-col gap-2 mt-4">
              <button style="width: 100%;" onclick="navigate('/audit/${e}')">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                Inspect Audit Log
              </button>
              <button class="secondary" style="width: 100%;" onclick="navigate('/')">Return Home</button>
            </div>
          </div>
        </div>
      </div>
    `,window.showOtherResults=()=>{document.getElementById("other-results-container").style.display="block",document.getElementById("btn-load-more").style.display="none"}}catch(t){i.innerHTML=`<div class="error card">${t.message}</div><button onclick="navigate('/')">Back Home</button>`}}async function V(n){let e=n[0],i=document.getElementById("app");i.innerHTML="<div>Loading Audit Log...</div>";try{let o=(await l(`/audit/${e}`)).logs||[];i.innerHTML=`
      ${y()}
      <div class="animate-fade-in">
        <div class="flex justify-between items-center mb-6">
          <div>
            <h1>Election Audit Log</h1>
            <p class="text-muted">Cryptographically verifiable technical timeline of all election events.</p>
          </div>
          <button class="secondary" onclick="navigate('/results/${e}')">Exit to Results</button>
        </div>
        
        <div style="background: #1e293b; border-radius: var(--radius); border: 1px solid #334155; padding: 1.5rem; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);">
          <div style="display: flex; align-items: center; gap: 0.5rem; color: #94a3b8; font-family: 'Fira Code', monospace; font-size: 0.75rem; margin-bottom: 1.5rem; padding-bottom: 1rem; border-bottom: 1px solid #334155;">
            <span style="display: inline-block; width: 8px; height: 8px; background: #22c55e; border-radius: 50%; animation: pulse 2s infinite;"></span>
            LIVE AUDIT CHAIN ACTIVE
          </div>
          
          <div style="max-height: 600px; overflow-y: auto; display: flex; flex-direction: column; gap: 0.75rem; padding-right: 0.5rem;">
            ${o.map(r=>`
              <div style="padding: 1rem; background: rgba(30, 41, 59, 0.5); border: 1px solid #334155; border-radius: 8px; font-family: 'Fira Code', monospace; font-size: 0.8rem;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                  <span style="color: #60a5fa; font-weight: 500;">${h(r.timestamp)}</span>
                  <span style="color: #f59e0b; font-weight: 700;">[${r.action}]</span>
                </div>
                <div style="color: #cbd5e1; word-break: break-all; line-height: 1.4;">
                  ${r.details?r.details:"NO_METADATA_PROVIDED"}
                </div>
              </div>
            `).reverse().join("")}
            ${o.length===0?'<div class="text-center py-8 text-muted font-mono">NO_LOG_DATA_DETECTED</div>':""}
          </div>
        </div>

        <div class="text-center mt-8">
          <button class="secondary" onclick="navigate('/')">Return to Homepage</button>
        </div>
      </div>
      
      <style>
        @keyframes pulse {
          0% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.9); }
          100% { opacity: 1; transform: scale(1); }
        }
      </style>
    `}catch(t){i.innerHTML=`<div class="error card">${t.message}</div><button onclick="navigate('/')">Back Home</button>`}}function D(){let n=document.getElementById("app");n.innerHTML=`
    ${y()}
    <div class="animate-fade-in">
      <div class="card" style="max-width: 640px; margin: 2rem auto;">
        <h1 class="text-center" style="margin-bottom: 0.5rem;">Ballot Verification</h1>
        <p class="text-muted text-center" style="margin-bottom: 2rem;">Ensure your vote was accurately recorded by querying its unique cryptographic signature.</p>
        
        <div style="background: var(--bg); padding: 1.5rem; border-radius: var(--radius); border: 1px solid var(--border);">
          <label style="margin-bottom: 0.5rem;">Enter Ballot Hash</label>
          <div class="flex gap-2">
            <input type="text" id="verify-hash" placeholder="e.g. 8f4c3a2b1..." style="margin-bottom: 0; font-family: 'Fira Code', monospace; flex: 1;" />
            <button onclick="verifyHash()" style="min-width: 120px;">Verify Now</button>
          </div>
        </div>

        <div id="verify-result" class="mt-6"></div>
      </div>
      <div class="text-center">
        <button class="secondary" onclick="navigate('/')">Return to Platform Hub</button>
      </div>
    </div>
  `,window.verifyHash=async()=>{let e=document.getElementById("verify-hash").value.trim();if(!e)return;let i=document.getElementById("verify-result");i.innerHTML="Verifying...";try{let o=(await l(`/verify/${e}`)).ballot;i.innerHTML=`
        <div class="card animate-fade-in" style="background: #f0fdf4; border: 1px solid #bcf0da; padding: 1.5rem;">
          <div style="display: flex; align-items: center; gap: 0.75rem; color: #166534; margin-bottom: 1rem;">
             <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
             <h3 style="margin: 0; color: #166534;">Verified Integrity \u2713</h3>
          </div>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; font-size: 0.9rem;">
            <div>
              <label style="color: #65a30d; font-size: 0.6rem;">Election Record</label>
              <div style="font-weight: 600;">E-ID: ${o.election_id}</div>
            </div>
            <div>
              <label style="color: #65a30d; font-size: 0.6rem;">Cast On</label>
              <div style="font-weight: 600;">${h(o.timestamp)}</div>
            </div>
            <div style="grid-column: span 2;">
              <label style="color: #65a30d; font-size: 0.6rem;">Chain Connectivity (Previous Hash)</label>
              <div class="font-mono" style="word-break: break-all; font-size: 0.75rem; color: #3f6212; padding: 0.5rem; background: rgba(255,255,255,0.5); border-radius: 4px;">
                ${o.previous_hash||"ROOT_GENESIS_BLOCK"}
              </div>
            </div>
          </div>
        </div>
      `}catch(t){i.innerHTML=`
        <div class="error" style="padding: 1rem; background: #fef2f2; border-radius: 4px; border: 1px solid var(--danger);">
          <h3>Verification Failed \u2717</h3>
          <p>${t.message}</p>
        </div>
      `}}}var N=w(()=>{"use strict";x()});var J=F(()=>{T();x();H();O();N();d.add("/",()=>{let n=document.getElementById("app");n&&(n.innerHTML=`
    ${y()}
    <div class="animate-fade-in" style="max-width: 900px; margin: 0 auto; padding: 2rem 1rem;">
      <div class="card text-center" style="padding: 4rem 2rem; border-bottom: 4px solid var(--primary); background: radial-gradient(circle at top right, rgba(59, 130, 246, 0.05), transparent);">
        <h1 style="font-size: 3.5rem; margin-bottom: 1rem; letter-spacing: -0.02em;">TEC Election Portal</h1>
        <p class="text-muted" style="font-size: 1.25rem; max-width: 700px; margin: 0 auto 2.5rem auto;">Building a sustainable community of technology entrepreneurs. A secure and cryptographically verifiable platform for the <strong>Technology Entrepreneurs\u2019 Council</strong>.</p>
        
        <div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;">
          <button style="padding: 1rem 2.5rem; font-size: 1.1rem; font-weight: 600;" onclick="navigate('/verify')">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 0.5rem;"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
            Verify a Ballot
          </button>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1.5rem; margin-top: 3rem;">
        <div class="card" style="padding: 1.5rem;">
          <div style="color: var(--primary); margin-bottom: 1rem;"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg></div>
          <h3 style="margin-bottom: 0.5rem;">End-to-End Encryption</h3>
          <p class="text-sm text-muted">Your vote is encrypted at the source, ensuring that even administrators cannot link your identity to your choices.</p>
        </div>
        <div class="card" style="padding: 1.5rem;">
          <div style="color: var(--success); margin-bottom: 1rem;"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg></div>
          <h3 style="margin-bottom: 0.5rem;">Real-time Auditing</h3>
          <p class="text-sm text-muted">A transparent, append-only ledger tracks every action in the system, providing a complete trail for post-election review.</p>
        </div>
        <div class="card" style="padding: 1.5rem;">
          <div style="color: var(--cta); margin-bottom: 1rem;"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg></div>
          <h3 style="margin-bottom: 0.5rem;">Verified Integrity</h3>
          <p class="text-sm text-muted">Every voter receives a digital receipt holding a cryptographic proof that their specific ballot was counted accurately.</p>
        </div>
      </div>

      <div style="margin-top: 4rem; padding-top: 2rem; border-top: 1px solid var(--border); display: flex; justify-content: center; gap: 2rem; flex-wrap: wrap;">
        <a href="https://github.com/tecouncil/Election-Tool" target="_blank" rel="noopener" style="display: flex; align-items: center; gap: 0.5rem; color: var(--text-muted); text-decoration: none; font-size: 0.9rem; font-weight: 500; transition: color 0.2s;">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>
          Audit Source Code
        </a>
        <a href="https://tecouncil.org/" target="_blank" rel="noopener" style="display: flex; align-items: center; gap: 0.5rem; color: var(--text-muted); text-decoration: none; font-size: 0.9rem; font-weight: 500; transition: color 0.2s;">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>
          TEC Website
        </a>
      </div>
    </div>
  `)});d.add("/admin/login",S);d.add("/admin",C);d.add("/admin/elections/:id",b);d.add("/vote/:id",A);d.add("/vote/:id/ballot",M);d.add("/vote/:id/confirm",j);d.add("/results/:id",P);d.add("/audit/:id",V);d.add("/verify",D);d.route()});J();})();
