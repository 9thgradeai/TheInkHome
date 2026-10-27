import { lazy, Suspense } from 'react';
import { Story } from '../types';

const Carousel3D = lazy(() => import('./Carousel3D'));

interface LazyCarouselProps {
  stories: Story[];
  onSelectStory: (story: Story) => void;
  likedSlugs: string[];
  savedSlugs: string[];
  onToggleLike: (slug: string) => void;
  onToggleSave: (slug: string) => void;
}

export default function LazyCarousel(props: LazyCarouselProps) {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center min-h-[400px] text-gray-400">
          <div className="h-8 w-8 rounded-full border-2 border-white/20 border-t-[#c8ff4d] animate-spin mb-4" />
          <p className="font-mono text-sm tracking-widest uppercase">Loading...</p>
        </div>
      }
    >
      <Carousel3D {...props} />
    </Suspense>
  );
}
