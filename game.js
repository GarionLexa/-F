let myPlayer = null;
let bots = {};
const playersList = [];
const container = document.getElementById('game-canvas');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0b101b);
scene.fog = new THREE.Fog(0x0b101b, 20, 60);
const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100);
const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: "high-performance" });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
container.appendChild(renderer.domElement);
scene.add(new THREE.HemisphereLight(0x93c5fd, 0x1e293b, 0.8));
const dirLight = new THREE.DirectionalLight(0xffedd5, 0.8);
dirLight.position.set(15, 30, 15);
scene.add(dirLight);
const mats = {
asphalt: new THREE.MeshLambertMaterial({ color: 0x1e293b }),
grass: new THREE.MeshLambertMaterial({ color: 0x14532d }),
wall: new THREE.MeshLambertMaterial({ color: 0xfef3c7 }),
trailer: new THREE.MeshLambertMaterial({ color: 0xf1f5f9 })
};
const colliders = [];
const addCollider = (x, z, w, d) => colliders.push({ x, z, hw: w/2, hd: d/2 });
const checkCollision = (px, pz, radius = 0.4) => {
if (px < -35 || px > 35 || pz < -35 || pz > 35) return true;
for (let c of colliders) {
if (px + radius > c.x - c.hw && px - radius < c.x + c.hw &&
pz + radius > c.z - c.hd && pz - radius < c.z + c.hd) return true;
}
return false;
};
const ground = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), mats.asphalt);
ground.rotation.x = -Math.PI / 2; ground.position.y = 0; scene.add(ground);
const grass = new THREE.Mesh(new THREE.PlaneGeometry(35, 80), mats.grass);
grass.rotation.x = -Math.PI / 2; grass.position.set(20, 0.01, 0); scene.add(grass);
const createTruck = (x, z, colorHex) => {
const group = new THREE.Group();
const trailer = new THREE.Mesh(new THREE.BoxGeometry(4.5, 5, 12), mats.trailer);
trailer.position.set(0, 2.5, -3.5); group.add(trailer);
const cab = new THREE.Mesh(new THREE.BoxGeometry(4.3, 4, 4.5), new THREE.MeshLambertMaterial({ color: colorHex }));
cab.position.set(0, 2, 5); group.add(cab);
group.position.set(x, 0, z); scene.add(group);
addCollider(x, z, 5, 16);
};
createTruck(-10, -2, 0xd97706);
createTruck(-18, 10, 0x2563eb);
const cafe = new THREE.Mesh(new THREE.BoxGeometry(9, 5, 9), mats.wall);
cafe.position.set(18, 2.5, -2); scene.add(cafe);
addCollider(18, -2, 9, 9);
class Avatar3D {
constructor(name, colors, isLocal = false) {
this.name = name;
this.isLocal = isLocal;
this.group = new THREE.Group();
const skin = new THREE.MeshLambertMaterial({ color: 0xffcc99 });
const shirt = new THREE.MeshLambertMaterial({ color: colors.shirt });
const hairMat = new THREE.MeshLambertMaterial({ color: colors.hair });
const pants = new THREE.MeshLambertMaterial({ color: 0x1e3a8a });
this.body = new THREE.Mesh(new THREE.BoxGeometry(1, 1.2, 0.7), shirt);
this.body.position.y = 1.2; this.group.add(this.body);
this.head = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.1, 1.1), skin);
this.head.position.y = 2.2; this.group.add(this.head);
const hair = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.35, 1.2), hairMat);
hair.position.y = 0.6; this.head.add(hair);
this.armL = new THREE.Mesh(new THREE.BoxGeometry(0.3, 1, 0.35), shirt); this.armL.position.set(-0.7, 1.2, 0); this.group.add(this.armL);
this.armR = new THREE.Mesh(new THREE.BoxGeometry(0.3, 1, 0.35), shirt); this.armR.position.set(0.7, 1.2, 0); this.group.add(this.armR);
this.legL = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.9, 0.4), pants); this.legL.position.set(-0.25, 0.45, 0); this.group.add(this.legL);
this.legR = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.9, 0.4), pants); this.legR.position.set(0.25, 0.45, 0); this.group.add(this.legR);
this.ring = new THREE.Mesh(
new THREE.RingGeometry(3, 3.4, 16),
new THREE.MeshBasicMaterial({ color: 0x22c55e, side: THREE.DoubleSide, transparent: true, opacity: 0.8 })
);
this.ring.rotation.x = -Math.PI / 2; this.ring.position.y = 0.05; this.ring.visible = false;
this.group.add(this.ring);
scene.add(this.group);
this.speed = 8;
this.animTime = 0;
this.isMoving = false;
this.uiName = document.createElement('div');
this.uiName.className = 'name-tag'; this.uiName.textContent = name;
document.getElementById('ui-layer').appendChild(this.uiName);
this.bubble = null;
playersList.push(this);
}
setPosition(x, z) { this.group.position.set(x, 0, z); }
speak(text) {
if (this.bubble) this.bubble.remove();
this.bubble = document.createElement('div');
this.bubble.className = 'chat-bubble'; this.bubble.textContent = text;
document.getElementById('ui-layer').appendChild(this.bubble);
setTimeout(() => { if (this.bubble) { this.bubble.remove(); this.bubble = null; } }, 4000);
}
update(delta) {
if (this.isMoving) {
this.animTime += delta * 12;
const walkCycle = Math.sin(this.animTime);
this.legL.position.z = walkCycle * 0.4;
this.legR.position.z = -walkCycle * 0.4;
this.armL.position.z = -walkCycle * 0.4;
this.armR.position.z = walkCycle * 0.4;
} else {
this.legL.position.z = 0; this.legR.position.z = 0;
this.armL.position.z = 0; this.armR.position.z = 0;
}
const vector = new THREE.Vector3();
this.group.getWorldPosition(vector);
vector.y += 2.8;
vector.project(camera);
const hw = window.innerWidth / 2; const hh = window.innerHeight / 2;
const sx = (vector.x * hw) + hw; const sy = -(vector.y * hh) + hh;
if (this.uiName) { this.uiName.style.left = ${sx}px; this.uiName.style.top = ${sy}px; }
if (this.bubble) { this.bubble.style.left = ${sx}px; this.bubble.style.top = ${sy - 15}px; }
}
}
const moveInput = { x: 0, y: 0 };
const keys = { w: false, a: false, s: false, d: false };
let cameraAngle = 0;
window.addEventListener('keydown', (e) => {
if (e.key === 'w' || e.key === 'ArrowUp') keys.w = true;
if (e.key === 's' || e.key === 'ArrowDown') keys.s = true;
if (e.key === 'a' || e.key === 'ArrowLeft') keys.a = true;
if (e.key === 'd' || e.key === 'ArrowRight') keys.d = true;
});
window.addEventListener('keyup', (e) => {
if (e.key === 'w' || e.key === 'ArrowUp') keys.w = false;
if (e.key === 's' || e.key === 'ArrowDown') keys.s = false;
if (e.key === 'a' || e.key === 'ArrowLeft') keys.a = false;
if (e.key === 'd' || e.key === 'ArrowRight') keys.d = false;
});
const setupJoystick = (zoneId, joyId, inputObj, side) => {
const zone = document.getElementById(zoneId);
const base = document.getElementById(joyId);
const knob = base.querySelector('.joystick-knob');
let startX = 0, touchId = null;
zone.addEventListener('pointerdown', (e) => {
if (touchId !== null) return;
touchId = e.pointerId;
base.style.display = 'block';
base.style.left = ${e.clientX}px; base.style.top = ${e.clientY}px;
knob.style.left = '50%'; knob.style.top = '50%';
startX = e.clientX;
});
zone.addEventListener('pointermove', (e) => {
if (touchId !== e.pointerId) return;
if (side === 'right') {
let dx = e.clientX - startX;
cameraAngle -= dx * 0.005;
startX = e.clientX;
return;
}
const rect = base.getBoundingClientRect();
const cx = rect.left + rect.width/2; const cy = rect.top + rect.height/2;
let dx = e.clientX - cx; let dy = e.clientY - cy;
const dist = Math.min(Math.sqrt(dxdx + dydy), 30);
const angle = Math.atan2(dy, dx);
knob.style.left = calc(50% + ${Math.cos(angle)*dist}px);
knob.style.top = calc(50% + ${Math.sin(angle)*dist}px);
inputObj.x = Math.cos(angle) * (dist/30);
inputObj.y = Math.sin(angle) * (dist/30);
});
const endTouch = (e) => {
if (touchId === e.pointerId) {
touchId = null; base.style.display = 'none';
inputObj.x = 0; inputObj.y = 0;
}
};
zone.addEventListener('pointerup', endTouch);
zone.addEventListener('pointercancel', endTouch);
};
setupJoystick('zone-left', 'joy-left', moveInput, 'left');
setupJoystick('zone-right', 'joy-right', {}, 'right');
const clock = new THREE.Clock();
function animate() {
requestAnimationFrame(animate);
const delta = Math.min(clock.getDelta(), 0.1);
if (myPlayer) {
let mx = moveInput.x, my = moveInput.y;
if (keys.w) my = -1;
if (keys.s) my = 1;
if (keys.a) mx = -1;
if (keys.d) mx = 1;
myPlayer.isMoving = (Math.abs(mx) > 0.05 || Math.abs(my) > 0.05);
if (myPlayer.isMoving) {
const moveDir = new THREE.Vector3(mx, 0, my);
moveDir.applyAxisAngle(new THREE.Vector3(0, 1, 0), cameraAngle);
const dx = moveDir.x * myPlayer.speed * delta;
const dz = moveDir.z * myPlayer.speed * delta;
const pos = myPlayer.group.position;
let nextX = pos.x + dx, nextZ = pos.z + dz;
if (!checkCollision(nextX, pos.z)) pos.x = nextX;
if (!checkCollision(pos.x, nextZ)) pos.z = nextZ;
pos.y = 0;
const targetAngle = Math.atan2(moveDir.x, moveDir.z);
let diff = targetAngle - myPlayer.group.rotation.y;
while (diff < -Math.PI) diff += Math.PI * 2;
while (diff > Math.PI) diff -= Math.PI * 2;
myPlayer.group.rotation.y += diff * 0.2;
}
const idealOffset = new THREE.Vector3(Math.sin(cameraAngle) * 8, 5, Math.cos(cameraAngle) * 8);
camera.position.copy(myPlayer.group.position).add(idealOffset);
camera.lookAt(myPlayer.group.position.clone().add(new THREE.Vector3(0, 1.2, 0)));
let nearSomeone = false;
for (let p of playersList) {
if (p !== myPlayer && myPlayer.group.position.distanceTo(p.group.position) < 6) {
nearSomeone = true; break;
}
}
myPlayer.ring.visible = nearSomeone;
}
playersList.forEach(p => p.update(delta));
renderer.render(scene, camera);
}
animate();
const handleSendMessage = () => {
const input = document.getElementById('chatInput');
const text = input.value.trim();
if (text && myPlayer) {
myPlayer.speak(text);
input.value = '';
setTimeout(() => {
const activeBots = Object.values(bots);
const randomBot = activeBots[Math.floor(Math.random() * activeBots.length)];
if (randomBot) {
const replies = ["Шершавенькой!", "Норм дорога, лети смело.", "Через километр стоянка нормальная.", "Принял, удачи в рейсе!"];
randomBot.speak(replies[Math.floor(Math.random() * replies.length)]);
}
}, 800);
}
};
document.getElementById('send-btn').addEventListener('click', handleSendMessage);
document.getElementById('chatInput').addEventListener('keydown', (e) => {
if (e.key === 'Enter') handleSendMessage();
});
const micBtn = document.getElementById('mic-btn');
let isListening = false;
if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = new SpeechRecognition();
recognition.lang = 'ru-RU';
recognition.interimResults = false;
recognition.maxAlternatives = 1;
micBtn.addEventListener('click', () => {
if (!isListening) {
try { recognition.start(); } catch(e) {}
} else {
recognition.stop();
}
});
recognition.onstart = () => {
isListening = true;
micBtn.classList.remove('text-red-500', 'border-red-500/30');
micBtn.classList.add('text-emerald-400', 'border-emerald-500', 'bg-emerald-500/20', 'animate-pulse');
document.getElementById('chatInput').placeholder = "Говорите в рацию...";
};
recognition.onresult = (event) => {
const speechToText = event.results[0][0].transcript;
document.getElementById('chatInput').value = speechToText;
handleSendMessage();
};
recognition.onerror = () => { stopMicUI(); };
recognition.onend = () => { stopMicUI(); };
}
function stopMicUI() {
isListening = false;
micBtn.classList.remove('text-emerald-400', 'border-emerald-500', 'bg-emerald-500/20', 'animate-pulse');
micBtn.classList.add('text-red-500', 'border-red-500/30');
document.getElementById('chatInput').placeholder = "Сказать в эфир...";
}
document.getElementById('startGameBtn').addEventListener('click', () => {
const name = document.getElementById('custName').value || "Водитель";
const colors = { shirt: document.getElementById('custShirtColor').value, hair: document.getElementById('custHairColor').value };
document.getElementById('login-screen').style.display = 'none';
document.getElementById('game-ui').style.display = 'block';
myPlayer = new Avatar3D(name, colors, true);
myPlayer.setPosition(10, 2);
bots['b1'] = new Avatar3D('Саныч', {shirt:'#ef4444', hair:'#9ca3af'}); bots['b1'].setPosition(14, -2);
bots['b2'] = new Avatar3D('Мария', {shirt:'#10b981', hair:'#b91c1c'}); bots['b2'].setPosition(12, 2);
bots['b3'] = newAvatar3D('Леха_V8', {shirt:'#3b82f6', hair:'#f59e0b'}); bots['b3'].setPosition(2, -6);
});
document.getElementById('exit-btn').addEventListener('click', () => {
document.getElementById('login-screen').style.display = 'flex';
document.getElementById('game-ui').style.display = 'none';
if (myPlayer) { scene.remove(myPlayer.group); myPlayer.uiName.remove(); if(myPlayer.bubble) myPlayer.bubble.remove(); }
for(let id in bots) { scene.remove(bots[id].group); bots[id].uiName.remove(); if(bots[id].bubble) bots[id].bubble.remove(); }
myPlayer = null; bots = {}; playersList.length = 0;
});
window.addons = {}; // placeholder
window.addEventListener('resize', () => {
setTimeout(() => {
camera.aspect = window.innerWidth / window.innerHeight;
camera.updateProjectionMatrix();
renderer.setSize(window.innerWidth, window.innerHeight);
}, 250);
});
