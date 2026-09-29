import React, { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import {
  Eye,
  Maximize2,
  Minimize2,
  RotateCcw,
  RotateCw,
  Compass,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Sparkles,
  Info,
  Calendar,
  CheckCircle,
  AlertTriangle,
  Clock,
  Wrench,
  Users,
  Tv,
  Navigation
} from "lucide-react";

export default function RoomVisualizer3D({ rooms, bookings, selectedRoom, onSelectRoom, onBookRoom, currentUser, onUpdateRoomStatus }) {
  const mountRef = useRef(null);
  const [activeCamView, setActiveCamView] = useState("overview");
  const [hoveredRoom, setHoveredRoom] = useState(null);
  const [statusFilter, setStatusFilter] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [isRevolving, setIsRevolving] = useState(false);
  const [isAutoRotate, setIsAutoRotate] = useState(false);

  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const controlsRef = useRef(null);
  const roomObjectsRef = useRef({});
  const animationFrameRef = useRef(null);
  const revolveStateRef = useRef({ active: false, startTheta: 0, currentAngle: 0, targetAngle: 0, speed: 0.03 });

  // Helper to determine live status of a room for selected date with Admin Overrides & 12h auto-expiry
  const getRoomLiveStatus = (roomId, targetDate = selectedDate) => {
    const room = rooms.find((r) => r.id === roomId);
    if (!room) return { status: "Available", color: "#10b981" };

    // Explicit Admin Overrides take highest priority!
    if (room.status === "Maintenance") return { status: "Maintenance", color: "#4b5563" };
    if (room.status === "Force Available") return { status: "Available (Admin Override)", color: "#10b981" };
    if (room.status === "Force Booked") return { status: "Booked (Admin Override)", color: "#ef4444" };

    let checkDate = targetDate || selectedDate || new Date().toISOString().split("T")[0];
    if (typeof checkDate === "string" && checkDate.includes("T")) {
      checkDate = checkDate.split("T")[0];
    }

    const todayStr = new Date().toISOString().split("T")[0];
    const nowMinutes = new Date().getHours() * 60 + new Date().getMinutes();

    // Get active bookings for the specified room on checkDate
    const roomBookings = bookings.filter((b) => {
      let bDate = b.date;
      if (typeof bDate === "string" && bDate.includes("T")) {
        bDate = bDate.split("T")[0];
      }
      return (b.roomId === roomId || b.roomId === room.id || b.roomName === room.name) && bDate === checkDate;
    });

    const approved = roomBookings.find((b) => b.status === "Approved");
    if (approved) {
      if (checkDate === todayStr && approved.endTime) {
        const [endH, endM] = approved.endTime.split(":").map(Number);
        const endMinutes = endH * 60 + (endM || 0);
        if (nowMinutes > endMinutes + 720) {
          return { status: "Available", color: "#10b981" };
        }
      }
      return { status: "Booked", color: "#ef4444", booking: approved };
    }

    const pending = roomBookings.find((b) => b.status === "Pending");
    if (pending) {
      return { status: "Pending Approval", color: "#f59e0b", booking: pending };
    }

    return { status: "Available", color: "#10b981" };
  };

  useEffect(() => {
    const currentContainer = mountRef.current;
    if (!currentContainer) return;

    const width = currentContainer.clientWidth;
    const height = currentContainer.clientHeight;

    // 1. Create Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#0b0f19");
    scene.fog = new THREE.FogExp2("#0b0f19", 0.025);
    sceneRef.current = scene;

    // 2. Camera Setup
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 18, 22);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // 3. Renderer Setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    rendererRef.current = renderer;

    currentContainer.innerHTML = "";
    currentContainer.appendChild(renderer.domElement);

    // 4. OrbitControls for 360 Full Directional Navigation
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.maxPolarAngle = Math.PI / 2 - 0.04; // Don't go below floor
    controls.minDistance = 6;
    controls.maxDistance = 55;
    controls.target.set(0, 0, 0);
    controlsRef.current = controls;

    // 5. Lighting
    const ambientLight = new THREE.AmbientLight("#ffffff", 0.75);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight("#60a5fa", 1.2);
    dirLight.position.set(15, 25, 15);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    scene.add(dirLight);

    const bluePoint = new THREE.PointLight("#3b82f6", 1.5, 30);
    bluePoint.position.set(0, 10, 0);
    scene.add(bluePoint);

    // 6. Floor Grid Base
    const gridHelper = new THREE.GridHelper(30, 30, "#3b82f6", "#1e293b");
    gridHelper.position.y = -0.01;
    scene.add(gridHelper);

    const floorGeo = new THREE.PlaneGeometry(32, 32);
    const floorMat = new THREE.MeshStandardMaterial({
      color: "#0d1322",
      roughness: 0.8,
      metalness: 0.2
    });
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.position.y = -0.02;
    floorMesh.receiveShadow = true;
    scene.add(floorMesh);

    // 7. Build 3D Rooms
    const roomGroup = new THREE.Group();
    scene.add(roomGroup);

    rooms.forEach((room) => {
      const { status: liveStatus, color: statusColor } = getRoomLiveStatus(room.id);
      const isSelected = selectedRoom?.id === room.id;

      const rGroup = new THREE.Group();
      rGroup.position.set(room.position.x, room.position.y, room.position.z);
      rGroup.userData = { roomData: room };

      const w = room.dimensions.width;
      const h = room.dimensions.height;
      const d = room.dimensions.depth;

      // Base Floor structure
      const rFloorGeo = new THREE.BoxGeometry(w, 0.2, d);
      const rFloorMat = new THREE.MeshStandardMaterial({
        color: "#1e293b",
        metalness: 0.3,
        roughness: 0.4
      });
      const rFloor = new THREE.Mesh(rFloorGeo, rFloorMat);
      rFloor.position.y = 0.1;
      rFloor.receiveShadow = true;
      rGroup.add(rFloor);

      // Glowing Box Walls (Radiant Status Color)
      const wallGeo = new THREE.BoxGeometry(w, h, d);
      const wallMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(statusColor),
        emissive: new THREE.Color(statusColor),
        emissiveIntensity: isSelected ? 0.8 : 0.5,
        transparent: true,
        opacity: isSelected ? 0.85 : 0.6,
        roughness: 0.2,
        metalness: 0.1
      });
      const walls = new THREE.Mesh(wallGeo, wallMat);
      walls.position.y = h / 2 + 0.1;
      walls.castShadow = true;
      walls.receiveShadow = true;
      walls.userData = { isWall: true };
      rGroup.add(walls);

      // Glowing Outline Frame
      const edgesGeo = new THREE.EdgesGeometry(wallGeo);
      const lineMat = new THREE.LineBasicMaterial({
        color: new THREE.Color(statusColor),
        linewidth: isSelected ? 3 : 1
      });
      const wireframe = new THREE.LineSegments(edgesGeo, lineMat);
      wireframe.position.y = h / 2 + 0.1;
      wireframe.userData = { isWireframe: true };
      rGroup.add(wireframe);

      // Interior 3D Details (Stage, Podium, Screens)
      if (room.id === "ROOM_AUDITORIUM") {
        const stageGeo = new THREE.BoxGeometry(w * 0.8, 0.4, 1.8);
        const stageMat = new THREE.MeshStandardMaterial({ color: "#854d0e" });
        const stage = new THREE.Mesh(stageGeo, stageMat);
        stage.position.set(0, 0.4, -d / 2 + 1.2);
        rGroup.add(stage);

        const screenGeo = new THREE.BoxGeometry(w * 0.7, 1.2, 0.1);
        const screenMat = new THREE.MeshStandardMaterial({ color: "#60a5fa", emissive: "#2563eb" });
        const screen = new THREE.Mesh(screenGeo, screenMat);
        screen.position.set(0, 1.5, -d / 2 + 0.3);
        rGroup.add(screen);

        for (let row = 0; row < 3; row++) {
          const rowGeo = new THREE.BoxGeometry(w * 0.75, 0.3, 0.4);
          const rowMat = new THREE.MeshStandardMaterial({ color: "#334155" });
          const seatRow = new THREE.Mesh(rowGeo, rowMat);
          seatRow.position.set(0, 0.3 + row * 0.15, d / 2 - 1 - row * 0.8);
          rGroup.add(seatRow);
        }
      } else {
        const screenGeo = new THREE.BoxGeometry(w * 0.6, 0.9, 0.08);
        const screenMat = new THREE.MeshStandardMaterial({ color: "#f8fafc", emissive: "#94a3b8" });
        const screen = new THREE.Mesh(screenGeo, screenMat);
        screen.position.set(0, 1.4, -d / 2 + 0.2);
        rGroup.add(screen);

        for (let row = 0; row < 2; row++) {
          const deskGeo = new THREE.BoxGeometry(w * 0.7, 0.25, 0.3);
          const deskMat = new THREE.MeshStandardMaterial({ color: "#475569" });
          const desk = new THREE.Mesh(deskGeo, deskMat);
          desk.position.set(0, 0.3, d / 2 - 0.8 - row * 0.9);
          rGroup.add(desk);
        }
      }

      // Point Light inside Room for Glow Effect
      const pLight = new THREE.PointLight(statusColor, isSelected ? 2 : 1, 6);
      pLight.position.set(0, h * 0.8, 0);
      pLight.userData = { isLight: true };
      rGroup.add(pLight);

      roomGroup.add(rGroup);
      roomObjectsRef.current[room.id] = rGroup;
    });

    // 8. Mouse Interaction with Drag vs Click Discrimination
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let pointerDownPos = { x: 0, y: 0 };
    let isPointerDown = false;

    const handlePointerDown = (event) => {
      isPointerDown = true;
      pointerDownPos = { x: event.clientX, y: event.clientY };
    };

    const handlePointerMove = (event) => {
      const rect = currentContainer.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      // Only perform hover raycast if not actively dragging
      if (!isPointerDown) {
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(roomGroup.children, true);

        if (intersects.length > 0) {
          let root = intersects[0].object;
          while (root.parent && root.parent !== roomGroup) {
            root = root.parent;
          }
          if (root.userData?.roomData) {
            setHoveredRoom(root.userData.roomData);
            currentContainer.style.cursor = "pointer";
            return;
          }
        }
        setHoveredRoom(null);
        currentContainer.style.cursor = "grab";
      } else {
        currentContainer.style.cursor = "grabbing";
      }
    };

    const handlePointerUp = (event) => {
      isPointerDown = false;
      const dragDist = Math.hypot(event.clientX - pointerDownPos.x, event.clientY - pointerDownPos.y);

      // If moved less than 5px, it's a true click on a room!
      if (dragDist < 5) {
        const rect = currentContainer.getBoundingClientRect();
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(roomGroup.children, true);

        if (intersects.length > 0) {
          let root = intersects[0].object;
          while (root.parent && root.parent !== roomGroup) {
            root = root.parent;
          }
          if (root.userData?.roomData) {
            onSelectRoom(root.userData.roomData);
          }
        }
      }
      currentContainer.style.cursor = "grab";
    };

    currentContainer.addEventListener("pointerdown", handlePointerDown);
    currentContainer.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);

    // 9. Camera View Lerping & 360 Revolve Animation Loop
    let targetCamPos = null;
    let targetLookAt = null;

    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate);

      // Handle 360 Revolve Animation
      if (revolveStateRef.current.active) {
        const radius = Math.hypot(camera.position.x - controls.target.x, camera.position.z - controls.target.z) || 28;
        const currentY = camera.position.y;
        revolveStateRef.current.currentAngle += revolveStateRef.current.speed;

        camera.position.x = controls.target.x + radius * Math.sin(revolveStateRef.current.currentAngle);
        camera.position.z = controls.target.z + radius * Math.cos(revolveStateRef.current.currentAngle);
        camera.position.y = currentY;
        camera.lookAt(controls.target);

        if (revolveStateRef.current.currentAngle >= revolveStateRef.current.targetAngle) {
          revolveStateRef.current.active = false;
          setIsRevolving(false);
        }
      } else if (controls.autoRotate) {
        controls.update();
      } else if (targetCamPos && targetLookAt) {
        camera.position.lerp(targetCamPos, 0.08);
        controls.target.lerp(targetLookAt, 0.08);
        controls.update();

        if (camera.position.distanceTo(targetCamPos) < 0.05 && controls.target.distanceTo(targetLookAt) < 0.05) {
          targetCamPos = null;
          targetLookAt = null;
        }
      } else {
        controls.update();
      }

      // Subtle ambient room floating animation
      Object.values(roomObjectsRef.current).forEach((rObj, idx) => {
        rObj.position.y = Math.sin(Date.now() * 0.002 + idx) * 0.08;
      });

      renderer.render(scene, camera);
    };

    animate();

    // Store camera target helper
    scene.userData.setCam = (pos, look) => {
      revolveStateRef.current.active = false;
      setIsRevolving(false);
      controls.autoRotate = false;
      setIsAutoRotate(false);
      targetCamPos = pos.clone();
      targetLookAt = look.clone();
    };

    const handleResize = () => {
      if (!currentContainer) return;
      const w = currentContainer.clientWidth;
      const h = currentContainer.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animationFrameRef.current);
      currentContainer.removeEventListener("pointerdown", handlePointerDown);
      currentContainer.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("resize", handleResize);
      controls.dispose();
      if (renderer.domElement && currentContainer.contains(renderer.domElement)) {
        currentContainer.removeChild(renderer.domElement);
      }
    };
  }, [rooms, bookings, selectedRoom]);

  // Live color updater for 3D room boxes & wireframes
  useEffect(() => {
    if (!roomObjectsRef.current) return;

    rooms.forEach((room) => {
      const rGroup = roomObjectsRef.current[room.id];
      if (!rGroup) return;

      const { status: liveStatus, color: statusColor } = getRoomLiveStatus(room.id, selectedDate);
      const isSelected = selectedRoom?.id === room.id;
      const matchesFilter = !statusFilter || liveStatus.toLowerCase().includes(statusFilter.toLowerCase());

      const threeColor = new THREE.Color(statusColor);

      rGroup.children.forEach((child) => {
        if (child.userData?.isWall && child.material) {
          child.material.color.copy(threeColor);
          if (child.material.emissive) {
            child.material.emissive.copy(threeColor);
            child.material.emissiveIntensity = isSelected ? 0.9 : matchesFilter ? 0.55 : 0.1;
          }
          child.material.opacity = isSelected ? 0.85 : matchesFilter ? 0.6 : 0.15;
          child.material.needsUpdate = true;
        }
        if (child.userData?.isWireframe && child.material) {
          child.material.color.copy(threeColor);
          child.material.linewidth = isSelected ? 3 : 1;
          child.material.needsUpdate = true;
        }
        if (child.userData?.isLight) {
          child.color.copy(threeColor);
          child.intensity = isSelected ? 3.0 : matchesFilter ? 1.5 : 0.2;
        }
      });
    });
  }, [rooms, bookings, selectedRoom, statusFilter, selectedDate]);

  // -------------------------------------------------------------
  // 360° Revolve & Directional Navigation Controls
  // -------------------------------------------------------------

  // Trigger 360-Degree Revolve
  const trigger360Revolve = () => {
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    if (!camera || !controls) return;

    // Calculate current angle in X-Z plane relative to target
    const dx = camera.position.x - controls.target.x;
    const dz = camera.position.z - controls.target.z;
    const currentAngle = Math.atan2(dx, dz);

    revolveStateRef.current = {
      active: true,
      startTheta: currentAngle,
      currentAngle: currentAngle,
      targetAngle: currentAngle + Math.PI * 2, // Full 360 degrees
      speed: 0.035
    };
    setIsRevolving(true);
  };

  // Toggle continuous auto-rotation
  const toggleAutoRotate = () => {
    const controls = controlsRef.current;
    if (!controls) return;
    const newState = !isAutoRotate;
    controls.autoRotate = newState;
    controls.autoRotateSpeed = 2.0;
    setIsAutoRotate(newState);
    if (newState) {
      revolveStateRef.current.active = false;
      setIsRevolving(false);
    }
  };

  // Move camera in 4 directions
  const moveDirection = (direction) => {
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    if (!camera || !controls) return;

    revolveStateRef.current.active = false;
    setIsRevolving(false);

    const radius = camera.position.distanceTo(controls.target);
    const spherical = new THREE.Spherical().setFromVector3(
      new THREE.Vector3().subVectors(camera.position, controls.target)
    );

    if (direction === "left") {
      spherical.theta -= Math.PI / 6; // Orbit 30 deg left
    } else if (direction === "right") {
      spherical.theta += Math.PI / 6; // Orbit 30 deg right
    } else if (direction === "up") {
      spherical.phi = Math.max(0.15, spherical.phi - Math.PI / 12); // Tilt Up
    } else if (direction === "down") {
      spherical.phi = Math.min(Math.PI / 2 - 0.08, spherical.phi + Math.PI / 12); // Tilt Down
    }

    const newPos = new THREE.Vector3().setFromSpherical(spherical).add(controls.target);
    const scene = sceneRef.current;
    if (scene?.userData?.setCam) {
      scene.userData.setCam(newPos, controls.target);
    }
  };

  // Zoom In / Out
  const handleZoom = (inOut) => {
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    if (!camera || !controls) return;

    const dir = new THREE.Vector3().subVectors(camera.position, controls.target).normalize();
    const currentDist = camera.position.distanceTo(controls.target);
    const newDist = inOut === "in" ? Math.max(8, currentDist - 4) : Math.min(50, currentDist + 4);

    const newPos = new THREE.Vector3().copy(controls.target).addScaledVector(dir, newDist);
    const scene = sceneRef.current;
    if (scene?.userData?.setCam) {
      scene.userData.setCam(newPos, controls.target);
    }
  };

  // Reset to default overview
  const resetCamera = () => {
    setActiveCamView("overview");
    const scene = sceneRef.current;
    if (scene?.userData?.setCam) {
      scene.userData.setCam(new THREE.Vector3(0, 18, 22), new THREE.Vector3(0, 0, 0));
    }
  };

  // Handle preset camera views
  const setCameraView = (viewKey) => {
    setActiveCamView(viewKey);
    const scene = sceneRef.current;
    if (!scene || !scene.userData.setCam) return;

    if (viewKey === "overview") {
      scene.userData.setCam(new THREE.Vector3(0, 18, 22), new THREE.Vector3(0, 0, 0));
    } else if (viewKey === "auditorium") {
      scene.userData.setCam(new THREE.Vector3(0, 7, 12), new THREE.Vector3(0, 0, 4.5));
    } else if (viewKey === "hallA") {
      scene.userData.setCam(new THREE.Vector3(-9, 6, 1), new THREE.Vector3(-9, 0, -4.5));
    } else if (viewKey === "hallB") {
      scene.userData.setCam(new THREE.Vector3(-3, 6, 1), new THREE.Vector3(-3, 0, -4.5));
    } else if (viewKey === "hallC") {
      scene.userData.setCam(new THREE.Vector3(3, 6, 1), new THREE.Vector3(3, 0, -4.5));
    } else if (viewKey === "hallD") {
      scene.userData.setCam(new THREE.Vector3(9, 6, 1), new THREE.Vector3(9, 0, -4.5));
    }
  };

  return (
    <div className="relative w-full h-[540px] rounded-2xl overflow-hidden border border-slate-700/60 bg-slate-950 shadow-2xl shadow-cyan-950/30">
      {/* 3D WebGL Canvas */}
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Top Left Floating 3D Control HUD */}
      <div className="absolute top-4 left-4 z-10 flex flex-wrap items-center gap-2 bg-slate-900/80 backdrop-blur-md p-2 rounded-xl border border-slate-700/60 shadow-lg">
        <span className="text-xs font-semibold text-cyan-400 px-2 flex items-center gap-1">
          <Eye size={14} /> 3D View Preset:
        </span>
        <button
          onClick={() => setCameraView("overview")}
          className={`px-2.5 py-1 text-xs rounded-lg font-medium transition ${
            activeCamView === "overview"
              ? "bg-cyan-500 text-slate-950 font-bold shadow"
              : "bg-slate-800 text-slate-300 hover:bg-slate-700"
          }`}
        >
          Campus All
        </button>
        <button
          onClick={() => setCameraView("auditorium")}
          className={`px-2.5 py-1 text-xs rounded-lg font-medium transition ${
            activeCamView === "auditorium"
              ? "bg-amber-500 text-slate-950 font-bold shadow"
              : "bg-slate-800 text-slate-300 hover:bg-slate-700"
          }`}
        >
          Auditorium
        </button>
        <button
          onClick={() => setCameraView("hallA")}
          className={`px-2.5 py-1 text-xs rounded-lg font-medium transition ${
            activeCamView === "hallA"
              ? "bg-emerald-500 text-slate-950 font-bold shadow"
              : "bg-slate-800 text-slate-300 hover:bg-slate-700"
          }`}
        >
          Hall A
        </button>
        <button
          onClick={() => setCameraView("hallB")}
          className={`px-2.5 py-1 text-xs rounded-lg font-medium transition ${
            activeCamView === "hallB"
              ? "bg-blue-500 text-slate-950 font-bold shadow"
              : "bg-slate-800 text-slate-300 hover:bg-slate-700"
          }`}
        >
          Hall B
        </button>
        <button
          onClick={() => setCameraView("hallC")}
          className={`px-2.5 py-1 text-xs rounded-lg font-medium transition ${
            activeCamView === "hallC"
              ? "bg-gray-400 text-slate-950 font-bold shadow"
              : "bg-slate-800 text-slate-300 hover:bg-slate-700"
          }`}
        >
          Hall C
        </button>
        <button
          onClick={() => setCameraView("hallD")}
          className={`px-2.5 py-1 text-xs rounded-lg font-medium transition ${
            activeCamView === "hallD"
              ? "bg-purple-500 text-slate-950 font-bold shadow"
              : "bg-slate-800 text-slate-300 hover:bg-slate-700"
          }`}
        >
          Hall D
        </button>

        {/* Date Selector for 3D Viewer */}
        <div className="flex items-center gap-1.5 border-l border-slate-700/60 pl-2">
          <Calendar size={14} className="text-cyan-400" />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-slate-950 border border-slate-700/80 rounded-lg px-2 py-0.5 text-xs text-slate-100 font-semibold focus:outline-none cursor-pointer"
          />
        </div>
      </div>

      {/* Side 360° Revolve Return Logo & Directional Movement Gizmo */}
      <div className="absolute left-4 top-20 z-20 flex flex-col items-center gap-3 bg-slate-900/90 backdrop-blur-xl p-3 rounded-2xl border border-slate-700/70 shadow-2xl shadow-black/50 animate-fade-in">
        {/* Hero 360° Revolve Return Button */}
        <div className="relative group">
          <button
            onClick={trigger360Revolve}
            className={`relative w-12 h-12 rounded-2xl flex flex-col items-center justify-center transition-all duration-300 shadow-xl border active:scale-95 ${
              isRevolving
                ? "bg-gradient-to-tr from-cyan-500 to-indigo-600 border-cyan-300 text-white shadow-cyan-500/50 ring-4 ring-cyan-400/30"
                : "bg-slate-800/90 hover:bg-gradient-to-tr hover:from-cyan-600 hover:to-indigo-600 border-slate-600 hover:border-cyan-400 text-cyan-300 hover:text-white shadow-black/40"
            }`}
            title="Click to revolve 360° around campus"
          >
            <RotateCw
              size={20}
              className={`transition-transform duration-700 ${
                isRevolving ? "animate-spin text-white" : "group-hover:rotate-180"
              }`}
            />
            <span className="text-[9px] font-black tracking-tighter mt-0.5 font-mono">360°</span>
          </button>
          
          {/* Floating Hover Tooltip */}
          <div className="absolute left-16 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center gap-1.5 bg-slate-900/95 text-cyan-300 text-xs px-3 py-1.5 rounded-xl border border-cyan-500/40 shadow-xl whitespace-nowrap pointer-events-none z-30 font-semibold">
            <Sparkles size={13} className="text-amber-400" />
            {isRevolving ? "Revolving 360°..." : "Click to Revolve 360°"}
          </div>
        </div>

        {/* 4-Way Directional Controller (Move Camera in Any Direction) */}
        <div className="flex flex-col items-center gap-1 p-1 bg-slate-950/70 rounded-xl border border-slate-800">
          {/* Tilt Up */}
          <button
            onClick={() => moveDirection("up")}
            className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-800 hover:bg-cyan-500 hover:text-slate-950 text-slate-300 transition shadow active:scale-90"
            title="Tilt Camera Up"
          >
            <ChevronUp size={16} />
          </button>

          <div className="flex items-center gap-1">
            {/* Orbit Left */}
            <button
              onClick={() => moveDirection("left")}
              className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-800 hover:bg-cyan-500 hover:text-slate-950 text-slate-300 transition shadow active:scale-90"
              title="Orbit Left (30°)"
            >
              <ChevronLeft size={16} />
            </button>

            {/* Center Return Logo: Return to Default Center Overview */}
            <button
              onClick={resetCamera}
              className="w-7 h-7 flex items-center justify-center rounded-lg bg-indigo-950 border border-indigo-500/50 hover:bg-indigo-600 text-indigo-300 hover:text-white transition shadow active:scale-90"
              title="Return / Reset to Default Overview View"
            >
              <Compass size={14} />
            </button>

            {/* Orbit Right */}
            <button
              onClick={() => moveDirection("right")}
              className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-800 hover:bg-cyan-500 hover:text-slate-950 text-slate-300 transition shadow active:scale-90"
              title="Orbit Right (30°)"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Tilt Down */}
          <button
            onClick={() => moveDirection("down")}
            className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-800 hover:bg-cyan-500 hover:text-slate-950 text-slate-300 transition shadow active:scale-90"
            title="Tilt Camera Down"
          >
            <ChevronDown size={16} />
          </button>
        </div>

        {/* Zoom & Auto-Revolve Controls */}
        <div className="flex flex-col items-center gap-1 w-full pt-1 border-t border-slate-800">
          <button
            onClick={() => handleZoom("in")}
            className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition text-xs font-bold active:scale-90"
            title="Zoom In"
          >
            <ZoomIn size={14} />
          </button>
          <button
            onClick={() => handleZoom("out")}
            className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition text-xs font-bold active:scale-90"
            title="Zoom Out"
          >
            <ZoomOut size={14} />
          </button>
          <button
            onClick={toggleAutoRotate}
            className={`w-7 h-7 flex items-center justify-center rounded-lg transition text-[10px] font-bold border mt-0.5 active:scale-90 ${
              isAutoRotate
                ? "bg-cyan-500 text-slate-950 border-cyan-400 shadow-md shadow-cyan-500/30"
                : "bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200"
            }`}
            title={isAutoRotate ? "Pause Auto-Rotate" : "Start Continuous 360° Turntable Spin"}
          >
            <RotateCcw size={13} className={isAutoRotate ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Bottom Left Gesture Guidance Badge */}
      <div className="absolute bottom-4 left-4 z-10 hidden sm:flex items-center gap-2 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800 text-[11px] text-slate-400 shadow-lg pointer-events-none select-none">
        <Navigation size={13} className="text-cyan-400" />
        <span>Drag mouse to move in any direction • Right-click to pan • Scroll to zoom</span>
      </div>

      {/* Top Right Status Legend (Interactive Filter ONLY for Admin, Read-Only for Faculty/Guest) */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md p-1.5 rounded-xl border border-slate-700/60 text-xs font-medium text-slate-200 shadow-xl">
        {currentUser?.role === "Administrator" ? (
          <>
            <button
              onClick={() => setStatusFilter(statusFilter === "Available" ? null : "Available")}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition ${
                statusFilter === "Available"
                  ? "bg-emerald-950 border border-emerald-500 text-emerald-300 font-bold shadow-md"
                  : "hover:bg-slate-800 text-slate-300"
              }`}
              title="Admin Filter: Click to toggle Available halls"
            >
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-sm shadow-emerald-500/50" />
              Available
            </button>
            <button
              onClick={() => setStatusFilter(statusFilter === "Booked" ? null : "Booked")}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition ${
                statusFilter === "Booked"
                  ? "bg-rose-950 border border-rose-500 text-rose-300 font-bold shadow-md"
                  : "hover:bg-slate-800 text-slate-300"
              }`}
              title="Admin Filter: Click to toggle Booked halls"
            >
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-sm shadow-rose-500/50" />
              Booked
            </button>
            <button
              onClick={() => setStatusFilter(statusFilter === "Pending" ? null : "Pending")}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition ${
                statusFilter === "Pending"
                  ? "bg-amber-950 border border-amber-500 text-amber-300 font-bold shadow-md"
                  : "hover:bg-slate-800 text-slate-300"
              }`}
              title="Admin Filter: Click to toggle Pending halls"
            >
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-sm shadow-amber-400/50" />
              Pending
            </button>
            <button
              onClick={() => setStatusFilter(statusFilter === "Maintenance" ? null : "Maintenance")}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition ${
                statusFilter === "Maintenance"
                  ? "bg-slate-800 border border-slate-400 text-slate-100 font-bold shadow-md"
                  : "hover:bg-slate-800 text-slate-300"
              }`}
              title="Admin Filter: Click to toggle Maintenance halls"
            >
              <span className="w-2.5 h-2.5 rounded-full bg-gray-500 shadow-sm shadow-gray-500/50" />
              Maintenance
            </button>
          </>
        ) : (
          <div className="flex items-center gap-3 px-2 py-1 text-slate-300 select-none">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-sm shadow-emerald-500/50" />
              Available
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-sm shadow-rose-500/50" />
              Booked
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-sm shadow-amber-400/50" />
              Pending
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-gray-500 shadow-sm shadow-gray-500/50" />
              Maintenance
            </span>
          </div>
        )}
      </div>

      {/* Bottom Center Hover Tooltip */}
      {hoveredRoom && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 bg-slate-900/95 backdrop-blur-md px-4 py-2.5 rounded-xl border border-cyan-500/40 shadow-xl text-center pointer-events-none transition-all duration-200">
          <div className="text-sm font-bold text-cyan-300 flex items-center justify-center gap-2">
            <Sparkles size={15} /> {hoveredRoom.name} ({hoveredRoom.code})
          </div>
          <div className="text-xs text-slate-400 mt-0.5 flex items-center justify-center gap-3">
            <span>Cap: {hoveredRoom.capacity} seats</span>
            <span>•</span>
            <span>{hoveredRoom.building}</span>
          </div>
        </div>
      )}

      {/* Selected Room Overlay Drawer */}
      {selectedRoom && (
        <div className="absolute bottom-4 right-4 z-20 w-80 bg-slate-900/95 backdrop-blur-xl p-4 rounded-2xl border border-cyan-500/40 shadow-2xl animate-fade-in text-slate-100">
          <div className="flex items-start justify-between border-b border-slate-800 pb-2 mb-3">
            <div>
              <h4 className="font-bold text-cyan-300 text-base flex items-center gap-2">
                {selectedRoom.name}
              </h4>
              <span className="text-xs text-slate-400">{selectedRoom.code} | {selectedRoom.building}</span>
            </div>
            <button
              onClick={() => onSelectRoom(null)}
              className="text-slate-400 hover:text-white text-xs bg-slate-800 px-2 py-1 rounded-lg"
            >
              ✕
            </button>
          </div>

          <div className="space-y-2 text-xs text-slate-300 mb-4">
            <div className="flex justify-between items-center bg-slate-800/60 p-2 rounded-lg">
              <span className="text-slate-400 flex items-center gap-1"><Users size={14} /> Capacity</span>
              <span className="font-bold text-cyan-400">{selectedRoom.capacity} Seats</span>
            </div>

            <div className="flex justify-between items-center bg-slate-800/60 p-2 rounded-lg">
              <span className="text-slate-400 flex items-center gap-1"><Clock size={14} /> Today Status</span>
              {(() => {
                const { status, color, booking } = getRoomLiveStatus(selectedRoom.id);
                return (
                  <span className="font-bold px-2 py-0.5 rounded-full text-[11px]" style={{ backgroundColor: `${color}25`, color }}>
                    {status}
                  </span>
                );
              })()}
            </div>

            <div>
              <span className="text-slate-400 font-medium block mb-1">Facilities Available:</span>
              <div className="flex flex-wrap gap-1">
                {selectedRoom.facilities.map((fac, idx) => (
                  <span key={idx} className="bg-cyan-950/80 border border-cyan-700/50 text-cyan-300 px-2 py-0.5 rounded-md text-[10px]">
                    {fac}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Admin Master Privilege Control Panel */}
          {currentUser?.role === "Administrator" ? (
            <div className="space-y-2 border-t border-slate-800 pt-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase text-amber-400 tracking-wider flex items-center gap-1">
                  👑 ADMIN MASTER OVERRIDE
                </span>
                <span className="text-[10px] text-cyan-300 font-semibold">
                  Status: {selectedRoom.status === "Maintenance" ? "Maintenance" : "Force Available"}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    onUpdateRoomStatus && onUpdateRoomStatus(selectedRoom.id, "Force Available", "Made available by Admin override");
                  }}
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 border shadow-lg ${
                    selectedRoom.status === "Force Available" || selectedRoom.status === "Available"
                      ? "bg-emerald-950 text-emerald-300 border-emerald-500 shadow-emerald-500/20 font-black ring-2 ring-emerald-500/40"
                      : "bg-slate-800/80 text-slate-300 border-slate-700 hover:border-emerald-500"
                  }`}
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  Force Available
                </button>
                <button
                  onClick={() => {
                    const reason = window.prompt("Enter maintenance reason:", selectedRoom.maintenanceReason || "Technical maintenance by Admin");
                    if (reason !== null) {
                      onUpdateRoomStatus && onUpdateRoomStatus(selectedRoom.id, "Maintenance", reason);
                    }
                  }}
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 border shadow-lg ${
                    selectedRoom.status === "Maintenance"
                      ? "bg-slate-800 text-slate-100 border-slate-400 font-black ring-2 ring-slate-400/40"
                      : "bg-slate-800/80 text-slate-300 border-slate-700 hover:border-amber-400"
                  }`}
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-gray-500" />
                  Force Maintenance
                </button>
              </div>
              <button
                onClick={() => onBookRoom(selectedRoom)}
                disabled={selectedRoom.status === "Maintenance"}
                className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition mt-1"
              >
                {selectedRoom.status === "Maintenance" ? "Under Maintenance" : "Reserve / Book Hall →"}
              </button>
            </div>
          ) : (
            <button
              onClick={() => onBookRoom(selectedRoom)}
              disabled={selectedRoom.status === "Maintenance"}
              className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {selectedRoom.status === "Maintenance" ? "Under Maintenance" : "Book This Hall Now →"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
