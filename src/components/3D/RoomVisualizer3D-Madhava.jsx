import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { 
  Maximize2, 
  RotateCcw, 
  Layers, 
  Sliders, 
  Info, 
  Calendar, 
  Users, 
  Tv, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle,
  Eye,
  Plus
} from "lucide-react";
import { timeToMinutes } from "../../utils/conflictDetector";

export default function RoomVisualizer3D({
  rooms = [],
  bookings = [],
  selectedRoom,
  onSelectRoom,
  onBookRoom,
  user
}) {
  const mountRef = useRef(null);
  const [hoveredRoom, setHoveredRoom] = useState(null);
  const [selectedFloor, setSelectedFloor] = useState("All");
  const [simulatedTime, setSimulatedTime] = useState("10:00");
  const [autoRotate, setAutoRotate] = useState(false);

  // References for Three.js state
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const roomMeshesRef = useRef(new Map());
  const raycasterRef = useRef(new THREE.Raycaster());
  const mouseRef = useRef(new THREE.Vector2(-100, -100));

  // Determine real-time occupancy based on simulated time
  const getRoomLiveStatus = (room) => {
    if (room.status === "Maintenance") return { status: "Maintenance", label: "Maintenance", color: "#f59e0b" };

    const targetDate = new Date().toISOString().split("T")[0];
    const currentMins = timeToMinutes(simulatedTime);

    const activeBkg = bookings.find((b) => {
      if (b.room_id !== room.id) return false;
      if (b.date !== targetDate) return false;
      if (b.status !== "Approved") return false;
      const s = timeToMinutes(b.start_time);
      const e = timeToMinutes(b.end_time);
      return currentMins >= s && currentMins < e;
    });

    if (activeBkg) {
      return {
        status: "Occupied",
        label: `Occupied: ${activeBkg.event_name}`,
        booking: activeBkg,
        color: "#ef4444"
      };
    }

    return { status: "Available", label: "Available", color: "#10b981" };
  };

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight || 500;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0f1d);
    scene.fog = new THREE.FogExp2(0x0a0f1d, 0.025);
    sceneRef.current = scene;

    // 2. Camera (Perspective)
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 24, 28);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    container.innerHTML = "";
    container.appendChild(renderer.domElement);

    // 4. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.4);
    dirLight.position.set(20, 30, 20);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.bias = -0.001;
    scene.add(dirLight);

    const blueLight = new THREE.PointLight(0x6366f1, 2, 50);
    blueLight.position.set(-15, 10, -10);
    scene.add(blueLight);

    const cyanLight = new THREE.PointLight(0x06b6d4, 1.5, 50);
    cyanLight.position.set(15, 8, 15);
    scene.add(cyanLight);

    // 5. Floor Ground Grid
    const groundGeo = new THREE.PlaneGeometry(60, 40);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.8,
      metalness: 0.2
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.05;
    ground.receiveShadow = true;
    scene.add(ground);

    const gridHelper = new THREE.GridHelper(60, 40, 0x334155, 0x1e293b);
    gridHelper.position.y = 0;
    scene.add(gridHelper);

    // 6. Simple Mouse Drag Orbit Controls
    let isDragging = false;
    let prevMousePos = { x: 0, y: 0 };
    let cameraAngle = { theta: 0, phi: Math.PI / 4, radius: 36 };

    const updateCameraPosition = () => {
      camera.position.x = cameraAngle.radius * Math.sin(cameraAngle.phi) * Math.sin(cameraAngle.theta);
      camera.position.y = cameraAngle.radius * Math.cos(cameraAngle.phi);
      camera.position.z = cameraAngle.radius * Math.sin(cameraAngle.phi) * Math.cos(cameraAngle.theta);
      camera.lookAt(0, 0, 0);
    };
    updateCameraPosition();

    const onMouseDown = (e) => {
      isDragging = true;
      prevMousePos = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e) => {
      const rect = container.getBoundingClientRect();
      mouseRef.current.x = ((e.clientX - rect.left) / width) * 2 - 1;
      mouseRef.current.y = -((e.clientY - rect.top) / height) * 2 + 1;

      if (isDragging) {
        const deltaX = e.clientX - prevMousePos.x;
        const deltaY = e.clientY - prevMousePos.y;

        cameraAngle.theta -= deltaX * 0.006;
        cameraAngle.phi = Math.max(0.1, Math.min(Math.PI / 2 - 0.05, cameraAngle.phi - deltaY * 0.006));

        prevMousePos = { x: e.clientX, y: e.clientY };
        updateCameraPosition();
      }
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    const onWheel = (e) => {
      e.preventDefault();
      cameraAngle.radius = Math.max(15, Math.min(60, cameraAngle.radius + e.deltaY * 0.04));
      updateCameraPosition();
    };

    const onCanvasClick = () => {
      raycasterRef.current.setFromCamera(mouseRef.current, camera);
      const meshes = Array.from(roomMeshesRef.current.values());
      const intersects = raycasterRef.current.intersectObjects(meshes, true);

      if (intersects.length > 0) {
        let root = intersects[0].object;
        while (root.parent && root.parent !== scene && !root.userData?.roomId) {
          root = root.parent;
        }
        if (root.userData?.roomId) {
          const room = rooms.find((r) => r.id === root.userData.roomId);
          if (room) onSelectRoom(room);
        }
      }
    };

    container.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    container.addEventListener("wheel", onWheel, { passive: false });
    container.addEventListener("click", onCanvasClick);

    // 7. Animation Loop
    let animId;
    const clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      if (autoRotate && !isDragging) {
        cameraAngle.theta += 0.003;
        updateCameraPosition();
      }

      // Check Hover Raycasting
      raycasterRef.current.setFromCamera(mouseRef.current, camera);
      const meshes = Array.from(roomMeshesRef.current.values());
      const intersects = raycasterRef.current.intersectObjects(meshes, true);

      if (intersects.length > 0) {
        let root = intersects[0].object;
        while (root.parent && root.parent !== scene && !root.userData?.roomId) {
          root = root.parent;
        }
        if (root.userData?.roomId) {
          const r = rooms.find((x) => x.id === root.userData.roomId);
          setHoveredRoom(r || null);
          container.style.cursor = "pointer";
        }
      } else {
        setHoveredRoom(null);
        container.style.cursor = "grab";
      }

      // Animate floating status beacon rings
      scene.traverse((obj) => {
        if (obj.userData?.isBeacon) {
          obj.rotation.y += 0.02;
          obj.position.y = obj.userData.baseY + Math.sin(elapsedTime * 2.5 + obj.userData.offset) * 0.15;
        }
      });

      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!container) return;
      const newW = container.clientWidth;
      const newH = container.clientHeight || 500;
      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animId);
      container.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      container.removeEventListener("wheel", onWheel);
      container.removeEventListener("click", onCanvasClick);
      window.removeEventListener("resize", handleResize);
      renderer.dispose();
    };
  }, [rooms, autoRotate]);

  // Build & update 3D room objects whenever rooms or simulated time changes
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    // Clear existing room meshes
    roomMeshesRef.current.forEach((mesh) => scene.remove(mesh));
    roomMeshesRef.current.clear();

    // Filter rooms by floor
    const filteredRooms = selectedFloor === "All" 
      ? rooms 
      : rooms.filter((r) => (r.floor || "").toLowerCase().includes(selectedFloor.toLowerCase()));

    filteredRooms.forEach((room, idx) => {
      const roomGroup = new THREE.Group();
      roomGroup.userData = { roomId: room.id };

      const pos = room.position || { x: (idx - 2) * 5, y: 0, z: 0 };
      const dim = room.dimensions || { width: 4, height: 2.5, depth: 3.5 };
      const live = getRoomLiveStatus(room);
      const isSelected = selectedRoom?.id === room.id;

      // Status color
      const statusColor = isSelected ? 0x8b5cf6 : live.status === "Available" ? 0x10b981 : live.status === "Maintenance" ? 0xf59e0b : 0xef4444;

      // Room Floor Mat
      const floorGeo = new THREE.BoxGeometry(dim.width, 0.1, dim.depth);
      const floorMat = new THREE.MeshStandardMaterial({
        color: 0x1e293b,
        roughness: 0.6,
        metalness: 0.3
      });
      const floorMesh = new THREE.Mesh(floorGeo, floorMat);
      floorMesh.position.set(0, 0.05, 0);
      floorMesh.receiveShadow = true;
      roomGroup.add(floorMesh);

      // Glass Walls / Boundary Frame
      const wallMat = new THREE.MeshPhysicalMaterial({
        color: statusColor,
        transparent: true,
        opacity: isSelected ? 0.35 : 0.18,
        roughness: 0.1,
        transmission: 0.6,
        thickness: 0.5
      });

      // Perimeter wireframe / walls
      const wallGeo = new THREE.BoxGeometry(dim.width, dim.height, dim.depth);
      const wallMesh = new THREE.Mesh(wallGeo, wallMat);
      wallMesh.position.set(0, dim.height / 2, 0);
      wallMesh.castShadow = true;
      roomGroup.add(wallMesh);

      const edgeGeo = new THREE.EdgesGeometry(wallGeo);
      const edgeMat = new THREE.LineBasicMaterial({
        color: statusColor,
        linewidth: isSelected ? 3 : 1
      });
      const edgeLines = new THREE.LineSegments(edgeGeo, edgeMat);
      edgeLines.position.copy(wallMesh.position);
      roomGroup.add(edgeLines);

      // Interior Furniture: Conference Table & Screen
      const tableGeo = new THREE.BoxGeometry(dim.width * 0.5, 0.4, dim.depth * 0.4);
      const tableMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.5 });
      const table = new THREE.Mesh(tableGeo, tableMat);
      table.position.set(0, 0.25, 0);
      table.castShadow = true;
      roomGroup.add(table);

      // Projection Board / Screen at front wall
      const screenGeo = new THREE.BoxGeometry(dim.width * 0.6, dim.height * 0.4, 0.08);
      const screenMat = new THREE.MeshStandardMaterial({
        color: live.status === "Available" ? 0x0284c7 : 0x475569,
        emissive: live.status === "Available" ? 0x0284c7 : 0x000000,
        emissiveIntensity: 0.4
      });
      const screen = new THREE.Mesh(screenGeo, screenMat);
      screen.position.set(0, dim.height * 0.55, -dim.depth / 2 + 0.1);
      roomGroup.add(screen);

      // Floating Holographic Beacon above Room
      const beaconGroup = new THREE.Group();
      beaconGroup.userData = { isBeacon: true, baseY: dim.height + 1.2, offset: idx * 0.8 };
      beaconGroup.position.set(0, dim.height + 1.2, 0);

      const ringGeo = new THREE.TorusGeometry(0.5, 0.05, 16, 32);
      const ringMat = new THREE.MeshBasicMaterial({ color: statusColor });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = Math.PI / 2;
      beaconGroup.add(ring);

      const diamondGeo = new THREE.OctahedronGeometry(0.25);
      const diamondMat = new THREE.MeshStandardMaterial({
        color: statusColor,
        emissive: statusColor,
        emissiveIntensity: 0.8
      });
      const diamond = new THREE.Mesh(diamondGeo, diamondMat);
      beaconGroup.add(diamond);

      roomGroup.add(beaconGroup);

      // Place room in world position
      roomGroup.position.set(pos.x, pos.y, pos.z);
      scene.add(roomGroup);
      roomMeshesRef.current.set(room.id, roomGroup);
    });
  }, [rooms, bookings, selectedRoom, selectedFloor, simulatedTime]);

  const resetCamera = () => {
    if (cameraRef.current) {
      cameraRef.current.position.set(0, 24, 28);
      cameraRef.current.lookAt(0, 0, 0);
    }
  };

  return (
    <div className="relative w-full h-[680px] rounded-3xl overflow-hidden glass-panel border border-slate-800 shadow-2xl flex flex-col">
      
      {/* Top Overlay Controls */}
      <div className="absolute top-4 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
        
        {/* Floor Filter & Title */}
        <div className="pointer-events-auto flex items-center gap-2 bg-slate-900/85 backdrop-blur-md p-1.5 rounded-2xl border border-slate-700/80 shadow-xl">
          <div className="px-3 py-1 text-xs font-bold text-indigo-400 flex items-center gap-1.5 border-r border-slate-700">
            <Layers className="w-4 h-4" />
            <span>Floor:</span>
          </div>
          {["All", "Ground", "1st", "2nd"].map((fl) => (
            <button
              key={fl}
              onClick={() => setSelectedFloor(fl)}
              className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all ${
                selectedFloor === fl
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              }`}
            >
              {fl}
            </button>
          ))}
        </div>

        {/* Time-Travel Occupancy Simulator */}
        <div className="pointer-events-auto flex items-center gap-3 bg-slate-900/85 backdrop-blur-md px-4 py-2 rounded-2xl border border-slate-700/80 shadow-xl">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
            <Clock className="w-4 h-4 text-cyan-400" />
            <span>Simulate Time:</span>
            <span className="font-mono text-cyan-300 bg-slate-950 px-2 py-0.5 rounded-lg border border-cyan-500/30">
              {simulatedTime}
            </span>
          </div>
          <input
            type="range"
            min="480"
            max="1200"
            step="30"
            value={timeToMinutes(simulatedTime)}
            onChange={(e) => {
              const val = Number(e.target.value);
              const hrs = Math.floor(val / 60).toString().padStart(2, "0");
              const mins = (val % 60).toString().padStart(2, "0");
              setSimulatedTime(`${hrs}:${mins}`);
            }}
            className="w-28 sm:w-36 accent-indigo-500 cursor-pointer"
          />
        </div>

        {/* Camera Tools */}
        <div className="pointer-events-auto flex items-center gap-1.5 bg-slate-900/85 backdrop-blur-md p-1.5 rounded-2xl border border-slate-700/80 shadow-xl">
          <button
            onClick={() => setAutoRotate(!autoRotate)}
            className={`p-2 rounded-xl text-xs transition-colors ${
              autoRotate ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            }`}
            title="Toggle Auto Rotate"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={resetCamera}
            className="p-2 rounded-xl text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            title="Reset Camera View"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>

      </div>

      {/* 3D WebGL Canvas Mount */}
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing flex-1" />

      {/* Status Color Legend */}
      <div className="absolute bottom-4 left-4 z-20 pointer-events-auto bg-slate-900/85 backdrop-blur-md px-4 py-2 rounded-2xl border border-slate-700/80 shadow-xl flex items-center gap-4 text-xs font-semibold">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />
          <span className="text-slate-300">Available</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-rose-500 shadow-sm shadow-rose-500/50" />
          <span className="text-slate-300">Occupied</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-amber-500 shadow-sm shadow-amber-500/50" />
          <span className="text-slate-300">Maintenance</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-indigo-500 shadow-sm shadow-indigo-500/50" />
          <span className="text-slate-300">Selected</span>
        </div>
      </div>

      {/* Hover Tooltip */}
      {hoveredRoom && (
        <div className="absolute top-20 left-6 z-20 pointer-events-none bg-slate-900/95 border border-indigo-500/40 rounded-2xl p-4 shadow-2xl backdrop-blur-xl max-w-xs animate-fadeIn">
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="font-bold text-sm text-white">{hoveredRoom.name}</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
              {hoveredRoom.code}
            </span>
          </div>
          <div className="text-xs text-slate-400 mb-2">{hoveredRoom.building}</div>
          <div className="flex items-center gap-3 text-xs text-slate-300">
            <span className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-indigo-400" />
              {hoveredRoom.capacity} Seats
            </span>
            <span className="flex items-center gap-1">
              <span className={`w-2 h-2 rounded-full ${
                getRoomLiveStatus(hoveredRoom).status === "Available" ? "bg-emerald-400" : "bg-rose-400"
              }`} />
              {getRoomLiveStatus(hoveredRoom).status}
            </span>
          </div>
        </div>
      )}

      {/* Selected Room Details Drawer */}
      {selectedRoom && (
        <div className="absolute top-4 right-4 bottom-4 w-80 sm:w-96 z-30 pointer-events-auto bg-slate-900/95 border border-slate-700/80 rounded-3xl p-6 shadow-2xl backdrop-blur-2xl flex flex-col justify-between overflow-y-auto animate-slideInRight">
          <div>
            <div className="flex items-start justify-between gap-2 mb-3">
              <div>
                <span className="text-[11px] font-semibold text-indigo-400 uppercase tracking-wider">
                  {selectedRoom.type}
                </span>
                <h4 className="font-display font-bold text-xl text-white mt-0.5">
                  {selectedRoom.name}
                </h4>
                <div className="text-xs text-slate-400 mt-0.5">{selectedRoom.building}</div>
              </div>
              <button
                onClick={() => onSelectRoom(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                ?
              </button>
            </div>

            {/* Live Status Badge */}
            {(() => {
              const live = getRoomLiveStatus(selectedRoom);
              return (
                <div className={`p-3 rounded-2xl mb-4 border flex items-center gap-3 ${
                  live.status === "Available"
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                    : live.status === "Maintenance"
                    ? "bg-amber-500/10 border-amber-500/30 text-amber-300"
                    : "bg-rose-500/10 border-rose-500/30 text-rose-300"
                }`}>
                  {live.status === "Available" ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  ) : live.status === "Maintenance" ? (
                    <AlertTriangle className="w-5 h-5 text-amber-400" />
                  ) : (
                    <XCircle className="w-5 h-5 text-rose-400" />
                  )}
                  <div>
                    <div className="text-xs font-bold">{live.status} at {simulatedTime}</div>
                    <div className="text-[11px] opacity-80">{live.label}</div>
                  </div>
                </div>
              );
            })()}

            {/* Room Specs */}
            <div className="grid grid-cols-2 gap-2.5 mb-4">
              <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/50">
                <div className="text-[10px] text-slate-400">Capacity</div>
                <div className="text-sm font-bold text-slate-200 mt-0.5 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-indigo-400" />
                  {selectedRoom.capacity} People
                </div>
              </div>
              <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/50">
                <div className="text-[10px] text-slate-400">Floor Level</div>
                <div className="text-sm font-bold text-slate-200 mt-0.5 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-cyan-400" />
                  {selectedRoom.floor || "Ground"}
                </div>
              </div>
            </div>

            {/* Description */}
            {selectedRoom.description && (
              <p className="text-xs text-slate-300 leading-relaxed mb-4">
                {selectedRoom.description}
              </p>
            )}

            {/* Facilities */}
            <div className="mb-4">
              <div className="text-[11px] font-semibold text-slate-400 mb-2">Equipped Facilities</div>
              <div className="flex flex-wrap gap-1.5">
                {(selectedRoom.facilities || []).map((fac, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-800 text-slate-300 border border-slate-700"
                  >
                    {fac}
                  </span>
                ))}
              </div>
            </div>

          </div>

          {/* Action CTA */}
          <div className="pt-4 border-t border-slate-800">
            <button
              onClick={() => onBookRoom(selectedRoom)}
              className="w-full py-3 px-4 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-xl shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 active:scale-98"
            >
              <Plus className="w-4 h-4" />
              <span>Reserve {selectedRoom.name}</span>
            </button>
          </div>

        </div>
      )}

    </div>
  );
}
