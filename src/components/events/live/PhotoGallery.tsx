"use client";

import { useState, useEffect } from "react";
import { Images, Loader2, X } from "lucide-react";

interface Photo {
  id: string;
  url: string;
  caption: string | null;
  uploadedAt: Date;
}

interface Props {
  eventId: string;
}

export default function PhotoGallery({ eventId }: Props) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [lightboxPhoto, setLightboxPhoto] = useState<string | null>(null);

  useEffect(() => {
    fetchPhotos();
    const interval = setInterval(fetchPhotos, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [eventId]);

  const fetchPhotos = async () => {
    try {
      const response = await fetch(`/api/admin/events/${eventId}/photos`);
      if (response.ok) {
        const data = await response.json();
        setPhotos(data.photos || []);
      }
    } catch (error) {
      console.error("Failed to fetch photos:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-8 text-center">
        <Loader2 className="w-8 h-8 text-primary-400 animate-spin mx-auto mb-3" />
        <p className="text-neutral-400 text-sm">Loading photos...</p>
      </div>
    );
  }

  if (photos.length === 0) {
    return null; // Don't show section if no photos
  }

  return (
    <>
      <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-6">
        <h3 className="font-display font-bold text-white text-lg mb-6 flex items-center gap-2">
          <Images className="w-5 h-5" />
          Event Photos
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {photos.map((photo) => (
            <button
              key={photo.id}
              onClick={() => setLightboxPhoto(photo.url)}
              className="aspect-square rounded-lg overflow-hidden border border-white/10 hover:border-primary-500 transition-all hover:scale-105 cursor-pointer"
            >
              <img
                src={photo.url}
                alt={photo.caption || "Event photo"}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      </div>

      {/* Lightbox */}
      {lightboxPhoto && (
        <div
          className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50"
          onClick={() => setLightboxPhoto(null)}
        >
          <button
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
            onClick={() => setLightboxPhoto(null)}
          >
            <X className="w-6 h-6" />
          </button>

          <img
            src={lightboxPhoto}
            alt="Event photo"
            className="max-w-full max-h-full object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
