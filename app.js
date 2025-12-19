document.addEventListener('DOMContentLoaded', function() {
    window.currentService = null;
    window.isSpinning = false;
    
    initializeApp();
});

function initializeApp() {
    createParticles();
    updateWheelSegments();
    setupEventListeners();
    
    if (availableServices.length === 0) {
        document.getElementById('spin-btn').disabled = true;
        document.getElementById('spin-btn').innerHTML = '<span class="btn-text">ВСЕ ЗАБЛОКИРОВАНЫ</span><span class="btn-glow"></span><span class="btn-icon"><i class="fas fa-ban"></i></span>';
    }
    
    gsap.from('.header', {
        y: -30,
        opacity: 0,
        duration: 0.8,
        delay: 0.2
    });
    
    gsap.from('.roulette-container', {
        y: 30,
        opacity: 0,
        duration: 0.8,
        delay: 0.4
    });
    
    gsap.from('.registry-section', {
        y: 30,
        opacity: 0,
        duration: 0.8,
        delay: 0.6
    });
}

function createParticles() {
    const particles = document.getElementById('particles');
    const particleCount = 30;
    
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        
        const size = Math.random() * 2 + 1;
        const posX = Math.random() * 100;
        const posY = Math.random() * 100;
        const duration = Math.random() * 15 + 10;
        const delay = Math.random() * 5;
        const colors = ['#00f3ff', '#ff0055', '#ffaa00', '#00ff88'];
        const color = colors[Math.floor(Math.random() * colors.length)];
        
        particle.style.cssText = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            background: ${color};
            border-radius: 50%;
            left: ${posX}%;
            top: ${posY}%;
            opacity: ${Math.random() * 0.2 + 0.1};
            pointer-events: none;
        `;
        
        particles.appendChild(particle);
        
        gsap.to(particle, {
            x: `+=${(Math.random() - 0.5) * 80}`,
            y: `+=${(Math.random() - 0.5) * 80}`,
            duration: duration,
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut",
            delay: delay
        });
    }
}

function updateWheelSegments() {
    const wheelSegments = document.getElementById('wheel-segments');
    wheelSegments.innerHTML = '';
    
    const segmentCount = Math.min(12, availableServices.length);
    const angleStep = 360 / segmentCount;
    
    for (let i = 0; i < segmentCount; i++) {
        const serviceIndex = i % availableServices.length;
        const service = availableServices[serviceIndex];
        const segment = document.createElement('div');
        segment.className = 'segment';
        segment.dataset.id = service.id;
        segment.dataset.index = i;
        
        segment.style.transform = `rotate(${i * angleStep}deg)`;
        
        const content = document.createElement('div');
        content.className = 'segment-content';
        content.innerHTML = `
            <span class="segment-icon"><i class="${service.icon}"></i></span>
            <span>${service.name}</span>
        `;
        
        segment.appendChild(content);
        wheelSegments.appendChild(segment);
    }
    
    const spinBtn = document.getElementById('spin-btn');
    if (availableServices.length === 0) {
        spinBtn.disabled = true;
        spinBtn.innerHTML = '<span class="btn-text">ВСЕ ЗАБЛОКИРОВАНЫ</span><span class="btn-glow"></span><span class="btn-icon"><i class="fas fa-ban"></i></span>';
    } else {
        spinBtn.disabled = false;
        spinBtn.innerHTML = '<span class="btn-text">ЗАПУСТИТЬ РУЛЕТКУ</span><span class="btn-glow"></span><span class="btn-icon"><i class="fas fa-play"></i></span>';
    }
}

function setupEventListeners() {
    document.getElementById('spin-btn').addEventListener('click', spinRoulette);
    document.getElementById('ban-btn').addEventListener('click', banService);
    document.getElementById('cancel-btn').addEventListener('click', cancelDecision);
    document.getElementById('delete-btn').addEventListener('click', deleteService);
    document.getElementById('clear-registry').addEventListener('click', () => registry.clear());
    document.getElementById('export-registry').addEventListener('click', () => registry.export());
    
    document.addEventListener('click', function(e) {
        if (e.target.closest('.segment')) {
            const segment = e.target.closest('.segment');
            if (!isSpinning) {
                const serviceId = parseInt(segment.dataset.id);
                selectService(serviceId);
            }
        }
    });
}

function spinRoulette() {
    if (isSpinning || availableServices.length === 0) return;
    
    isSpinning = true;
    const wheel = document.getElementById('roulette-wheel');
    const spinBtn = document.getElementById('spin-btn');
    
    wheel.classList.add('wheel-spinning');
    spinBtn.disabled = true;
    spinBtn.innerHTML = '<span class="btn-text">КРУТИМ...</span><span class="btn-glow"></span><span class="btn-icon"><i class="fas fa-spinner fa-spin"></i></span>';
    
    const spinDuration = Math.random() * 2000 + 3000;
    const targetRotation = Math.random() * 720 + 1080;
    
    gsap.to(wheel, {
        rotation: targetRotation,
        duration: spinDuration / 1000,
        ease: "power3.out",
        onComplete: () => {
            wheel.classList.remove('wheel-spinning');
            isSpinning = false;
            
            if (availableServices.length > 0) {
                spinBtn.disabled = false;
                spinBtn.innerHTML = '<span class="btn-text">ЗАПУСТИТЬ РУЛЕТКУ</span><span class="btn-glow"></span><span class="btn-icon"><i class="fas fa-play"></i></span>';
                
                const normalizedRotation = targetRotation % 360;
                selectRandomService(normalizedRotation);
            }
        }
    });
}

function selectRandomService(rotation) {
    const segmentCount = Math.min(12, availableServices.length);
    const segmentAngle = 360 / segmentCount;
    
    let selectedIndex = Math.floor((360 - rotation % 360) / segmentAngle);
    selectedIndex = selectedIndex % segmentCount;
    
    const segment = document.querySelector(`.segment[data-index="${selectedIndex}"]`);
    if (segment) {
        const serviceId = parseInt(segment.dataset.id);
        selectService(serviceId);
        
        gsap.to(segment, {
            scale: 1.05,
            duration: 0.3,
            repeat: 3,
            yoyo: true
        });
    }
}

function selectService(serviceId) {
    const service = availableServices.find(s => s.id === serviceId);
    if (service) {
        currentService = service;
        
        document.getElementById('current-selection').textContent = service.name;
        document.getElementById('service-name').textContent = service.name;
        document.getElementById('service-icon').innerHTML = `<i class="${service.icon}"></i>`;
        document.getElementById('service-users').textContent = service.users;
        document.getElementById('service-country').textContent = service.country;
        document.getElementById('service-risk').textContent = service.risk;
        
        const decisionPanel = document.getElementById('decision-panel');
        gsap.killTweensOf(decisionPanel);
        decisionPanel.style.display = 'block';
        
        gsap.fromTo(decisionPanel,
            { opacity: 0, y: 20 },
            { opacity: 1, y: 0, duration: 0.5 }
        );
        
        gsap.from('.decision-btn', {
            scale: 0,
            opacity: 0,
            duration: 0.3,
            stagger: 0.1
        });
    }
}

function banService() {
    if (!currentService) {
        registry.showNotification('Сначала выберите сервис!', 'warning');
        return;
    }
    
    const success = registry.add(currentService);
    
    if (success) {
        hideDecisionPanel();
        
        gsap.to('#blocked-count', {
            innerText: registry.blockedServices.length,
            duration: 0.5,
            snap: { innerText: 1 }
        });
        
        gsap.to('#success-rate', {
            innerText: Math.round((registry.blockedServices.length / services.length) * 100) + '%',
            duration: 0.5
        });
    }
}

function cancelDecision() {
    hideDecisionPanel();
}

function deleteService() {
    if (!currentService) return;
    
    if (confirm(`Удалить ${currentService.name} навсегда из системы?`)) {
        const success = registry.permanentlyDelete(currentService);
        
        if (success) {
            hideDecisionPanel();
        }
    }
}

function hideDecisionPanel() {
    const decisionPanel = document.getElementById('decision-panel');
    
    gsap.to(decisionPanel, {
        opacity: 0,
        y: 20,
        duration: 0.3,
        onComplete: () => {
            decisionPanel.style.display = 'none';
            currentService = null;
            document.getElementById('current-selection').textContent = "—";
            
            document.getElementById('service-name').textContent = "Выберите сервис";
            document.getElementById('service-icon').innerHTML = '<i class="fas fa-question"></i>';
            document.getElementById('service-users').textContent = "—";
            document.getElementById('service-country').textContent = "—";
            document.getElementById('service-risk').textContent = "—";
        }
    });
}

window.updateWheelSegments = updateWheelSegments;
window.registry = registry;

window.addEventListener('resize', updateWheelSegments);