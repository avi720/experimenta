import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { createGroundPlane, disposeObject3D, setupScene } from './sceneUtils';

export { disposeObject3D };

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

const SPHERE_RADIUS = 3;
const INITIAL_Z_OFFSET = 23;
const DEFAULT_H0 = 50;

const FreeFallScene = ({ dataPointToRender, paramValues }) => {
    const mountRef = useRef(null);
    const sceneRef = useRef(null);
    const sphereRef = useRef(null);
    const buildingRef = useRef(null);

    // Initialize scene
    useEffect(() => {
        const currentMount = mountRef.current;
        if (!currentMount) return;

        const { scene, start, dispose } = setupScene(currentMount, {
            background: 0x87ceeb,
            fov: 75,
            far: 2000,
            cameraPosition: [80, 60, 120],
            target: [0, 25, 0],
            lights: {
                ambientIntensity: 0.7,
                directionalIntensity: 1.0,
                directionalPosition: [100, 150, 100],
                shadowCamera: { near: 0.5, far: 500, left: -150, right: 150, top: 150, bottom: -150 },
            },
            controls: { minDistance: 10, maxDistance: 600, maxPolarAngle: Math.PI / 2 },
        });
        sceneRef.current = scene;

        scene.add(createGroundPlane(500, 500, new THREE.MeshLambertMaterial({ color: 0x3c7a3c })));

        const sphere = new THREE.Mesh(
            new THREE.SphereGeometry(SPHERE_RADIUS, 32, 32),
            new THREE.MeshLambertMaterial({ color: 0x0077ff })
        );
        sphere.castShadow = true;
        scene.add(sphere);
        sphereRef.current = sphere;

        const building = createBuildingWithWindows(DEFAULT_H0);
        building.userData.height = DEFAULT_H0;
        building.name = "building";
        scene.add(building);
        buildingRef.current = building;

        start();

        return () => {
            dispose();
            sceneRef.current = null;
            sphereRef.current = null;
            buildingRef.current = null;
        };
    }, []);

    // Update building height based on parameters
    useEffect(() => {
        if (!buildingRef.current || !sceneRef.current || !paramValues) return;

        const h0 = parseFloat(paramValues.h0) || DEFAULT_H0;
        const currentBuilding = buildingRef.current;
        const currentHeight = currentBuilding.userData.height || DEFAULT_H0;

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

        const h0 = parseFloat(paramValues.h0) || DEFAULT_H0;

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
