let scene, camera, renderer, character, gui, ambientLight, directionalLight, params;

function init() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    document.getElementById('scene').appendChild(renderer.domElement);

    character = createCharacter();
    scene.add(character);

    camera.position.z = 5;

    // Tambahkan pencahayaan
    ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(1, 1, 1);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    // Tambahkan plane untuk bayangan
    const planeGeometry = new THREE.PlaneGeometry(10, 10);
    const planeMaterial = new THREE.MeshStandardMaterial({ color: 0xcccccc });
    const plane = new THREE.Mesh(planeGeometry, planeMaterial);
    plane.rotation.x = -Math.PI / 2;
    plane.position.y = -1;
    plane.receiveShadow = true;
    scene.add(plane);

    // Set background color
    scene.background = new THREE.Color(0x000000);

    setupGUI();
    updateGUIPosition();
    animate();
}

function createCharacter() {
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshStandardMaterial({ color: 0x2ecc71 });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
}

function setupGUI() {
    const guiContainer = document.getElementById('gui-container');
    
    // Buat tombol toggle
    const toggleButton = document.createElement('button');
    toggleButton.id = 'toggle-gui';
    toggleButton.textContent = 'Buka/Tutup Kontrol';
    toggleButton.addEventListener('click', toggleGUI);
    guiContainer.insertBefore(toggleButton, guiContainer.firstChild);

    // Setup dat.GUI
    gui = new dat.GUI({ autoPlace: false });
    document.getElementById('gui').appendChild(gui.domElement);
    params = {
        scaleX: 1,
        scaleY: 1,
        scaleZ: 1,
        color: '#2ecc71',
        rotateX: 0,
        rotateY: 0,
        rotateZ: 0,
        positionX: 0,
        positionY: 0,
        positionZ: 0,
        wireframe: false,
        shape: 'Box',
        roughness: 0.5,
        metalness: 0.5,
        emissive: '#000000',
        emissiveIntensity: 1,
        lightIntensity: 0.5,
        backgroundColor: '#000000',
        autoRotate: false,
        autoRotateSpeed: 1,
        texture: 'None',
        castShadow: false,
        receiveShadow: false
    };

    const transformFolder = gui.addFolder('Transform');
    transformFolder.add(params, 'scaleX', 0.1, 2).name('Scale X').onChange((value) => character.scale.x = value);
    transformFolder.add(params, 'scaleY', 0.1, 2).name('Scale Y').onChange((value) => character.scale.y = value);
    transformFolder.add(params, 'scaleZ', 0.1, 2).name('Scale Z').onChange((value) => character.scale.z = value);
    transformFolder.add(params, 'rotateX', 0, Math.PI * 2).name('Rotate X').onChange((value) => character.rotation.x = value);
    transformFolder.add(params, 'rotateY', 0, Math.PI * 2).name('Rotate Y').onChange((value) => character.rotation.y = value);
    transformFolder.add(params, 'rotateZ', 0, Math.PI * 2).name('Rotate Z').onChange((value) => character.rotation.z = value);
    transformFolder.add(params, 'positionX', -5, 5).name('Position X').onChange((value) => character.position.x = value);
    transformFolder.add(params, 'positionY', -5, 5).name('Position Y').onChange((value) => character.position.y = value);
    transformFolder.add(params, 'positionZ', -5, 5).name('Position Z').onChange((value) => character.position.z = value);

    const materialFolder = gui.addFolder('Material');
    materialFolder.addColor(params, 'color').name('Color').onChange((value) => character.material.color.setHex(parseInt(value.replace('#', '0x'))));
    materialFolder.add(params, 'wireframe').name('Wireframe').onChange((value) => character.material.wireframe = value);
    materialFolder.add(params, 'roughness', 0, 1).name('Roughness').onChange((value) => character.material.roughness = value);
    materialFolder.add(params, 'metalness', 0, 1).name('Metalness').onChange((value) => character.material.metalness = value);
    materialFolder.addColor(params, 'emissive').name('Emissive').onChange((value) => character.material.emissive.setHex(parseInt(value.replace('#', '0x'))));
    materialFolder.add(params, 'emissiveIntensity', 0, 1).name('Emissive Intensity').onChange((value) => character.material.emissiveIntensity = value);
    materialFolder.add(params, 'texture', ['None', 'Wood', 'Metal', 'Brick']).name('Texture').onChange(changeTexture);

    const shapeFolder = gui.addFolder('Shape');
    shapeFolder.add(params, 'shape', ['Box', 'Sphere', 'Cone', 'Cylinder', 'Torus']).name('Shape').onChange(changeShape);

    const lightingFolder = gui.addFolder('Lighting');
    lightingFolder.add(params, 'lightIntensity', 0, 2).name('Light Intensity').onChange((value) => {
        ambientLight.intensity = value;
        directionalLight.intensity = value;
    });
    lightingFolder.addColor(params, 'backgroundColor').name('Background Color').onChange((value) => {
        scene.background.setHex(parseInt(value.replace('#', '0x')));
    });

    const effectsFolder = gui.addFolder('Effects');
    effectsFolder.add(params, 'autoRotate').name('Auto Rotate');
    effectsFolder.add(params, 'autoRotateSpeed', 0, 5).name('Rotation Speed');
    effectsFolder.add(params, 'castShadow').name('Cast Shadow').onChange((value) => {
        character.castShadow = value;
        updateShadows();
    });
    effectsFolder.add(params, 'receiveShadow').name('Receive Shadow').onChange((value) => {
        character.receiveShadow = value;
        updateShadows();
    });

    // Sembunyikan GUI awalnya
    document.getElementById('gui').style.display = 'none';
}

function changeTexture(textureName) {
    const textureLoader = new THREE.TextureLoader();
    if (textureName === 'None') {
        character.material.map = null;
    } else {
        textureLoader.load(`textures/${textureName.toLowerCase()}.jpg`, (texture) => {
            character.material.map = texture;
            character.material.needsUpdate = true;
        });
    }
}

function updateShadows() {
    renderer.shadowMap.enabled = character.castShadow || character.receiveShadow;
    directionalLight.castShadow = character.castShadow;
    character.castShadow = character.castShadow;
    character.receiveShadow = character.receiveShadow;
}

function changeShape(shape) {
    let geometry;
    switch(shape) {
        case 'Sphere':
            geometry = new THREE.SphereGeometry(0.5, 32, 32);
            break;
        case 'Cone':
            geometry = new THREE.ConeGeometry(0.5, 1, 32);
            break;
        case 'Cylinder':
            geometry = new THREE.CylinderGeometry(0.5, 0.5, 1, 32);
            break;
        case 'Torus':
            geometry = new THREE.TorusGeometry(0.5, 0.2, 16, 100);
            break;
        default:
            geometry = new THREE.BoxGeometry(1, 1, 1);
    }
    
    scene.remove(character);
    character.geometry.dispose();
    character = new THREE.Mesh(geometry, character.material);
    character.castShadow = true;
    character.receiveShadow = true;
    scene.add(character);
    
    // Perbarui kontrol GUI
    updateGUIControls();
}

function updateGUIControls() {
    for (let i in gui.__folders) {
        const folder = gui.__folders[i];
        for (let j in folder.__controllers) {
            const controller = folder.__controllers[j];
            controller.updateDisplay();
        }
    }
}

function animate() {
    requestAnimationFrame(animate);

    if (params.autoRotate) {
        character.rotation.y += params.autoRotateSpeed * 0.01;
    }

    renderer.render(scene, camera);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);

    // Sesuaikan posisi kamera untuk perangkat mobile
    if (window.innerWidth <= 768) {
        camera.position.z = 7;
    } else {
        camera.position.z = 5;
    }

    // Perbarui ukuran dan posisi GUI
    updateGUIPosition();
}

function updateGUIPosition() {
    const guiContainer = document.getElementById('gui-container');
    if (window.innerWidth <= 768) {
        guiContainer.style.width = 'calc(100% - 20px)';
        guiContainer.style.left = '10px';
        guiContainer.style.right = '10px';
    } else {
        guiContainer.style.width = 'auto';
        guiContainer.style.left = 'auto';
        guiContainer.style.right = '20px';
    }
}

function toggleGUI() {
    const guiElement = document.getElementById('gui');
    const toggleButton = document.getElementById('toggle-gui');
    if (guiElement.style.display === 'none') {
        guiElement.style.display = 'block';
        toggleButton.textContent = 'Tutup Kontrol';
    } else {
        guiElement.style.display = 'none';
        toggleButton.textContent = 'Buka Kontrol';
    }
}

window.addEventListener('load', init);
window.addEventListener('resize', onWindowResize);
window.addEventListener('orientationchange', onWindowResize);

document.getElementById('start-creating').addEventListener('click', () => {
    document.getElementById('container').style.display = 'block';
    document.getElementById('start-creating').style.display = 'none';
});

// Sembunyikan container saat halaman dimuat
document.getElementById('container').style.display = 'none';
