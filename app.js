const openCameraBtn = document.getElementById('openCamera');
const cameraContainer = document.getElementById('cameraContainer');
const video = document.getElementById('video');
const takePhotoBtn = document.getElementById('takePhoto');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const galleryElement = document.getElementById('gallery');
const clearGalleryBtn = document.getElementById('clearGallery');

// Array para almacenar las fotos (se guardará en localStorage)
let photos = [];

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

// Cargar fotos guardadas al iniciar
function loadSavedPhotos() {
    const savedPhotos = localStorage.getItem('pwa-camera-photos');
    if (savedPhotos) {
        photos = JSON.parse(savedPhotos);
        renderGallery();
    }
}

// Guardar fotos en localStorage
function savePhotos() {
    localStorage.setItem('pwa-camera-photos', JSON.stringify(photos));
    renderGallery();
}

// Renderizar galería de fotos
function renderGallery() {
    if (!galleryElement) return;
    
    galleryElement.innerHTML = '';

    if (photos.length === 0) {
        const emptyMessage = document.createElement('div');
        emptyMessage.className = 'gallery-empty-message';
        emptyMessage.innerHTML = `
            <span style="font-size: 2rem;">📸</span>
            <p style="margin: 0.5rem 0;">Toma algunas fotos y aparecerán aquí</p>
            <small style="opacity: 0.7;">Las fotos se guardarán automáticamente</small>
        `;
        galleryElement.appendChild(emptyMessage);
        return;
    }
    
    photos.forEach((photo, index) => {
        const item = document.createElement('div');
        item.className = 'gallery-item';
        
        const img = document.createElement('img');
        img.src = photo;
        img.alt = `Foto ${index + 1}`;
        
        const downloadBtn = document.createElement('div');
        downloadBtn.className = 'download-btn';
        downloadBtn.innerHTML = '⬇️';
        downloadBtn.onclick = () => downloadPhoto(photo, index);
        
        item.appendChild(img);
        item.appendChild(downloadBtn);
        galleryElement.appendChild(item);
    });
    
    // Mostrar/ocultar botón de limpiar
    if (clearGalleryBtn) {
        clearGalleryBtn.style.display = photos.length > 0 ? 'inline-flex' : 'none';
    }
}

// Descargar foto
function downloadPhoto(dataUrl, index) {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `foto-${index + 1}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function takePhoto() {
    if (!stream) {
        alert('Primero debes abrir la cámara');
        return;
    }

    // Capturar la foto
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageDataURL = canvas.toDataURL('image/png');
    
    // Guardar la foto en el array y localStorage
    photos.push(imageDataURL);
    savePhotos();
    
    // Crear y mostrar la notificación
    const notification = document.createElement('div');
    notification.textContent = '¡Foto guardada! 📸';
    notification.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: var(--primary-color);
        color: white;
        padding: 12px 24px;
        border-radius: 25px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 1000;
    `;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 2000);

    // No cerrar la cámara después de tomar la foto
    // closeCamera(); - Removemos esta línea para mantener la cámara abierta
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

// Limpiar galería
if (clearGalleryBtn) {
    clearGalleryBtn.addEventListener('click', () => {
        if (confirm('¿Estás seguro de que quieres eliminar todas las fotos?')) {
            photos = [];
            savePhotos();
        }
    });
}

window.addEventListener('beforeunload', () => {
    closeCamera();
});

// Navegación de la galería
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');

if (prevBtn && nextBtn && galleryElement) {
    prevBtn.addEventListener('click', () => {
        galleryElement.scrollBy({
            left: -300,
            behavior: 'smooth'
        });
    });

    nextBtn.addEventListener('click', () => {
        galleryElement.scrollBy({
            left: 300,
            behavior: 'smooth'
        });
    });

    // Mostrar/ocultar botones según la posición del scroll
    galleryElement.addEventListener('scroll', () => {
        const showPrev = galleryElement.scrollLeft > 0;
        const showNext = galleryElement.scrollLeft < (galleryElement.scrollWidth - galleryElement.clientWidth);
        
        prevBtn.style.display = showPrev ? 'flex' : 'none';
        nextBtn.style.display = showNext ? 'flex' : 'none';
    });
}

// También podemos usar las teclas de flecha para navegar
document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') {
        prevBtn?.click();
    } else if (e.key === 'ArrowRight') {
        nextBtn?.click();
    }
});

// Cargar fotos guardadas al iniciar
loadSavedPhotos();

console.log('📱 PWA Cámara cargada. Presiona F12 para abrir las herramientas de desarrollador y ver la consola.');