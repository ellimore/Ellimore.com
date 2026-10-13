(() => {
  const $ = (sel, root=document) => root.querySelector(sel);
  const $$ = (sel, root=document) => [...root.querySelectorAll(sel)];
  const KEY = "ellimor-demo-v1";
  const starter = {
    workspace: "Ellimor Studio",
    projects: [
      {id:"p1",name:"Starter Lua Project",type:"Standalone Lua",description:"A sample project to explore the Ellimor workflow.",updated:"Just now"}
    ],
    files: [
      {id:"f1",name:"main.lua",projectId:"p1",size:1280,updated:"Today",preview:"-- Ellimor sample file\n-- This is a harmless example for your own project.\n\nlocal Project = {}\n\nfunction Project.hello()\n    print('Hello from Ellimor!')\nend\n\nreturn Project"},
      {id:"f2",name:"README.txt",projectId:"p1",size:420,updated:"Today",preview:"Ellimor starter project\n\nUse this workspace to organize Lua files for software and Roblox experiences you control.\n\nThis static demo stores file metadata locally and never executes code."}
    ],
    releases: [{id:"r1",version:"v1.0.0",projectId:"p1",notes:"Initial sample release for the demo workspace.",date:"Today"}]
  };
  let data;
  try { data = JSON.parse(localStorage.getItem(KEY)) || structuredClone(starter); } catch { data = structuredClone(starter); }
  let selectedFile = null;
  let toastTimer;
  const escapeHtml = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(data)); } catch {} };
  const notify = msg => {
    const el = $("#toast"); el.textContent = msg; el.classList.add("show");
    clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove("show"), 2800);
  };
  const projectName = id => data.projects.find(p=>p.id===id)?.name || "Unknown project";
  const shortType = type => type === "Roblox Studio" ? "ROBLOX" : type === "Standalone Lua" ? "LUA" : "LIBRARY";
  function setPage(name) {
    $$(".page").forEach(p => p.classList.toggle("active", p.id === `page-${name}`));
    $$(".nav-item").forEach(b => b.classList.toggle("active", b.dataset.page === name));
    $("#crumb").textContent = ({overview:"Overview",projects:"Projects",files:"Script files",releases:"Releases",discord:"Discord bot",plans:"Plans & access",settings:"Settings"})[name] || "Overview";
    $("#sidebar").classList.remove("open");
    if (name === "projects") renderProjects();
    if (name === "files") renderFiles();
    if (name === "releases") renderReleases();
    if (name === "overview") renderOverview();
    if (name === "settings") $("#workspaceName").value = data.workspace;
    window.scrollTo({top:0,behavior:"smooth"});
  }
  function projectCard(p) {
    return `<article class="project-card"><div class="project-card-head"><div class="project-icon">${escapeHtml(shortType(p.type).slice(0,1))}</div><span class="project-tag">${escapeHtml(shortType(p.type))}</span></div><h3>${escapeHtml(p.name)}</h3><p>${escapeHtml(p.description || "No description added yet.")}</p><div class="project-card-foot"><small>Updated ${escapeHtml(p.updated || "Recently")}</small><button class="text-button" data-project-files="${escapeHtml(p.id)}">View files →</button></div></article>`;
  }
  function renderOverview() {
    $("#projectCount").textContent = data.projects.length;
    $("#fileCount").textContent = data.files.length;
    $("#releaseCount").textContent = data.releases.length;
    $("#recentProjects").innerHTML = data.projects.slice(0,4).map(p=>`<div class="project-row"><div class="project-icon">${escapeHtml(shortType(p.type).slice(0,1))}</div><div class="project-info"><b>${escapeHtml(p.name)}</b><small>${escapeHtml(p.type)} · Updated ${escapeHtml(p.updated || "Recently")}</small></div><span class="project-tag">${data.files.filter(f=>f.projectId===p.id).length} FILES</span></div>`).join("") || `<div class="empty-state">No projects yet. Create your first project.</div>`;
  }
  function renderProjects() {
    const q = ($("#projectSearch").value || "").toLowerCase();
    const list = data.projects.filter(p => `${p.name} ${p.type} ${p.description}`.toLowerCase().includes(q));
    $("#allProjects").innerHTML = list.map(projectCard).join("") || `<div class="empty-state">No matching projects found.</div>`;
    $("#projectSummary").textContent = `${list.length} project${list.length===1?"":"s"}`;
    renderOverview();
  }
  function renderFiles() {
    $("#filesTable").innerHTML = data.files.map(f=>`<tr><td><div class="file-name"><span class="file-badge">${escapeHtml(f.name.split(".").pop().toUpperCase().slice(0,4))}</span>${escapeHtml(f.name)}</div></td><td>${escapeHtml(projectName(f.projectId))}</td><td>${f.size < 1024 ? f.size+" B" : (f.size/1024).toFixed(1)+" KB"}</td><td>${escapeHtml(f.updated || "Today")}</td><td><button class="table-action" data-preview="${escapeHtml(f.id)}">Preview</button> <button class="table-action" data-delete-file="${escapeHtml(f.id)}">Delete</button></td></tr>`).join("") || `<tr><td colspan="5" class="empty-state">No files imported yet.</td></tr>`;
    if (selectedFile && data.files.some(f=>f.id===selectedFile)) showFile(selectedFile);
    renderOverview();
  }
  function showFile(id) {
    const f = data.files.find(f=>f.id===id); if (!f) return;
    selectedFile = id; $("#previewName").textContent = `${f.name} · ${projectName(f.projectId)}`;
    $("#filePreview").textContent = f.preview || "Preview unavailable. This demo keeps imported file metadata only.";
  }
  function renderReleases() {
    $("#releaseList").innerHTML = data.releases.map(r=>`<div class="release-item"><div class="release-icon">⇧</div><div class="release-details"><b>${escapeHtml(r.version)} <span class="project-tag">${escapeHtml(projectName(r.projectId))}</span></b><p>${escapeHtml(r.notes || "No release notes.")}</p><small>Published ${escapeHtml(r.date || "Today")} · Demo record</small></div><button class="table-action" data-delete-release="${escapeHtml(r.id)}">Remove</button></div>`).join("") || `<div class="empty-state">No releases yet. Create your first release.</div>`;
    renderOverview();
  }
  function openProjectDialog() {
    if (data.projects.length >= 3) { notify("The free demo is limited to 3 projects."); setPage("plans"); return; }
    $("#projectForm").reset(); $("#projectDialog").showModal();
  }
  function openReleaseDialog() {
    if (!data.projects.length) { notify("Create a project first."); setPage("projects"); return; }
    $("#releaseProject").innerHTML = data.projects.map(p=>`<option value="${escapeHtml(p.id)}">${escapeHtml(p.name)}</option>`).join("");
    $("#releaseForm").reset(); $("#releaseDialog").showModal();
  }
  function downloadJson() {
    const blob = new Blob([JSON.stringify(data,null,2)], {type:"application/json"});
    const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href=url; a.download="ellimor-demo-export.json"; a.click(); URL.revokeObjectURL(url);
    notify("Demo data export created.");
  }
  $$(".nav-item").forEach(b=>b.addEventListener("click",()=>setPage(b.dataset.page)));
  $$("[data-page]").forEach(b=>b.addEventListener("click",()=>setPage(b.dataset.page)));
  $$("[data-action='new-project']").forEach(b=>b.addEventListener("click",openProjectDialog));
  $("#newProjectBtn").addEventListener("click",openProjectDialog);
  $("#createProject").addEventListener("click",e=>{
    e.preventDefault();
    const name=$("#projectName").value.trim(); if(!name){notify("Enter a project name.");return;}
    if(data.projects.length>=3){notify("Free demo limit: 3 projects.");$("#projectDialog").close();return;}
    const p={id:"p"+Date.now(),name,type:$("#projectType").value,description:$("#projectDescription").value.trim(),updated:"Just now"};
    data.projects.unshift(p);save();$("#projectDialog").close();renderProjects();setPage("projects");notify("Project created in this browser.");
  });
  $("#projectSearch").addEventListener("input",renderProjects);
  $("#allProjects").addEventListener("click",e=>{const b=e.target.closest("[data-project-files]");if(b){setPage("files");notify("Showing the shared file library. Project filter can be added with a backend.");}});
  $("#uploadBtn").addEventListener("click",()=>{
    if(!data.projects.length){notify("Create a project first.");return;}
    $("#fileInput").click();
  });
  $("#fileInput").addEventListener("change",async e=>{
    const f=e.target.files?.[0];if(!f)return;
    if(f.size>200000){notify("Demo import limit is 200 KB.");e.target.value="";return;}
    const ext=f.name.split(".").pop().toLowerCase();
    if(!["lua","luau","txt","json"].includes(ext)){notify("Import a .lua, .luau, .txt, or .json file.");e.target.value="";return;}
    let preview="File imported. Preview unavailable.";
    try{preview=await f.text();}catch{}
    const p=data.projects[0];
    data.files.unshift({id:"f"+Date.now(),name:f.name,projectId:p.id,size:f.size,updated:"Just now",preview:preview.slice(0,8000)});
    save();renderFiles();showFile(data.files[0].id);notify("File imported locally. It was not uploaded to a server.");e.target.value="";
  });
  $("#filesTable").addEventListener("click",e=>{
    const pv=e.target.closest("[data-preview]");if(pv){showFile(pv.dataset.preview);return;}
    const del=e.target.closest("[data-delete-file]");if(del){data.files=data.files.filter(f=>f.id!==del.dataset.deleteFile);if(selectedFile===del.dataset.deleteFile)selectedFile=null;save();renderFiles();notify("File removed from local demo.");}
  });
  $("#newReleaseBtn").addEventListener("click",openReleaseDialog);
  $("#createRelease").addEventListener("click",e=>{
    e.preventDefault();const version=$("#releaseVersion").value.trim();if(!version){notify("Enter a version name.");return;}
    data.releases.unshift({id:"r"+Date.now(),version,projectId:$("#releaseProject").value,notes:$("#releaseNotes").value.trim(),date:"Just now"});
    save();$("#releaseDialog").close();renderReleases();setPage("releases");notify("Release record saved locally.");
  });
  $("#releaseList").addEventListener("click",e=>{const b=e.target.closest("[data-delete-release]");if(b){data.releases=data.releases.filter(r=>r.id!==b.dataset.deleteRelease);save();renderReleases();notify("Release removed.");}});
  $("#exportBtn").addEventListener("click",downloadJson);
  $("#helpBtn").addEventListener("click",()=>$("#helpDialog").showModal());
  $("#mobileMenu").addEventListener("click",()=>$("#sidebar").classList.toggle("open"));
  $("#saveWorkspace").addEventListener("click",()=>{const n=$("#workspaceName").value.trim();if(!n){notify("Workspace name can't be empty.");return;}data.workspace=n;$(".workspace-picker b").textContent=n;save();notify("Workspace name saved locally.");});
  $("#resetBtn").addEventListener("click",()=>{if(confirm("Reset this browser's Ellimor demo data?")){data=structuredClone(starter);save();renderOverview();renderProjects();renderFiles();renderReleases();$("#workspaceName").value=data.workspace;$(".workspace-picker b").textContent=data.workspace;notify("Demo data reset.");}});
  $("#creatorBtn").addEventListener("click",()=>notify("Creator plans are not available in this free demo."));
  $("#studioBtn").addEventListener("click",()=>notify("Studio plans are not available in this free demo."));
  renderOverview();renderProjects();renderFiles();renderReleases();
})();