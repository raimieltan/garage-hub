"use client";

interface YouTubeEmbedProps {
  url: string;
}

function extractVideoId(url: string): string | null {
  const regex =
    /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/;
  const match = regex.exec(url);
  return match ? match[1] : null;
}

export function YouTubeEmbed({ url }: YouTubeEmbedProps) {
  const videoId = extractVideoId(url);

  if (!videoId) return null;

  return (
    <div className="relative w-full overflow-hidden rounded-xl border border-border/60 bg-black aspect-video">
      <iframe
        src={`https://www.youtube.com/embed/${videoId}`}
        title="YouTube video"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        loading="lazy"
        className="absolute inset-0 size-full"
      />
    </div>
  );
}

export function extractYouTubeUrls(text: string): string[] {
  const regex =
    /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/g;
  const urls: string[] = [];
  let match;
  while ((match = regex.exec(text)) !== null) {
    urls.push(match[0]);
  }
  return urls;
}
