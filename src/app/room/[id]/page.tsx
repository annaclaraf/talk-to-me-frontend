'use client'
import { useContext, useEffect, useRef } from "react";

import { Chat } from "@/components/Chat";
import Footer from "@/components/Footer";
import Header from "@/components/Header";

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
      createPeerConnection(data.socketId);

      socket.emit("new user connected", {
        to: data.socketId,
        sender: socket.id,
      });
    });

    socket?.on("new user connected", data => {
      createPeerConnection(data.sender)
    });
  }, [socket]);

  function createPeerConnection(socketId: string) {
    const config = { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] };
    const peer = new RTCPeerConnection(config);
    peerConnections.current[socketId] = peer;
  }

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