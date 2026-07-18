"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { Loader2, X, Sparkles, ExternalLink } from "lucide-react";

import * as THREE from 'three';

const ForceGraph3D = dynamic(() => import("react-force-graph-3d"), { ssr: false });

const NODE_COLORS = {
  capture: "#38bdf8", // Sky blue
  file: "#a78bfa",    // Purple
  roadmap: "#f472b6", // Pink
  default: "#fde047", // Yellow
};

const CLUSTER_COLORS = [
    "#FF3366", "#33CCFF", "#FFCC00", "#33FF99", 
    "#9933FF", "#FF9933", "#3366FF", "#FF33CC",
    "#00CC66", "#FF6600"
];

export default function KnowledgeGraphPage() {
    const [graphData, setGraphData] = useState({ nodes: [], links: [] });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const router = useRouter();
    const fgRef = useRef();

    // Time Travel State
    const [timeRange, setTimeRange] = useState({ min: Date.now() - 86400000, max: Date.now() });
    const [maxDate, setMaxDate] = useState(Date.now());

    // Explore Mode State
    const [exploreNode, setExploreNode] = useState(null);
    const [aiExplanation, setAiExplanation] = useState("");
    const [analyzing, setAnalyzing] = useState(false);

    // Responsive dimensions
    const containerRef = useRef();
    const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

    useEffect(() => {
        if (typeof window === "undefined" || !containerRef.current) return;

        const resizeObserver = new ResizeObserver((entries) => {
            if (entries && entries.length > 0) {
                setDimensions({
                    width: entries[0].contentRect.width,
                    height: entries[0].contentRect.height
                });
            }
        });
        resizeObserver.observe(containerRef.current);
        
        // Initial dimension set
        setDimensions({
            width: containerRef.current.clientWidth,
            height: containerRef.current.clientHeight
        });

        return () => resizeObserver.disconnect();
    }, []);

    useEffect(() => {
        if (fgRef.current && graphData.nodes.length > 0) {
            // Prevent nodes from flying infinitely far apart
            fgRef.current.d3Force('charge').strength(-120).distanceMax(300);
        }
    }, [graphData.nodes.length]);

    useEffect(() => {
        let animationFrameId;
        const animate = () => {
            if (fgRef.current) {
                const scene = fgRef.current.scene();
                if (scene) {
                    const time = Date.now() * 0.002;
                    scene.traverse((obj) => {
                        if (obj.__halo) {
                            const scale = 1 + Math.sin(time + obj.__pulsePhase) * 0.2;
                            obj.__halo.scale.set(scale, scale, scale);
                            obj.__halo.material.opacity = 0.3 + Math.sin(time + obj.__pulsePhase) * 0.2;
                        }
                    });
                }
            }
            animationFrameId = requestAnimationFrame(animate);
        };
        animate();
        return () => cancelAnimationFrame(animationFrameId);
    }, []);

    useEffect(() => {
        const loadGraph = async () => {
            try {
                const res = await apiFetch("/api/graph");
                const data = await res.json();
                if (data.success) {
                    setGraphData(data.data);
                    
                    if (data.data.nodes.length > 0) {
                        const timestamps = data.data.nodes.map(n => {
                            const time = new Date(n.createdAt).getTime();
                            return isNaN(time) ? Date.now() : time;
                        });
                        const min = Math.min(...timestamps);
                        const max = Math.max(...timestamps) + 1000; // Add a second padding
                        setTimeRange({ min, max });
                        setMaxDate(max);
                    }
                } else {
                    setError(data.message || "Failed to load graph");
                }
            } catch (err) {
                setError("Error loading graph data");
            } finally {
                setLoading(false);
            }
        };
        loadGraph();
    }, []);

    const filteredNodes = useMemo(() => {
        return graphData.nodes.filter(n => {
            const time = new Date(n.createdAt).getTime();
            const validTime = isNaN(time) ? Date.now() : time;
            return validTime <= maxDate;
        });
    }, [graphData, maxDate]);

    const filteredLinks = useMemo(() => {
        const validNodeIds = new Set(filteredNodes.map(n => n.id));
        return graphData.links.filter(l => {
            const sourceId = typeof l.source === 'object' ? l.source.id : l.source;
            const targetId = typeof l.target === 'object' ? l.target.id : l.target;
            return validNodeIds.has(sourceId) && validNodeIds.has(targetId);
        });
    }, [graphData, filteredNodes]);

    const handleNodeClick = (node) => {
        // Focus the camera on the node
        if (fgRef.current) {
            const distance = 40;
            const distRatio = 1 + distance/Math.hypot(node.x, node.y, node.z);
            fgRef.current.cameraPosition(
                { x: node.x * distRatio, y: node.y * distRatio, z: node.z * distRatio },
                node,
                3000 // ms transition
            );
        }
        
        setExploreNode(node);
        setAiExplanation(""); // Reset explanation
    };

    const handleNavigate = (node) => {
        const id = node.id.split("_")[1];
        if (node.type === "capture") {
            router.push(`/captures/${id}`);
        } else if (node.type === "roadmap") {
            router.push(`/journey/${id}`);
        } else if (node.type === "file") {
            router.push(`/vault/${id}`);
        }
    };

    const analyzeConnections = async () => {
        if (!exploreNode) return;
        setAnalyzing(true);
        setAiExplanation("");

        try {
            const response = await apiFetch(`/api/graph/explore?nodeId=${exploreNode.id}`);
            if (!response.ok) throw new Error("Failed to analyze");

            const reader = response.body.getReader();
            const decoder = new TextDecoder("utf-8");

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split('\n');
                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        let text = line.substring(6);
                        if (text === "[DONE]") {
                            break;
                        }
                        setAiExplanation(prev => prev + text);
                    }
                }
            }
        } catch (e) {
            setAiExplanation("Error analyzing connections. Please try again.");
        } finally {
            setAnalyzing(false);
        }
    };

    const getNodeColor = (node) => {
        if (node.clusterId !== undefined && node.clusterId !== -1) {
            return CLUSTER_COLORS[node.clusterId % CLUSTER_COLORS.length];
        }
        return NODE_COLORS[node.type] || NODE_COLORS.default;
    };

    if (loading) {
        return (
            <div className="graph-page graph-page-center" style={{ height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                <Loader2 size={32} className="auth-spinner" />
                <p className="page-subtitle" style={{ marginTop: '1rem' }}>Initializing 3D Environment...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="graph-page graph-page-center" style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <p className="page-subtitle">{error}</p>
            </div>
        );
    }

    return (
        <div ref={containerRef} className="graph-page" style={{ position: 'relative', width: '100%', height: 'calc(100vh - 2rem)', overflow: 'hidden', background: '#0a0a0a', borderRadius: '8px' }}>
            
            {/* HUD: Legend */}
            <div className="graph-legend card" style={{ position: 'absolute', top: '20px', left: '20px', zIndex: 10, background: 'rgba(20,20,20,0.85)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <h1 className="page-title" style={{ fontSize: '1.25rem' }}>3D Knowledge Graph</h1>
                <p className="page-subtitle" style={{ marginTop: '0.35rem' }}>
                    {filteredNodes.length} nodes · {filteredLinks.length} connections
                </p>
                <div className="graph-legend-items" style={{ display: 'flex', gap: '1rem', marginTop: '1rem', flexWrap: 'wrap' }}>
                    <div className="graph-legend-item"><span className="graph-legend-dot" style={{ background: NODE_COLORS.capture }} /> Captures</div>
                    <div className="graph-legend-item"><span className="graph-legend-dot" style={{ background: NODE_COLORS.file }} /> Files</div>
                    <div className="graph-legend-item"><span className="graph-legend-dot" style={{ background: NODE_COLORS.roadmap }} /> Roadmaps</div>
                    <div className="graph-legend-item"><span className="graph-legend-dot" style={{ background: 'linear-gradient(45deg, #FF3366, #33CCFF)' }} /> AI Semantic Clusters</div>
                </div>
            </div>

            {/* Explore Mode Side-Panel */}
            {exploreNode && (
                <div className="graph-explore-panel card" style={{ 
                    position: 'absolute', top: '20px', right: '20px', zIndex: 10, 
                    width: '350px', maxWidth: 'calc(100vw - 40px)', 
                    background: 'rgba(20,20,20,0.85)', backdropFilter: 'blur(10px)', 
                    border: '1px solid rgba(255,255,255,0.1)',
                    display: 'flex', flexDirection: 'column', gap: '1rem'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                            Explore Node
                        </h3>
                        <button onClick={() => setExploreNode(null)} className="icon-btn" style={{ padding: 0 }}>
                            <X size={18} />
                        </button>
                    </div>

                    <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '8px' }}>
                        <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>{exploreNode.type}</span>
                        <h4 style={{ fontSize: '1rem', color: 'var(--text-primary)', marginTop: '0.25rem', marginBottom: '1rem' }}>
                            {exploreNode.name}
                        </h4>
                        
                        <button onClick={() => handleNavigate(exploreNode)} className="btn btn-secondary" style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: '0.5rem', alignItems: 'center', color: '#ffffff', borderColor: 'rgba(255,255,255,0.2)' }}>
                            <ExternalLink size={14} /> Open {exploreNode.type}
                        </button>
                    </div>

                    <div>
                        <button 
                            onClick={analyzeConnections} 
                            disabled={analyzing}
                            className="btn btn-primary" 
                            style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: '0.5rem', alignItems: 'center', background: 'linear-gradient(45deg, var(--brand-purple), var(--brand-blue))', border: 'none', color: '#ffffff' }}
                        >
                            {analyzing ? <Loader2 size={16} className="spin" /> : <Sparkles size={16} />}
                            {analyzing ? 'Analyzing connections...' : 'AI Connection Analysis'}
                        </button>
                    </div>

                    {aiExplanation && (
                        <div style={{ 
                            background: 'rgba(124, 58, 237, 0.1)', 
                            border: '1px solid rgba(124, 58, 237, 0.3)',
                            padding: '1rem', 
                            borderRadius: '8px',
                            fontSize: '0.9rem',
                            lineHeight: '1.5',
                            color: 'var(--text-secondary)'
                        }}>
                            {aiExplanation}
                        </div>
                    )}
                </div>
            )}

            {/* Time Travel Slider */}
            {timeRange.min !== timeRange.max && (
                <div className="graph-time-slider card" style={{ 
                    position: 'absolute', bottom: '40px', left: '50%', transform: 'translateX(-50%)', zIndex: 10,
                    background: 'rgba(20,20,20,0.85)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)',
                    padding: '1rem 2rem', borderRadius: '100px', display: 'flex', alignItems: 'center', gap: '1rem',
                    width: '90%', maxWidth: '600px'
                }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>Time Travel</span>
                    <input 
                        type="range" 
                        min={timeRange.min} 
                        max={timeRange.max} 
                        value={maxDate} 
                        onChange={(e) => setMaxDate(Number(e.target.value))}
                        style={{ flex: 1, accentColor: 'var(--brand-purple)' }}
                    />
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)', whiteSpace: 'nowrap', fontWeight: 600, minWidth: '90px', textAlign: 'right' }}>
                        {new Date(maxDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                </div>
            )}

            {/* 3D Graph Engine */}
            <ForceGraph3D
                ref={fgRef}
                width={dimensions.width}
                height={dimensions.height}
                graphData={{ nodes: filteredNodes, links: filteredLinks }}
                nodeLabel="name"
                nodeThreeObject={node => {
                    const color = getNodeColor(node);
                    const group = new THREE.Group();
                    
                    const geometry = new THREE.SphereGeometry(14, 32, 32);
                    const material = new THREE.MeshBasicMaterial({ color: color });
                    const mesh = new THREE.Mesh(geometry, material);
                    group.add(mesh);

                    const haloGeometry = new THREE.SphereGeometry(22, 32, 32);
                    const haloMaterial = new THREE.MeshBasicMaterial({ 
                        color: color, 
                        transparent: true, 
                        opacity: 0.4, 
                        blending: THREE.AdditiveBlending,
                        depthWrite: false
                    });
                    const halo = new THREE.Mesh(haloGeometry, haloMaterial);
                    group.add(halo);

                    group.__pulsePhase = Math.random() * Math.PI * 2;
                    group.__halo = halo;

                    return group;
                }}
                linkColor={link => link.type === 'semantic' ? 'rgba(124, 58, 237, 0.4)' : 'rgba(255, 255, 255, 0.1)'}
                linkWidth={link => link.strength * 2}
                linkResolution={6}
                onNodeClick={handleNodeClick}
                cooldownTicks={100}
                onEngineStop={() => {
                    if (fgRef.current && !fgRef.current.initialZoomDone) {
                        fgRef.current.zoomToFit(400, 50);
                        fgRef.current.initialZoomDone = true;
                    }
                }}
                backgroundColor="#0a0a0a"
                showNavInfo={false}
            />
        </div>
    );
}
