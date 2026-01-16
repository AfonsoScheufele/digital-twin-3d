import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import * as CANNON from 'cannon-es';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0a0a);
scene.fog = new THREE.FogExp2(0x0a0a0a, 0.001);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(20, 15, 25);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;
document.getElementById('container').appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.minDistance = 10;
controls.maxDistance = 100;
controls.maxPolarAngle = Math.PI / 2.1;

const world = new CANNON.World({
    gravity: new CANNON.Vec3(0, -9.8, 0),
});
world.broadphase = new CANNON.NaiveBroadphase();
world.solver.iterations = 10;

const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(20, 30, 10);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = 2048;
directionalLight.shadow.mapSize.height = 2048;
directionalLight.shadow.camera.near = 0.5;
directionalLight.shadow.camera.far = 100;
directionalLight.shadow.camera.left = -30;
directionalLight.shadow.camera.right = 30;
directionalLight.shadow.camera.top = 30;
directionalLight.shadow.camera.bottom = -30;
scene.add(directionalLight);

const pointLight1 = new THREE.PointLight(0x64b5f6, 1, 50);
pointLight1.position.set(-15, 10, -15);
scene.add(pointLight1);

const pointLight2 = new THREE.PointLight(0xff6b6b, 1, 50);
pointLight2.position.set(15, 10, 15);
scene.add(pointLight2);

const gridHelper = new THREE.GridHelper(50, 50, 0x444444, 0x222222);
scene.add(gridHelper);

const planeGeometry = new THREE.PlaneGeometry(100, 100);
const planeMaterial = new THREE.MeshStandardMaterial({ color: 0x1a1a2e, roughness: 0.8, metalness: 0.2 });
const plane = new THREE.Mesh(planeGeometry, planeMaterial);
plane.rotation.x = -Math.PI / 2;
plane.position.y = 0;
plane.receiveShadow = true;
scene.add(plane);

const groundShape = new CANNON.Plane();
const groundBody = new CANNON.Body({ mass: 0 });
groundBody.addShape(groundShape);
groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
world.addBody(groundBody);

const meshes = [];
const bodies = [];
const clickableObjects = [];
let animationSpeed = 1;
let selectedObject = null;
let wireframeMode = false;
let coolingSystem = 0;

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

function createFactoryStructure() {
    const factoryGroup = new THREE.Group();

    const baseGeometry = new THREE.BoxGeometry(12, 1, 12);
    const baseMaterial = new THREE.MeshStandardMaterial({ color: 0x4a5568, roughness: 0.7, metalness: 0.3 });
    const base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.y = 0.5;
    base.castShadow = true;
    base.receiveShadow = true;
    base.userData.type = 'factory';
    base.userData.name = 'Factory Base';
    base.userData.metrics = { temperature: 25, pressure: 1013, power: 450 };
    factoryGroup.add(base);
    clickableObjects.push(base);

    const columnGeometry = new THREE.CylinderGeometry(0.3, 0.3, 8, 16);
    const columnMaterial = new THREE.MeshStandardMaterial({ color: 0x718096, roughness: 0.5, metalness: 0.5 });
    const positions = [
        [-5, 4, -5], [5, 4, -5], [-5, 4, 5], [5, 4, 5]
    ];
    positions.forEach((pos, idx) => {
        const column = new THREE.Mesh(columnGeometry, columnMaterial);
        column.position.set(pos[0], pos[1], pos[2]);
        column.castShadow = true;
        column.userData.type = 'column';
        column.userData.name = `Column ${idx + 1}`;
        factoryGroup.add(column);
    });

    const roofGeometry = new THREE.BoxGeometry(12, 0.5, 12);
    const roofMaterial = new THREE.MeshStandardMaterial({ color: 0x2d3748, roughness: 0.8 });
    const roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.y = 8.25;
    roof.castShadow = true;
    roof.receiveShadow = true;
    factoryGroup.add(roof);

    factoryGroup.position.set(0, 0, 0);
    scene.add(factoryGroup);
    meshes.push(factoryGroup);

    return factoryGroup;
}

function createRotatingMachine(position, id) {
    const machineGroup = new THREE.Group();

    const baseGeom = new THREE.BoxGeometry(2, 0.3, 2);
    const baseMat = new THREE.MeshStandardMaterial({ color: 0x4299e1, roughness: 0.4, metalness: 0.7 });
    const machineBase = new THREE.Mesh(baseGeom, baseMat);
    machineBase.position.y = 0.15;
    machineBase.castShadow = true;
    machineBase.userData.type = 'machine';
    machineBase.userData.name = `Machine ${id}`;
    machineBase.userData.metrics = { 
        temperature: 28 + Math.random() * 5, 
        rpm: 1200 + Math.random() * 300,
        power: 25 + Math.random() * 15 
    };
    machineGroup.add(machineBase);
    clickableObjects.push(machineBase);

    const rotorGeom = new THREE.TorusGeometry(0.8, 0.15, 16, 32);
    const rotorMat = new THREE.MeshStandardMaterial({ color: 0xffd700, roughness: 0.3, metalness: 0.9 });
    const rotor = new THREE.Mesh(rotorGeom, rotorMat);
    rotor.position.y = 1;
    rotor.castShadow = true;
    machineGroup.add(rotor);

    machineGroup.position.set(position.x, position.y, position.z);
    scene.add(machineGroup);
    meshes.push(machineGroup);

    return { group: machineGroup, rotor: rotor, base: machineBase };
}

function createConveyorBelt(position, rotation) {
    const beltGroup = new THREE.Group();

    const baseGeom = new THREE.BoxGeometry(8, 0.2, 1.5);
    const baseMat = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.8 });
    const beltBase = new THREE.Mesh(baseGeom, baseMat);
    beltBase.position.y = 0.1;
    beltBase.castShadow = true;
    beltBase.receiveShadow = true;
    beltGroup.add(beltBase);

    const beltGeom = new THREE.BoxGeometry(8, 0.05, 1.5);
    const beltMat = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.9 });
    const belt = new THREE.Mesh(beltGeom, beltMat);
    belt.position.y = 0.225;
    belt.userData.type = 'conveyor';
    belt.userData.name = 'Conveyor Belt';
    belt.userData.speed = 0.5;
    beltGroup.add(belt);
    clickableObjects.push(belt);

    const wheelPositions = [
        [-3.5, 0.35, 0],
        [3.5, 0.35, 0]
    ];
    const wheelGeom = new THREE.CylinderGeometry(0.2, 0.2, 1.6, 16);
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.7 });
    wheelPositions.forEach(pos => {
        const wheel = new THREE.Mesh(wheelGeom, wheelMat);
        wheel.position.set(pos[0], pos[1], pos[2]);
        wheel.rotation.z = Math.PI / 2;
        wheel.castShadow = true;
        beltGroup.add(wheel);
    });

    beltGroup.position.set(position.x, position.y, position.z);
    beltGroup.rotation.y = rotation;
    scene.add(beltGroup);
    meshes.push(beltGroup);

    return { group: beltGroup, belt: belt };
}

function createPipeline(startPos, endPos) {
    const pipeGroup = new THREE.Group();
    const distance = startPos.distanceTo(endPos);
    const midPoint = new THREE.Vector3().addVectors(startPos, endPos).multiplyScalar(0.5);
    midPoint.y += 3;

    const pipeGeom = new THREE.TubeGeometry(
        new THREE.QuadraticBezierCurve3(startPos, midPoint, endPos),
        32,
        0.3,
        16,
        false
    );
    const pipeMat = new THREE.MeshStandardMaterial({ color: 0x4a90e2, roughness: 0.3, metalness: 0.8 });
    const pipe = new THREE.Mesh(pipeGeom, pipeMat);
    pipe.castShadow = true;
    pipe.userData.type = 'pipeline';
    pipe.userData.name = 'Pipeline';
    pipe.userData.metrics = { flowRate: 0, currentFlow: 0, pressure: 0 };
    pipe.material.emissive = new THREE.Color(0x000000);
    pipe.material.emissiveIntensity = 0;
    pipeGroup.add(pipe);
    clickableObjects.push(pipe);

    const valveGeom = new THREE.SphereGeometry(0.4, 16, 16);
    const valveMat = new THREE.MeshStandardMaterial({ color: 0xff6b6b, roughness: 0.4, metalness: 0.9, emissive: 0xff0000, emissiveIntensity: 0.2 });
    const valve = new THREE.Mesh(valveGeom, valveMat);
    valve.position.copy(midPoint);
    valve.castShadow = true;
    valve.userData.open = false;
    valve.userData.type = 'valve';
    valve.userData.name = 'Valve';
    pipeGroup.add(valve);
    clickableObjects.push(valve);

    scene.add(pipeGroup);
    meshes.push(pipeGroup);

    return { group: pipeGroup, pipe: pipe, valve: valve };
}

function createFloatingOrb(position, color, name) {
    const geometry = new THREE.SphereGeometry(0.8, 32, 32);
    const material = new THREE.MeshStandardMaterial({ 
        color: color, 
        emissive: color,
        emissiveIntensity: 0.3,
        roughness: 0.2,
        metalness: 0.8
    });
    const orb = new THREE.Mesh(geometry, material);
    orb.position.set(position.x, position.y, position.z);
    orb.castShadow = true;
    orb.userData.type = 'sensor';
    orb.userData.name = name;
    orb.userData.metrics = { 
        temperature: 20 + Math.random() * 15,
        humidity: 45 + Math.random() * 25,
        status: 'active'
    };
    scene.add(orb);
    meshes.push(orb);
    clickableObjects.push(orb);

    const shape = new CANNON.Sphere(0.8);
    const body = new CANNON.Body({ mass: 1 });
    body.addShape(shape);
    body.position.set(position.x, position.y, position.z);
    body.linearDamping = 0.4;
    body.angularDamping = 0.4;
    world.addBody(body);
    bodies.push({ mesh: orb, body: body });

    return { mesh: orb, body: body };
}

function createParticleSystem() {
    const particleCount = 500;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    const color = new THREE.Color();
    for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;
        positions[i3] = (Math.random() - 0.5) * 100;
        positions[i3 + 1] = Math.random() * 30;
        positions[i3 + 2] = (Math.random() - 0.5) * 100;

        const hue = 0.6 + Math.random() * 0.2;
        color.setHSL(hue, 0.8, 0.6);
        colors[i3] = color.r;
        colors[i3 + 1] = color.g;
        colors[i3 + 2] = color.b;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
        size: 0.1,
        vertexColors: true,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending
    });

    const particles = new THREE.Points(geometry, material);
    scene.add(particles);
    meshes.push(particles);

    return particles;
}

function highlightObject(object) {
    if (selectedObject) {
        selectedObject.material.emissive.setHex(selectedObject.userData.originalEmissive || 0x000000);
    }
    selectedObject = object;
    object.userData.originalEmissive = object.material.emissive.getHex();
    object.material.emissive.setHex(0xffff00);
    object.material.emissiveIntensity = 0.5;
}

function showObjectDetails(object) {
    const panel = document.getElementById('detailsPanel');
    const title = document.getElementById('detailsTitle');
    const content = document.getElementById('detailsContent');
    
    title.textContent = object.userData.name || 'Object';
    let html = '';
    
    if (object.userData.type) {
        html += `<div class="detail-row"><span class="detail-label">Type:</span><span class="detail-value">${object.userData.type}</span></div>`;
    }
    
    if (object.userData.metrics) {
        Object.entries(object.userData.metrics).forEach(([key, value]) => {
            html += `<div class="detail-row"><span class="detail-label">${key}:</span><span class="detail-value">${typeof value === 'number' ? value.toFixed(2) : value}</span></div>`;
        });
    }
    
    html += `<div class="detail-row"><span class="detail-label">Position:</span><span class="detail-value">(${object.position.x.toFixed(1)}, ${object.position.y.toFixed(1)}, ${object.position.z.toFixed(1)})</span></div>`;
    
    if (object.userData.type === 'conveyor') {
        html += `
            <div class="detail-row control-interactive">
                <label>Speed: ${(object.userData.speed || 0.5).toFixed(2)}</label>
                <input type="range" min="0" max="2" step="0.1" value="${object.userData.speed || 0.5}" 
                       class="detail-control" data-action="conveyor-speed" data-target="${clickableObjects.indexOf(object)}">
            </div>
            <div class="detail-row">
                <button class="detail-btn" data-action="conveyor-toggle" data-target="${clickableObjects.indexOf(object)}">
                    ${object.userData.enabled !== false ? 'Stop' : 'Start'} Conveyor
                </button>
            </div>
        `;
    }
    
    if (object.userData.type === 'pipeline') {
        const pipeline = pipelines.find(p => p.pipe === object);
        const valveOpen = pipeline && pipeline.valve.userData.open !== false;
        html += `
            <div class="detail-row control-interactive">
                <label>Flow Rate: ${object.userData.metrics?.flowRate?.toFixed(1) || 0} L/min</label>
                <input type="range" min="0" max="100" step="1" value="${object.userData.metrics?.flowRate || 50}" 
                       class="detail-control" data-action="pipeline-flow" data-target="${clickableObjects.indexOf(object)}">
            </div>
            <div class="detail-row">
                <button class="detail-btn ${valveOpen ? 'active' : ''}" 
                        data-action="valve-toggle" data-pipeline="${pipelines.indexOf(pipeline)}">
                    ${valveOpen ? '🔓 Close' : '🔒 Open'} Valve
                </button>
            </div>
        `;
    }
    
    if (object.userData.type === 'machine') {
        html += `
            <div class="detail-row control-interactive">
                <label>RPM: ${object.userData.metrics?.rpm?.toFixed(0) || 1200}</label>
                <input type="range" min="0" max="2000" step="50" value="${object.userData.metrics?.rpm || 1200}" 
                       class="detail-control" data-action="machine-rpm" data-target="${clickableObjects.indexOf(object)}">
            </div>
            <div class="detail-row">
                <button class="detail-btn" data-action="machine-toggle" data-target="${clickableObjects.indexOf(object)}">
                    ${object.userData.enabled !== false ? 'Stop' : 'Start'} Machine
                </button>
            </div>
        `;
    }
    
    if (object.userData.type === 'valve') {
        const pipeline = pipelines.find(p => p.valve === object);
        const isOpen = object.userData.open !== false;
        html += `
            <div class="detail-row">
                <button class="detail-btn ${isOpen ? 'active' : ''}" 
                        data-action="valve-toggle" data-pipeline="${pipelines.indexOf(pipeline)}">
                    ${isOpen ? '🔓 Close' : '🔒 Open'} Valve
                </button>
            </div>
            <div class="detail-row">
                <span class="detail-label">Status:</span>
                <span class="detail-value">${isOpen ? 'OPEN - Flow Active' : 'CLOSED - No Flow'}</span>
            </div>
        `;
    }
    
    if (object.userData.type === 'sensor') {
        html += `
            <div class="detail-row">
                <button class="detail-btn" data-action="sensor-reset" data-target="${clickableObjects.indexOf(object)}">
                    Reset Sensor
                </button>
            </div>
        `;
    }
    
    content.innerHTML = html;
    panel.style.display = 'block';
    
    content.querySelectorAll('.detail-control').forEach(control => {
        control.addEventListener('input', (e) => {
            const action = e.target.dataset.action;
            const targetIndex = parseInt(e.target.dataset.target);
            const targetObject = clickableObjects[targetIndex];
            
            if (action === 'conveyor-speed') {
                targetObject.userData.speed = parseFloat(e.target.value);
                e.target.previousElementSibling.textContent = `Speed: ${targetObject.userData.speed.toFixed(2)}`;
            } else if (action === 'pipeline-flow') {
                const flowRate = parseFloat(e.target.value);
                targetObject.userData.metrics.flowRate = flowRate;
                targetObject.userData.metrics.currentFlow = flowRate;
                e.target.previousElementSibling.textContent = `Flow Rate: ${flowRate.toFixed(1)} L/min`;
                const pipeline = pipelines.find(p => p.pipe === targetObject);
                if (pipeline) {
                    if (flowRate > 0 && !pipeline.valve.userData.open) {
                        pipeline.valve.userData.open = true;
                        pipeline.valve.material.color.setHex(0x4caf50);
                        pipeline.valve.material.emissive.setHex(0x00ff00);
                        pipeline.valve.material.emissiveIntensity = 0.3;
                        const valveBtn = content.querySelector('[data-action="valve-toggle"]');
                        if (valveBtn) {
                            valveBtn.textContent = '🔓 Close Valve';
                            valveBtn.classList.add('active');
                        }
                    }
                    
                    if (flowRate > 0) {
                        const color = flowRate > 75 ? 0x00ff00 : flowRate > 50 ? 0xffff00 : 0xff9900;
                        targetObject.material.emissive.setHex(color);
                        targetObject.material.emissiveIntensity = Math.min(flowRate / 100, 0.5);
                        pipeline.valve.material.color.setHex(flowRate > 50 ? 0x4caf50 : 0xff9900);
                        targetObject.userData.metrics.pressure = 400 + (flowRate / 100) * 400;
                    } else {
                        targetObject.material.emissive.setHex(0x000000);
                        targetObject.material.emissiveIntensity = 0;
                        targetObject.userData.metrics.pressure = 0;
                        if (pipeline.valve.userData.open) {
                            pipeline.valve.material.color.setHex(0xff6b6b);
                        }
                    }
                    
                    window.metricData.flow.push(flowRate);
                    if (window.metricData.flow.length > 50) window.metricData.flow.shift();
                    window.metricData.pressure.push(targetObject.userData.metrics.pressure);
                    if (window.metricData.pressure.length > 50) window.metricData.pressure.shift();
                    
                    document.getElementById('flowValue').textContent = flowRate.toFixed(1) + 'L/min';
                    document.getElementById('pressureValue').textContent = targetObject.userData.metrics.pressure.toFixed(0) + 'Pa';
                    updateMetricsChart();
                }
                const metricsRow = Array.from(content.querySelectorAll('.detail-row')).find(row => {
                    const label = row.querySelector('.detail-label');
                    return label && label.textContent === 'flowRate:';
                });
                if (metricsRow) {
                    const valueEl = metricsRow.querySelector('.detail-value');
                    if (valueEl) {
                        valueEl.textContent = flowRate.toFixed(2);
                    }
                }
            } else if (action === 'machine-rpm') {
                const rpm = parseFloat(e.target.value);
                targetObject.userData.metrics.rpm = rpm;
                targetObject.userData.metrics.power = rpm / 50;
                e.target.previousElementSibling.textContent = `RPM: ${rpm.toFixed(0)}`;
                
                let totalPower = 0;
                machines.forEach(({ base }) => {
                    if (base.userData.enabled !== false && base.userData.metrics) {
                        totalPower += base.userData.metrics.power || 0;
                    }
                });
                
                window.metricData.power.push(totalPower);
                if (window.metricData.power.length > 50) window.metricData.power.shift();
                document.getElementById('powerValue').textContent = totalPower.toFixed(1) + 'kW';
                updateMetricsChart();
            }
        });
    });
    
    content.querySelectorAll('.detail-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const action = e.target.dataset.action;
            const targetIndex = e.target.dataset.target ? parseInt(e.target.dataset.target) : -1;
            const pipelineIndex = e.target.dataset.pipeline !== undefined ? parseInt(e.target.dataset.pipeline) : -1;
            
            if (action === 'conveyor-toggle') {
                const conveyor = clickableObjects[targetIndex];
                conveyor.userData.enabled = !conveyor.userData.enabled;
                e.target.textContent = conveyor.userData.enabled ? 'Stop Conveyor' : 'Start Conveyor';
                const beltGroup = conveyors.find(c => c.belt === conveyor)?.group;
                if (beltGroup) {
                    beltGroup.traverse(child => {
                        if (child.isMesh) {
                            child.material.opacity = conveyor.userData.enabled ? 1 : 0.5;
                        }
                    });
                }
            } else if (action === 'valve-toggle') {
                const pipeline = pipelines[pipelineIndex];
                if (pipeline) {
                    pipeline.valve.userData.open = !pipeline.valve.userData.open;
                    const isOpen = pipeline.valve.userData.open;
                    
                    const currentFlow = pipeline.pipe.userData.metrics.flowRate || 0;
                    
                    if (isOpen) {
                        pipeline.valve.material.color.setHex(0x4caf50);
                        pipeline.valve.material.emissive.setHex(0x00ff00);
                        pipeline.valve.material.emissiveIntensity = 0.3;
                        const newFlow = Math.max(currentFlow, 10);
                        pipeline.pipe.userData.metrics.flowRate = newFlow;
                        pipeline.pipe.userData.metrics.currentFlow = newFlow;
                        pipeline.pipe.userData.metrics.pressure = 400 + (newFlow / 100) * 400;
                        pipeline.pipe.material.emissive.setHex(0x00ff00);
                        pipeline.pipe.material.emissiveIntensity = 0.2;
                        
                        window.metricData.flow.push(newFlow);
                        if (window.metricData.flow.length > 50) window.metricData.flow.shift();
                        window.metricData.pressure.push(pipeline.pipe.userData.metrics.pressure);
                        if (window.metricData.pressure.length > 50) window.metricData.pressure.shift();
                        
                        document.getElementById('flowValue').textContent = newFlow.toFixed(1) + 'L/min';
                        document.getElementById('pressureValue').textContent = pipeline.pipe.userData.metrics.pressure.toFixed(0) + 'Pa';
                    } else {
                        pipeline.valve.material.color.setHex(0xff6b6b);
                        pipeline.valve.material.emissive.setHex(0xff0000);
                        pipeline.valve.material.emissiveIntensity = 0.2;
                        pipeline.pipe.userData.metrics.flowRate = 0;
                        pipeline.pipe.userData.metrics.currentFlow = 0;
                        pipeline.pipe.userData.metrics.pressure = 0;
                        pipeline.pipe.material.emissive.setHex(0x000000);
                        pipeline.pipe.material.emissiveIntensity = 0;
                        
                        window.metricData.flow.push(0);
                        if (window.metricData.flow.length > 50) window.metricData.flow.shift();
                        window.metricData.pressure.push(0);
                        if (window.metricData.pressure.length > 50) window.metricData.pressure.shift();
                        
                        document.getElementById('flowValue').textContent = '0.0L/min';
                        document.getElementById('pressureValue').textContent = '0Pa';
                    }
                    
                    updateMetricsChart();
                    
                    e.target.textContent = isOpen ? '🔓 Close Valve' : '🔒 Open Valve';
                    e.target.classList.toggle('active', isOpen);
                    
                    const statusRows = Array.from(content.querySelectorAll('.detail-row'));
                    statusRows.forEach(row => {
                        const label = row.querySelector('.detail-label');
                        if (label && label.textContent === 'Status:') {
                            const valueEl = row.querySelector('.detail-value');
                            if (valueEl) {
                                valueEl.textContent = isOpen ? 'OPEN - Flow Active' : 'CLOSED - No Flow';
                            }
                        }
                    });
                    
                    const flowSlider = content.querySelector('[data-action="pipeline-flow"]');
                    if (flowSlider) {
                        flowSlider.value = pipeline.pipe.userData.metrics.flowRate;
                        flowSlider.previousElementSibling.textContent = `Flow Rate: ${pipeline.pipe.userData.metrics.flowRate.toFixed(1)} L/min`;
                    }
                    
                    const flowRow = Array.from(content.querySelectorAll('.detail-row')).find(row => {
                        return row.querySelector('.detail-label')?.textContent === 'flowRate:';
                    });
                    if (flowRow) {
                        flowRow.querySelector('.detail-value').textContent = pipeline.pipe.userData.metrics.flowRate.toFixed(2);
                    }
                    
                    showAlert(isOpen ? `Valve opened - Flow: ${pipeline.pipe.userData.metrics.flowRate.toFixed(1)} L/min` : 'Valve closed - Flow stopped', 'info');
                }
            } else if (action === 'machine-toggle') {
                const machine = clickableObjects[targetIndex];
                machine.userData.enabled = !machine.userData.enabled;
                e.target.textContent = machine.userData.enabled ? 'Stop Machine' : 'Start Machine';
                const machineGroup = machines.find(m => m.base === machine)?.group;
                if (machineGroup) {
                    machineGroup.traverse(child => {
                        if (child.isMesh && child.material.emissive) {
                            child.material.emissiveIntensity = machine.userData.enabled ? 0.3 : 0.1;
                        }
                    });
                }
                
                let totalPower = 0;
                machines.forEach(({ base }) => {
                    if (base.userData.enabled !== false && base.userData.metrics) {
                        totalPower += base.userData.metrics.power || 0;
                    }
                });
                
                window.metricData.power.push(totalPower);
                if (window.metricData.power.length > 50) window.metricData.power.shift();
                document.getElementById('powerValue').textContent = totalPower.toFixed(1) + 'kW';
                updateMetricsChart();
            } else if (action === 'sensor-reset') {
                const sensor = clickableObjects[targetIndex];
                sensor.userData.metrics = {
                    temperature: 20 + Math.random() * 15,
                    humidity: 45 + Math.random() * 25,
                    status: 'active'
                };
                showAlert('Sensor reset - New values initialized', 'info');
                setTimeout(() => showObjectDetails(sensor), 100);
            }
        });
    });
}

function hideObjectDetails() {
    document.getElementById('detailsPanel').style.display = 'none';
    if (selectedObject && selectedObject.userData.originalEmissive !== undefined) {
        selectedObject.material.emissive.setHex(selectedObject.userData.originalEmissive);
    }
    selectedObject = null;
}

function updatePipelineDetails(pipe) {
    if (selectedObject !== pipe && selectedObject !== pipelines.find(p => p.pipe === pipe)?.valve) return;
    
    const content = document.getElementById('detailsContent');
    if (!content) return;
    
    const flowRow = Array.from(content.querySelectorAll('.detail-row')).find(row => {
        const label = row.querySelector('.detail-label');
        return label && label.textContent === 'flowRate:';
    });
    if (flowRow && pipe.userData.metrics) {
        const valueEl = flowRow.querySelector('.detail-value');
        if (valueEl) {
            valueEl.textContent = pipe.userData.metrics.currentFlow.toFixed(2);
        }
    }
    
    const pressureRow = Array.from(content.querySelectorAll('.detail-row')).find(row => {
        const label = row.querySelector('.detail-label');
        return label && label.textContent === 'pressure:';
    });
    if (pressureRow && pipe.userData.metrics) {
        const valueEl = pressureRow.querySelector('.detail-value');
        if (valueEl) {
            valueEl.textContent = pipe.userData.metrics.pressure.toFixed(2);
        }
    }
    
    const flowLabel = content.querySelector('label');
    if (flowLabel && flowLabel.textContent.includes('Flow Rate:')) {
        flowLabel.textContent = `Flow Rate: ${pipe.userData.metrics.currentFlow.toFixed(1)} L/min`;
        const slider = content.querySelector('[data-action="pipeline-flow"]');
        if (slider) {
            slider.value = pipe.userData.metrics.flowRate;
        }
    }
}

function createLabel(text, object) {
    const label = document.createElement('div');
    label.className = 'label-floating';
    label.textContent = text;
    document.getElementById('ui-overlay').appendChild(label);
    object.userData.label = label;
    updateLabelPosition(object);
}

function updateLabelPosition(object) {
    const label = object.userData.label;
    if (!label) return;
    
    const vector = object.position.clone();
    vector.project(camera);
    
    const x = (vector.x * 0.5 + 0.5) * window.innerWidth;
    const y = (-vector.y * 0.5 + 0.5) * window.innerHeight;
    
    label.style.left = x + 'px';
    label.style.top = y + 'px';
}

function updateMinimap() {
    const canvas = document.getElementById('minimap');
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, 200, 200);
    
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, 200, 200);
    
    ctx.strokeStyle = '#444444';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 10; i++) {
        ctx.beginPath();
        ctx.moveTo(i * 20, 0);
        ctx.lineTo(i * 20, 200);
        ctx.moveTo(0, i * 20);
        ctx.lineTo(200, i * 20);
        ctx.stroke();
    }
    
    const scale = 4;
    const offsetX = 100;
    const offsetY = 100;
    
    clickableObjects.forEach(obj => {
        const x = obj.position.x * scale + offsetX;
        const y = -obj.position.z * scale + offsetY;
        
        if (obj.userData.type === 'sensor') {
            ctx.fillStyle = '#64b5f6';
            ctx.beginPath();
            ctx.arc(x, y, 3, 0, Math.PI * 2);
            ctx.fill();
        } else if (obj.userData.type === 'machine') {
            ctx.fillStyle = '#4299e1';
            ctx.fillRect(x - 2, y - 2, 4, 4);
        } else if (obj.userData.type === 'pipeline') {
            ctx.strokeStyle = '#4a90e2';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(x - 5, y);
            ctx.lineTo(x + 5, y);
            ctx.stroke();
        }
    });
    
    ctx.fillStyle = '#ffff00';
    ctx.beginPath();
    ctx.arc(offsetX, offsetY, 2, 0, Math.PI * 2);
    ctx.fill();
}

function updateMetricsChart() {
    const canvas = document.getElementById('metricChart');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;
    
    const data = window.metricData || { temp: [], pressure: [], flow: [], power: [] };
    
    ctx.clearRect(0, 0, 300, 150);
    
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, 300, 150);
    
    const maxTemp = 60;
    const maxPressure = 1000;
    const maxFlow = 100;
    const maxPower = 500;
    const padding = 20;
    const chartWidth = 300 - padding * 2;
    const chartHeight = 150 - padding * 2;
    
    function drawLine(dataPoints, color, maxVal) {
        if (dataPoints.length < 2) return;
        
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        dataPoints.forEach((value, index) => {
            const x = padding + (index / (dataPoints.length - 1)) * chartWidth;
            const y = padding + chartHeight - (value / maxVal) * chartHeight;
            
            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });
        
        ctx.stroke();
    }
    
    if (data.temp.length > 1) drawLine(data.temp, '#ff6b6b', maxTemp);
    if (data.flow.length > 1) drawLine(data.flow, '#4ecdc4', maxFlow);
    if (data.pressure.length > 1) drawLine(data.pressure, '#64b5f6', maxPressure);
    if (data.power.length > 1) drawLine(data.power, '#ffd700', maxPower);
}

function showAlert(message, type = 'error') {
    const container = document.getElementById('alertContainer');
    const alert = document.createElement('div');
    alert.className = `alert ${type}`;
    alert.textContent = message;
    container.appendChild(alert);
    
    setTimeout(() => {
        alert.style.animation = 'alertSlide 0.3s ease-out reverse';
        setTimeout(() => alert.remove(), 300);
    }, 3000);
}

const machines = [];
const orbs = [];
const conveyors = [];
const pipelines = [];
const particles = createParticleSystem();

machines.push(createRotatingMachine({ x: -15, y: 1, z: -10 }, 1));
machines.push(createRotatingMachine({ x: 15, y: 1, z: -10 }, 2));
machines.push(createRotatingMachine({ x: -15, y: 1, z: 10 }, 3));
machines.push(createRotatingMachine({ x: 15, y: 1, z: 10 }, 4));

orbs.push(createFloatingOrb({ x: 0, y: 8, z: 0 }, 0x64b5f6, 'Sensor A'));
orbs.push(createFloatingOrb({ x: -15, y: 9, z: -15 }, 0xff6b6b, 'Sensor B'));
orbs.push(createFloatingOrb({ x: 15, y: 9, z: 15 }, 0x4ecdc4, 'Sensor C'));

conveyors.push(createConveyorBelt({ x: -15, y: 0.5, z: -5 }, 0));
conveyors.push(createConveyorBelt({ x: 15, y: 0.5, z: 5 }, Math.PI));

pipelines.push(createPipeline(
    new THREE.Vector3(-15, 3, -10),
    new THREE.Vector3(15, 3, 10)
));


window.metricData = {
    temp: [],
    pressure: [],
    flow: [],
    power: []
};

for (let i = 0; i < 50; i++) {
    window.metricData.temp.push(25 + Math.random() * 15);
    window.metricData.pressure.push(500 + Math.random() * 200);
    window.metricData.flow.push(30 + Math.random() * 40);
    window.metricData.power.push(200 + Math.random() * 150);
}

const clock = new THREE.Clock();
let frameCount = 0;
let lastTime = performance.now();
let metricUpdateTime = 0;

function animate() {
    requestAnimationFrame(animate);

    const delta = clock.getDelta() * animationSpeed;
    const elapsedTime = clock.getElapsedTime();

    world.step(1/60, delta, 3);

    orbs.forEach(({ mesh, body }) => {
        mesh.position.copy(body.position);
        mesh.quaternion.copy(body.quaternion);
        
        const offset = mesh.userData.offset || Math.random() * Math.PI * 2;
        mesh.userData.offset = offset;
        
        const floatHeight = Math.sin(elapsedTime * 0.5 + offset) * 0.5;
        body.position.y += floatHeight * delta * 2;
        
        mesh.rotation.x += delta * 0.5;
        mesh.rotation.y += delta * 0.7;
        
    });

    machines.forEach(({ rotor, base }) => {
        if (base.userData.enabled !== false) {
            const rpm = (base.userData.metrics?.rpm || 1200) / 600;
            rotor.rotation.x += delta * rpm;
            rotor.rotation.z += delta * rpm * 0.75;
            
            if (base.userData.metrics) {
                if (base.userData.enabled !== false) {
                    const rpm = base.userData.metrics.rpm || 1200;
                    const targetTemp = 30 + (rpm / 100) * 1.2;
                    const currentTemp = base.userData.metrics.temperature || 25;
                    const coolingEffect = coolingSystem > 0 ? (coolingSystem / 100) * 0.5 : 0;
                    const adjustedTarget = targetTemp - coolingEffect;
                    if (currentTemp < adjustedTarget) {
                        base.userData.metrics.temperature = Math.min(adjustedTarget, currentTemp + delta * 2);
                    } else if (currentTemp > adjustedTarget) {
                        base.userData.metrics.temperature = Math.max(adjustedTarget, currentTemp - delta * 2);
                    }
                    base.userData.metrics.temperature = Math.max(25, Math.min(70, base.userData.metrics.temperature));
                } else {
                    const currentTemp = base.userData.metrics.temperature || 25;
                    base.userData.metrics.temperature = Math.max(25, currentTemp - delta * 3);
                }
                base.userData.metrics.power = base.userData.enabled !== false ? (base.userData.metrics.rpm || 1200) / 50 : 0;
            }
        }
    });

    conveyors.forEach(({ belt, group }) => {
        if (belt.userData.enabled !== false) {
            if (belt.material.map) {
                belt.material.map.offset.x += delta * (belt.userData.speed || 0.5);
            }
            group.children.forEach(child => {
                if (child.geometry && child.type === 'Mesh' && child !== belt) {
                    child.rotation.x += delta * (belt.userData.speed || 0.5) * 2;
                }
            });
        }
    });

    pipelines.forEach(({ valve, pipe }) => {
        if (valve.userData.open) {
            valve.rotation.y += delta * 0.5;
            valve.material.emissiveIntensity = 0.3 + Math.sin(elapsedTime * 5) * 0.1;
            if (pipe.userData.metrics) {
                const targetFlow = pipe.userData.metrics.flowRate || 0;
                const currentFlow = pipe.userData.metrics.currentFlow || targetFlow;
                if (currentFlow < targetFlow) {
                    pipe.userData.metrics.currentFlow = Math.min(targetFlow, currentFlow + delta * 20);
                } else if (currentFlow > targetFlow) {
                    pipe.userData.metrics.currentFlow = Math.max(targetFlow, currentFlow - delta * 20);
                } else {
                    pipe.userData.metrics.currentFlow = targetFlow;
                }
                pipe.userData.metrics.pressure = 400 + (pipe.userData.metrics.currentFlow / 100) * 400 + Math.sin(elapsedTime * 0.3) * 50;
                pipe.material.emissiveIntensity = Math.min(pipe.userData.metrics.currentFlow / 100, 0.5);
                
                if (selectedObject === pipe || selectedObject === valve) {
                    updatePipelineDetails(pipe);
                }
            }
        } else {
            valve.rotation.y += delta * 0.1;
            valve.material.emissiveIntensity = 0.2;
            if (pipe.userData.metrics) {
                pipe.userData.metrics.currentFlow = 0;
                if (pipe.userData.metrics.flowRate > 0) {
                    pipe.userData.metrics.flowRate = 0;
                }
                pipe.userData.metrics.pressure = 0;
                pipe.material.emissiveIntensity = 0;
                
                if (selectedObject === pipe || selectedObject === valve) {
                    updatePipelineDetails(pipe);
                }
            }
        }
    });

    if (particles) {
        const positions = particles.geometry.attributes.position.array;
        for (let i = 0; i < positions.length; i += 3) {
            positions[i + 1] += Math.sin(elapsedTime + i) * 0.01;
            if (positions[i + 1] > 30) positions[i + 1] = 0;
        }
        particles.geometry.attributes.position.needsUpdate = true;
    }

    pointLight1.intensity = 1 + Math.sin(elapsedTime) * 0.3;
    pointLight2.intensity = 1 + Math.cos(elapsedTime * 0.8) * 0.3;

    controls.update();
    renderer.render(scene, camera);

    frameCount++;
    const currentTime = performance.now();
    if (currentTime >= lastTime + 1000) {
        const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
        document.getElementById('fps').textContent = fps;
        document.getElementById('objectCount').textContent = meshes.length;
        document.getElementById('physicsCount').textContent = bodies.length;
        frameCount = 0;
        lastTime = currentTime;
    }

    if (currentTime >= metricUpdateTime + 200) {
        let totalTemp = 0;
        let activeMachines = 0;
        machines.forEach(({ base }) => {
            if (base.userData.enabled !== false && base.userData.metrics) {
                const machineTemp = base.userData.metrics.temperature || 25;
                const cooledTemp = coolingSystem > 0 ? machineTemp - (coolingSystem / 100) * 15 : machineTemp;
                totalTemp += Math.max(25, cooledTemp);
                activeMachines++;
            }
        });
        const baseTemp = activeMachines > 0 ? totalTemp / activeMachines : 25;
        const coolingEffect = coolingSystem > 0 ? (coolingSystem / 100) * 10 : 0;
        const avgTemp = baseTemp - coolingEffect + Math.sin(elapsedTime * 0.3) * 1;
        
        let totalPower = 0;
        machines.forEach(({ base }) => {
            if (base.userData.enabled !== false && base.userData.metrics) {
                totalPower += base.userData.metrics.power || 0;
            }
        });
        
        let pipelineFlow = 0;
        let pipelinePressure = 0;
        pipelines.forEach(({ pipe, valve }) => {
            if (valve.userData.open && pipe.userData.metrics) {
                pipelineFlow = pipe.userData.metrics.currentFlow || pipe.userData.metrics.flowRate || 0;
                pipelinePressure = pipe.userData.metrics.pressure || 0;
            }
        });
        
        const temp = avgTemp + Math.sin(elapsedTime * 0.3) * 1;
        const pressure = pipelinePressure || (400 + Math.sin(elapsedTime * 0.3) * 50);
        const flow = pipelineFlow || 0;
        const power = totalPower || (200 + Math.sin(elapsedTime * 0.4) * 50);

        window.metricData.temp.push(temp);
        window.metricData.pressure.push(pressure);
        window.metricData.flow.push(flow);
        window.metricData.power.push(power);

        if (window.metricData.temp.length > 50) {
            window.metricData.temp.shift();
            window.metricData.pressure.shift();
            window.metricData.flow.shift();
            window.metricData.power.shift();
        }

        document.getElementById('tempValue').textContent = temp.toFixed(1) + '°C';
        document.getElementById('pressureValue').textContent = pressure.toFixed(0) + 'Pa';
        document.getElementById('flowValue').textContent = flow.toFixed(1) + 'L/min';
        document.getElementById('powerValue').textContent = power.toFixed(1) + 'kW';

        const tempItem = document.getElementById('tempValue').parentElement;
        if (temp > 50) {
            tempItem.classList.add('alert');
            if (Math.random() < 0.02) {
                showAlert('High Temperature Warning! (>50°C)', 'warning');
            }
        } else if (temp > 45) {
            tempItem.classList.remove('alert');
        } else {
            tempItem.classList.remove('alert');
        }

        updateMetricsChart();
        updateMinimap();
        metricUpdateTime = currentTime;
    }
}

function onMouseClick(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(clickableObjects);

    if (intersects.length > 0) {
        const object = intersects[0].object;
        highlightObject(object);
        showObjectDetails(object);
    } else {
        hideObjectDetails();
    }
}

window.addEventListener('click', onMouseClick);

const animSpeedSlider = document.getElementById('animSpeed');
const animSpeedValue = document.getElementById('animSpeedValue');
animSpeedSlider.addEventListener('input', (e) => {
    animationSpeed = parseFloat(e.target.value);
    animSpeedValue.textContent = animationSpeed.toFixed(1);
});

const gravitySlider = document.getElementById('gravity');
const gravityValue = document.getElementById('gravityValue');
gravitySlider.addEventListener('input', (e) => {
    const gravity = parseFloat(e.target.value);
    world.gravity.set(0, gravity, 0);
    gravityValue.textContent = gravity.toFixed(1);
});

const coolingSlider = document.getElementById('cooling');
const coolingValue = document.getElementById('coolingValue');
coolingSlider.addEventListener('input', (e) => {
    coolingSystem = parseFloat(e.target.value);
    coolingValue.textContent = coolingSystem + '%';
    if (coolingSystem > 0) {
        machines.forEach(({ base }) => {
            if (base.userData.metrics) {
                base.userData.metrics.temperature = Math.max(25, base.userData.metrics.temperature - (coolingSystem / 100) * 5);
            }
        });
    }
});

const cameraView = document.getElementById('cameraView');
cameraView.addEventListener('change', (e) => {
    const view = e.target.value;
    switch(view) {
        case 'top':
            camera.position.set(0, 50, 0);
            camera.lookAt(0, 0, 0);
            break;
        case 'front':
            camera.position.set(0, 10, 30);
            camera.lookAt(0, 5, 0);
            break;
        case 'side':
            camera.position.set(30, 10, 0);
            camera.lookAt(0, 5, 0);
            break;
        case 'close':
            camera.position.set(8, 8, 8);
            camera.lookAt(0, 3, 0);
            break;
        default:
            camera.position.set(20, 15, 25);
            camera.lookAt(0, 0, 0);
    }
    controls.update();
});

document.getElementById('resetBtn').addEventListener('click', () => {
    orbs.forEach(({ body }) => {
        body.velocity.set(0, 0, 0);
        body.angularVelocity.set(0, 0, 0);
    });
    orbs[0].body.position.set(0, 8, 0);
    orbs[1].body.position.set(-15, 9, -15);
    orbs[2].body.position.set(15, 9, 15);
    clock.start();
    hideObjectDetails();
});

document.getElementById('wireframeBtn').addEventListener('click', () => {
    wireframeMode = !wireframeMode;
    scene.traverse((child) => {
        if (child.isMesh) {
            child.material.wireframe = wireframeMode;
        }
    });
});

document.getElementById('closeDetails').addEventListener('click', hideObjectDetails);

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

updateMetricsChart();
updateMinimap();
animate();
