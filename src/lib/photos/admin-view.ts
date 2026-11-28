/**
 * What the admin pages and APIs hand to the browser about a photo. PURE.
 *
 * A photo that is NOT approved (people in it may not have consented) is given no storage address at all: its image
 * addresses are our own route, which checks the permission and redirects to a short-lived presigned address
 * (./download.ts). The public domain refuses the pending area on purpose.
 */
export interface AdminPhoto {
  id: string;
  url: string;
  thumbUrl: string | null;
  caption: string | null;
  captionEs: string | null;
  approved: boolean;
  width: number | null;
  height: number | null;
}

export const adminImagePath = (eventId: string, photoId: string, size: "thumb" | "main") =>
  `/api/admin/events/${eventId}/photos/${photoId}/image?size=${size}`;

/** Only these fields leave the server: not the storage keys, not who uploaded it. */
export function adminPhoto(p: AdminPhoto & { eventId: string }): AdminPhoto {
  return {
    id: p.id,
    url: p.approved ? p.url : adminImagePath(p.eventId, p.id, "main"),
    thumbUrl: p.approved ? p.thumbUrl : adminImagePath(p.eventId, p.id, "thumb"),
    caption: p.caption,
    captionEs: p.captionEs,
    approved: p.approved,
    width: p.width,
    height: p.height,
  };
}
