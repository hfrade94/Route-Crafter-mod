// Minimal in-browser navigation prototype.
// Tracks geolocation (or simulated steps) and measures proximity to the GPX route.

import { calculateDistance } from './utils.js';

export class NavigationPrototype {
    constructor(mapManager, routingManager) {
        this.map = mapManager.getMap();
        this.routingManager = routingManager;

        this.panel = document.getElementById('navigationPrototypePanel');
        this.statusEl = document.getElementById('navStatus');
        this.distanceEl = document.getElementById('navDistance');
        this.startBtn = document.getElementById('navStartBtn');
        this.stopBtn = document.getElementById('navStopBtn');
        this.simulateBtn = document.getElementById('navSimulateBtn');

        this.watchId = null;
        this.userMarker = null;
        this.simulationIndex = 0;
        this.cachedRoute = routingManager.getRoutePoints() || [];

        if (!this.panel) {
            return;
        }

        this.attachEventListeners();
        this.updateButtons();
        this.handleRouteChange(this.cachedRoute);
    }

    attachEventListeners() {
        this.startBtn?.addEventListener('click', () => this.startTracking());
        this.stopBtn?.addEventListener('click', () => this.stopTracking());
        this.simulateBtn?.addEventListener('click', () => this.advanceSimulation());

        document.addEventListener('routecrafter:route-updated', (event) => {
            const points = (event.detail && Array.isArray(event.detail.points)) ? event.detail.points : [];
            this.handleRouteChange(points);
        });

        window.addEventListener('beforeunload', () => this.stopTracking());
    }

    handleRouteChange(points) {
        this.cachedRoute = Array.isArray(points) ? points : [];
        if (!this.cachedRoute.length) {
            if (this.distanceEl) {
                this.distanceEl.textContent = '—';
            }
            this.simulationIndex = 0;
        } else {
            this.simulationIndex = 0;
        }
    }

    startTracking() {
        if (!('geolocation' in navigator)) {
            this.updateStatus('Geolocalização indisponível.');
            return;
        }

        if (!this.ensureRouteAvailable()) {
            return;
        }

        if (this.watchId) {
            return;
        }

        this.updateStatus('Solicitando GPS...');

        this.watchId = navigator.geolocation.watchPosition(
            (position) => {
                const coords = [position.coords.latitude, position.coords.longitude];
                this.updateStatus('Rastreamento ativo');
                this.renderUserMarker(coords, true);
                this.updateDistance(coords);
            },
            (error) => {
                this.updateStatus(`Erro no GPS: ${error.message}`);
                this.stopTracking();
            },
            {
                enableHighAccuracy: true,
                maximumAge: 1000,
                timeout: 15000
            }
        );

        this.updateButtons();
    }

    stopTracking() {
        if (this.watchId && navigator.geolocation && navigator.geolocation.clearWatch) {
            navigator.geolocation.clearWatch(this.watchId);
        }
        this.watchId = null;
        this.updateStatus('Rastreamento inativo');
        this.updateButtons();
    }

    advanceSimulation() {
        if (!this.ensureRouteAvailable()) {
            return;
        }

        if (!this.cachedRoute.length) {
            return;
        }

        const point = this.cachedRoute[this.simulationIndex];
        this.simulationIndex = (this.simulationIndex + Math.max(1, Math.floor(this.cachedRoute.length / 40))) % this.cachedRoute.length;

        this.renderUserMarker(point, true);
        this.updateDistance(point);
        this.updateStatus('Simulação manual (sem GPS)');
    }

    ensureRouteAvailable() {
        if (!this.cachedRoute || this.cachedRoute.length === 0) {
            alert('Gere ou aplique uma rota antes de usar o modo navegação.');
            return false;
        }
        return true;
    }

    renderUserMarker(latlng, panToPoint = false) {
        if (!latlng) {
            return;
        }

        if (!this.userMarker) {
            this.userMarker = L.circleMarker(latlng, {
                radius: 10,
                color: '#1d4ed8',
                weight: 3,
                fillColor: '#93c5fd',
                fillOpacity: 0.8
            }).addTo(this.map);
        } else {
            this.userMarker.setLatLng(latlng);
        }

        if (panToPoint) {
            this.map.panTo(latlng, { animate: false });
        }
    }

    updateDistance(latlng) {
        if (!this.distanceEl) {
            return;
        }
        
        if (!this.cachedRoute || this.cachedRoute.length === 0 || !latlng) {
            this.distanceEl.textContent = '—';
            return;
        }

        const userPoint = [latlng[0], latlng[1]];
        let closestDistanceKm = Infinity;

        for (let i = 0; i < this.cachedRoute.length; i++) {
            const routePoint = this.cachedRoute[i];
            const d = calculateDistance(userPoint, routePoint);
            if (d < closestDistanceKm) {
                closestDistanceKm = d;
            }
        }

        if (!isFinite(closestDistanceKm)) {
            this.distanceEl.textContent = '—';
            return;
        }

        if (closestDistanceKm >= 1) {
            this.distanceEl.textContent = `${closestDistanceKm.toFixed(2)} km`;
        } else {
            this.distanceEl.textContent = `${Math.round(closestDistanceKm * 1000)} m`;
        }
    }

    updateStatus(message) {
        if (this.statusEl) {
            this.statusEl.textContent = message;
        }
    }

    updateButtons() {
        if (this.startBtn) {
            this.startBtn.disabled = !!this.watchId;
        }
        if (this.stopBtn) {
            this.stopBtn.disabled = !this.watchId;
        }
    }

    reset() {
        this.stopTracking();
        this.cachedRoute = [];
        if (this.distanceEl) {
            this.distanceEl.textContent = '—';
        }
        this.updateStatus('Aguardando rota');
        if (this.userMarker) {
            this.map.removeLayer(this.userMarker);
            this.userMarker = null;
        }
    }
}

