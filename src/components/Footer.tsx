'use client'
import { useState, MutableRefObject } from 'react';
import { Camera, Computer, Mic, NoCamera, NoComputer, NoMic, Phone } from '@/Icons';
import Container from './Container';

interface IFooter {
  localStream: MediaStream | null;
  peerConnections:  MutableRefObject<Record<string, RTCPeerConnection>>;
  userCam: MutableRefObject<HTMLVideoElement | null>;
};

export default function Footer({localStream, peerConnections, userCam}: IFooter) {
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  const date = new Date();
  const hours = date.getHours().toString().padStart(2, '0') + ':';
  const minutes = date.getMinutes().toString().padStart(2, '0');

  function toggleMuted() {
    localStream?.getAudioTracks().forEach(track => {
      track.enabled = !track.enabled;
    });
    setIsMuted(!isMuted);

    Object.values(peerConnections.current).forEach(peerConnection => {
      peerConnection.getSenders().forEach(sender => {
        if (sender.track?.kind === "audio") {
          if (localStream && localStream.getAudioTracks().length > 0) {
            sender.replaceTrack(
              localStream
                ?.getAudioTracks()
                .find(track => track.kind === "audio") ?? null,
            );
          }
        }
      });
    });
  }

  function toggleVideo() {
    localStream?.getVideoTracks().forEach(track => {
      track.enabled = !track.enabled;
    });
    setIsCameraOff(!isCameraOff);

    Object.values(peerConnections.current).forEach(peerConnection => {
      peerConnection.getSenders().forEach(sender => {
        if (sender.track?.kind === "video") {
          sender.replaceTrack(
            localStream
              ?.getVideoTracks()
              .find(track => track.kind === "video") ?? null,
          );
        }
      });
    });
  }

  async function toggleScreenSharing() {
    if (!isScreenSharing) {
      const videoShareScreen = await navigator.mediaDevices.getDisplayMedia({
        video: true,
      });

      if (userCam.current){
        userCam.current.srcObject = videoShareScreen
      };

      Object.values(peerConnections.current).forEach((peerConnections) => {
        peerConnections.getSenders().forEach((sender) => {
          if (sender.track?.kind === 'video') {
            sender.replaceTrack(videoShareScreen.getVideoTracks()[0]);
          }
        });
      });

      setIsScreenSharing(!isScreenSharing);
      return;
    }

    if (userCam.current) userCam.current.srcObject = localStream;

    Object.values(peerConnections.current).forEach((peerConnections) => {
      peerConnections.getSenders().forEach((sender) => {
        if (sender.track?.kind === 'video') {
          sender.replaceTrack(localStream && localStream?.getVideoTracks()[0]);
        }
      });
    });
    setIsScreenSharing(!isScreenSharing);
  }

  return (
    <div className="fixed bottom-0 bg-black py-6 w-full">
      <Container>
        <div className="grid grid-cols-3">
          <div className="flex items-center justify-center">
            <span className="text-xl">{hours + minutes}</span>
          </div>
          <div className="flex justify-center space-x-4">
            {isMuted ? 
              <NoMic className="w-16 h-12 p-2 cursor-pointer bg-red-500 rounded-md" onClick={toggleMuted} /> : 
              <Mic className="w-16 h-12 p-2 cursor-pointer bg-gray-950 rounded-md" onClick={toggleMuted} />
            }
            {isCameraOff ? 
              <NoCamera className="w-16 h-12 cursor-pointer bg-red-500 rounded-md" onClick={toggleVideo} /> : 
              <Camera className="w-16 h-12 p-2 cursor-pointer bg-gray-950 rounded-md" onClick={toggleVideo} />
            }
            {isScreenSharing ? 
              <NoComputer className="w-16 h-12 p-2 cursor-pointer bg-red-500 rounded-md" onClick={toggleScreenSharing} /> : 
              <Computer className="w-16 h-12 p-2 cursor-pointer bg-gray-950 rounded-md" onClick={toggleScreenSharing} />
            }

            <Phone className="w-16 h-12 p-2 cursor-pointer bg-primary hover:bg-red-500 rounded-md" />
          </div>
        </div>
      </Container>
    </div>
  )
}
