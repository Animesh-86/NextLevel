"use client";

import { useEffect, useState, useRef } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { Loader2 } from "lucide-react";

const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), { ssr: false });

const NODE_COLORS = {
  capture: "#fafafa",
  file: "#888888",
  roadmap: "#555555",
  default: "#444444",
};

export default function KnowledgeGraphPage() {
    const [graphData, setGraphData] = useState({ nodes: [], links: [] });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const router = useRouter();
    const fgRef = useRef();

    useEffect(() => {
        const loadGraph = async () => {
            try {
                const res = await apiFetch("/api/graph");
                const data = await res.json();
                if (data.success) {
                    setGraphData(data.data);
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

    const handleNodeClick = (node) => {
        const id = node.id.split("_")[1];
        if (node.type === "capture") {
            router.push(`/captures/${id}`);
        } else if (node.type === "roadmap") {
            router.push(`/journey/${id}`);
        } else if (node.type === "file") {
            router.push(`/vault/${id}`);
        }
    };

    if (loading) {
        return (
            <div className="graph-page graph-page-center">
                <Loader2 size={24} className="auth-spinner" />
                <p className="page-subtitle" style={{ marginTop: '1rem' }}>Mapping your knowledge...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="graph-page graph-page-center">
                <p className="page-subtitle">{error}</p>
            </div>
        );
    }

    return (
        <div className="graph-page">
            <div className="graph-legend card">
                <h1 className="page-title" style={{ fontSize: '1.25rem' }}>Knowledge Graph</h1>
                <p className="page-subtitle" style={{ marginTop: '0.35rem' }}>
                    {graphData.nodes.length} nodes · {graphData.links.length} connections
                </p>
                <div className="graph-legend-items">
                    <div className="graph-legend-item"><span className="graph-legend-dot" style={{ background: NODE_COLORS.capture }} /> Captures</div>
                    <div className="graph-legend-item"><span className="graph-legend-dot" style={{ background: NODE_COLORS.file }} /> Files</div>
                    <div className="graph-legend-item"><span className="graph-legend-dot" style={{ background: NODE_COLORS.roadmap }} /> Roadmaps</div>
                </div>
            </div>

            <ForceGraph2D
                ref={fgRef}
                graphData={graphData}
                nodeLabel="name"
                nodeColor={node => NODE_COLORS[node.type] || NODE_COLORS.default}
                nodeVal="val"
                linkColor={link => link.type === 'semantic' ? 'rgba(250, 250, 250, 0.25)' : 'rgba(136, 136, 136, 0.2)'}
                linkWidth={link => link.strength * 2}
                onNodeClick={handleNodeClick}
                cooldownTicks={100}
                onEngineStop={() => fgRef.current?.zoomToFit(400, 50)}
                backgroundColor="transparent"
            />
        </div>
    );
}
