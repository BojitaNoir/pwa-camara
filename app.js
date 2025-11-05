const openCameraBtn = document.getElementById('openCamera');
const cameraContainer = document.getElementById('cameraContainer');
const video = document.getElementById('video');
const takePhotoBtn = document.getElementById('takePhoto');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

let stream = null;
let currentFacing = 'environment'; // 'environment' (trasera) o 'user' (frontal)
let hasMultipleCameras = false;

// Función para verificar si hay múltiples cámaras
async function checkAvailableCameras() {
    try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        hasMultipleCameras = videoDevices.length > 1;
        
        // Actualizar visibilidad del botón de cambio
        const toggleBtn = document.getElementById('toggleCameraBtn');
        if (toggleBtn) {
            toggleBtn.style.display = hasMultipleCameras ? 'inline-flex' : 'none';
            if (!hasMultipleCameras) {
                console.log('Solo se detectó una cámara - el botón de cambio se ocultará');
            }
        }
    } catch (err) {
        console.error('Error al enumerar dispositivos:', err);
        hasMultipleCameras = false;
    }
}

async function startCamera(facing = currentFacing) {
    try {
        // Detener stream previo si existe
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            stream = null;
            video.srcObject = null;
        }

        const constraints = {
            video: {
                facingMode: { ideal: facing },
                width: { ideal: 320 },
                height: { ideal: 240 }
            }
        };

        stream = await navigator.mediaDevices.getUserMedia(constraints);
        video.srcObject = stream;

        cameraContainer.style.display = 'block';
        openCameraBtn.textContent = 'Cámara Abierta';
        openCameraBtn.disabled = true;

        // Habilitar el botón de alternar cámara
        const toggleBtn = document.getElementById('toggleCameraBtn');
        if (toggleBtn) {
            toggleBtn.disabled = false;
            updateToggleButtonLabel();
        }

        console.log('Cámara abierta exitosamente con facingMode:', facing);
    } catch (error) {
        console.error('Error al acceder a la cámara:', error);
        alert('No se pudo acceder a la cámara. Asegúrate de dar permisos y que tu dispositivo tenga la cámara solicitada.');
        // Si falló al cambiar, revertir currentFacing
        currentFacing = (facing === 'user') ? 'environment' : 'user';
    }
}

function updateToggleButtonLabel() {
    const toggleBtn = document.getElementById('toggleCameraBtn');
    if (!toggleBtn) return;
    if (currentFacing === 'user') {
        toggleBtn.textContent = '🔁 Cambiar a trasera';
    } else {
        toggleBtn.textContent = '🔁 Cambiar a frontal';
    }
}

async function openCamera() {
    // Primero verifica las cámaras disponibles
    await checkAvailableCameras();
    // Abre la cámara con el facing actual
    await startCamera(currentFacing);
}

function takePhoto() {
    if (!stream) {
        alert('Primero debes abrir la cámara');
        return;
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    const imageDataURL = canvas.toDataURL('image/png');
    
    console.log('📸 Foto capturada en base64:');
    console.log(imageDataURL);
    console.log(`Tamaño de la imagen: ${imageDataURL.length} caracteres`);
    
    alert('¡Foto capturada! Revisa la consola para ver el base64');
    
    closeCamera();
}

function closeCamera() {
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
        stream = null;

        video.srcObject = null;
        cameraContainer.style.display = 'none';
        
        openCameraBtn.textContent = 'Abrir Cámara';
        openCameraBtn.disabled = false;

        const toggleBtn = document.getElementById('toggleCameraBtn');
        if (toggleBtn) {
            toggleBtn.disabled = true;
        }
        
        console.log('Cámara cerrada');
    }
}

openCameraBtn.addEventListener('click', openCamera);
takePhotoBtn.addEventListener('click', takePhoto);

// Toggle camera button
const toggleCameraBtn = document.getElementById('toggleCameraBtn');
if (toggleCameraBtn) {
    toggleCameraBtn.addEventListener('click', async () => {
        // Cambiar facing y reiniciar la cámara
        currentFacing = (currentFacing === 'user') ? 'environment' : 'user';
        updateToggleButtonLabel();
        await startCamera(currentFacing);
    });
}

window.addEventListener('beforeunload', () => {
    closeCamera();
});

console.log('📱 PWA Cámara cargada. Presiona F12 para abrir las herramientas de desarrollador y ver la consola.');