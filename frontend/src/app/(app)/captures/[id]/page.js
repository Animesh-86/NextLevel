"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { ArrowLeft, Edit3, Loader2 } from "lucide-react";
import CaptureModal from "@/components/CaptureModal";
import RelatedSidebar from "@/components/RelatedSidebar";

export default function CaptureDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [capture, setCapture] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        const loadCapture = async () => {
            try {
                const res = await apiFetch(`/api/captures/${params.id}`);
                const data = await res.json();
                if (data.success) {
                    setCapture(data.data);
                }
            } catch (err) {
                console.error("Failed to load capture", err);
            } finally {
                setLoading(false);
            }
        };
        if (params.id) {
            loadCapture();
        }
    }, [params.id]);

    if (loading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!capture) {
        return (
            <div className="p-8 text-center text-muted-foreground">
                Capture not found.
            </div>
        );
    }

    return (
        <div className="p-6 max-w-6xl mx-auto">
            <button 
                onClick={() => router.back()} 
                className="flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
            >
                <ArrowLeft size={16} className="mr-2" /> Back
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-card text-card-foreground border rounded-lg p-6 shadow-sm">
                        <div className="flex justify-between items-start mb-4">
                            <h1 className="text-2xl font-bold tracking-tight">{capture.title}</h1>
                            <button 
                                onClick={() => setIsEditing(true)}
                                className="p-2 hover:bg-accent rounded-md transition-colors"
                            >
                                <Edit3 size={18} />
                            </button>
                        </div>
                        
                        <div className="flex flex-wrap gap-2 mb-6">
                            <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                                {capture.category}
                            </span>
                            {capture.urgency !== 'none' && (
                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                    capture.urgency === 'critical' ? 'bg-red-500/10 text-red-500' :
                                    capture.urgency === 'high' ? 'bg-orange-500/10 text-orange-500' :
                                    'bg-yellow-500/10 text-yellow-500'
                                }`}>
                                    {capture.urgency}
                                </span>
                            )}
                            {capture.tags?.map(tag => (
                                <span key={tag} className="px-2.5 py-0.5 rounded-full bg-secondary text-secondary-foreground text-xs">
                                    #{tag}
                                </span>
                            ))}
                        </div>

                        {capture.type === 'screenshot' && capture.imageData && (
                            <div className="mb-6 rounded-md overflow-hidden border">
                                <img src={capture.imageData} alt="Screenshot" className="w-full h-auto" />
                            </div>
                        )}

                        {capture.description && (
                            <div className="mb-6">
                                <h3 className="text-sm font-medium text-muted-foreground mb-2">Description</h3>
                                <p className="text-sm whitespace-pre-wrap">{capture.description}</p>
                            </div>
                        )}

                        {capture.rawContent && (
                            <div>
                                <h3 className="text-sm font-medium text-muted-foreground mb-2">Content</h3>
                                <div className="p-4 bg-muted/50 rounded-md text-sm whitespace-pre-wrap font-mono">
                                    {capture.rawContent}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="space-y-6">
                    <RelatedSidebar itemId={capture.id || capture._id} type="capture" />
                </div>
            </div>

            <CaptureModal 
                isOpen={isEditing} 
                onClose={() => setIsEditing(false)} 
                editingCapture={capture}
                onSave={() => window.location.reload()}
            />
        </div>
    );
}
