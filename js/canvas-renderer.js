import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';

// Lorem ipsum rendering system
class GlobularCluster {
    constructor(canvas) {
        this.canvas = canvas;
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });

        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        this.camera.position.z = 100;
        this.mouse = new THREE.Vector2(0, 0);
        this.targetMouse = new THREE.Vector2(0, 0);

        this.init();
        this.animate();
        this.addEventListeners();
    }

    init() {
        const particleCount = 1000; // Dense field

        // Buffer attributes
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        const sizes = new Float32Array(particleCount);
        const intensities = new Float32Array(particleCount); // Brightness values

        // Color palette
        const colorPalette = [
            new THREE.Color(0xfff8e7), // White-yellow
            new THREE.Color(0xffd285), // Gold
            new THREE.Color(0xffaa33), // Orange
            new THREE.Color(0xff7744), // Red giant
            new THREE.Color(0xaaccff), // Blue straggler (rare)
        ];

        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;

            // Cluster distribution
            // Density concentration
            const radius = 100 * Math.pow(Math.random(), 0.5);
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);

            positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
            positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
            positions[i3 + 2] = radius * Math.cos(phi);

            // Pick a color from the palette
            const color = colorPalette[Math.floor(Math.random() * colorPalette.length)];
            colors[i3] = color.r;
            colors[i3 + 1] = color.g;
            colors[i3 + 2] = color.b;

            // Scale particle size by distance
            const distFromCenter = Math.sqrt(positions[i3]**2 + positions[i3+1]**2 + positions[i3+2]**2);
            sizes[i] = (Math.random() * 4 + 2) * (1.2 - distFromCenter / 100.0);

            // Store brightness intensity
            intensities[i] = Math.random() * 0.5 + 0.5;
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('aColor', new THREE.BufferAttribute(colors, 3));
        geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
        geometry.setAttribute('aIntensity', new THREE.BufferAttribute(intensities, 1));

        // Shader material
        const material = new THREE.ShaderMaterial({
            uniforms: {
                uTime: { value: 0 },
                uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) }
            },
            vertexShader: `
                attribute vec3 aColor;
                attribute float aSize;
                attribute float aIntensity;

                varying vec3 vColor;
                varying float vIntensity;

                uniform float uTime;
                uniform float uPixelRatio;

                void main() {
                    vColor = aColor;
                    vIntensity = aIntensity;

                    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                    gl_Position = projectionMatrix * mvPosition;

                    // Size attenuation
                    gl_PointSize = aSize * uPixelRatio * (300.0 / -mvPosition.z);
                    gl_PointSize = max(gl_PointSize, 1.0);
                }
            `,
            fragmentShader: `
                varying vec3 vColor;
                varying float vIntensity;

                void main() {
                    // Centered UVs
                    vec2 uv = gl_PointCoord - 0.5;

                    // Core
                    float dist = length(uv);
                    float core = exp(-dist * dist * 25.0);

                    // Spikes
                    // Smooth falloff along axes
                    float spikeX = exp(-abs(uv.y) * 60.0) * exp(-abs(uv.x) * 4.0);
                    float spikeY = exp(-abs(uv.x) * 60.0) * exp(-abs(uv.y) * 4.0);
                    float spikes = (spikeX + spikeY) * 0.8;

                    // Combine
                    float brightness = core + spikes * vIntensity;

                    // Color tinting
                    vec3 finalColor = mix(vColor, vec3(1.0), spikes * 0.5);

                    // Apply brightness
                    gl_FragColor = vec4(finalColor * brightness, brightness);
                }
            `,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        this.particles = new THREE.Points(geometry, material);
        this.scene.add(this.particles);
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        // Smooth mouse follow
        this.mouse.x += (this.targetMouse.x - this.mouse.x) * 0.05;
        this.mouse.y += (this.targetMouse.y - this.mouse.y) * 0.05;

        this.particles.material.uniforms.uTime.value = performance.now() * 0.001;

        // Gentle rotation based on mouse
        this.particles.rotation.y = this.mouse.x * 0.3;
        this.particles.rotation.x = this.mouse.y * 0.3;

        // Slow auto-rotation
        this.particles.rotation.z += 0.0002;

        this.renderer.render(this.scene, this.camera);
    }

    addEventListeners() {
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
            this.particles.material.uniforms.uPixelRatio.value = Math.min(window.devicePixelRatio, 2);
        });

        window.addEventListener('mousemove', (e) => {
            this.targetMouse.x = (e.clientX / window.innerWidth) * 2 - 1;
            this.targetMouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
        });
    }
}

export { GlobularCluster };
