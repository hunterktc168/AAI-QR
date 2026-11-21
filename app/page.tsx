'use client';

import { useState } from 'react';
import ExportModal from './components/ExportModal';
import FrameCard from './components/FrameCard';
import Header from './components/Header';
import MobileBar from './components/MobileBar';
import PayloadCard from './components/PayloadCard';
import PreviewStage from './components/PreviewStage';
import StyleCard from './components/StyleCard';

export default function HomePage() {
  const [htmlModalOpen, setHtmlModalOpen] = useState<boolean>(false);

  return (
    <div className="min-h-screen flex flex-col pb-20 lg:pb-10">
      <Header />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 sm:px-6 py-6 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-7 space-y-6">
            <PayloadCard />
            <StyleCard />
            <FrameCard />
          </div>

          <div className="lg:col-span-5">
            <PreviewStage onOpenHtmlModal={() => setHtmlModalOpen(true)} />
          </div>
        </div>
      </main>

      <MobileBar />
      <ExportModal open={htmlModalOpen} onClose={() => setHtmlModalOpen(false)} />
    </div>
  );
}
