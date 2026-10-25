import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';

export function disposeObject3D(root) {
    if (!root) return;
    const geometries = new Set();
    const materials = new Set();

    root.traverse((node) => {
        if (node.geometry) {
            geometries.add(node.geometry);
        }
        if (node.material) {
            if (Array.isArray(node.material)) {
                node.material.forEach((m) => m && materials.add(m));
            } else {
                materials.add(node.material);
            }
        }
    });

    geometries.forEach((geom) => geom.dispose());
    materials.forEach((mat) => mat.dispose());
}

export function createBuildingWithWindows(height) {
    const buildingGroup = new THREE.Group();

    const buildingGeometry = new THREE.BoxGeometry(40, height, 40);
    const buildingMaterial = new THREE.MeshLambertMaterial({ color: 0x888899 });
    const mainBuilding = new THREE.Mesh(buildingGeometry, buildingMaterial);
    mainBuilding.position.y = height / 2;
    buildingGroup.add(mainBuilding);

    const doorGeometry = new THREE.BoxGeometry(8, 12, 0.5);
    const doorMaterial = new THREE.MeshLambertMaterial({ color: 0x664422 });
    const door = new THREE.Mesh(doorGeometry, doorMaterial);
    door.position.set(0, 6, 20.3);
    buildingGroup.add(door);

    const windowMaterial = new THREE.MeshLambertMaterial({ color: 0x444455 });
    const frontBackWindowGeometry = new THREE.BoxGeometry(8, 6, 0.5);
    const sideWindowGeometry = new THREE.BoxGeometry(0.5, 6, 8);
    const floorHeight = 10;
    const numFloors = Math.floor(height / floorHeight);

    for (let floor = 2; floor <= numFloors; floor++) {
        const floorY = floor * floorHeight - floorHeight / 2;

        for (let i = 0; i < 2; i++) {
            const windowX = -10 + i * 20;

            const frontWindow = new THREE.Mesh(frontBackWindowGeometry, windowMaterial);
            frontWindow.position.set(windowX, floorY, 20.3);
            buildingGroup.add(frontWindow);

            const backWindow = new THREE.Mesh(frontBackWindowGeometry, windowMaterial);
            backWindow.position.set(windowX, floorY, -20.3);
            buildingGroup.add(backWindow);
        }

        for (let i = 0; i < 2; i++) {
            const windowZ = -10 + i * 20;

            const leftWindow = new THREE.Mesh(sideWindowGeometry, windowMaterial);
            leftWindow.position.set(-20.3, floorY, windowZ);
            buildingGroup.add(leftWindow);

            const rightWindow = new THREE.Mesh(sideWindowGeometry, windowMaterial);
            rightWindow.position.set(20.3, floorY, windowZ);
            buildingGroup.add(rightWindow);
        }
    }

    if (numFloors < 2) {
        frontBackWindowGeometry.dispose();
        sideWindowGeometry.dispose();
        windowMaterial.dispose();
    }

    return buildingGroup;
}

const FreeFallScene = ({ dataPointToRender, paramValues }) => {
    const mountRef = useRef(null);
    const sceneRef = useRef(null);
    const cameraRef = useRef(null);
    const rendererRef = useRef(null);
    const sphereRef = useRef(null);
    const buildingRef = useRef(null);
    const controlsState = useRef({
        isMouseDown: false,
        mouseButton: -1,
        lastMouseX: 0,
        lastMouseY: 0,
        cameraTarget: new THREE.Vector3(0, 25, 0),
    });

    const SPHERE_RADIUS = 3;
    const INITIAL_Z_OFFSET = 23;
    const BUILDING_BUFFER = 30;

    const enforceCameraBounds = (camera) => {
        if (!camera) return;

        const buildingCenter = new THREE.Vector2(0, 0);
        const cameraPos2D = new THREE.Vector2(camera.position.x, camera.position.z);
        const distanceToBuilding = cameraPos2D.distanceTo(buildingCenter);

        if (distanceToBuilding < BUILDING_BUFFER) {
            const direction = cameraPos2D.clone().sub(buildingCenter).normalize();
            const correctedPos = buildingCenter.clone().add(direction.multiplyScalar(BUILDING_BUFFER));

            camera.position.x = correctedPos.x;
            camera.position.z = correctedPos.y;
        }

        camera.position.y = Math.max(camera.position.y, 2);
    };

    // Initialize scene
    useEffect(() => {
        const currentMount = mountRef.current;
        if (!currentMount) return;

        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x87CEEB);
        sceneRef.current = scene;

        const camera = new THREE.PerspectiveCamera(75, currentMount.clientWidth / currentMount.clientHeight, 0.1, 2000);
        camera.position.set(80, 60, 120);
        camera.lookAt(controlsState.current.cameraTarget);
        cameraRef.current = camera;

        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        currentMount.appendChild(renderer.domElement);
        rendererRef.current = renderer;

        const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
        scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
        directionalLight.position.set(100, 150, 100);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = 500;
        directionalLight.shadow.camera.left = -150;
        directionalLight.shadow.camera.right = 150;
        directionalLight.shadow.camera.top = 150;
        directionalLight.shadow.camera.bottom = -150;
        scene.add(directionalLight);

        const groundGeometry = new THREE.PlaneGeometry(500, 500);
        const groundMaterial = new THREE.MeshLambertMaterial({ color: 0x3c7a3c });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        ground.name = "ground";
        scene.add(ground);

        const sphereGeometry = new THREE.SphereGeometry(SPHERE_RADIUS, 32, 32);
        const sphereMaterial = new THREE.MeshLambertMaterial({ color: 0x0077ff });
        const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
        sphere.castShadow = true;
        scene.add(sphere);
        sphereRef.current = sphere;

        const initialH0 = 50;
        const building = createBuildingWithWindows(initialH0);
        building.userData.height = initialH0;
        building.name = "building";
        scene.add(building);
        buildingRef.current = building;

        // Mouse controls
        const onMouseDown = (event) => {
            event.preventDefault();
            controlsState.current.isMouseDown = true;
            controlsState.current.mouseButton = event.button;
            controlsState.current.lastMouseX = event.clientX;
            controlsState.current.lastMouseY = event.clientY;

            if (currentMount) {
                currentMount.style.cursor = 'grabbing';
            }
        };

        const onMouseMove = (event) => {
            if (!controlsState.current.isMouseDown) return;
            event.preventDefault();

            const activeCamera = cameraRef.current;
            if (!activeCamera) return;

            const deltaX = event.clientX - controlsState.current.lastMouseX;
            const deltaY = event.clientY - controlsState.current.lastMouseY;

            if (controlsState.current.mouseButton === 0) {
                const panSpeed = 0.3;
                const right = new THREE.Vector3().crossVectors(activeCamera.up, new THREE.Vector3().subVectors(controlsState.current.cameraTarget, activeCamera.position).normalize()).normalize();
                const up = new THREE.Vector3().copy(activeCamera.up);

                const panOffset = right.multiplyScalar(deltaX * panSpeed).add(up.multiplyScalar(deltaY * panSpeed));
                activeCamera.position.add(panOffset);
                controlsState.current.cameraTarget.add(panOffset);
            } else if (controlsState.current.mouseButton === 2) {
                const euler = new THREE.Euler(0, 0, 0, 'YXZ');
                euler.setFromQuaternion(activeCamera.quaternion);

                euler.y -= deltaX * 0.005;
                euler.x -= deltaY * 0.005;

                euler.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, euler.x));
                activeCamera.quaternion.setFromEuler(euler);

                const direction = new THREE.Vector3(0, 0, -1).applyQuaternion(activeCamera.quaternion);
                controlsState.current.cameraTarget.copy(activeCamera.position).add(direction.multiplyScalar(50));
            }

            controlsState.current.lastMouseX = event.clientX;
            controlsState.current.lastMouseY = event.clientY;

            enforceCameraBounds(activeCamera);

            activeCamera.lookAt(controlsState.current.cameraTarget);
        };

        const onMouseUp = () => {
            controlsState.current.isMouseDown = false;
            controlsState.current.mouseButton = -1;

            if (currentMount) {
                currentMount.style.cursor = 'grab';
            }
        };

        const onWheel = (event) => {
            event.preventDefault();
            const activeCamera = cameraRef.current;
            if (!activeCamera) return;

            const direction = new THREE.Vector3(0, 0, -1).applyQuaternion(activeCamera.quaternion);

            if (event.deltaY > 0) {
                const newPosition = activeCamera.position.clone().add(direction.multiplyScalar(-10));
                activeCamera.position.copy(newPosition);
            } else {
                const newPosition = activeCamera.position.clone().add(direction.multiplyScalar(10));

                const buildingCenter = new THREE.Vector2(0, 0);
                const newPos2D = new THREE.Vector2(newPosition.x, newPosition.z);
                const distanceToBuilding = newPos2D.distanceTo(buildingCenter);

                if (distanceToBuilding >= BUILDING_BUFFER && newPosition.y >= 2) {
                    activeCamera.position.copy(newPosition);
                }
            }

            const newDirection = new THREE.Vector3(0, 0, -1).applyQuaternion(activeCamera.quaternion);
            controlsState.current.cameraTarget.copy(activeCamera.position).add(newDirection.multiplyScalar(50));

            activeCamera.lookAt(controlsState.current.cameraTarget);
        };

        const onContextMenu = (event) => event.preventDefault();

        currentMount.addEventListener('mousedown', onMouseDown);
        currentMount.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
        currentMount.addEventListener('wheel', onWheel);
        currentMount.addEventListener('contextmenu', onContextMenu);

        const onResize = () => {
            if (currentMount && cameraRef.current && rendererRef.current) {
                cameraRef.current.aspect = currentMount.clientWidth / currentMount.clientHeight;
                cameraRef.current.updateProjectionMatrix();
                rendererRef.current.setSize(currentMount.clientWidth, currentMount.clientHeight);
            }
        };
        window.addEventListener('resize', onResize);

        let animationFrameId = null;
        let isDisposed = false;

        const animate = () => {
            if (isDisposed) return;
            animationFrameId = requestAnimationFrame(animate);
            if (rendererRef.current && sceneRef.current && cameraRef.current) {
                rendererRef.current.render(sceneRef.current, cameraRef.current);
            }
        };
        animate();

        return () => {
            isDisposed = true;
            if (animationFrameId !== null) {
                cancelAnimationFrame(animationFrameId);
                animationFrameId = null;
            }
            currentMount.removeEventListener('mousedown', onMouseDown);
            currentMount.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
            currentMount.removeEventListener('wheel', onWheel);
            currentMount.removeEventListener('contextmenu', onContextMenu);
            window.removeEventListener('resize', onResize);

            disposeObject3D(scene);

            if (currentMount && renderer.domElement && renderer.domElement.parentNode === currentMount) {
                currentMount.removeChild(renderer.domElement);
            }
            renderer.dispose();

            sceneRef.current = null;
            cameraRef.current = null;
            rendererRef.current = null;
            sphereRef.current = null;
            buildingRef.current = null;
        };
    }, []);

    // Update building height based on parameters
    useEffect(() => {
        if (!buildingRef.current || !sceneRef.current || !paramValues) return;

        const h0 = parseFloat(paramValues.h0) || 50;
        const currentBuilding = buildingRef.current;
        const currentHeight = currentBuilding.userData.height || 50;

        if (Math.abs(currentHeight - h0) > 0.5) {
            sceneRef.current.remove(currentBuilding);
            disposeObject3D(currentBuilding);
            const newBuilding = createBuildingWithWindows(h0);
            newBuilding.userData.height = h0;
            newBuilding.name = "building";
            sceneRef.current.add(newBuilding);
            buildingRef.current = newBuilding;
        }
    }, [paramValues]);

    // Update sphere position
    useEffect(() => {
        if (!sphereRef.current || !paramValues) return;

        const h0 = parseFloat(paramValues.h0) || 50;

        // If no simulation data yet, position sphere at initial height (top of building)
        if (!dataPointToRender || !dataPointToRender.position) {
            const initialYPos = h0 + SPHERE_RADIUS;
            sphereRef.current.position.set(0, initialYPos, INITIAL_Z_OFFSET);
            return;
        }

        // During simulation, use the position from dataPoint
        const sim_y =
            typeof dataPointToRender.position === 'number'
                ? dataPointToRender.position
                : dataPointToRender.position.y ?? 0;

        const yPos = Math.max(sim_y, 0) + SPHERE_RADIUS;
        sphereRef.current.position.set(0, yPos, INITIAL_Z_OFFSET);
    }, [dataPointToRender, paramValues]);

    return <div ref={mountRef} className="w-full h-full" style={{ cursor: 'grab' }} />;
};

export default FreeFallScene;
