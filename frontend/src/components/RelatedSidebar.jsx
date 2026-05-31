"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FileText, Map, Image as ImageIcon, Link as LinkIcon } from "lucide-react";
import { apiFetch } from "@/lib/api";
export default function RelatedSidebar({ itemId, type }) {
    const [related, setRelated] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadRelated = async () => {
            try {
                const res = await apiFetch(`/api/related?itemId=${itemId}&type=${type}`);
                const data = await res.json();
                if (data.success) {
                    setRelated(data.data);
                }
            } catch (err) {
                console.error("Failed to load related items", err);
            } finally {
                setLoading(false);
            }
        };

        if (itemId && type) {
            loadRelated();
        }
    }, [itemId, type]);

    if (loading) {
        return (
            <div className="p-4 border rounded-lg bg-card text-card-foreground">
                <h3 className="font-semibold text-sm mb-4">Related Intelligence</h3>
                <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="animate-pulse flex space-x-3 items-center">
                            <div className="rounded-full bg-muted h-8 w-8"></div>
                            <div className="flex-1 space-y-2 py-1">
                                <div className="h-2 bg-muted rounded w-3/4"></div>
                                <div className="h-2 bg-muted rounded w-1/2"></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (related.length === 0) {
        return null;
    }

    const getIcon = (itemType) => {
        if (itemType === 'roadmap') return <Map className="w-4 h-4 text-orange-500" />;
        if (itemType === 'file') return <FileText className="w-4 h-4 text-green-500" />;
        return <LinkIcon className="w-4 h-4 text-blue-500" />;
    };

    const getLink = (itemType, id) => {
        if (itemType === 'roadmap') return `/journey/${id}`;
        if (itemType === 'file') return `/vault/${id}`;
        return `/captures/${id}`;
    };

    return (
        <div className="p-4 border rounded-lg bg-card text-card-foreground shadow-sm">
            <h3 className="font-semibold text-sm mb-4 flex items-center">
                <span className="bg-primary/10 text-primary p-1 rounded mr-2">✨</span>
                Related Intelligence
            </h3>
            <div className="space-y-3">
                {related.map(item => (
                    <Link 
                        key={item.id} 
                        href={getLink(item.type, item.id)}
                        className="flex items-start space-x-3 p-2 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors group"
                    >
                        <div className="mt-0.5 p-1.5 bg-background rounded-md border group-hover:border-primary/20">
                            {getIcon(item.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                                {item.title || "Untitled"}
                            </p>
                            <p className="text-xs text-muted-foreground capitalize">
                                {item.type} • {(item.score * 100).toFixed(0)}% match
                            </p>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}
