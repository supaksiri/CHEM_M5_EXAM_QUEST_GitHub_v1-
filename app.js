/* PHYSICAL CHEM LIVE — PSW M.5 */
const $ = (s,el=document)=>el.querySelector(s);
const $$ = (s,el=document)=>[...el.querySelectorAll(s)];
const app=$('#app'), badge=$('#connectionBadge');
const avatars=['🧪','⚛️','🔬','🧬','🚀','🌟','🧲','💎','🔥','🌈'];
const letters=['ก','ข','ค','ง'];
const iconMap={molecule:'⚛️',flame:'🔥',doublebond:'C═C',bonds:'C—C',polymer:'⛓️',pipe:'🧱',rubber:'⭕',fiber:'🧵',protein:'🧬',acid:'🧪 H⁺',base:'🧪 OH⁻',aminoacid:'H₂N—CH—COOH',vitamin:'🍊',dissolve:'💧',hydrogenbond:'O—H···O',oh:'—OH',network:'🕸️',chains:'⛓️',melamine:'🍽️',bag:'🛍️',reuse:'♻️',recycle:'♻️',basket:'🧺',states:'(s) (l) (g) (aq)',energy:'⚡ ΔH',equation:'2H₂ + O₂ → 2H₂O',rate:'⏱️',particles:'● ● ● ●',activation:'Ea ↘',bubbles:'🫧',fridge:'❄️',surface:'◼︎ → ▪︎▪︎▪︎',temperature:'🌡️',electron:'e⁻',transfer:'Mg → Mg²⁺ + 2e⁻',halflife:'½ → ¼ → ⅛',tracer:'🏥',shield:'🛡️',bromine:'Br₂ → ใส',monomer:'nM → (M)ₙ',litmus:'🔴 → 🔵',solubility:'💧 + —OH',thermoplastic:'♨️',balance:'__Al + __O₂ → __Al₂O₃',testtube:'🧪 → 🟣'};
let user={uid:sessionStorage.pclUid||crypto.randomUUID(),name:sessionStorage.pclName||'',avatar:sessionStorage.pclAvatar||avatars[Math.floor(Math.random()*avatars.length)]};
sessionStorage.pclUid=user.uid;
let mode=window.DEMO_MODE?'demo':'firebase', roomCode='', room=null, unwatch=null, ticker=null, hostGuard=false, practice=null;

function toast(msg){const t=$('#toast');t.textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2300)}
function shuffle(a){return [...a].sort(()=>Math.random()-.5)}
function esc(s=''){return String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
function code(){return Math.random().toString(36).slice(2,8).toUpperCase()}
function selectBalanced(count){
  const groups={}; QUESTION_BANK.forEach(q=>(groups[q.topic]??=[]).push(q)); Object.values(groups).forEach(g=>g.sort(()=>Math.random()-.5));
  const out=[], keys=shuffle(Object.keys(groups)); let i=0;
  while(out.length<count){const k=keys[i++%keys.length];if(groups[k].length)out.push(groups[k].pop());if(!Object.values(groups).some(x=>x.length))break}
  return out.map(q=>q.id);
}
function qById(id){return QUESTION_BANK.find(q=>q.id===Number(id))}
function visual(q){return `<div class="visual"><div class="${String(iconMap[q.visual]).length>5?'formula':'big'}">${iconMap[q.visual]||'⚗️'}</div></div>`}
function ranking(players={}){return Object.values(players).sort((a,b)=>(b.score||0)-(a.score||0)||(a.totalTime||0)-(b.totalTime||0))}
function rankHtml(players,limit=10){return ranking(players).slice(0,limit).map((p,i)=>`<div class="rank-row ${p.uid===user.uid?'me':''}"><b>${i+1}</b><span>${esc(p.avatar)} ${esc(p.name)}</span><b>${p.score||0}</b></div>`).join('')||'<div class="empty">ยังไม่มีผู้เล่น</div>'}

const local={
  key:c=>`pcl_room_${c}`,
  get(c){try{return JSON.parse(localStorage.getItem(this.key(c)))}catch{return null}},
  set(c,v){localStorage.setItem(this.key(c),JSON.stringify(v));window.dispatchEvent(new CustomEvent('pcl-local',{detail:c}))},
  watch(c,cb){const fn=e=>{if((e.key===this.key(c))||e.detail===c)cb(this.get(c))};addEventListener('storage',fn);addEventListener('pcl-local',fn);cb(this.get(c));return()=>{removeEventListener('storage',fn);removeEventListener('pcl-local',fn)}}
};
const data={
  async init(){
    if(mode==='firebase')try{firebase.initializeApp(FIREBASE_CONFIG);await firebase.auth().signInAnonymously();user.uid=firebase.auth().currentUser.uid;badge.textContent='● Firebase LIVE';badge.style.color='var(--mint)'}catch(e){console.error(e);mode='demo';badge.textContent='โหมดสาธิต';toast('Firebase ยังไม่พร้อม—เปิดโหมดสาธิตแทน')}
  },
  async get(c){return mode==='demo'?local.get(c):(await firebase.database().ref(`rooms/${c}`).once('value')).val()},
  async set(c,v){return mode==='demo'?local.set(c,v):firebase.database().ref(`rooms/${c}`).set(v)},
  async patch(c,p){if(mode==='demo'){const r=local.get(c)||{};Object.entries(p).forEach(([path,val])=>{const ks=path.split('/');let x=r;ks.slice(0,-1).forEach(k=>x=x[k]??={});x[ks.at(-1)]=val});local.set(c,r);return}return firebase.database().ref(`rooms/${c}`).update(p)},
  watch(c,cb){return mode==='demo'?local.watch(c,cb):(()=>{const ref=firebase.database().ref(`rooms/${c}`),fn=s=>cb(s.val());ref.on('value',fn);return()=>ref.off('value',fn)})()}
};

function home(){
  cleanup(); location.hash='';
  app.innerHTML=`<section class="hero"><div class="eyebrow">โรงเรียนโพธิ์ศรีสว่างวิทยา • ว32107</div><h1>PHYSICAL CHEM <span>LIVE BATTLE</span></h1><p>สนามแข่งขันวิทยาศาสตร์กายภาพ ม.5 ตอบพร้อมกันทั้งห้อง พร้อมคำใบ้ภาพและอันดับสด</p></section>
  <section class="grid three">
    <button class="card role-card" data-go="host"><span class="icon">🖥️</span><h2>ครูเปิดห้อง</h2><p>สร้าง PIN/QR ควบคุมเกมและดูผลทั้งห้อง</p><span class="btn">Teacher Host</span></button>
    <button class="card role-card" data-go="join"><span class="icon">📱</span><h2>นักเรียนเข้าร่วม</h2><p>ใส่รหัสห้อง ชื่อ และตอบผ่านมือถือ</p><span class="btn">Join Live</span></button>
    <button class="card role-card" data-go="practice"><span class="icon">🎯</span><h2>ฝึกก่อนแข่ง</h2><p>สุ่ม 20 ข้อ มีคำใบ้และเฉลยทันที</p><span class="btn">Practice Quest</span></button>
  </section>`;
  $$('[data-go]').forEach(b=>b.onclick=()=>({host:hostSetup,join:joinSetup,practice:startPractice}[b.dataset.go])());
}

function hostSetup(){
  app.innerHTML=`<div class="card" style="max-width:700px;margin:auto"><div class="title-row"><h1>สร้างห้องแข่งขัน</h1><span>🧑‍🏫</span></div>
    <div class="grid two"><div class="field"><label>จำนวนข้อแข่งขัน</label><select id="qCount"><option>10</option><option selected>20</option><option>30</option><option>40</option><option>50</option></select></div><div class="field"><label>เวลาต่อข้อ</label><select id="qTime"><option value="15">15 วินาที</option><option value="20" selected>20 วินาที</option><option value="30">30 วินาที</option><option value="45">45 วินาที</option></select></div></div>
    <div class="field"><label>เวลาหน้าเฉลยและอันดับ</label><select id="revealTime"><option value="4">4 วินาที</option><option value="6" selected>6 วินาที</option><option value="8">8 วินาที</option></select></div>
    <label class="player-chip"><input id="autoNext" type="checkbox" checked> เดินเกมอัตโนมัติ: ปิดรับ → เฉลย → อันดับ → ข้อถัดไป</label>
    <p class="hint">ระบบสุ่มแบบกระจายหัวข้อ เพื่อให้ข้อสอบครอบคลุมเนื้อหา ไม่กระจุกอยู่บทเดียว</p><button id="createRoom" class="btn">สร้างรหัสห้อง</button></div>`;
  $('#createRoom').onclick=createRoom;
}
async function createRoom(){
  roomCode=code();const ids=selectBalanced(+$(`#qCount`).value);
  const payload={code:roomCode,status:'lobby',hostUid:user.uid,createdAt:Date.now(),settings:{seconds:+$('#qTime').value,revealSeconds:+$('#revealTime').value,autoNext:$('#autoNext').checked},quiz:ids,currentIndex:-1,phase:'lobby',players:{},answers:{}};
  await data.set(roomCode,payload);location.hash=`host=${roomCode}`;watchRoom('host');
}
function joinSetup(prefill=''){
  app.innerHTML=`<div class="card" style="max-width:560px;margin:auto"><div class="title-row"><h1>เข้าร่วมห้อง</h1><span>📱</span></div>
    <div class="field"><label>รหัสห้อง 6 ตัว</label><input id="joinCode" class="input" maxlength="6" value="${esc(prefill)}" placeholder="เช่น AB12CD" autocapitalize="characters"></div>
    <div class="field"><label>ชื่อ–นามสกุล หรือชื่อเล่น</label><input id="playerName" class="input" maxlength="28" value="${esc(user.name)}" placeholder="ชื่อของนักเรียน"></div>
    <div class="field"><label>เลือกอวตาร</label><div class="actions" id="avatarList">${avatars.map((x,i)=>`<button class="tab ${x===user.avatar?'active':''}" data-av="${x}">${x}</button>`).join('')}</div></div>
    <button id="joinBtn" class="btn">เข้าสู่ Waiting Room</button></div>`;
  $$('#avatarList button').forEach(b=>b.onclick=()=>{$$('#avatarList button').forEach(x=>x.classList.remove('active'));b.classList.add('active');user.avatar=b.dataset.av});
  $('#joinBtn').onclick=joinRoom;
}
async function joinRoom(){
  const c=$('#joinCode').value.trim().toUpperCase(),name=$('#playerName').value.trim();if(c.length!==6||!name)return toast('กรอกรหัสห้องและชื่อให้ครบ');
  const r=await data.get(c);if(!r)return toast('ไม่พบห้องนี้');if(r.status==='finished')return toast('ห้องนี้จบการแข่งขันแล้ว');
  user.name=name;sessionStorage.pclName=name;sessionStorage.pclAvatar=user.avatar;roomCode=c;
  await data.patch(c,{[`players/${user.uid}`]:{uid:user.uid,name,avatar:user.avatar,score:0,streak:0,totalTime:0,joinedAt:Date.now()}});location.hash=`play=${c}`;watchRoom('player');
}
function watchRoom(role){cleanup(false);unwatch=data.watch(roomCode,r=>{if(!r){toast('ห้องถูกปิดแล้ว');return home()}room=r;renderRoom(role);if(role==='host')hostAutomation()})}
function renderRoom(role){
  if(room.phase==='lobby')return role==='host'?renderHostLobby():renderPlayerLobby();
  if(room.phase==='finished')return renderFinish(role);
  return role==='host'?renderHostStage():renderPlayerStage();
}
function renderHostLobby(){
  app.innerHTML=`<div class="title-row"><h1>Waiting Room</h1><button class="btn secondary" id="copyLink">คัดลอกลิงก์</button></div><div class="grid lobby">
  <section class="card"><div class="room-code">${roomCode}</div><div id="qr" class="qrbox"></div><p style="text-align:center;color:var(--muted)">สแกนแล้วใส่ชื่อเพื่อเข้าร่วม</p><button id="startLive" class="btn" style="width:100%" ${Object.keys(room.players||{}).length?'':'disabled'}>เริ่มแข่งขัน</button></section>
  <section class="card"><h2>ผู้เล่น <span>${Object.keys(room.players||{}).length}</span> คน</h2><div class="players">${Object.values(room.players||{}).map(p=>`<div class="player-chip"><span class="avatar">${p.avatar}</span>${esc(p.name)}</div>`).join('')||'<div class="empty">กำลังรอนักเรียน…</div>'}</div></section></div>`;
  setTimeout(()=>{const el=$('#qr');if(el&&window.QRCode)new QRCode(el,{text:joinUrl(),width:184,height:184})},0);
  $('#startLive').onclick=()=>startQuestion(0);$('#copyLink').onclick=async()=>{await navigator.clipboard.writeText(joinUrl());toast('คัดลอกลิงก์แล้ว')};
}
function renderPlayerLobby(){app.innerHTML=`<div class="card" style="max-width:620px;margin:auto;text-align:center"><div class="spinner"></div><h1>เข้าห้องแล้ว!</h1><div class="score-big">${user.avatar}</div><h2>${esc(user.name)}</h2><p>รหัสห้อง <b>${roomCode}</b></p><p class="hint">รอคุณครูเริ่มการแข่งขัน หน้าจอจะเปลี่ยนอัตโนมัติ</p></div>`}
function joinUrl(){return `${location.origin}${location.pathname}#join=${roomCode}`}
async function startQuestion(index){
  if(index>=room.quiz.length)return data.patch(roomCode,{phase:'finished',status:'finished',finishedAt:Date.now()});
  await data.patch(roomCode,{currentIndex:index,phase:'question',startedAt:Date.now(),endsAt:Date.now()+room.settings.seconds*1000});
}
function currentQ(){return qById(room.quiz[room.currentIndex])}
function answeredCount(){return Object.keys((room.answers||{})[room.currentIndex]||{}).length}
function renderHostStage(){
  const q=currentQ(),sec=Math.max(0,Math.ceil((room.endsAt-Date.now())/1000)),reveal=room.phase==='reveal';
  app.innerHTML=`<div class="stage"><section class="card question-card"><div class="qmeta"><b>ข้อ ${room.currentIndex+1}/${room.quiz.length} • ${esc(q.topic)}</b><div id="timer" class="timer">${reveal?'✓':sec}</div></div>${visual(q)}<h2>${esc(q.q)}</h2><div class="hint">💡 ${esc(q.hint)}</div><div class="answers">${q.choices.map((c,i)=>`<div class="answer ${reveal?(i===q.answer?'correct':''):''}"><span class="letter">${letters[i]}</span><span>${esc(c)}</span></div>`).join('')}</div>${reveal?`<div class="feedback correct"><b>เฉลย ${letters[q.answer]}</b> — ${esc(q.explain)}</div>`:''}</section>
  <aside class="card side"><h3>ตอบแล้ว ${answeredCount()}/${Object.keys(room.players||{}).length}</h3><div class="bar"><i style="width:${answeredCount()/Math.max(1,Object.keys(room.players||{}).length)*100}%"></i></div><h3>อันดับสด</h3>${rankHtml(room.players)}<div class="actions" style="margin-top:18px"><button id="pauseBtn" class="btn secondary">${room.phase==='paused'?'เล่นต่อ':'พัก'}</button><button id="nextBtn" class="btn secondary">ข้อต่อไป</button><button id="endBtn" class="btn danger">จบเกม</button></div></aside></div>`;
  $('#nextBtn').onclick=()=>startQuestion(room.currentIndex+1);$('#endBtn').onclick=()=>data.patch(roomCode,{phase:'finished',status:'finished'});$('#pauseBtn').onclick=togglePause;
  startTicker(()=>renderHostStage());
}
function togglePause(){if(room.phase==='paused')data.patch(roomCode,{phase:'question',endsAt:Date.now()+(room.pauseRemaining||10)*1000});else data.patch(roomCode,{phase:'paused',pauseRemaining:Math.max(1,Math.ceil((room.endsAt-Date.now())/1000))})}
function renderPlayerStage(){
  const q=currentQ(),answers=(room.answers||{})[room.currentIndex]||{},mine=answers[user.uid],reveal=room.phase==='reveal',sec=Math.max(0,Math.ceil((room.endsAt-Date.now())/1000));
  if(room.phase==='paused')return app.innerHTML=`<div class="card" style="max-width:600px;margin:auto;text-align:center"><h1>⏸️ หยุดชั่วคราว</h1><p>รอคุณครูเปิดเกมต่อ</p></div>`;
  app.innerHTML=`<section class="card question-card" style="max-width:760px;margin:auto"><div class="qmeta"><b>ข้อ ${room.currentIndex+1}/${room.quiz.length}</b><div id="timer" class="timer">${reveal?'✓':sec}</div></div>${visual(q)}<h2>${esc(q.q)}</h2><div class="answers">${q.choices.map((c,i)=>`<button class="answer ${mine&&mine.choice===i?'selected':''} ${reveal?(i===q.answer?'correct':(mine&&mine.choice===i?'wrong':'')):''}" data-choice="${i}" ${(mine||reveal)?'disabled':''}><span class="letter">${letters[i]}</span><span>${esc(c)}</span></button>`).join('')}</div>
  ${mine&&!reveal?'<div class="feedback">🔒 ส่งคำตอบแล้ว รอผู้เล่นคนอื่น…</div>':''}${reveal?`<div class="feedback ${mine&&mine.correct?'correct':'wrong'}"><h2>${mine&&mine.correct?'✅ ถูกต้อง!':'❌ ยังไม่ถูก'}</h2><p>${esc(q.explain)}</p><b>คะแนนสะสม ${(room.players?.[user.uid]?.score)||0}</b></div>`:''}</section>`;
  $$('.answer[data-choice]').forEach(b=>b.onclick=()=>submitAnswer(+b.dataset.choice));startTicker(()=>renderPlayerStage());
}
async function submitAnswer(choice){
  const q=currentQ(),elapsed=Math.max(0,Date.now()-room.startedAt),remain=Math.max(0,room.endsAt-Date.now());if(remain<=0)return;
  const correct=choice===q.answer,base=correct?600:0,speed=correct?Math.round(400*(remain/(room.settings.seconds*1000))):0,p=room.players[user.uid],streak=correct?(p.streak||0)+1:0,bonus=correct&&streak>=3?100:0;
  await data.patch(roomCode,{[`answers/${room.currentIndex}/${user.uid}`]:{choice,correct,elapsed,points:base+speed+bonus},[`players/${user.uid}/score`]:(p.score||0)+base+speed+bonus,[`players/${user.uid}/streak`]:streak,[`players/${user.uid}/totalTime`]:(p.totalTime||0)+elapsed});
}
function hostAutomation(){
  if(hostGuard||!room)return;const now=Date.now();
  if(room.phase==='question'&&now>=room.endsAt){hostGuard=true;data.patch(roomCode,{phase:'reveal',revealEndsAt:now+room.settings.revealSeconds*1000}).finally(()=>hostGuard=false)}
  else if(room.phase==='reveal'&&room.settings.autoNext&&now>=room.revealEndsAt){hostGuard=true;startQuestion(room.currentIndex+1).finally(()=>hostGuard=false)}
}
function renderFinish(role){
  const ranks=ranking(room.players||{}),top=ranks.slice(0,3),order=[top[1],top[0],top[2]],cls=['p2','p1','p3'];
  app.innerHTML=`<section class="card" style="max-width:900px;margin:auto;text-align:center"><div class="eyebrow">MISSION COMPLETE</div><h1>🏆 จบการแข่งขัน</h1><div class="podium">${order.map((p,i)=>p?`<div class="${cls[i]}"><div class="score-big">${p.avatar}</div><b>${esc(p.name)}</b><p>${p.score||0} คะแนน</p></div>`:'').join('')}</div><div class="actions" style="justify-content:center"><button class="btn" onclick="window.print()">พิมพ์/บันทึก PDF</button>${role==='host'?'<button id="rematch" class="btn secondary">แข่งใหม่</button>':''}<button class="btn secondary" data-action="home">หน้าหลัก</button></div><div class="card" style="margin-top:20px;text-align:left"><h3>อันดับทั้งหมด</h3>${rankHtml(room.players,99)}</div></section>`;
  $('[data-action="home"]').onclick=home;if($('#rematch'))$('#rematch').onclick=()=>{data.patch(roomCode,{status:'lobby',phase:'lobby',currentIndex:-1,quiz:selectBalanced(room.quiz.length),answers:{},...Object.fromEntries(Object.keys(room.players||{}).map(uid=>[`players/${uid}/score`,0]))});};
}

function startPractice(){
  practice={ids:selectBalanced(20),i:0,score:0,selected:null};renderPractice();
}
function renderPractice(){
  if(practice.i>=practice.ids.length)return renderPracticeFinish();const q=qById(practice.ids[practice.i]),done=practice.selected!==null;
  app.innerHTML=`<section class="card question-card" style="max-width:850px;margin:auto"><div class="qmeta"><b>Practice Quest • ${practice.i+1}/20</b><b>${practice.score} คะแนน</b></div><div class="progress"><i style="width:${practice.i/20*100}%"></i></div>${visual(q)}<h2>${esc(q.q)}</h2><button id="hintBtn" class="btn secondary">💡 เปิดคำใบ้</button><div id="practiceHint"></div><div class="answers" style="margin-top:14px">${q.choices.map((c,i)=>`<button class="answer ${done?(i===q.answer?'correct':(practice.selected===i?'wrong':'')):''}" data-pick="${i}" ${done?'disabled':''}><span class="letter">${letters[i]}</span>${esc(c)}</button>`).join('')}</div>${done?`<div class="feedback ${practice.selected===q.answer?'correct':'wrong'}">${practice.selected===q.answer?'✅ ถูกต้อง':'❌ คำตอบที่ถูกคือ '+letters[q.answer]}<br>${esc(q.explain)}</div><button id="pnext" class="btn">ข้อต่อไป</button>`:''}</section>`;
  $('#hintBtn').onclick=()=>$('#practiceHint').innerHTML=`<div class="hint">${esc(q.hint)}</div>`;$$('[data-pick]').forEach(b=>b.onclick=()=>{practice.selected=+b.dataset.pick;if(practice.selected===q.answer)practice.score++;renderPractice()});if($('#pnext'))$('#pnext').onclick=()=>{practice.i++;practice.selected=null;renderPractice()};
}
function renderPracticeFinish(){app.innerHTML=`<section class="card" style="max-width:650px;margin:auto;text-align:center"><h1>🎯 ฝึกครบแล้ว</h1><div class="score-big">${practice.score}/20</div><p>${practice.score>=16?'ยอดเยี่ยม พร้อมลงสนาม!':practice.score>=12?'ทำได้ดี ลองทบทวนคำใบ้อีกครั้ง':'กลับไปทบทวนแต่ละหัวข้อแล้วลองใหม่'}</p><div class="actions" style="justify-content:center"><button class="btn" onclick="window.print()">บันทึกผล PDF</button><button id="again" class="btn secondary">ฝึกอีกครั้ง</button><button data-action="home" class="btn secondary">หน้าหลัก</button></div></section>`;$('#again').onclick=startPractice;$('[data-action="home"]').onclick=home}
function startTicker(fn){clearInterval(ticker);ticker=setInterval(()=>{if(room&&['question','reveal'].includes(room.phase)){hostAutomation();fn()}},500)}
function cleanup(clear=true){clearInterval(ticker);ticker=null;if(unwatch){unwatch();unwatch=null}if(clear){room=null;roomCode=''}}
document.addEventListener('click',e=>{if(e.target.closest('[data-action="home"]'))home()});

(async function boot(){await data.init();const h=location.hash.slice(1);if(h.startsWith('join='))joinSetup(h.split('=')[1]);else if(h.startsWith('host=')){roomCode=h.split('=')[1];watchRoom('host')}else if(h.startsWith('play=')){roomCode=h.split('=')[1];watchRoom('player')}else home()})();
