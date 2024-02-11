'use client'
import { useContext, useEffect, useRef } from "react";

import { Chat } from "@/components/Chat";
import Footer from "@/components/Footer";
import Header from "@/components/Header";

interface IAnswer {
  sender: string;
  description: RTCSessionDescriptionInit;
}

import { SocketContext } from "@/contexts/SocketContext";

export default function Room({ params }: { params: { id: string } }) {
  const { socket } = useContext(SocketContext);

  const userCam = useRef<HTMLVideoElement>(null);
  const peerConnections = useRef<Record<string, RTCPeerConnection>>({});

  useEffect(() => {
    socket?.on("connect", async () => {
      socket?.emit("subscribe", { 
        roomId: params.id,
        socketId: socket.id
      });
      await initCamera();
    });

    socket?.on("new user", data => {
      createPeerConnection(data.socketId, false);

      socket.emit("new user connected", {
        to: data.socketId,
        sender: socket.id,
      });
    });

    socket?.on("new user connected", data => {
      createPeerConnection(data.sender, true);
    });

    socket?.on("sdp", data => {
      handleAnswer(data);
    });
  }, [socket]);

  async function createPeerConnection(socketId: string, createOffer?: boolean) {
    const config = { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] };
    const peer = new RTCPeerConnection(config);
    peerConnections.current[socketId] = peer;

    if (createOffer) {
      const peerConnection = peerConnections.current[socketId];

      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);

      socket?.emit('sdp', {
        to: socketId,
        sender: socket?.id,
        description: peerConnection.localDescription,
      });
    }
  }

  async function handleAnswer(data: IAnswer){
    const peerConnection = peerConnections.current[data.sender];

    if (data.description.type === 'offer') {
      await peerConnection.setRemoteDescription(data.description);

      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);

      socket?.emit('sdp', {
        to: data.sender,
        sender: socket?.id,
        description: peerConnection.localDescription,
      });
    } else if (data.description.type === 'answer') {
      await peerConnection.setRemoteDescription(
        new RTCSessionDescription(data.description),
      );
    }
  };

  async function initCamera() {
    const video = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: { noiseSuppression: true, echoCancellation: true },
    });
    if (userCam.current) userCam.current.srcObject = video;
  }

  return (
    <div className="h-screen">
      <Header />
      <div className="flex h-[80%]">
        <div className="md:w-[85%] w-full m-3">
          <div className="grid md:grid-cols-2 grid-cols-1 gap-8">
            <div className="bg-gray-950 w-full rounded-md h-full p-2 relative">
              <video
                className="h-full w-full"
                ref={userCam}
                autoPlay
                playsInline
              />
              <span className="absolute bottom-3">Anna Clara</span>
            </div>

            <div className="bg-gray-950 w-full rounded-md h-full p-2 relative">
              <video className="h-full w-full" />
              <span className="absolute bottom-3">Anna Clara</span>
            </div>

            <div className="bg-gray-950 w-full rounded-md h-full p-2 relative">
              <video className="h-full w-full" />
              <span className="absolute bottom-3">Anna Clara</span>
            </div>
            
            <div className="bg-gray-950 w-full rounded-md h-full p-2 relative">
              <video className="h-full w-full" />
              <span className="absolute bottom-3">Anna Clara</span>
            </div>
          </div>
        </div>
        <Chat roomId={params.id} />
      </div>
      <Footer />
    </div>
  );
}