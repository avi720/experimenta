
import * as THREE from 'three';

export function createOrbitControls(camera, domElement) {
    const controls = {
        target: new THREE.Vector3(),
        minDistance: 20,
        maxDistance: 500,
        enableDamping: true,
        dampingFactor: 0.05,
        
        state: -1,
        STATE: { NONE: -1, ROTATE: 0, DOLLY: 1, PAN: 2 },
        spherical: new THREE.Spherical(),
        sphericalDelta: new THREE.Spherical(),
        scale: 1,
        panOffset: new THREE.Vector3(),
        zoomChanged: false,
        
        rotateStart: new THREE.Vector2(),
        rotateEnd: new THREE.Vector2(),
        rotateDelta: new THREE.Vector2(),
        
        panStart: new THREE.Vector2(),
        panEnd: new THREE.Vector2(),
        panDelta: new THREE.Vector2(),
        
        dollyStart: new THREE.Vector2(),
        dollyEnd: new THREE.Vector2(),
        dollyDelta: new THREE.Vector2(),

        update: function() {
            const offset = new THREE.Vector3();
            const quat = new THREE.Quaternion().setFromUnitVectors(camera.up, new THREE.Vector3(0, 1, 0));
            const quatInverse = quat.clone().invert();
            
            offset.copy(camera.position).sub(this.target);
            offset.applyQuaternion(quat);
            this.spherical.setFromVector3(offset);
            
            if (this.enableDamping) {
                this.spherical.theta += this.sphericalDelta.theta * this.dampingFactor;
                this.spherical.phi += this.sphericalDelta.phi * this.dampingFactor;
            } else {
                this.spherical.theta += this.sphericalDelta.theta;
                this.spherical.phi += this.sphericalDelta.phi;
            }

            this.spherical.makeSafe();
            this.spherical.radius *= this.scale;
            this.spherical.radius = Math.max(this.minDistance, Math.min(this.maxDistance, this.spherical.radius));
            
            this.target.add(this.panOffset);
            offset.setFromSpherical(this.spherical);
            offset.applyQuaternion(quatInverse);
            
            camera.position.copy(this.target).add(offset);
            camera.lookAt(this.target);

            if (this.enableDamping) {
                this.sphericalDelta.theta *= (1 - this.dampingFactor);
                this.sphericalDelta.phi *= (1 - this.dampingFactor);
            } else {
                this.sphericalDelta.set(0, 0, 0);
            }

            this.scale = 1;
            this.panOffset.set(0, 0, 0);
            return this.zoomChanged;
        },

        dispose: function() {
            if (domElement) {
                domElement.removeEventListener('contextmenu', onContextMenu);
                domElement.removeEventListener('pointerdown', onPointerDown);
                domElement.removeEventListener('wheel', onWheel);
            }
        }
    };

    function onContextMenu(event) {
        event.preventDefault();
    }

    function onPointerDown(event) {
        if (event.button === 0) { // left button -> PAN (move target)
            controls.state = controls.STATE.PAN;
            controls.panStart.set(event.clientX, event.clientY);
        } else if (event.button === 2) { // right button -> ROTATE (orbit around target)
            controls.state = controls.STATE.ROTATE;
            controls.rotateStart.set(event.clientX, event.clientY);
        }
        document.addEventListener('pointermove', onPointerMove);
        document.addEventListener('pointerup', onPointerUp);
    }
    
    function onPointerMove(event) {
        if (controls.state === controls.STATE.ROTATE) {
            controls.rotateEnd.set(event.clientX, event.clientY);
            controls.rotateDelta.subVectors(controls.rotateEnd, controls.rotateStart).multiplyScalar(0.22); // Increased to 0.22
            controls.sphericalDelta.theta -= 2 * Math.PI * controls.rotateDelta.x / domElement.clientHeight;
            controls.sphericalDelta.phi -= 2 * Math.PI * controls.rotateDelta.y / domElement.clientHeight;
            controls.rotateStart.copy(controls.rotateEnd);
        } else if (controls.state === controls.STATE.PAN) {
            controls.panEnd.set(event.clientX, event.clientY);
            controls.panDelta.subVectors(controls.panEnd, controls.panStart).multiplyScalar(0.25); // Increased to 0.25
            const offset = new THREE.Vector3();
            offset.copy(camera.position).sub(controls.target);
            const targetDistance = offset.length();
            const fov = (camera.fov / 2) * Math.PI / 180.0;
            const panX = 2 * controls.panDelta.x * targetDistance * Math.tan(fov) / domElement.clientHeight;
            const panY = 2 * controls.panDelta.y * targetDistance * Math.tan(fov) / domElement.clientHeight;
            controls.panOffset.x -= panX;
            controls.panOffset.y += panY;
            controls.panStart.copy(controls.panEnd);
        }
    }

    function onPointerUp() {
        controls.state = controls.STATE.NONE;
        document.removeEventListener('pointermove', onPointerMove);
        document.removeEventListener('pointerup', onPointerUp);
    }

    function onWheel(event) {
        event.preventDefault();
        const delta = event.deltaY;
        if (delta > 0) {
            controls.scale *= 1.2; // Increased from 1.1 for faster zoom
        } else {
            controls.scale *= 0.8; // Increased from 0.9 for faster zoom
        }
        controls.zoomChanged = true;
    }

    if (domElement) {
        domElement.addEventListener('contextmenu', onContextMenu);
        domElement.addEventListener('pointerdown', onPointerDown);
        domElement.addEventListener('wheel', onWheel, { passive: false });
    }

    return controls;
}
