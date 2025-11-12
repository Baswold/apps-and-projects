// Virtual Ecosystem Terrarium - Comprehensive Simulation
// 20 Full Features Implementation

class VirtualTerrarium {
    constructor() {
        this.canvas = document.getElementById('terrariumCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.foodWebCanvas = document.getElementById('foodWebCanvas');
        this.foodWebCtx = this.foodWebCanvas.getContext('2d');

        // Set canvas size
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());

        // FEATURE 1: Dynamic Day/Night Cycle
        this.timeOfDay = 6; // 0-24 hours
        this.dayCount = 1;
        this.timeSpeed = 0; // 0=paused, 1=normal, 5=fast, 10=ultra

        // FEATURE 2: Weather System
        this.weather = {
            current: 'sunny',
            intensity: 0,
            particles: [],
            temperature: 72,
            humidity: 65
        };

        // FEATURE 3 & 15: Creatures with AI and Personalities
        this.creatures = [];
        this.creatureTypes = {
            beetle: { speed: 0.5, size: 8, color: '#8B4513', diet: 'herbivore', emoji: '🪲' },
            butterfly: { speed: 1.2, size: 10, color: '#FF69B4', diet: 'herbivore', emoji: '🦋' },
            spider: { speed: 0.8, size: 7, color: '#4A4A4A', diet: 'carnivore', emoji: '🕷️' },
            ant: { speed: 1.5, size: 4, color: '#8B0000', diet: 'omnivore', emoji: '🐜' },
            ladybug: { speed: 0.7, size: 6, color: '#FF0000', diet: 'herbivore', emoji: '🐞' },
            worm: { speed: 0.3, size: 12, color: '#CD853F', diet: 'decomposer', emoji: '🪱' }
        };

        // FEATURE 4: Plant Growth System
        this.plants = [];
        this.plantTypes = {
            grass: { growthRate: 0.02, maxHeight: 30, color: '#90EE90', waterNeed: 0.3 },
            fern: { growthRate: 0.015, maxHeight: 50, color: '#228B22', waterNeed: 0.5 },
            moss: { growthRate: 0.025, maxHeight: 15, color: '#556B2F', waterNeed: 0.7 },
            flower: { growthRate: 0.01, maxHeight: 40, color: '#FFB6C1', waterNeed: 0.4 }
        };

        // FEATURE 5: Ecosystem Balance (predator/prey)
        this.foodWeb = {
            producers: [], // plants
            herbivores: [],
            carnivores: [],
            decomposers: []
        };

        // FEATURE 6: Temperature & Humidity already in weather

        // FEATURE 7: Sound Ecosystem
        this.audioContext = null;
        this.sounds = {
            ambient: null,
            rain: null,
            crickets: null
        };
        this.initAudio();

        // FEATURE 8: Decomposition Cycle
        this.deadMatter = [];
        this.decompositionRate = 0.01;

        // FEATURE 9: Food Web Visualization (rendered separately)

        // FEATURE 10: Creature Genetics
        this.geneticsPool = [];

        // FEATURE 11: Seasonal Changes
        this.season = 'spring'; // spring, summer, fall, winter
        this.seasonDay = 0;
        this.seasonLength = 30; // days per season

        // FEATURE 12: Soil Quality System
        this.soil = {
            nutrients: 85,
            moisture: 60,
            pH: 7.0,
            organicMatter: 50
        };

        // FEATURE 13: Water Cycle
        this.waterCycle = {
            groundWater: 60,
            condensation: 0,
            evaporation: 0
        };

        // FEATURE 14: Microbiome (invisible but affects ecosystem)
        this.microbiome = {
            bacteria: 1000,
            fungi: 500,
            effectiveness: 1.0
        };

        // FEATURE 16: Achievement System
        this.achievements = [
            { id: 'first_plant', name: 'Green Thumb', desc: 'Plant your first seed', unlocked: false },
            { id: 'ecosystem_balance', name: 'Perfect Balance', desc: 'Achieve 90% ecosystem health', unlocked: false },
            { id: 'population_boom', name: 'Population Boom', desc: 'Have 20+ creatures', unlocked: false },
            { id: 'survivor', name: 'Survivor', desc: 'Keep ecosystem alive for 10 days', unlocked: false },
            { id: 'weather_master', name: 'Weather Master', desc: 'Experience all weather types', unlocked: false },
            { id: 'breeding_success', name: 'Breeder', desc: 'Successfully breed creatures', unlocked: false },
            { id: 'full_food_web', name: 'Complex Web', desc: 'Have all organism types present', unlocked: false }
        ];
        this.weatherExperienced = new Set();

        // FEATURE 17: Ecosystem Health Score
        this.ecosystemHealth = 100;

        // FEATURE 18: Time Manipulation (already handled in timeSpeed)

        // FEATURE 19: Camera System
        this.camera = {
            x: 0,
            y: 0,
            zoom: 1.0,
            following: null,
            panSpeed: 5
        };

        // FEATURE 20: Time-lapse Recording
        this.recording = {
            active: false,
            frames: [],
            frameRate: 30,
            lastCapture: 0
        };

        // Initialize
        this.initializeEcosystem();
        this.setupEventListeners();
        this.gameLoop();
    }

    resizeCanvas() {
        const container = this.canvas.parentElement;
        this.canvas.width = container.clientWidth;
        this.canvas.height = container.clientHeight;
    }

    // FEATURE 7: Initialize Audio System
    initAudio() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGain = this.audioContext.createGain();
            this.masterGain.gain.value = 0.3;
            this.masterGain.connect(this.audioContext.destination);
        } catch (e) {
            console.log('Web Audio API not supported');
        }
    }

    playAmbientSound(type, frequency, duration = 0.5) {
        if (!this.audioContext) return;

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.masterGain);

        oscillator.frequency.value = frequency;
        oscillator.type = type;

        gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);

        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration);
    }

    updateAmbientSounds() {
        // Night sounds
        if (this.timeOfDay > 20 || this.timeOfDay < 6) {
            if (Math.random() < 0.01) {
                this.playAmbientSound('sine', 200 + Math.random() * 100, 0.3); // Cricket chirps
            }
        }

        // Rain sounds
        if (this.weather.current === 'rainy' && Math.random() < 0.05) {
            this.playAmbientSound('noise', 100 + Math.random() * 50, 0.1);
        }

        // Creature sounds based on population
        this.creatures.forEach(creature => {
            if (Math.random() < 0.001) {
                const freq = creature.size * 50 + Math.random() * 100;
                this.playAmbientSound('sine', freq, 0.2);
            }
        });
    }

    initializeEcosystem() {
        // Add initial plants
        for (let i = 0; i < 15; i++) {
            this.addPlant(Math.random() * this.canvas.width, Math.random() * 0.3 * this.canvas.height + this.canvas.height * 0.6);
        }

        // Add initial creatures
        for (let i = 0; i < 5; i++) {
            this.addCreature('beetle');
            this.addCreature('ant');
        }

        this.updatePopulationDisplay();
    }

    setupEventListeners() {
        // Camera controls
        document.getElementById('zoomIn').addEventListener('click', () => {
            this.camera.zoom = Math.min(3, this.camera.zoom * 1.2);
        });
        document.getElementById('zoomOut').addEventListener('click', () => {
            this.camera.zoom = Math.max(0.5, this.camera.zoom / 1.2);
        });
        document.getElementById('resetCamera').addEventListener('click', () => {
            this.camera.x = 0;
            this.camera.y = 0;
            this.camera.zoom = 1.0;
            this.camera.following = null;
        });
        document.getElementById('followMode').addEventListener('click', () => {
            if (this.creatures.length > 0) {
                this.camera.following = this.creatures[Math.floor(Math.random() * this.creatures.length)];
            }
        });

        // Time controls
        document.getElementById('pauseTime').addEventListener('click', (e) => {
            this.timeSpeed = 0;
            this.updateTimeButtonStates(e.target);
        });
        document.getElementById('normalSpeed').addEventListener('click', (e) => {
            this.timeSpeed = 1;
            this.updateTimeButtonStates(e.target);
        });
        document.getElementById('fastSpeed').addEventListener('click', (e) => {
            this.timeSpeed = 5;
            this.updateTimeButtonStates(e.target);
        });
        document.getElementById('ultraSpeed').addEventListener('click', (e) => {
            this.timeSpeed = 10;
            this.updateTimeButtonStates(e.target);
        });

        // Weather controls
        document.querySelectorAll('.weather-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.setWeather(e.target.dataset.weather);
            });
        });

        // Action buttons
        document.getElementById('addPlant').addEventListener('click', () => this.addRandomPlant());
        document.getElementById('addWater').addEventListener('click', () => this.addWater());
        document.getElementById('addInsect').addEventListener('click', () => this.addRandomCreature('herbivore'));
        document.getElementById('addAnimal').addEventListener('click', () => this.addRandomCreature());
        document.getElementById('feedCreatures').addEventListener('click', () => this.scatterFood());
        document.getElementById('cleanTerrain').addEventListener('click', () => this.cleanDeadMatter());

        // Recording controls
        document.getElementById('startRecording').addEventListener('click', () => this.startRecording());
        document.getElementById('stopRecording').addEventListener('click', () => this.stopRecording());

        // Canvas interaction
        this.canvas.addEventListener('click', (e) => this.handleCanvasClick(e));
    }

    updateTimeButtonStates(activeButton) {
        document.querySelectorAll('.time-controls button').forEach(btn => {
            btn.classList.remove('active');
        });
        activeButton.classList.add('active');
    }

    // FEATURE 1: Day/Night Cycle
    updateDayNightCycle(deltaTime) {
        this.timeOfDay += (deltaTime / 1000) * this.timeSpeed * 0.1; // 0.1 = time scale

        if (this.timeOfDay >= 24) {
            this.timeOfDay = 0;
            this.dayCount++;
            this.seasonDay++;

            // Check season change
            if (this.seasonDay >= this.seasonLength) {
                this.advanceSeason();
            }

            // Check achievements
            if (this.dayCount >= 10) {
                this.unlockAchievement('survivor');
            }
        }

        // Update lighting overlay
        const overlay = document.getElementById('lightingOverlay');
        let opacity = 0;

        if (this.timeOfDay < 6) {
            opacity = 0.7; // Night
        } else if (this.timeOfDay < 8) {
            opacity = 0.7 - ((this.timeOfDay - 6) / 2) * 0.7; // Dawn
        } else if (this.timeOfDay < 18) {
            opacity = 0; // Day
        } else if (this.timeOfDay < 20) {
            opacity = ((this.timeOfDay - 18) / 2) * 0.7; // Dusk
        } else {
            opacity = 0.7; // Night
        }

        overlay.style.backgroundColor = `rgba(0, 0, 30, ${opacity})`;

        // Update display
        const hour = Math.floor(this.timeOfDay);
        const minute = Math.floor((this.timeOfDay % 1) * 60);
        document.getElementById('currentTime').textContent =
            `Day ${this.dayCount} - ${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        document.getElementById('season').textContent = this.season.charAt(0).toUpperCase() + this.season.slice(1);
    }

    // FEATURE 11: Seasonal Changes
    advanceSeason() {
        const seasons = ['spring', 'summer', 'fall', 'winter'];
        const currentIndex = seasons.indexOf(this.season);
        this.season = seasons[(currentIndex + 1) % 4];
        this.seasonDay = 0;

        // Seasonal effects
        switch (this.season) {
            case 'spring':
                this.weather.temperature = 68;
                this.weather.humidity = 70;
                break;
            case 'summer':
                this.weather.temperature = 82;
                this.weather.humidity = 55;
                break;
            case 'fall':
                this.weather.temperature = 65;
                this.weather.humidity = 65;
                break;
            case 'winter':
                this.weather.temperature = 50;
                this.weather.humidity = 60;
                break;
        }
    }

    // FEATURE 2: Weather System
    setWeather(weatherType) {
        this.weather.current = weatherType;
        this.weatherExperienced.add(weatherType);

        if (this.weatherExperienced.size >= 4) {
            this.unlockAchievement('weather_master');
        }

        const descriptions = {
            sunny: 'Clear skies, warm and bright',
            rainy: 'Gentle rain falling, increasing moisture',
            foggy: 'Misty conditions, high humidity',
            stormy: 'Heavy rain and wind, dramatic changes'
        };

        document.getElementById('weatherDescription').textContent = descriptions[weatherType];

        // Weather effects on environment
        switch (weatherType) {
            case 'rainy':
                this.soil.moisture = Math.min(100, this.soil.moisture + 2);
                this.weather.humidity = Math.min(95, this.weather.humidity + 10);
                break;
            case 'sunny':
                this.soil.moisture = Math.max(0, this.soil.moisture - 1);
                this.weather.humidity = Math.max(30, this.weather.humidity - 5);
                break;
            case 'foggy':
                this.weather.humidity = Math.min(100, this.weather.humidity + 15);
                break;
            case 'stormy':
                this.soil.moisture = Math.min(100, this.soil.moisture + 5);
                this.weather.humidity = Math.min(100, this.weather.humidity + 20);
                break;
        }

        this.updateWeatherParticles();
    }

    updateWeatherParticles() {
        this.weather.particles = [];

        if (this.weather.current === 'rainy' || this.weather.current === 'stormy') {
            const count = this.weather.current === 'stormy' ? 100 : 50;
            for (let i = 0; i < count; i++) {
                this.weather.particles.push({
                    x: Math.random() * this.canvas.width,
                    y: Math.random() * this.canvas.height,
                    speed: 5 + Math.random() * 5,
                    length: 10 + Math.random() * 10
                });
            }
        }
    }

    drawWeather() {
        if (this.weather.current === 'rainy' || this.weather.current === 'stormy') {
            this.ctx.strokeStyle = 'rgba(174, 194, 224, 0.5)';
            this.ctx.lineWidth = 1;

            this.weather.particles.forEach(particle => {
                particle.y += particle.speed * this.timeSpeed;
                if (particle.y > this.canvas.height) {
                    particle.y = -particle.length;
                    particle.x = Math.random() * this.canvas.width;
                }

                this.ctx.beginPath();
                this.ctx.moveTo(particle.x, particle.y);
                this.ctx.lineTo(particle.x - 2, particle.y + particle.length);
                this.ctx.stroke();
            });
        }

        if (this.weather.current === 'foggy') {
            const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
            gradient.addColorStop(0, 'rgba(200, 200, 200, 0.3)');
            gradient.addColorStop(1, 'rgba(200, 200, 200, 0.1)');
            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }
    }

    // FEATURE 4: Plant Growth System
    addPlant(x, y) {
        const types = Object.keys(this.plantTypes);
        const type = types[Math.floor(Math.random() * types.length)];
        const plantData = this.plantTypes[type];

        this.plants.push({
            x: x,
            y: y,
            type: type,
            height: 5,
            maxHeight: plantData.maxHeight,
            growthRate: plantData.growthRate,
            health: 100,
            age: 0,
            waterNeed: plantData.waterNeed,
            color: plantData.color
        });

        this.unlockAchievement('first_plant');
        this.updatePopulationDisplay();
    }

    addRandomPlant() {
        const x = Math.random() * this.canvas.width;
        const y = Math.random() * 0.3 * this.canvas.height + this.canvas.height * 0.6;
        this.addPlant(x, y);
    }

    updatePlants(deltaTime) {
        this.plants = this.plants.filter(plant => {
            plant.age += deltaTime / 1000 * this.timeSpeed;

            // Growth
            if (plant.height < plant.maxHeight && this.soil.nutrients > 10) {
                const growthFactor = (this.soil.moisture / 100) * (this.soil.nutrients / 100);
                plant.height += plant.growthRate * growthFactor * this.timeSpeed;
                this.soil.nutrients -= 0.01 * this.timeSpeed;
            }

            // Health management
            const moistureDiff = Math.abs(this.soil.moisture - plant.waterNeed * 100);
            if (moistureDiff > 30) {
                plant.health -= 0.1 * this.timeSpeed;
            } else {
                plant.health = Math.min(100, plant.health + 0.05 * this.timeSpeed);
            }

            // Temperature effects
            if (this.weather.temperature < 55 || this.weather.temperature > 90) {
                plant.health -= 0.2 * this.timeSpeed;
            }

            // Die if health depleted
            if (plant.health <= 0) {
                this.addDeadMatter(plant.x, plant.y, 'plant', plant.height);
                return false;
            }

            return true;
        });
    }

    drawPlants() {
        this.plants.forEach(plant => {
            const alpha = plant.health / 100;
            this.ctx.strokeStyle = plant.color;
            this.ctx.globalAlpha = alpha;
            this.ctx.lineWidth = 2;

            this.ctx.beginPath();
            this.ctx.moveTo(plant.x, plant.y);
            this.ctx.lineTo(plant.x, plant.y - plant.height);
            this.ctx.stroke();

            // Add leaves/details
            if (plant.type === 'fern') {
                for (let i = 0; i < plant.height / 10; i++) {
                    this.ctx.beginPath();
                    this.ctx.moveTo(plant.x, plant.y - i * 10);
                    this.ctx.lineTo(plant.x - 5, plant.y - i * 10 - 3);
                    this.ctx.lineTo(plant.x + 5, plant.y - i * 10 - 3);
                    this.ctx.stroke();
                }
            } else if (plant.type === 'flower') {
                this.ctx.fillStyle = plant.color;
                this.ctx.beginPath();
                this.ctx.arc(plant.x, plant.y - plant.height, 4, 0, Math.PI * 2);
                this.ctx.fill();
            }

            this.ctx.globalAlpha = 1.0;
        });
    }

    // FEATURE 3, 10, 15: Creatures with AI, Genetics, and Personalities
    addCreature(type) {
        if (!type) {
            const types = Object.keys(this.creatureTypes);
            type = types[Math.floor(Math.random() * types.length)];
        }

        const creatureData = this.creatureTypes[type];
        const creature = {
            id: Math.random().toString(36).substr(2, 9),
            type: type,
            x: Math.random() * this.canvas.width,
            y: this.canvas.height * 0.7 + Math.random() * this.canvas.height * 0.2,
            vx: (Math.random() - 0.5) * creatureData.speed,
            vy: 0,
            size: creatureData.size + (Math.random() - 0.5) * 2,
            color: creatureData.color,
            diet: creatureData.diet,
            emoji: creatureData.emoji,
            health: 100,
            energy: 100,
            age: 0,
            // FEATURE 15: Personality traits
            personality: {
                aggression: Math.random(),
                curiosity: Math.random(),
                sociability: Math.random(),
                caution: Math.random()
            },
            // FEATURE 10: Genetics
            genetics: {
                speed: 0.8 + Math.random() * 0.4,
                size: 0.8 + Math.random() * 0.4,
                fertility: Math.random(),
                lifespan: 100 + Math.random() * 100
            },
            hunger: 0,
            target: null,
            state: 'wandering' // wandering, hunting, fleeing, eating, resting
        };

        this.creatures.push(creature);
        this.updatePopulationDisplay();

        if (this.creatures.length >= 20) {
            this.unlockAchievement('population_boom');
        }
    }

    addRandomCreature(dietType) {
        const types = Object.keys(this.creatureTypes);
        let validTypes = types;

        if (dietType) {
            validTypes = types.filter(t => this.creatureTypes[t].diet === dietType);
        }

        if (validTypes.length > 0) {
            const type = validTypes[Math.floor(Math.random() * validTypes.length)];
            this.addCreature(type);
        }
    }

    updateCreatures(deltaTime) {
        this.creatures = this.creatures.filter(creature => {
            creature.age += deltaTime / 1000 * this.timeSpeed;
            creature.hunger += 0.1 * this.timeSpeed;
            creature.energy -= 0.05 * this.timeSpeed;

            // Apply personality to behavior
            if (creature.personality.curiosity > 0.7 && Math.random() < 0.01) {
                creature.vx = (Math.random() - 0.5) * this.creatureTypes[creature.type].speed * 2;
            }

            // AI State Machine
            this.updateCreatureAI(creature);

            // Movement
            creature.x += creature.vx * creature.genetics.speed * this.timeSpeed;
            creature.y += creature.vy * this.timeSpeed;

            // Boundaries
            if (creature.x < 0 || creature.x > this.canvas.width) {
                creature.vx *= -1;
                creature.x = Math.max(0, Math.min(this.canvas.width, creature.x));
            }
            if (creature.y < this.canvas.height * 0.5) {
                creature.y = this.canvas.height * 0.5;
                creature.vy = 0;
            }
            if (creature.y > this.canvas.height) {
                creature.y = this.canvas.height;
                creature.vy = 0;
            }

            // Gravity
            creature.vy += 0.2 * this.timeSpeed;
            creature.vy = Math.min(5, creature.vy);

            // Energy depletion
            if (creature.hunger > 100) {
                creature.health -= 0.5 * this.timeSpeed;
            }

            if (creature.energy < 0) {
                creature.energy = 0;
                creature.state = 'resting';
            }

            // Temperature effects
            const tempDiff = Math.abs(this.weather.temperature - 70);
            if (tempDiff > 20) {
                creature.health -= 0.1 * this.timeSpeed;
            }

            // Age limit
            if (creature.age > creature.genetics.lifespan) {
                creature.health -= 1 * this.timeSpeed;
            }

            // Death
            if (creature.health <= 0) {
                this.addDeadMatter(creature.x, creature.y, 'creature', creature.size);
                return false;
            }

            return true;
        });

        // FEATURE 10: Breeding
        this.attemptBreeding();
    }

    updateCreatureAI(creature) {
        const creatureData = this.creatureTypes[creature.type];

        switch (creature.diet) {
            case 'herbivore':
                if (creature.hunger > 50) {
                    const nearestPlant = this.findNearest(creature, this.plants);
                    if (nearestPlant) {
                        creature.target = nearestPlant;
                        creature.state = 'hunting';
                        this.moveToward(creature, nearestPlant);

                        if (this.distance(creature, nearestPlant) < 10) {
                            nearestPlant.health -= 5;
                            creature.hunger = Math.max(0, creature.hunger - 30);
                            creature.state = 'eating';
                        }
                    }
                } else {
                    creature.state = 'wandering';
                    if (Math.random() < 0.02) {
                        creature.vx = (Math.random() - 0.5) * creatureData.speed;
                    }
                }
                break;

            case 'carnivore':
                if (creature.hunger > 60) {
                    const prey = this.creatures.find(c =>
                        c.diet === 'herbivore' &&
                        this.distance(creature, c) < 100 &&
                        c.size <= creature.size
                    );

                    if (prey) {
                        creature.state = 'hunting';
                        this.moveToward(creature, prey);

                        if (this.distance(creature, prey) < 5) {
                            prey.health -= 20;
                            creature.hunger = Math.max(0, creature.hunger - 50);
                        }
                    }
                } else {
                    creature.state = 'wandering';
                }
                break;

            case 'decomposer':
                const deadMatter = this.findNearest(creature, this.deadMatter);
                if (deadMatter && creature.hunger > 30) {
                    creature.state = 'hunting';
                    this.moveToward(creature, deadMatter);

                    if (this.distance(creature, deadMatter) < 10) {
                        deadMatter.mass -= 1;
                        creature.hunger = Math.max(0, creature.hunger - 20);
                        this.soil.nutrients += 0.5;
                    }
                }
                break;

            case 'omnivore':
                if (creature.hunger > 50) {
                    const food = this.findNearest(creature, [...this.plants, ...this.deadMatter]);
                    if (food) {
                        this.moveToward(creature, food);
                        if (this.distance(creature, food) < 10) {
                            if (food.health !== undefined) {
                                food.health -= 3;
                            } else {
                                food.mass -= 0.5;
                            }
                            creature.hunger = Math.max(0, creature.hunger - 25);
                        }
                    }
                }
                break;
        }

        // Resting behavior
        if (creature.state === 'resting') {
            creature.vx *= 0.9;
            creature.energy += 0.2 * this.timeSpeed;
            if (creature.energy > 50) {
                creature.state = 'wandering';
            }
        }
    }

    attemptBreeding() {
        for (let i = 0; i < this.creatures.length; i++) {
            const creature1 = this.creatures[i];
            if (creature1.age < 20 || creature1.health < 70) continue;

            for (let j = i + 1; j < this.creatures.length; j++) {
                const creature2 = this.creatures[j];
                if (creature2.type !== creature1.type) continue;
                if (creature2.age < 20 || creature2.health < 70) continue;

                if (this.distance(creature1, creature2) < 15 && Math.random() < 0.001) {
                    this.breed(creature1, creature2);
                }
            }
        }
    }

    breed(parent1, parent2) {
        const offspring = {
            id: Math.random().toString(36).substr(2, 9),
            type: parent1.type,
            x: (parent1.x + parent2.x) / 2,
            y: (parent1.y + parent2.y) / 2,
            vx: 0,
            vy: 0,
            size: (parent1.size + parent2.size) / 2 + (Math.random() - 0.5),
            color: parent1.color,
            diet: parent1.diet,
            emoji: parent1.emoji,
            health: 100,
            energy: 100,
            age: 0,
            personality: {
                aggression: (parent1.personality.aggression + parent2.personality.aggression) / 2 + (Math.random() - 0.5) * 0.2,
                curiosity: (parent1.personality.curiosity + parent2.personality.curiosity) / 2 + (Math.random() - 0.5) * 0.2,
                sociability: (parent1.personality.sociability + parent2.personality.sociability) / 2 + (Math.random() - 0.5) * 0.2,
                caution: (parent1.personality.caution + parent2.personality.caution) / 2 + (Math.random() - 0.5) * 0.2
            },
            genetics: {
                speed: (parent1.genetics.speed + parent2.genetics.speed) / 2 + (Math.random() - 0.5) * 0.1,
                size: (parent1.genetics.size + parent2.genetics.size) / 2 + (Math.random() - 0.5) * 0.1,
                fertility: (parent1.genetics.fertility + parent2.genetics.fertility) / 2,
                lifespan: (parent1.genetics.lifespan + parent2.genetics.lifespan) / 2 + (Math.random() - 0.5) * 20
            },
            hunger: 0,
            target: null,
            state: 'wandering'
        };

        this.creatures.push(offspring);
        this.unlockAchievement('breeding_success');
        this.updatePopulationDisplay();
    }

    moveToward(creature, target) {
        const dx = target.x - creature.x;
        const dy = target.y - creature.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 0) {
            const speed = this.creatureTypes[creature.type].speed;
            creature.vx = (dx / dist) * speed;
            creature.vy = (dy / dist) * speed * 0.5;
        }
    }

    distance(obj1, obj2) {
        const dx = obj1.x - obj2.x;
        const dy = obj1.y - obj2.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    findNearest(creature, objects) {
        let nearest = null;
        let minDist = Infinity;

        objects.forEach(obj => {
            const dist = this.distance(creature, obj);
            if (dist < minDist) {
                minDist = dist;
                nearest = obj;
            }
        });

        return nearest;
    }

    drawCreatures() {
        this.creatures.forEach(creature => {
            // Shadow
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
            this.ctx.beginPath();
            this.ctx.ellipse(creature.x, creature.y + 2, creature.size * 0.8, creature.size * 0.4, 0, 0, Math.PI * 2);
            this.ctx.fill();

            // Body
            this.ctx.fillStyle = creature.color;
            this.ctx.beginPath();
            this.ctx.arc(creature.x, creature.y - creature.size / 2, creature.size, 0, Math.PI * 2);
            this.ctx.fill();

            // Health bar
            if (creature.health < 100) {
                this.ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
                this.ctx.fillRect(creature.x - 10, creature.y - creature.size - 5, 20, 2);
                this.ctx.fillStyle = 'rgba(0, 255, 0, 0.8)';
                this.ctx.fillRect(creature.x - 10, creature.y - creature.size - 5, 20 * (creature.health / 100), 2);
            }

            // State indicator
            if (creature.state === 'hunting') {
                this.ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
                this.ctx.beginPath();
                this.ctx.arc(creature.x, creature.y - creature.size / 2, creature.size + 2, 0, Math.PI * 2);
                this.ctx.fill();
            }
        });
    }

    // FEATURE 8: Decomposition Cycle
    addDeadMatter(x, y, type, size) {
        this.deadMatter.push({
            x: x,
            y: y,
            type: type,
            mass: size,
            age: 0
        });
    }

    updateDecomposition(deltaTime) {
        this.deadMatter = this.deadMatter.filter(matter => {
            matter.age += deltaTime / 1000 * this.timeSpeed;

            // Decompose based on microbiome effectiveness
            matter.mass -= this.decompositionRate * this.microbiome.effectiveness * this.timeSpeed;

            // Add nutrients to soil
            this.soil.nutrients += 0.01 * this.microbiome.effectiveness * this.timeSpeed;
            this.soil.organicMatter += 0.02 * this.timeSpeed;

            return matter.mass > 0;
        });

        // Update microbiome based on dead matter
        this.microbiome.bacteria += this.deadMatter.length * 0.1 * this.timeSpeed;
        this.microbiome.fungi += this.deadMatter.length * 0.05 * this.timeSpeed;

        // Microbiome effectiveness based on conditions
        const optimalTemp = Math.abs(this.weather.temperature - 75) < 10;
        const optimalMoisture = this.soil.moisture > 40 && this.soil.moisture < 70;
        this.microbiome.effectiveness = (optimalTemp && optimalMoisture) ? 1.2 : 0.8;
    }

    drawDeadMatter() {
        this.ctx.fillStyle = 'rgba(101, 67, 33, 0.6)';
        this.deadMatter.forEach(matter => {
            this.ctx.beginPath();
            this.ctx.arc(matter.x, matter.y, matter.mass / 2, 0, Math.PI * 2);
            this.ctx.fill();
        });
    }

    // FEATURE 12: Soil Quality System
    updateSoil(deltaTime) {
        // Moisture evaporation
        const evaporationRate = (this.weather.temperature - 60) / 100;
        this.soil.moisture -= evaporationRate * this.timeSpeed * 0.1;
        this.soil.moisture = Math.max(0, Math.min(100, this.soil.moisture));

        // Nutrient depletion by plants
        // (handled in updatePlants)

        // Nutrient regeneration
        if (this.soil.organicMatter > 0) {
            this.soil.nutrients += 0.05 * this.timeSpeed;
            this.soil.organicMatter -= 0.01 * this.timeSpeed;
        }

        // pH balance
        const targetpH = 7.0;
        if (this.soil.pH < targetpH) {
            this.soil.pH += 0.01 * this.timeSpeed;
        } else if (this.soil.pH > targetpH) {
            this.soil.pH -= 0.01 * this.timeSpeed;
        }

        // Cap values
        this.soil.nutrients = Math.max(0, Math.min(100, this.soil.nutrients));
        this.soil.organicMatter = Math.max(0, Math.min(100, this.soil.organicMatter));
    }

    // FEATURE 13: Water Cycle
    updateWaterCycle(deltaTime) {
        // Evaporation
        if (this.soil.moisture > 0 && this.weather.temperature > 65) {
            const evapRate = ((this.weather.temperature - 65) / 100) * this.timeSpeed;
            this.soil.moisture -= evapRate;
            this.waterCycle.evaporation += evapRate;
        }

        // Condensation
        if (this.waterCycle.evaporation > 10) {
            this.waterCycle.condensation += this.waterCycle.evaporation * 0.1;
            this.waterCycle.evaporation *= 0.9;
        }

        // Rain contribution
        if (this.weather.current === 'rainy' || this.weather.current === 'stormy') {
            this.waterCycle.condensation = 0;
            this.waterCycle.groundWater += 0.5 * this.timeSpeed;
        }

        // Ground water to soil
        if (this.waterCycle.groundWater > this.soil.moisture) {
            const transfer = (this.waterCycle.groundWater - this.soil.moisture) * 0.05;
            this.waterCycle.groundWater -= transfer;
            this.soil.moisture += transfer;
        }
    }

    // FEATURE 17: Ecosystem Health Score
    calculateEcosystemHealth() {
        let score = 0;

        // Biodiversity (30 points)
        const uniqueCreatureTypes = new Set(this.creatures.map(c => c.type)).size;
        const uniquePlantTypes = new Set(this.plants.map(p => p.type)).size;
        score += (uniqueCreatureTypes * 5) + (uniquePlantTypes * 5);

        // Population balance (20 points)
        const totalCreatures = this.creatures.length;
        const herbivores = this.creatures.filter(c => c.diet === 'herbivore').length;
        const carnivores = this.creatures.filter(c => c.diet === 'carnivore').length;

        if (totalCreatures > 0) {
            const ratio = herbivores / (carnivores + 1);
            if (ratio > 2 && ratio < 5) score += 20; // Healthy ratio
            else if (ratio > 1 && ratio < 7) score += 10;
        }

        // Environmental conditions (30 points)
        if (this.soil.moisture > 30 && this.soil.moisture < 80) score += 10;
        if (this.soil.nutrients > 20) score += 10;
        if (this.weather.temperature > 60 && this.weather.temperature < 80) score += 10;

        // Plant health (10 points)
        if (this.plants.length > 0) {
            const avgPlantHealth = this.plants.reduce((sum, p) => sum + p.health, 0) / this.plants.length;
            score += avgPlantHealth / 10;
        }

        // Creature health (10 points)
        if (this.creatures.length > 0) {
            const avgCreatureHealth = this.creatures.reduce((sum, c) => sum + c.health, 0) / this.creatures.length;
            score += avgCreatureHealth / 10;
        }

        this.ecosystemHealth = Math.max(0, Math.min(100, score));

        if (this.ecosystemHealth >= 90) {
            this.unlockAchievement('ecosystem_balance');
        }

        // Check for full food web
        const hasProducers = this.plants.length > 0;
        const hasHerbivores = this.creatures.some(c => c.diet === 'herbivore');
        const hasCarnivores = this.creatures.some(c => c.diet === 'carnivore');
        const hasDecomposers = this.creatures.some(c => c.diet === 'decomposer');

        if (hasProducers && hasHerbivores && hasCarnivores && hasDecomposers) {
            this.unlockAchievement('full_food_web');
        }

        return this.ecosystemHealth;
    }

    updateEcosystemDisplay() {
        const health = this.calculateEcosystemHealth();

        document.getElementById('healthScore').textContent = `${Math.round(health)}%`;
        const healthBar = document.getElementById('healthBar');
        healthBar.style.width = `${health}%`;

        if (health > 75) {
            healthBar.style.backgroundColor = '#4CAF50';
        } else if (health > 50) {
            healthBar.style.backgroundColor = '#FFC107';
        } else {
            healthBar.style.backgroundColor = '#F44336';
        }

        document.getElementById('temperature').textContent = `${Math.round(this.weather.temperature)}°F`;
        document.getElementById('humidity').textContent = `${Math.round(this.weather.humidity)}%`;
        document.getElementById('soilQuality').textContent = `${Math.round(this.soil.nutrients)}%`;

        let lightLevel = 'Dark';
        if (this.timeOfDay >= 6 && this.timeOfDay < 8) lightLevel = 'Dawn';
        else if (this.timeOfDay >= 8 && this.timeOfDay < 18) lightLevel = 'Bright';
        else if (this.timeOfDay >= 18 && this.timeOfDay < 20) lightLevel = 'Dusk';
        document.getElementById('lightLevel').textContent = lightLevel;
    }

    // FEATURE 9: Food Web Visualization
    drawFoodWeb() {
        const ctx = this.foodWebCtx;
        ctx.clearRect(0, 0, this.foodWebCanvas.width, this.foodWebCanvas.height);

        const centerX = this.foodWebCanvas.width / 2;
        const centerY = this.foodWebCanvas.height / 2;
        const radius = 60;

        // Count each type
        const producers = this.plants.length;
        const herbivores = this.creatures.filter(c => c.diet === 'herbivore').length;
        const carnivores = this.creatures.filter(c => c.diet === 'carnivore').length;
        const decomposers = this.creatures.filter(c => c.diet === 'decomposer').length;

        // Draw connections
        ctx.strokeStyle = 'rgba(100, 100, 100, 0.3)';
        ctx.lineWidth = 1;

        const nodes = [
            { x: centerX, y: centerY - radius, label: '🌱', count: producers, color: '#90EE90' },
            { x: centerX + radius, y: centerY, label: '🦋', count: herbivores, color: '#FFB6C1' },
            { x: centerX, y: centerY + radius, label: '🕷️', count: carnivores, color: '#FF6347' },
            { x: centerX - radius, y: centerY, label: '🪱', count: decomposers, color: '#CD853F' }
        ];

        // Draw connections
        for (let i = 0; i < nodes.length; i++) {
            for (let j = i + 1; j < nodes.length; j++) {
                ctx.beginPath();
                ctx.moveTo(nodes[i].x, nodes[i].y);
                ctx.lineTo(nodes[j].x, nodes[j].y);
                ctx.stroke();
            }
        }

        // Draw nodes
        nodes.forEach(node => {
            const size = 15 + Math.min(node.count * 2, 20);

            ctx.fillStyle = node.color;
            ctx.beginPath();
            ctx.arc(node.x, node.y, size, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = '#333';
            ctx.lineWidth = 2;
            ctx.stroke();

            ctx.fillStyle = '#000';
            ctx.font = '16px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(node.label, node.x, node.y);

            ctx.font = '10px Arial';
            ctx.fillText(node.count, node.x, node.y + size + 10);
        });
    }

    updatePopulationDisplay() {
        const list = document.getElementById('populationList');
        const counts = {};

        this.creatures.forEach(c => {
            counts[c.type] = (counts[c.type] || 0) + 1;
        });

        const plantCounts = {};
        this.plants.forEach(p => {
            plantCounts[p.type] = (plantCounts[p.type] || 0) + 1;
        });

        let html = '<div class="pop-section"><strong>Creatures:</strong></div>';
        Object.entries(counts).forEach(([type, count]) => {
            const emoji = this.creatureTypes[type].emoji;
            html += `<div class="pop-item">${emoji} ${type}: ${count}</div>`;
        });

        html += '<div class="pop-section"><strong>Plants:</strong></div>';
        Object.entries(plantCounts).forEach(([type, count]) => {
            html += `<div class="pop-item">🌱 ${type}: ${count}</div>`;
        });

        html += `<div class="pop-section"><strong>Dead Matter:</strong> ${this.deadMatter.length}</div>`;

        list.innerHTML = html;
    }

    // FEATURE 16: Achievement System
    unlockAchievement(id) {
        const achievement = this.achievements.find(a => a.id === id);
        if (achievement && !achievement.unlocked) {
            achievement.unlocked = true;
            this.showAchievementNotification(achievement);
            this.updateAchievementsDisplay();
        }
    }

    showAchievementNotification(achievement) {
        // Simple console notification (could be enhanced with UI toast)
        console.log(`🏆 Achievement Unlocked: ${achievement.name} - ${achievement.desc}`);
    }

    updateAchievementsDisplay() {
        const list = document.getElementById('achievementsList');
        let html = '';

        this.achievements.forEach(achievement => {
            const icon = achievement.unlocked ? '🏆' : '🔒';
            const className = achievement.unlocked ? 'achievement unlocked' : 'achievement locked';
            html += `
                <div class="${className}">
                    <span>${icon}</span>
                    <div>
                        <strong>${achievement.name}</strong>
                        <small>${achievement.desc}</small>
                    </div>
                </div>
            `;
        });

        list.innerHTML = html;
    }

    // Action handlers
    addWater() {
        this.soil.moisture = Math.min(100, this.soil.moisture + 20);
        this.weather.humidity = Math.min(100, this.weather.humidity + 10);
    }

    scatterFood() {
        for (let i = 0; i < 10; i++) {
            this.addDeadMatter(
                Math.random() * this.canvas.width,
                this.canvas.height * 0.7 + Math.random() * this.canvas.height * 0.2,
                'food',
                5
            );
        }
    }

    cleanDeadMatter() {
        this.deadMatter = [];
    }

    // FEATURE 19: Camera System
    updateCamera() {
        if (this.camera.following && this.creatures.includes(this.camera.following)) {
            this.camera.x = -this.camera.following.x * this.camera.zoom + this.canvas.width / 2;
            this.camera.y = -this.camera.following.y * this.camera.zoom + this.canvas.height / 2;
        }
    }

    applyCameraTransform() {
        this.ctx.save();
        this.ctx.translate(this.canvas.width / 2, this.canvas.height / 2);
        this.ctx.scale(this.camera.zoom, this.camera.zoom);
        this.ctx.translate(-this.canvas.width / 2 + this.camera.x, -this.canvas.height / 2 + this.camera.y);
    }

    resetCameraTransform() {
        this.ctx.restore();
    }

    // FEATURE 20: Time-lapse Recording
    startRecording() {
        this.recording.active = true;
        this.recording.frames = [];
        this.recording.lastCapture = 0;
        document.getElementById('startRecording').disabled = true;
        document.getElementById('stopRecording').disabled = false;
        document.getElementById('recordingStatus').textContent = '🔴 Recording...';
    }

    stopRecording() {
        this.recording.active = false;
        document.getElementById('startRecording').disabled = false;
        document.getElementById('stopRecording').disabled = true;
        document.getElementById('recordingStatus').textContent = `✅ Captured ${this.recording.frames.length} frames`;

        // Note: Actual video export would require additional libraries
        // This creates a downloadable data URL of the last frame as a demo
        if (this.recording.frames.length > 0) {
            const link = document.createElement('a');
            link.download = `terrarium-timelapse-${Date.now()}.png`;
            link.href = this.recording.frames[this.recording.frames.length - 1];
            link.click();
            console.log(`Time-lapse with ${this.recording.frames.length} frames ready for export`);
        }
    }

    captureFrame() {
        if (this.recording.active) {
            const now = Date.now();
            if (now - this.recording.lastCapture > 1000 / this.recording.frameRate) {
                this.recording.frames.push(this.canvas.toDataURL());
                this.recording.lastCapture = now;
            }
        }
    }

    handleCanvasClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Check if clicked on a creature
        for (const creature of this.creatures) {
            const dx = creature.x - x;
            const dy = creature.y - y;
            if (Math.sqrt(dx * dx + dy * dy) < creature.size) {
                this.showCreatureInfo(creature);
                break;
            }
        }
    }

    showCreatureInfo(creature) {
        const modal = document.getElementById('infoModal');
        const content = document.getElementById('modalContent');

        content.innerHTML = `
            <h3>${creature.emoji} ${creature.type}</h3>
            <p><strong>Health:</strong> ${Math.round(creature.health)}%</p>
            <p><strong>Energy:</strong> ${Math.round(creature.energy)}%</p>
            <p><strong>Age:</strong> ${Math.round(creature.age)} days</p>
            <p><strong>Hunger:</strong> ${Math.round(creature.hunger)}%</p>
            <p><strong>State:</strong> ${creature.state}</p>
            <p><strong>Diet:</strong> ${creature.diet}</p>
            <hr>
            <h4>Personality:</h4>
            <p>Aggression: ${Math.round(creature.personality.aggression * 100)}%</p>
            <p>Curiosity: ${Math.round(creature.personality.curiosity * 100)}%</p>
            <p>Sociability: ${Math.round(creature.personality.sociability * 100)}%</p>
            <p>Caution: ${Math.round(creature.personality.caution * 100)}%</p>
            <hr>
            <h4>Genetics:</h4>
            <p>Speed Factor: ${creature.genetics.speed.toFixed(2)}</p>
            <p>Size Factor: ${creature.genetics.size.toFixed(2)}</p>
            <p>Lifespan: ${Math.round(creature.genetics.lifespan)} days</p>
        `;

        modal.classList.remove('hidden');

        // Close modal
        modal.querySelector('.close').onclick = () => {
            modal.classList.add('hidden');
        };
    }

    // Main rendering
    render() {
        // Clear canvas
        this.ctx.fillStyle = '#E8D4A0';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Apply camera transform
        this.applyCameraTransform();

        // Draw ground
        const groundY = this.canvas.height * 0.7;
        this.ctx.fillStyle = '#8B7355';
        this.ctx.fillRect(0, groundY, this.canvas.width, this.canvas.height - groundY);

        // Draw elements
        this.drawDeadMatter();
        this.drawPlants();
        this.drawCreatures();

        // Reset camera transform
        this.resetCameraTransform();

        // Draw weather (overlay, not affected by camera)
        this.drawWeather();

        // Draw food web
        this.drawFoodWeb();
    }

    // Main game loop
    gameLoop(timestamp) {
        if (!this.lastTime) this.lastTime = timestamp;
        const deltaTime = timestamp - this.lastTime;
        this.lastTime = timestamp;

        // Update systems
        this.updateDayNightCycle(deltaTime);
        this.updatePlants(deltaTime);
        this.updateCreatures(deltaTime);
        this.updateDecomposition(deltaTime);
        this.updateSoil(deltaTime);
        this.updateWaterCycle(deltaTime);
        this.updateCamera();
        this.updateEcosystemDisplay();
        this.updateAmbientSounds();

        // Capture frame for recording
        this.captureFrame();

        // Render
        this.render();

        // Continue loop
        requestAnimationFrame((t) => this.gameLoop(t));
    }
}

// Initialize when page loads
window.addEventListener('load', () => {
    const terrarium = new VirtualTerrarium();
});
