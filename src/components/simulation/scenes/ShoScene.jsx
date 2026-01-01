import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { setupBasicScene } from './sceneUtils';
import { createOrbitControls } from '../controls/orbitControls';

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

        const { scene, camera, renderer } = setupBasicScene(currentMount);
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

        // Create spring geometry function
        const createSpringGeometry = (length) => {
            const springPoints = [];
            const coils = Math.max(8, Math.floor(length / 8));
            const radius = 3;
            
            for (let i = 0; i <= 128; i++) {
                const t = i / 128;
                const x = t * length;
                const y = radius * Math.cos(t * coils * 2 * Math.PI);
                const z = radius * Math.sin(t * coils * 2 * Math.PI);
                springPoints.push(new THREE.Vector3(x, y, z));
            }
            
            const springCurve = new THREE.CatmullRomCurve3(springPoints);
            return new THREE.TubeGeometry(springCurve, 64, 0.8, 8, false);
        };

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
            springRef.current.geometry.dispose();
            springRef.current.geometry = createSpringGeometry(initialSpringLength);
            springRef.current.position.x = wallEdgeX;
        }

        let lastSpringLength = initialSpringLength || 50;

        const animate = () => {
            animationFrameId.current = requestAnimationFrame(animate);
            controlsRef.current.update();

            const currentSpringLength = updateMassAndSpringPosition(parametersRef.current, dataPointRef.current);

            if (currentSpringLength && Math.abs(currentSpringLength - lastSpringLength) > 2) {
                if (springRef.current) {
                    springRef.current.geometry.dispose();
                    springRef.current.geometry = createSpringGeometry(currentSpringLength);
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
            cancelAnimationFrame(animationFrameId.current);
            window.removeEventListener('resize', handleResize);
            if (resizeObserver && currentMount) {
                resizeObserver.unobserve(currentMount);
                resizeObserver.disconnect();
            }
            if (controlsRef.current) controlsRef.current.dispose();
            if (rendererRef.current) {
                if (springRef.current && springRef.current.geometry) {
                    springRef.current.geometry.dispose();
                }
                if(currentMount && rendererRef.current.domElement.parentElement === currentMount) {
                    currentMount.removeChild(rendererRef.current.domElement);
                }
                rendererRef.current.dispose();
            }
        };
    }, [wallEdgeX]);

    return <div ref={mountRef} className="w-full h-full" />;
};

export default React.memo(ShoScene);