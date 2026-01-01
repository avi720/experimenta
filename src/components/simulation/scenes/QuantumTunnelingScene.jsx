
import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { createOrbitControls } from '../controls/orbitControls';

export default function QuantumTunnelingScene({ parameters, dataPointToRender }) {
    const mountRef = useRef(null);
    const sceneRef = useRef(null);
    const rendererRef = useRef(null);
    const cameraRef = useRef(null);
    const controlsRef = useRef(null);
    const animationIdRef = useRef(null);

    // Particle Refs
    const incomingParticleRef = useRef(null);
    const transmittedParticleRef = useRef(null);
    const reflectedParticleRef = useRef(null);
    
    const barrierRef = useRef(null);
    const detectorRef = useRef(null);
    const detectorConeRef = useRef(null);

    // Visual scaling factor for barrier width
    const VISUAL_L_SCALE_FACTOR = 0.25;

    useEffect(() => {
        const mountElement = mountRef.current;
        if (!mountElement) return;

        const DETECTOR_X_POSITION = -25; // Moved inside useEffect

        // Scene setup
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0xf7fafc);
        sceneRef.current = scene;

        // Camera setup
        const camera = new THREE.PerspectiveCamera(
            60,
            mountElement.clientWidth / mountElement.clientHeight,
            0.1,
            1000
        );
        camera.position.set(0, 15, 25);
        camera.lookAt(0, 0, 0);
        cameraRef.current = camera;

        // Renderer setup
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(mountElement.clientWidth, mountElement.clientHeight);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        mountElement.appendChild(renderer.domElement);
        rendererRef.current = renderer;

        // Controls setup using createOrbitControls
        const controls = createOrbitControls(camera, renderer.domElement);
        controls.target.set(0, 0, 0);
        controls.minDistance = 5;
        controls.maxDistance = 100;
        controlsRef.current = controls;

        // Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
        scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(10, 10, 5);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        scene.add(directionalLight);

        // Floor
        const floorGeometry = new THREE.PlaneGeometry(100, 50);
        const floorMaterial = new THREE.MeshLambertMaterial({ color: 0xf0f0f0 });
        const floor = new THREE.Mesh(floorGeometry, floorMaterial);
        floor.rotation.x = -Math.PI / 2;
        floor.position.y = -2;
        floor.receiveShadow = true;
        scene.add(floor);

        // Particle Gun
        const gunGroup = new THREE.Group();
        gunGroup.position.set(-48, 0, 0);

        const bodyGeometry = new THREE.CylinderGeometry(0.8, 1.2, 4, 8);
        const bodyMaterial = new THREE.MeshLambertMaterial({ color: 0x4a5568 });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        gunGroup.add(body);

        const barrelGeometry = new THREE.CylinderGeometry(0.3, 0.3, 3, 8);
        const barrelMaterial = new THREE.MeshLambertMaterial({ color: 0x2d3748 });
        const barrel = new THREE.Mesh(barrelGeometry, barrelMaterial);
        barrel.position.set(2.5, 0, 0);
        barrel.rotation.z = Math.PI / 2;
        gunGroup.add(barrel);

        const baseGeometry = new THREE.CylinderGeometry(1.5, 1.5, 0.5, 8);
        const baseMaterial = new THREE.MeshLambertMaterial({ color: 0x718096 });
        const base = new THREE.Mesh(baseGeometry, baseMaterial);
        base.position.set(0, -1.5, 0);
        gunGroup.add(base);

        scene.add(gunGroup);

        // Barrier
        const barrierGeometry = new THREE.BoxGeometry(1, 8, 2);
        const barrierMaterial = new THREE.MeshLambertMaterial({
            color: 0xe53e3e,
            transparent: true,
            opacity: 0.7
        });
        const barrier = new THREE.Mesh(barrierGeometry, barrierMaterial);
        barrier.position.set(0, 2, 0);
        barrierRef.current = barrier;
        scene.add(barrier);

        // Detector (Camera-like shape)
        const detectorGroup = new THREE.Group();
        detectorGroup.position.set(DETECTOR_X_POSITION, 3, -4); // Positioned to the side

        // Detector body (rectangular)
        const detectorBodyGeometry = new THREE.BoxGeometry(2, 1.5, 3);
        const detectorBodyMaterial = new THREE.MeshLambertMaterial({ color: 0x606060 });
        const detectorBody = new THREE.Mesh(detectorBodyGeometry, detectorBodyMaterial);
        detectorGroup.add(detectorBody);

        // Detector cone (lens/camera front)
        const detectorConeGeometry = new THREE.ConeGeometry(0.8, 2, 8);
        const detectorConeMaterial = new THREE.MeshLambertMaterial({ color: 0x404040 });
        const detectorCone = new THREE.Mesh(detectorConeGeometry, detectorConeMaterial);
        detectorCone.position.set(0, -0.5, 2); // In front of the body
        detectorCone.rotation.x = -Math.PI / 6 ; // Angled slightly downward
        detectorConeRef.current = detectorCone;
        detectorGroup.add(detectorCone);

        // Detector support arm
        const armGeometry = new THREE.CylinderGeometry(0.2, 0.2, 5, 8);
        const armMaterial = new THREE.MeshLambertMaterial({ color: 0x505050 });
        const arm = new THREE.Mesh(armGeometry, armMaterial);
        arm.position.set(0, -3, 0);
        detectorGroup.add(arm);

        detectorRef.current = detectorGroup;
        scene.add(detectorGroup);

        // Particles
        const particleGeometry = new THREE.SphereGeometry(0.4, 16, 16);

        // Incoming Particle (Blue)
        const incomingMaterial = new THREE.MeshLambertMaterial({ color: 0x2b6cb0 });
        const incomingParticle = new THREE.Mesh(particleGeometry, incomingMaterial);
        incomingParticle.castShadow = true;
        incomingParticle.visible = false;
        scene.add(incomingParticle);
        incomingParticleRef.current = incomingParticle;

        // Transmitted Particle (Green)
        const transmittedMaterial = new THREE.MeshLambertMaterial({
            color: 0x38a169,
            transparent: true,
        });
        const transmittedParticle = new THREE.Mesh(particleGeometry, transmittedMaterial);
        transmittedParticle.castShadow = true;
        transmittedParticle.visible = false;
        scene.add(transmittedParticle);
        transmittedParticleRef.current = transmittedParticle;

        // Reflected Particle (Yellow)
        const reflectedMaterial = new THREE.MeshLambertMaterial({
            color: 0xd69e2e,
            transparent: true,
        });
        const reflectedParticle = new THREE.Mesh(particleGeometry, reflectedMaterial);
        reflectedParticle.castShadow = true;
        reflectedParticle.visible = false;
        scene.add(reflectedParticle);
        reflectedParticleRef.current = reflectedParticle;

        // Animation loop
        const animate = () => {
            animationIdRef.current = requestAnimationFrame(animate);

            if (controlsRef.current) {
                controlsRef.current.update();
            }
            
            const time = Date.now() * 0.005;
            [incomingParticleRef, transmittedParticleRef, reflectedParticleRef].forEach(ref => {
                if (ref.current && ref.current.visible) {
                    ref.current.position.y = Math.sin(time) * 0.1;
                }
            });

            renderer.render(scene, camera);
        };
        animate();

        // Handle resize
        const handleResize = () => {
            if (mountElement) {
                camera.aspect = mountElement.clientWidth / mountElement.clientHeight;
                camera.updateProjectionMatrix();
                renderer.setSize(mountElement.clientWidth, mountElement.clientHeight);
            }
        };
        window.addEventListener('resize', handleResize);

        // Cleanup
        return () => {
            if (animationIdRef.current) {
                cancelAnimationFrame(animationIdRef.current);
            }
            if (controlsRef.current) {
                controlsRef.current.dispose();
            }
            if (mountElement && renderer.domElement) {
                mountElement.removeChild(renderer.domElement);
            }
            renderer.dispose();
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    // Effect to update scene based on simulation data
    useEffect(() => {
        const DETECTOR_X_POSITION = -25; // Moved inside useEffect
        const allParticles = [incomingParticleRef.current, transmittedParticleRef.current, reflectedParticleRef.current];
        if (!allParticles.every(p => p) || !barrierRef.current || !detectorConeRef.current) return;
        
        if (dataPointToRender) {
            const { position, transmission, reflection, time, measurementResult, hasCollapsed } = dataPointToRender;
            const simParams = dataPointToRender.debug || parameters || {};

            // Update detector appearance based on measurement result
            if (hasCollapsed && measurementResult) {
                if (measurementResult === 'reflected') {
                    detectorConeRef.current.material.color.setHex(0xffa500); // Orange for detection
                } else if (measurementResult === 'transmitted') {
                    detectorConeRef.current.material.color.setHex(0x00ff00); // Green for no detection
                }
            } else {
                detectorConeRef.current.material.color.setHex(0x404040); // Default gray
            }

            // Barrier properties
            const L = parseFloat(simParams.barrier_width_nm || parameters.L) || 10;
            const barrierWidthVisual = L * VISUAL_L_SCALE_FACTOR;
            barrierRef.current.scale.x = barrierWidthVisual;
            const barrierLeftEdge = -barrierWidthVisual / 2;

            // Visibility control
            const isSimulationActive = time > 0;
            const hasFinished = position > 50; 
            const hasHitBarrier = position >= barrierLeftEdge;

            // Before simulation starts or after it finishes, hide all
            if (!isSimulationActive || hasFinished) {
                allParticles.forEach(p => p.visible = false);
                return;
            }

            // Before hitting the barrier
            if (!hasHitBarrier) {
                incomingParticleRef.current.visible = true;
                transmittedParticleRef.current.visible = false;
                reflectedParticleRef.current.visible = false;
                incomingParticleRef.current.position.x = position;
            } 
            // After hitting the barrier
            else {
                incomingParticleRef.current.visible = false;

                // Handle quantum collapse
                if (hasCollapsed && measurementResult) {
                    if (measurementResult === 'transmitted') {
                        // Only transmitted particle is visible
                        transmittedParticleRef.current.visible = true;
                        reflectedParticleRef.current.visible = false;
                        transmittedParticleRef.current.position.x = position;
                        transmittedParticleRef.current.material.opacity = 1.0; // Full opacity for the "chosen" particle
                    } else if (measurementResult === 'reflected') {
                        // Only reflected particle is visible
                        transmittedParticleRef.current.visible = false;
                        reflectedParticleRef.current.visible = true;
                        const reflectedPosition = barrierLeftEdge - (position - barrierLeftEdge);
                        reflectedParticleRef.current.position.x = reflectedPosition;
                        reflectedParticleRef.current.material.opacity = 1.0; // Full opacity for the "chosen" particle
                    }
                } else {
                    // Normal superposition state - both particles visible with probability-based opacity
                    transmittedParticleRef.current.visible = true;
                    reflectedParticleRef.current.visible = true;

                    // Update transmitted particle
                    transmittedParticleRef.current.position.x = position;
                    const MIN_DISPLAY_OPACITY = 0.1;
                    transmittedParticleRef.current.material.opacity = Math.max(transmission, MIN_DISPLAY_OPACITY);

                    // Update reflected particle
                    const reflectedPosition = barrierLeftEdge - (position - barrierLeftEdge);
                    reflectedParticleRef.current.position.x = reflectedPosition;
                    reflectedParticleRef.current.material.opacity = Math.max(reflection, MIN_DISPLAY_OPACITY);
                }
            }

        } else {
            // Hide all particles if no data point is available (e.g., on reset)
            allParticles.forEach(p => p.visible = false);
            // Reset detector appearance
            if (detectorConeRef.current) {
                detectorConeRef.current.material.color.setHex(0x404040);
            }
        }
    }, [dataPointToRender, parameters]);

    return <div ref={mountRef} className="w-full h-full" />;
}
