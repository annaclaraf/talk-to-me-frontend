'use client'
import { useState, MutableRefObject } from 'react';
import { Camera, Computer, Mic, NoCamera, NoComputer, NoMic, Phone } from '@/Icons';
import Container from './Container';

interface IFooter {
  localStream: MediaStream | null;
  peerConnections:  MutableRefObject<Record<string, RTCPeerConnection>>;
  userCam: MutableRefObject<HTMLVideoElement | null>;
  logout: () => void;
  initLocalCamera: () => void;
};

export default function Footer({localStream, peerConnections, userCam, logout, initLocalCamera}: IFooter) {
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
      if (!track.enabled) {
        track.stop();
      } else {
        initLocalCamera();
      }
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
    <div className="fixed bottom-0 bg-black py-[10px] w-full border-t-[1px] border-white">
      <Container>
        <div className="w-full min-h-[73px] flex items-center">
          <div className="flex flex-wrap justify-center md:justify-start gap-[5px] w-full">
            <div className="flex items-center justify-center md:justify-start w-[33%]">
              <span className="text-xl">{hours + minutes}</span>
            </div>
            <div className="flex justify-center space-x-4 flex-1 md:flex-[unset] md:w-[33%]">
              {isMuted ? 
                <NoMic className="w-16 h-12 p-2 cursor-pointer bg-red-500 rounded-md shrink-0" onClick={toggleMuted} /> : 
                <Mic className="w-16 h-12 p-2 cursor-pointer bg-gray-950 rounded-md shrink-0" onClick={toggleMuted} />
              }
              {isCameraOff ? 
                <NoCamera className="w-16 h-12 cursor-pointer bg-red-500 rounded-md shrink-0" onClick={toggleVideo} /> : 
                <Camera className="w-16 h-12 p-2 cursor-pointer bg-gray-950 rounded-md shrink-0" onClick={toggleVideo} />
              }
              {isScreenSharing ? 
                <NoComputer className="w-16 h-12 p-2 cursor-pointer bg-red-500 rounded-md shrink-0" onClick={toggleScreenSharing} /> : 
                <Computer className="w-16 h-12 p-2 cursor-pointer bg-gray-950 rounded-md shrink-0" onClick={toggleScreenSharing} />
              }

              <Phone className="w-16 h-12 p-2 cursor-pointer bg-primary hover:bg-red-500 rounded-md shrink-0" onClick={logout} />
            </div>
          </div>
        </div>
      </Container>
    </div>
  )
}
