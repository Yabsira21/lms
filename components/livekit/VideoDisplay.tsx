'use client';

import { useTracks } from '@livekit/components-react';
import { Track } from 'livekit-client';
import { VideoTrack, TrackRefContext, type TrackReference } from '@livekit/components-react';

export default function VideoDisplay() {
  // Get all camera and screen share tracks
  const tracks = useTracks([
    { source: Track.Source.Camera, withPlaceholder: false },
    { source: Track.Source.ScreenShare, withPlaceholder: false },
  ]);

  // Separate screen share and camera tracks - filter out placeholders
  const screenShareTrack = tracks.find(
    (track) => track.publication && track.publication.source === Track.Source.ScreenShare
  ) as TrackReference | undefined;
  
  const cameraTracks = tracks.filter(
    (track) => track.publication && track.publication.source === Track.Source.Camera
  ) as TrackReference[];

  // If there's a screen share, show it prominently
  if (screenShareTrack && screenShareTrack.publication) {
    return (
      <div className="w-full h-full bg-black">
        <TrackRefContext.Provider value={screenShareTrack}>
          <VideoTrack 
            trackRef={screenShareTrack}
            className="w-full h-full object-contain"
          />
        </TrackRefContext.Provider>
        
        {/* Show camera feeds as small thumbnails when screen sharing */}
        {cameraTracks.length > 0 && (
          <div className="absolute bottom-4 right-4 flex gap-2">
            {cameraTracks.map((track) => (
              <div 
                key={track.participant.identity}
                className="w-32 h-24 bg-black rounded-lg overflow-hidden border-2 border-white shadow-lg"
              >
                <TrackRefContext.Provider value={track}>
                  <VideoTrack 
                    trackRef={track}
                    className="w-full h-full object-cover"
                  />
                </TrackRefContext.Provider>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // If no screen share, show camera feeds
  if (cameraTracks.length > 0) {
    // If only one camera (instructor), show it large
    if (cameraTracks.length === 1) {
      return (
        <div className="w-full h-full bg-black">
          <TrackRefContext.Provider value={cameraTracks[0]}>
            <VideoTrack 
              trackRef={cameraTracks[0]}
              className="w-full h-full object-contain"
            />
          </TrackRefContext.Provider>
          <div className="absolute bottom-4 left-4 bg-black/70 text-white px-3 py-1 rounded text-sm">
            {cameraTracks[0].participant.name || 'Instructor'}
          </div>
        </div>
      );
    }

    // Multiple cameras - show in grid
    return (
      <div className="w-full h-full bg-black grid grid-cols-2 gap-2 p-2">
        {cameraTracks.map((track) => (
          <div 
            key={track.participant.identity}
            className="relative bg-gray-900 rounded-lg overflow-hidden"
          >
            <TrackRefContext.Provider value={track}>
              <VideoTrack 
                trackRef={track}
                className="w-full h-full object-cover"
              />
            </TrackRefContext.Provider>
            <div className="absolute bottom-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
              {track.participant.name || track.participant.identity}
            </div>
          </div>
        ))}
      </div>
    );
  }

  // No video tracks - show placeholder
  return (
    <div className="w-full h-full bg-gray-900 flex items-center justify-center">
      <div className="text-center text-white">
        <div className="text-lg mb-2">Waiting...</div>
        <div className="text-sm opacity-75">Class will start soon</div>
      </div>
    </div>
  );
}
