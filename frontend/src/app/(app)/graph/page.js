"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
// Force graph must be imported dynamically to avoid SSR window issues
const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), { ssr: false });

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
            <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
                <div className="flex flex-col items-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
                    <p className="mt-4 text-sm text-muted-foreground">Mapping your knowledge...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex h-[calc(100vh-4rem)] items-center justify-center text-red-500">
                {error}
            </div>
        );
    }

    return (
        <div className="h-[calc(100vh-4rem)] w-full overflow-hidden relative bg-black/5">
            <div className="absolute top-4 left-4 z-10 bg-background/80 backdrop-blur-sm p-4 rounded-lg border shadow-sm">
                <h1 className="text-xl font-bold tracking-tight">Knowledge Graph</h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Showing {graphData.nodes.length} nodes and {graphData.links.length} connections.
                </p>
                <div className="mt-4 flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-sm"><span className="w-3 h-3 rounded-full bg-blue-500"></span> Captures</div>
                    <div className="flex items-center gap-2 text-sm"><span className="w-3 h-3 rounded-full bg-green-500"></span> Files</div>
                    <div className="flex items-center gap-2 text-sm"><span className="w-3 h-3 rounded-full bg-orange-500"></span> Roadmaps</div>
                </div>
            </div>

            <ForceGraph2D
                ref={fgRef}
                graphData={graphData}
                nodeLabel="name"
                nodeColor={node => {
                    if (node.type === "capture") return "#3b82f6"; // blue
                    if (node.type === "file") return "#22c55e"; // green
                    if (node.type === "roadmap") return "#f97316"; // orange
                    return "#888888";
                }}
                nodeVal="val"
                linkColor={link => link.type === 'semantic' ? 'rgba(59, 130, 246, 0.4)' : 'rgba(156, 163, 175, 0.3)'}
                linkWidth={link => link.strength * 3}
                onNodeClick={handleNodeClick}
                cooldownTicks={100}
                onEngineStop={() => fgRef.current?.zoomToFit(400, 50)}
            />
        </div>
    );
}
