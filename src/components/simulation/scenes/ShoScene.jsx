import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { setupBasicScene } from './sceneUtils';
import { createOrbitControls } from '../controls/orbitControls';

const SPRING_SAMPLES = 128;
const SPRING_TUBULAR_SEGMENTS = 64;
const SPRING_TUBE_RADIUS = 0.8;
const SPRING_RADIAL_SEGMENTS = 8;
const SPRING_COIL_RADIUS = 3;

/**
 * Builds a helical spring tube of the given length along +X. The vertex count is fixed
 * (it depends only on the segment constants), so a spring can be reshaped in place.
 */
export function createSpringGeometry(length) {
    const springPoints = [];
    const coils = Math.max(8, Math.floor(length / 8));

    for (let i = 0; i <= SPRING_SAMPLES; i++) {
        const t = i / SPRING_SAMPLES;
        const x = t * length;
        const y = SPRING_COIL_RADIUS * Math.cos(t * coils * 2 * Math.PI);
        const z = SPRING_COIL_RADIUS * Math.sin(t * coils * 2 * Math.PI);
        springPoints.push(new THREE.Vector3(x, y, z));
    }

    const springCurve = new THREE.CatmullRomCurve3(springPoints);
    return new THREE.TubeGeometry(springCurve, SPRING_TUBULAR_SEGMENTS, SPRING_TUBE_RADIUS, SPRING_RADIAL_SEGMENTS, false);
}

/**
 * Reshapes an existing spring geometry to `length` by rewriting its vertex buffers in place,
 * so the GPU buffers are reused instead of a new geometry being allocated per change.
 */
export function updateSpringGeometry(geometry, length) {
    const next = createSpringGeometry(length);
    ['position', 'normal', 'uv'].forEach((name) => {
        const target = geometry.getAttribute(name);
        const source = next.getAttribute(name);
        if (target && source) {
            target.array.set(source.array);
            target.needsUpdate = true;
        }
    });
    next.dispose();
    geometry.computeBoundingSphere();
    geometry.computeBoundingBox();
    return geometry;
}

const ShoScene = ({ parameters, dataPointToRender }) => {
    const mountRef = useRef(null);
    const sceneRef = useRef(null);
    const cameraRef = useRef(null);
    const rendererRef = useRef(null);
    const massRef = useRef(null);
    const springRef = useRef(null);
    const controlsRef = useRef(null);
    const animationFrameId = useRef(null);

    const wallEdgeX = -45;

    // Create refs for parameters and data point to avoid stale closures in animate loop
    const dataPointRef = useRef(dataPointToRender);
    const parametersRef = useRef(parameters);
    
    useEffect(() => {
        dataPointRef.current = dataPointToRender;
    }, [dataPointToRender]);
    
    useEffect(() => {
        parametersRef.current = parameters;
    }, [parameters]);

    useEffect(() => {
        const currentMount = mountRef.current;
        if (!currentMount) {
            return;
        }

        const { scene, camera, renderer, dispose: disposeBasicScene } = setupBasicScene(currentMount);
        sceneRef.current = scene;
        cameraRef.current = camera;
        rendererRef.current = renderer;
        
        controlsRef.current = createOrbitControls(camera, renderer.domElement);
        controlsRef.current.target.set(0, 10, 0);
        camera.position.set(0, 50, 150);

        // Wall
        const wallGeometry = new THREE.BoxGeometry(10, 50, 50);
        const wallMaterial = new THREE.MeshStandardMaterial({ color: 0x808080, metalness: 0.2, roughness: 0.8 });
        const wall = new THREE.Mesh(wallGeometry, wallMaterial);
        wall.position.x = wallEdgeX - 5;
        wall.position.y = 25;
        wall.receiveShadow = true;
        scene.add(wall);

        // Mass
        const massGeometry = new THREE.BoxGeometry(20, 20, 20);
        const massMaterial = new THREE.MeshStandardMaterial({ color: 0xef4444, metalness: 0.6, roughness: 0.4 });
        massRef.current = new THREE.Mesh(massGeometry, massMaterial);
        massRef.current.castShadow = true;
        massRef.current.position.y = 10;
        scene.add(massRef.current);

        // Initial spring
        const springMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x444444, 
            metalness: 0.8, 
            roughness: 0.3 
        });
        springRef.current = new THREE.Mesh(createSpringGeometry(50), springMaterial);
        springRef.current.position.y = 10;
        scene.add(springRef.current);

        // פונקציה מרכזית לחישוב ועדכון מיקום המסה והקפיץ
        const updateMassAndSpringPosition = (currentParams, currentDataPoint) => {
            if (!massRef.current || !springRef.current) return;

            // קבלת המיקום הפיזיקלי
            let x_physics;
            if (currentDataPoint && currentDataPoint.position !== undefined) {
                x_physics = currentDataPoint.position;
            } else if (currentParams && currentParams.x0 !== undefined) {
                x_physics = currentParams.x0;
            } else {
                x_physics = 1;
            }

            const massHalfWidth = 10;
            const visual_position_x = x_physics * 30;
            
            // Update mass position
            massRef.current.position.x = visual_position_x;

            // Calculate spring attachment points and current length
            const wallAttachmentX = wallEdgeX;
            const massAttachmentX = massRef.current.position.x - massHalfWidth;
            let currentSpringLength = massAttachmentX - wallAttachmentX;
            
            currentSpringLength = Math.max(10, currentSpringLength);

            return currentSpringLength;
        };

        // אתחול מיקום ראשוני - קריטי לתצוגה הנכונה מההתחלה
        const initialSpringLength = updateMassAndSpringPosition(parametersRef.current, dataPointRef.current);
        if (initialSpringLength && springRef.current) {
            updateSpringGeometry(springRef.current.geometry, initialSpringLength);
            springRef.current.position.x = wallEdgeX;
        }

        let lastSpringLength = initialSpringLength || 50;

        let isDisposed = false;
        const animate = () => {
            if (isDisposed) return;
            animationFrameId.current = requestAnimationFrame(animate);
            controlsRef.current.update();

            const currentSpringLength = updateMassAndSpringPosition(parametersRef.current, dataPointRef.current);

            if (currentSpringLength && Math.abs(currentSpringLength - lastSpringLength) > 2) {
                if (springRef.current) {
                    updateSpringGeometry(springRef.current.geometry, currentSpringLength);
                    lastSpringLength = currentSpringLength;
                }
            }
            
            renderer.render(scene, camera);
        };

        animate();

        // פונקציה לעדכון גודל renderer וcamera
        const handleResize = () => {
            if (!currentMount || !camera || !renderer) return;
            camera.aspect = currentMount.clientWidth / currentMount.clientHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
        };

        // ResizeObserver לזיהוי שינויים בגודל ה-div
        const resizeObserver = new ResizeObserver(() => {
            handleResize();
        });

        if (currentMount) {
            resizeObserver.observe(currentMount);
        }

        // window resize listener (backup)
        window.addEventListener('resize', handleResize);

        return () => {
            isDisposed = true;
            if (animationFrameId.current !== null) {
                cancelAnimationFrame(animationFrameId.current);
                animationFrameId.current = null;
            }
            window.removeEventListener('resize', handleResize);
            resizeObserver.disconnect();
            if (controlsRef.current) controlsRef.current.dispose();

            // Disposes every geometry/material in the scene (wall, mass, spring, ground, lights),
            // the renderer, and removes the canvas.
            disposeBasicScene();

            sceneRef.current = null;
            cameraRef.current = null;
            rendererRef.current = null;
            massRef.current = null;
            springRef.current = null;
            controlsRef.current = null;
        };
    }, [wallEdgeX]);

    return <div ref={mountRef} className="w-full h-full" />;
};

export default React.memo(ShoScene);