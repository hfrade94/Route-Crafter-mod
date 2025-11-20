// CPP solution parsing and visualization module

export class SolutionVisualizer {
    constructor(mapManager, routingManager) {
        this.mapManager = mapManager;
        this.routingManager = routingManager;
        
        this.cppSolutionLayer = null;
        this.solutionDirectionLayer = null;
        this.turnNumbersLayer = null;
    }

    getCppSolutionLayer() {
        return this.cppSolutionLayer;
    }

    handleCPPSolutionText(solutionText, nodeIdToCoordinateMap) {
        try {
            const solutionPath = this.parseOARLibSolution(solutionText);
            if (solutionPath && solutionPath.length > 0) {
                this.visualizeCPPSolution(solutionPath, nodeIdToCoordinateMap);
                // Optionally clear the textarea after successful application
                // document.getElementById('oarlibSolutionTextarea').value = '';
            } else {
                alert('No valid path found in the solution text. Please check the format.');
            }
        } catch (error) {
            console.error('Error parsing solution:', error);
            alert('Error parsing solution. Please check the format and try again.\n\nExpected format: Route with vertex IDs like [1-22-21-20-...] or one vertex ID per line.');
        }
    }

    parseOARLibSolution(fileText) {
        const lines = fileText.trim().split('\n');
        let vertexPath = [];
        let inRouteSection = false;
        
        for (const line of lines) {
            const trimmedLine = line.trim();
            if (!trimmedLine) continue;
            
            // Look for the route section
            if (trimmedLine.includes('[') && trimmedLine.includes(']')) {
                inRouteSection = true;
                // Extract the route from the line like: [1-22-21-20-...]
                const routeMatch = trimmedLine.match(/\[([^\]]+)\]/);
                if (routeMatch) {
                    const routeString = routeMatch[1];
                    const vertices = routeString.split('-').map(v => parseInt(v.trim()));
                    
                    // Filter out any invalid vertex IDs
                    vertexPath = vertices.filter(v => !isNaN(v));
                    break;
                }
            }
        }
        
        if (vertexPath.length === 0) {
            // Fallback to CSV parsing for backward compatibility
            return this.parseCPPSolutionCSV(fileText);
        }
        
        console.log('Parsed OARLib solution path:', vertexPath);
        return vertexPath;
    }

    parseCPPSolutionCSV(csvText) {
        const lines = csvText.trim().split('\n');
        const vertexPath = [];
        
        for (const line of lines) {
            const trimmedLine = line.trim();
            if (!trimmedLine) continue;
            
            const vertex = parseInt(trimmedLine);
            if (isNaN(vertex)) {
                console.warn('Skipping invalid vertex ID:', trimmedLine);
                continue;
            }
            
            vertexPath.push(vertex);
        }
        
        if (vertexPath.length === 0) {
            alert('No valid vertex IDs found in the CSV file. Expected format: single vertex ID per line (e.g., 28, 29, 28, 27...)');
            return null;
        }
        
        console.log('Parsed vertex path:', vertexPath);
        return vertexPath;
    }

    visualizeCPPSolution(vertexPath, nodeIdToCoordinateMap) {
        // Remove existing CPP solution layer
        if (this.cppSolutionLayer) {
            this.mapManager.getMap().removeLayer(this.cppSolutionLayer);
            this.cppSolutionLayer = null;
        }

        if (!vertexPath || vertexPath.length === 0) {
            alert('No valid vertex path found in the CSV file.');
            return;
        }

        // Reconstruct the path from vertex sequence
        const reconstructedPath = this.reconstructPathFromVertices(vertexPath, nodeIdToCoordinateMap);
        const hasCoordinateMappings = nodeIdToCoordinateMap.size > 0;
        
        if (reconstructedPath.length === 0) {
            alert('Unable to reconstruct path from the provided vertex IDs. The node IDs may not correspond to existing map features.');
            return;
        }

        // Create a polyline for the solution path
        const pathLayer = L.polyline(reconstructedPath, {
            color: '#0d47a1',
            weight: 7,
            opacity: 1,
            lineCap: 'round',
            className: 'route-solution-line',
            interactive: false // Não interativo para não bloquear cliques no Trim Mode
        });

        // Create a feature group to hold solution elements (path only)
        this.cppSolutionLayer = L.featureGroup([pathLayer]);
        
        // No popup for CPP solution path to avoid intrusive popups in the UI.
        // (Previously displayed "Chinese Postman Solution (Vertex Path)")
        this.cppSolutionLayer.addTo(this.mapManager.getMap());
        
        // Create direction arrows and turn number markers
        this.addSolutionDirectionArrows(reconstructedPath);
        
        // Add arrow markers to map with high z-index to appear above route line
        if (this.solutionDirectionLayer) {
            this.solutionDirectionLayer.addTo(this.mapManager.getMap());
            // Ensure arrows are above the route line
            if (typeof this.solutionDirectionLayer.bringToFront === 'function') {
                this.solutionDirectionLayer.bringToFront();
            }
        }
        
        // Add turn number markers to map (above arrows)
        if (this.turnNumbersLayer) {
            this.turnNumbersLayer.addTo(this.mapManager.getMap());
            // Ensure turn numbers are above everything
            if (typeof this.turnNumbersLayer.bringToFront === 'function') {
                this.turnNumbersLayer.bringToFront();
            }
        }
        // Não trazer para frente automaticamente - deixar o Trim Mode controlar a ordem das camadas
        // Se o Trim Mode estiver ativo, o geoJsonLayer deve ficar acima
        if (typeof this.cppSolutionLayer.bringToFront === 'function') {
            // Verificar se o Trim Mode está ativo antes de trazer para frente
            const roadProcessor = window.app && window.app.roadProcessor;
            if (!roadProcessor || !roadProcessor.isTrimModeActive()) {
                this.cppSolutionLayer.bringToFront();
            }
        }

        // Fit map to show the solution path
        if (this.cppSolutionLayer.getBounds().isValid()) {
            this.mapManager.getMap().fitBounds(this.cppSolutionLayer.getBounds());
        }

        // Update route length display
        const mappingNote = hasCoordinateMappings ? 
            '<br><span style="color: green;">✓</span> Mapped to actual road coordinates' : 
            '<br><span style="color: orange;">⚠</span> Demonstration path (fetch roads first for real mapping)';
        
        const animationNote = reconstructedPath.length > 0 ? 
            '<br><span style="color: #007bff;">🎬</span> Ready for animation - click "Play Route" to animate' : '';
        
        // Compute total route length (kilometers) for the CPP solution
        const totalKm = (function computeTotalKm(path) {
            if (!path || path.length < 2) return 0;
            let sum = 0;
            for (let i = 1; i < path.length; i++) {
                const a = path[i - 1];
                const b = path[i];
                // a and b are [lat, lng]
                const R = 6371; // km
                const dLat = (b[0] - a[0]) * Math.PI / 180;
                const dLon = (b[1] - a[1]) * Math.PI / 180;
                const lat1 = a[0] * Math.PI / 180;
                const lat2 = b[0] * Math.PI / 180;
                const sinDLat = Math.sin(dLat/2);
                const sinDLon = Math.sin(dLon/2);
                const c = 2 * Math.atan2(Math.sqrt(sinDLat*sinDLat + Math.cos(lat1)*Math.cos(lat2)*sinDLon*sinDLon), Math.sqrt(1 - (sinDLat*sinDLat + Math.cos(lat1)*Math.cos(lat2)*sinDLon*sinDLon)));
                sum += R * c;
            }
            return sum;
        })(reconstructedPath);

        const totalKmStr = totalKm ? totalKm.toFixed(2) : '0.00';

        // Insert a single-line route length (km + mi) into the stats panel without extra verbosity
        try {
                const routeLengthEl = document.getElementById('routeLength');
                if (routeLengthEl) {
                    const miles = totalKm * 0.621371;
                    const milesStr = miles ? miles.toFixed(2) : '0.00';

                    // Build inline span for length (no enclosing div as requested)
                    const lengthSpanHtml = `<span class="cpp-length"><strong>Route Length:</strong> ${totalKmStr} km (${milesStr} mi)</span>`;

                    // Efficiency: total road length / route length
                    let efficiencyHtml = '';
                    try {
                        // Prefer largest component required road length first. Fall back to required road length, then total length.
                        const largestComponentRequiredRoadKm = (typeof window !== 'undefined' && window.largestComponentRequiredRoadLengthKm != null) ? window.largestComponentRequiredRoadLengthKm : null;
                        const requiredRoadKm = (typeof window !== 'undefined' && window.requiredRoadLengthKm != null) ? window.requiredRoadLengthKm : null;
                        const totalRoadKm = (typeof window !== 'undefined' && window.totalRoadLengthKm != null) ? window.totalRoadLengthKm : null;
                        const baseLengthKm = (largestComponentRequiredRoadKm != null) ? largestComponentRequiredRoadKm : (requiredRoadKm != null) ? requiredRoadKm : totalRoadKm;

                        if (baseLengthKm && totalKm > 0) {
                            const efficiency = (baseLengthKm / totalKm) * 100;
                            const effStr = isFinite(efficiency) ? efficiency.toFixed(1) : '0.0';
                            // Use a single label 'Efficiency' regardless of which base length was used
                            efficiencyHtml = `<br><span class="cpp-efficiency"><strong>Efficiency:</strong> ${effStr}%</span>`;
                        } else if (baseLengthKm && totalKm === 0) {
                            efficiencyHtml = `<br><span class="cpp-efficiency"><strong>Efficiency:</strong> N/A</span>`;
                        }
                    } catch (err) {
                        console.warn('Error computing efficiency:', err);
                    }

                    // Update existing length span if present, otherwise append
                    const existing = routeLengthEl.querySelector('.cpp-length');
                    if (existing) {
                        // replace the span and following efficiency if present
                        let next = existing.nextSibling;
                        // Remove any following .cpp-efficiency nodes
                        while (next) {
                            if (next.nodeType === 1 && next.classList && next.classList.contains('cpp-efficiency')) {
                                const toRemove = next;
                                next = next.nextSibling;
                                toRemove.remove();
                            } else {
                                next = next.nextSibling;
                            }
                        }
                        existing.outerHTML = lengthSpanHtml + efficiencyHtml;
                    } else {
                        routeLengthEl.insertAdjacentHTML('beforeend', lengthSpanHtml + efficiencyHtml);
                    }
                }
        } catch (err) {
            console.warn('Failed to insert route length:', err);
        }

        // Set route points for animation
        this.routingManager.setRoutePoints(reconstructedPath);
        
        try {
            document.dispatchEvent(new CustomEvent('routecrafter:route-updated', { detail: { points: reconstructedPath } }));
        } catch (err) {
            console.warn('Failed to dispatch route updated event:', err);
        }
        
        console.log('CPP Solution visualized:', vertexPath);
        console.log('Route points set for animation:', reconstructedPath.length);
    }

    reconstructPathFromVertices(vertexPath, nodeIdToCoordinateMap) {
        // Reconstruct the path using stored coordinate mappings for vertex sequence
        if (vertexPath.length === 0) {
            return [];
        }
        
        const reconstructedPath = [];
        
        // Map each vertex ID to its coordinate
        for (const vertexId of vertexPath) {
            const coord = nodeIdToCoordinateMap.get(vertexId);
            if (coord) {
                // Convert [lng, lat] to [lat, lng]
                reconstructedPath.push([coord[1], coord[0]]);
            }
        }
        
        // If we couldn't map any coordinates, fall back to a demonstration path
        if (reconstructedPath.length === 0) {
            console.warn('No coordinate mappings found for vertex path. This might be because no roads have been fetched yet.');
            return this.createVertexDemonstrationPath(vertexPath);
        }
        
        // Remove duplicate consecutive coordinates to create a cleaner path
        return this.removeDuplicateCoordinates(reconstructedPath);
    }

    removeDuplicateCoordinates(path) {
        if (path.length <= 1) return path;
        
        const cleanedPath = [path[0]];
        
        for (let i = 1; i < path.length; i++) {
            const current = path[i];
            const previous = cleanedPath[cleanedPath.length - 1];
            
            // Check if coordinates are different (with small tolerance for floating point precision)
            const tolerance = 0.000001;
            if (Math.abs(current[0] - previous[0]) > tolerance || Math.abs(current[1] - previous[1]) > tolerance) {
                cleanedPath.push(current);
            }
        }
        
        return cleanedPath;
    }

    createVertexDemonstrationPath(vertexPath) {
        // Fallback: Create a demonstration path when no coordinate mappings exist for vertex path
        const reconstructedPath = [];
        
        const centerLat = 51.505;
        const centerLng = -0.09;
        const radius = 0.05; // degrees
        
        // Start from the center
        let currentLat = centerLat;
        let currentLng = centerLng;
        reconstructedPath.push([currentLat, currentLng]);
        
        // Create a connected path that represents the vertex sequence
        let angle = 0;
        const angleStep = (2 * Math.PI) / Math.max(vertexPath.length, 10);
        
        for (let i = 0; i < vertexPath.length; i++) {
            const vertexId = vertexPath[i];
            
            // Calculate next position based on angle and vertex ID
            const latOffset = (radius * Math.cos(angle)) * (0.3 + (vertexId % 10) / 100);
            const lngOffset = (radius * Math.sin(angle)) * (0.3 + (vertexId % 10) / 100);
            
            currentLat += latOffset;
            currentLng += lngOffset;
            
            reconstructedPath.push([currentLat, currentLng]);
            
            // Adjust angle for next point to create a more realistic path
            angle += angleStep * (0.7 + (vertexId % 5) / 50);
        }
        
        return this.smoothPath(reconstructedPath);
    }

    smoothPath(path) {
        if (path.length < 3) return path;
        
        const smoothed = [path[0]];
        
        for (let i = 1; i < path.length - 1; i++) {
            const prev = path[i - 1];
            const curr = path[i];
            const next = path[i + 1];
            
            // Simple smoothing by averaging adjacent points
            const smoothedLat = (prev[0] + curr[0] + next[0]) / 3;
            const smoothedLng = (prev[1] + curr[1] + next[1]) / 3;
            
            smoothed.push([smoothedLat, smoothedLng]);
        }
        
        smoothed.push(path[path.length - 1]);
        return smoothed;
    }

    // Calculate bearing (direction) between two points in degrees
    calculateBearing(point1, point2) {
        const lat1 = point1[0] * Math.PI / 180;
        const lat2 = point2[0] * Math.PI / 180;
        const dLon = (point2[1] - point1[1]) * Math.PI / 180;
        
        const y = Math.sin(dLon) * Math.cos(lat2);
        const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
        
        const bearing = (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
        return bearing;
    }

    // Create arrow icon using SVG (rotatable)
    createArrowIcon(bearing, size = 18) {
        // Normalize bearing to 0-360
        const normalizedBearing = ((bearing % 360) + 360) % 360;
        
        // Create SVG arrow that points in the direction of travel
        // Arrow points upward (0°) by default, then we rotate it based on bearing
        const svg = `
            <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" style="transform: rotate(${normalizedBearing}deg);">
                <defs>
                    <filter id="arrowShadow">
                        <feDropShadow dx="0" dy="1" stdDeviation="1.5" flood-color="rgba(0, 0, 0, 0.8)"/>
                    </filter>
                </defs>
                <path d="M ${size/2} ${size * 0.15} 
                        L ${size * 0.2} ${size * 0.6} 
                        L ${size * 0.4} ${size * 0.6} 
                        L ${size * 0.4} ${size * 0.85} 
                        L ${size * 0.6} ${size * 0.85} 
                        L ${size * 0.6} ${size * 0.6} 
                        L ${size * 0.8} ${size * 0.6} 
                        Z" 
                      fill="#ffffff" 
                      stroke="#0d47a1" 
                      stroke-width="0.5" 
                      filter="url(#arrowShadow)"
                      opacity="1"/>
            </svg>
        `;
        
        return L.divIcon({
            className: 'route-arrow-icon',
            html: svg,
            iconSize: [size, size],
            iconAnchor: [size/2, size/2]
        });
    }

    // Calculate angle difference between two bearings
    calculateAngleDifference(bearing1, bearing2) {
        let diff = Math.abs(bearing1 - bearing2);
        if (diff > 180) {
            diff = 360 - diff;
        }
        return diff;
    }

    // Create numbered turn marker icon
    createTurnNumberIcon(number, size = 20) {
        const svg = `
            <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
                <circle cx="${size/2}" cy="${size/2}" r="${size/2 - 2}" 
                        fill="#ffffff" 
                        stroke="#0d47a1" 
                        stroke-width="2" 
                        opacity="1"/>
                <text x="${size/2}" y="${size/2}" 
                      text-anchor="middle" 
                      dominant-baseline="central" 
                      font-family="Arial, sans-serif" 
                      font-size="${size * 0.5}" 
                      font-weight="bold" 
                      fill="#0d47a1">${number}</text>
            </svg>
        `;
        return L.divIcon({
            className: 'route-turn-number-icon',
            html: svg,
            iconSize: [size, size],
            iconAnchor: [size/2, size/2]
        });
    }

    addSolutionDirectionArrows(path) {
        if (!path || path.length < 2) {
            return;
        }
        if (typeof L === 'undefined') {
            return;
        }
        
        // Remove existing direction layer
        if (this.solutionDirectionLayer) {
            if (this.solutionDirectionLayer._map) {
                this.mapManager.getMap().removeLayer(this.solutionDirectionLayer);
            }
            this.solutionDirectionLayer = null;
        }
        
        // Remove existing turn numbers layer
        if (this.turnNumbersLayer) {
            if (this.turnNumbersLayer._map) {
                this.mapManager.getMap().removeLayer(this.turnNumbersLayer);
            }
            this.turnNumbersLayer = null;
        }
        
        try {
            // Convert path to arrays [lat, lng]
            const formattedPath = path.map(point => {
                if (Array.isArray(point) && point.length >= 2) {
                    return [point[0], point[1]];
                }
                if (point && point.lat !== undefined && point.lng !== undefined) {
                    return [point.lat, point.lng];
                }
                return point;
            });
            
            // Create layer groups
            this.solutionDirectionLayer = L.layerGroup();
            this.turnNumbersLayer = L.layerGroup();
            
            // Detect turn points (where direction changes significantly in straight segments)
            // Ignore gradual curves and roundabouts
            const turnPoints = [];
            const minTurnAngle = 30; // Minimum angle change to consider a turn (degrees) - increased to filter gradual curves
            const minDistanceBetweenTurns = 30; // Minimum distance in meters between turn points
            const lookAheadDistance = 50; // Look ahead distance in meters to detect gradual curves
            
            // Helper function to calculate distance between two points in meters
            const calculateDistanceMeters = (point1, point2) => {
                const R = 6371000; // Earth radius in meters
                const lat1 = point1[0] * Math.PI / 180;
                const lat2 = point2[0] * Math.PI / 180;
                const dLat = (point2[0] - point1[0]) * Math.PI / 180;
                const dLon = (point2[1] - point1[1]) * Math.PI / 180;
                const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                         Math.cos(lat1) * Math.cos(lat2) *
                         Math.sin(dLon/2) * Math.sin(dLon/2);
                const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
                return R * c;
            };
            
            // Helper function to check if a point is part of a gradual curve
            const isGradualCurve = (startIdx, endIdx, path) => {
                if (endIdx - startIdx < 3) return false;
                
                // Calculate total angle change over the curve segment
                let totalAngleChange = 0;
                let segmentCount = 0;
                
                for (let i = startIdx; i < endIdx - 1; i++) {
                    const bearing1 = this.calculateBearing(path[i], path[i + 1]);
                    const bearing2 = i < endIdx - 2 ? this.calculateBearing(path[i + 1], path[i + 2]) : bearing1;
                    const angleDiff = this.calculateAngleDifference(bearing1, bearing2);
                    totalAngleChange += angleDiff;
                    segmentCount++;
                }
                
                // Calculate average angle change per segment
                const avgAngleChange = segmentCount > 0 ? totalAngleChange / segmentCount : 0;
                
                // If average angle change is small (< 10 degrees), it's a gradual curve
                // Also check if total distance is long (indicating a roundabout or long curve)
                const totalDistance = calculateDistanceMeters(path[startIdx], path[endIdx]);
                
                return avgAngleChange < 10 && totalDistance > 20; // Gradual curve over long distance
            };
            
            // Find significant turn points, skipping gradual curves
            for (let i = 2; i < formattedPath.length - 2; i++) {
                // Look ahead to see if this is part of a gradual curve
                let lookAheadIdx = i;
                let lookAheadDistance = 0;
                
                // Find how far ahead we need to look
                while (lookAheadIdx < formattedPath.length - 1 && lookAheadDistance < lookAheadDistance) {
                    lookAheadDistance += calculateDistanceMeters(formattedPath[lookAheadIdx], formattedPath[lookAheadIdx + 1]);
                    lookAheadIdx++;
                }
                
                // Check if this point is part of a gradual curve
                if (isGradualCurve(Math.max(0, i - 2), Math.min(formattedPath.length - 1, lookAheadIdx), formattedPath)) {
                    continue; // Skip gradual curves
                }
                
                // Check angle change at this point
                const prevPoint = formattedPath[i - 1];
                const currentPoint = formattedPath[i];
                const nextPoint = formattedPath[i + 1];
                
                // Calculate bearings over longer segments to detect real turns, not small wiggles
                const segmentLength = 2; // Use 2-3 points ahead/behind for more stable bearing calculation
                const prevSegmentPoint = formattedPath[Math.max(0, i - segmentLength)];
                const nextSegmentPoint = formattedPath[Math.min(formattedPath.length - 1, i + segmentLength)];
                
                const bearing1 = this.calculateBearing(prevSegmentPoint, currentPoint);
                const bearing2 = this.calculateBearing(currentPoint, nextSegmentPoint);
                
                // Calculate angle difference
                const angleDiff = this.calculateAngleDifference(bearing1, bearing2);
                
                // If angle change is significant, check distance from last turn point
                if (angleDiff >= minTurnAngle) {
                    // Check if this turn is far enough from the last one
                    let isFarEnough = true;
                    if (turnPoints.length > 0) {
                        const lastTurn = turnPoints[turnPoints.length - 1];
                        const distance = calculateDistanceMeters(lastTurn.point, currentPoint);
                        isFarEnough = distance >= minDistanceBetweenTurns;
                    }
                    
                    if (isFarEnough) {
                        turnPoints.push({
                            point: currentPoint,
                            index: i,
                            angle: angleDiff,
                            bearing: bearing2 // Direction after the turn
                        });
                    }
                }
            }
            
            // Create numbered markers at turn points
            turnPoints.forEach((turn, index) => {
                const turnNumber = index + 1;
                const turnIcon = this.createTurnNumberIcon(turnNumber, 24);
                
                const marker = L.marker([turn.point[0], turn.point[1]], {
                    icon: turnIcon,
                    zIndexOffset: 1500, // Above arrows and route line
                    interactive: false
                });
                
                this.turnNumbersLayer.addLayer(marker);
            });
            
            // Helper function to calculate midpoint between two points
            const getMidpoint = (point1, point2) => {
                return [
                    (point1[0] + point2[0]) / 2,
                    (point1[1] + point2[1]) / 2
                ];
            };
            
            // Create arrow markers at the MIDDLE of each segment (not at points)
            // Use the calculateDistanceMeters function already defined above
            // Space them out so they appear every ~30-50 meters along the route
            const minDistanceBetweenArrows = 40; // meters
            let accumulatedDistance = 0;
            let lastArrowDistance = 0;
            
            for (let i = 0; i < formattedPath.length - 1; i++) {
                const currentPoint = formattedPath[i];
                const nextPoint = formattedPath[i + 1];
                
                // Calculate distance of this segment
                const segmentDistance = calculateDistanceMeters(currentPoint, nextPoint);
                accumulatedDistance += segmentDistance;
                
                // Check if we should place an arrow in this segment
                if (accumulatedDistance - lastArrowDistance >= minDistanceBetweenArrows) {
                    // Calculate midpoint of this segment
                    const midpoint = getMidpoint(currentPoint, nextPoint);
                    
                    // Calculate bearing (direction) from current to next point
                    const bearing = this.calculateBearing(currentPoint, nextPoint);
                    
                    // Create arrow icon with emoji
                    const arrowIcon = this.createArrowIcon(bearing, 18);
                    
                    // Create marker at midpoint
                    const marker = L.marker([midpoint[0], midpoint[1]], {
                        icon: arrowIcon,
                        zIndexOffset: 1000, // Above the route line (which has z-index ~500)
                        interactive: false
                    });
                    
                    this.solutionDirectionLayer.addLayer(marker);
                    lastArrowDistance = accumulatedDistance;
                }
            }
            
            console.log('addSolutionDirectionArrows: created', this.solutionDirectionLayer.getLayers().length, 'arrow markers');
            console.log('addSolutionDirectionArrows: created', turnPoints.length, 'turn number markers');
        } catch (error) {
            console.error('addSolutionDirectionArrows: error creating arrows', error);
        }
    }

    clearLayers() {
        if (this.cppSolutionLayer) {
            this.mapManager.getMap().removeLayer(this.cppSolutionLayer);
            this.cppSolutionLayer = null;
        }
        if (this.solutionDirectionLayer) {
            if (this.solutionDirectionLayer._map) {
                this.mapManager.getMap().removeLayer(this.solutionDirectionLayer);
            }
            this.solutionDirectionLayer = null;
        }
        if (this.turnNumbersLayer) {
            if (this.turnNumbersLayer._map) {
                this.mapManager.getMap().removeLayer(this.turnNumbersLayer);
            }
            this.turnNumbersLayer = null;
        }
    }
}

