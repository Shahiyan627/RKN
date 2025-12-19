class Registry {
    constructor() {
        this.blockedServices = JSON.parse(localStorage.getItem('rkn_registry')) || [];
        this.updateDisplay();
        this.updateStats();
        this.updateAvailableServices();
    }

    updateAvailableServices() {
        const blockedIds = this.blockedServices.map(s => s.id);
        availableServices = services.filter(service => !blockedIds.includes(service.id));
        
        if (typeof updateWheelSegments === 'function') {
            updateWheelSegments();
        }
        
        document.getElementById('total-services').textContent = services.length;
    }

    add(service) {
        if (!service || !service.id) {
            console.error('Invalid service:', service);
            return false;
        }
        
        const isAlreadyBlocked = this.blockedServices.some(s => s.id === service.id);
        if (!isAlreadyBlocked) {
            const blockedService = {
                ...service,
                blockedDate: new Date().toLocaleDateString('ru-RU'),
                blockedTime: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
            };
            
            this.blockedServices.unshift(blockedService);
            this.save();
            this.updateDisplay();
            this.updateStats();
            this.updateAvailableServices();
            
            this.showNotification(`${service.name} добавлен в реестр`, 'danger');
            
            return true;
        } else {
            this.showNotification(`${service.name} уже заблокирован`, 'warning');
            return false;
        }
    }

    remove(serviceId) {
        const serviceIndex = this.blockedServices.findIndex(s => s.id === serviceId);
        if (serviceIndex > -1) {
            const service = this.blockedServices[serviceIndex];
            this.blockedServices.splice(serviceIndex, 1);
            this.save();
            this.updateDisplay();
            this.updateStats();
            this.updateAvailableServices();
            
            this.showNotification(`${service.name} удален из реестра`, 'warning');
            return true;
        }
        return false;
    }

    permanentlyDelete(service) {
        if (!service || !service.id) return false;
        
        const serviceIndex = services.findIndex(s => s.id === service.id);
        if (serviceIndex > -1) {
            services.splice(serviceIndex, 1);
            
            const blockedIndex = this.blockedServices.findIndex(s => s.id === service.id);
            if (blockedIndex > -1) {
                this.blockedServices.splice(blockedIndex, 1);
            }
            
            this.save();
            this.updateDisplay();
            this.updateStats();
            this.updateAvailableServices();
            
            this.showNotification(`${service.name} полностью удален из системы`, 'success');
            return true;
        }
        return false;
    }

    clear() {
        if (this.blockedServices.length > 0) {
            this.blockedServices = [];
            this.save();
            this.updateDisplay();
            this.updateStats();
            this.updateAvailableServices();
            this.showNotification('Реестр полностью очищен', 'danger');
            return true;
        }
        this.showNotification('Реестр и так пуст', 'warning');
        return false;
    }

    export() {
        if (this.blockedServices.length === 0) {
            this.showNotification('Реестр пуст', 'warning');
            return;
        }
        
        const dataStr = JSON.stringify(this.blockedServices, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileDefaultName = `rkn_registry_${new Date().toISOString().slice(0,10)}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        document.body.appendChild(linkElement);
        linkElement.click();
        document.body.removeChild(linkElement);
        
        this.showNotification('Реестр экспортирован в JSON', 'primary');
    }

    save() {
        localStorage.setItem('rkn_registry', JSON.stringify(this.blockedServices));
    }

    updateDisplay() {
        const registryList = document.getElementById('registry-list');
        
        if (this.blockedServices.length === 0) {
            registryList.innerHTML = `
                <div class="empty-registry">
                    <i class="fas fa-inbox"></i>
                    <p>Реестр пуст. Заблокируйте первый сервис!</p>
                </div>
            `;
            return;
        }
        
        registryList.innerHTML = this.blockedServices.map(service => `
            <div class="registry-item" data-id="${service.id}">
                <div class="item-main">
                    <div class="item-icon">
                        <i class="${service.icon}"></i>
                    </div>
                    <div class="item-info">
                        <h4>${service.name}</h4>
                        <div class="item-details">
                            <span class="item-users"><i class="fas fa-users"></i> ${service.users}</span>
                            <span class="item-country"><i class="fas fa-globe"></i> ${service.country}</span>
                            <span class="item-date"><i class="fas fa-calendar"></i> ${service.blockedDate} ${service.blockedTime}</span>
                        </div>
                    </div>
                </div>
                <div class="item-actions">
                    <button class="item-btn btn-unban" title="Разблокировать">
                        <i class="fas fa-unlock"></i>
                    </button>
                    <button class="item-btn btn-delete-reg" title="Удалить навсегда">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
            </div>
        `).join('');
        
        this.addEventListeners();
    }

    addEventListeners() {
        document.querySelectorAll('.btn-unban').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const item = e.target.closest('.registry-item');
                const serviceId = parseInt(item.dataset.id);
                this.remove(serviceId);
            });
        });
        
        document.querySelectorAll('.btn-delete-reg').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const item = e.target.closest('.registry-item');
                const serviceId = parseInt(item.dataset.id);
                const service = this.blockedServices.find(s => s.id === serviceId);
                
                if (service && confirm(`Удалить ${service.name} навсегда из системы?`)) {
                    this.permanentlyDelete(service);
                }
            });
        });
    }

    updateStats() {
        document.getElementById('blocked-count').textContent = this.blockedServices.length;
        
        const successRate = Math.round((this.blockedServices.length / services.length) * 100);
        document.getElementById('success-rate').textContent = `${successRate}%`;
    }

    showNotification(message, type) {
        const existingNotifications = document.querySelectorAll('.notification');
        existingNotifications.forEach(n => n.remove());
        
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-${type === 'danger' ? 'exclamation-triangle' : type === 'warning' ? 'exclamation-circle' : 'check-circle'}"></i>
                <span>${message}</span>
            </div>
            <div class="notification-progress"></div>
        `;
        
        document.body.appendChild(notification);
        
        gsap.fromTo(notification, 
            { y: -50, opacity: 0 },
            { y: 15, opacity: 1, duration: 0.3, ease: "back.out(1)" }
        );
        
        setTimeout(() => {
            gsap.to(notification, {
                y: -50,
                opacity: 0,
                duration: 0.3,
                onComplete: () => {
                    if (notification.parentNode) {
                        notification.remove();
                    }
                }
            });
        }, 3000);
    }
}

const registry = new Registry();