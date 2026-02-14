// --- CONFIGURACIÓN DE RAZONES ---
const reasons = [
    "Porque 20 años a tu lado se han sentido como un suspiro.",
    "Por el regalo de ver crecer a Juanpi y sus casi 8 añitos.",
    "Porque eres mi mejor compañera de equipo en esta aventura.",
    "Por tu inteligencia que me desafía y admira cada día.",
    "Porque haces que nuestra casa sea un verdadero hogar.",
    "Por tu sonrisa que sigue iluminando mis días como al principio.",
    "Porque me apoyas en todas mis locuras tecnológicas.",
    "Porque cocinas con amor (y ese pastel de choclo es legendario).",
    "Por ser la madre increíble que eres.",
    "Porque si tuviera que elegir de nuevo, te elegiría mil veces."
];

let reasonIndex = 0;

// --- ELEMENTOS DOM ---
const generateBtn = document.getElementById('generate-love-btn');
const loveOutput = document.getElementById('love-reason');
const counterSpan = document.getElementById('counter');
const musicBtn = document.getElementById('play-music-btn');
const bgMusic = document.getElementById('bg-music');
const videoPlaceholder = document.querySelector('.video-placeholder');

// --- LÓGICA DE IA (SIMULADA) ---
generateBtn.addEventListener('click', () => {
    // Efecto "Calculando..."
    loveOutput.innerHTML = '<span class="cursor">_</span> Analizando terabytes de recuerdos...';
    generateBtn.disabled = true;

    setTimeout(() => {
        // Seleccionar razón (secuencial o aleatoria)
        const reason = reasons[reasonIndex];
        reasonIndex = (reasonIndex + 1) % reasons.length;

        // Efecto "Escribiendo" tipo máquina (Typewriter)
        const prefix = ">> RESULTADO: ";
        typeWriter(prefix + reason, loveOutput);
        generateBtn.disabled = false;
    }, 800);
});

function typeWriter(text, element) {
    element.innerHTML = '';
    let i = 0;
    const speed = 40;

    function type() {
        if (i < text.length) {
            element.innerHTML += text.charAt(i);
            i++;
            setTimeout(type, speed);
        } else {
            element.innerHTML += '<span class="cursor">_</span>';
        }
    }
    type();
}

// --- REPRODUCTOR DE MÚSICA ---
musicBtn.addEventListener('click', () => {
    if (bgMusic.paused) {
        bgMusic.play();
        musicBtn.innerHTML = '<i class="fa-solid fa-pause"></i> Pausar';
        videoPlaceholder.style.animation = "heartbeat 0.8s infinite";
    } else {
        bgMusic.pause();
        musicBtn.innerHTML = '<i class="fa-solid fa-music"></i> Reproducir';
        videoPlaceholder.style.animation = "heartbeat 1.2s infinite";
    }
});

// --- ANIMACIÓN "NEURAL HEART" (CANVAS) ---
const canvas = document.getElementById('neural-canvas');
const ctx = canvas.getContext('2d');

let width, height;
let particles = [];

function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
}

window.addEventListener('resize', resize);
resize();

class Particle {
    constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.vx = (Math.random() - 0.5) * 0.5;
        this.vy = (Math.random() - 0.5) * 0.5;
        this.size = Math.random() * 2 + 1;
        this.color = Math.random() > 0.5 ? '#ff007f' : '#00f3ff'; // Pink or Cyan
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;

        // Rebotar en bordes
        if (this.x < 0 || this.x > width) this.vx *= -1;
        if (this.y < 0 || this.y > height) this.vy *= -1;
    }

    draw() {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

function initParticles() {
    particles = [];
    const numParticles = Math.min(width * 0.1, 100); // 100 partículas max para rendimiento
    for (let i = 0; i < numParticles; i++) {
        particles.push(new Particle());
    }
}

function connectParticles() {
    for (let i = 0; i < particles.length; i++) {
        for (let j = i; j < particles.length; j++) {
            const dx = particles[i].x - particles[j].x;
            const dy = particles[i].y - particles[j].y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < 150) {
                ctx.strokeStyle = `rgba(255, 255, 255, ${1 - distance / 150})`;
                ctx.lineWidth = 0.5;
                ctx.beginPath();
                ctx.moveTo(particles[i].x, particles[i].y);
                ctx.lineTo(particles[j].x, particles[j].y);
                ctx.stroke();
            }
        }
    }
}

function animate() {
    ctx.clearRect(0, 0, width, height);

    // Dibujar un corazón sutil en el fondo (opcional, por ahora solo red neuronal)

    particles.forEach(p => {
        p.update();
        p.draw();
    });
    connectParticles();
    requestAnimationFrame(animate);
}

initParticles();
animate();

// --- GALERÍA INTERACTIVA (FLIP & LIGHTBOX) ---
document.addEventListener('DOMContentLoaded', () => {
    initGallery();
});

function initGallery() {
    const galleryGrid = document.querySelector('.gallery-grid');
    const existingItems = document.querySelectorAll('.gallery-item');

    // Create Lightbox DOM
    const lightbox = document.createElement('div');
    lightbox.className = 'lightbox';
    lightbox.innerHTML = `
        <span class="lightbox-close">&times;</span>
        <img src="" alt="Zoom">
    `;
    document.body.appendChild(lightbox);

    const lightboxImg = lightbox.querySelector('img');
    const lightboxClose = lightbox.querySelector('.lightbox-close');

    // Shuffle reasons for random assignment
    const shuffledReasons = [...reasons].sort(() => 0.5 - Math.random());

    existingItems.forEach((item, index) => {
        const img = item.querySelector('img');
        if (!img) return;

        const imgSrc = img.src;
        // Loop through reasons safely
        const message = shuffledReasons[index % shuffledReasons.length];

        // Create new Flip Card structure
        const card = document.createElement('div');
        card.className = 'gallery-card';
        card.innerHTML = `
            <div class="gallery-card-inner">
                <div class="gallery-card-front">
                    <img src="${imgSrc}" alt="Recuerdo" loading="lazy">
                </div>
                <div class="gallery-card-back">
                    <p>"${message}"</p>
                </div>
            </div>
        `;

        // Interaction: Click to open Lightbox
        // Note: The flip happens on hover via CSS. Click opens modal.
        card.addEventListener('click', () => {
            lightboxImg.src = imgSrc;
            lightbox.classList.add('active');
        });

        // Replace old item with new card
        galleryGrid.replaceChild(card, item);
    });

    // Close Lightbox Logic
    lightboxClose.addEventListener('click', () => {
        lightbox.classList.remove('active');
    });

    lightbox.addEventListener('click', (e) => {
        if (e.target !== lightboxImg) {
            lightbox.classList.remove('active');
        }
    });
}

// --- VIDEO MODAL LOGIC ---
document.addEventListener('DOMContentLoaded', () => {
    const openVideoBtn = document.getElementById('open-video-btn');
    const videoModal = document.getElementById('video-modal');
    const closeVideoBtn = document.getElementById('close-video-btn');
    const mainVideo = document.getElementById('main-video-player');

    if (openVideoBtn && videoModal && mainVideo) {
        openVideoBtn.addEventListener('click', () => {
            videoModal.classList.add('active');
            mainVideo.play();
        });

        const closeVideo = () => {
            videoModal.classList.remove('active');
            mainVideo.pause();
            mainVideo.currentTime = 0;
        };

        closeVideoBtn.addEventListener('click', closeVideo);

        videoModal.addEventListener('click', (e) => {
            if (e.target === videoModal) {
                closeVideo();
            }
        });
    }
});
