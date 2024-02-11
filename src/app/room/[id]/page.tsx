'use client'
import { useContext, useEffect, useRef, useState } from "react";

import { Chat } from "@/components/Chat";
import Footer from "@/components/Footer";
import Header from "@/components/Header";

import { SocketContext } from "@/contexts/SocketContext";

interface IAnswer {
  sender: string;
  description: RTCSessionDescriptionInit;
}

interface ICandidate {
  sender: string;
  candidate: RTCIceCandidate;
}

interface IDataStream {
  id: string;
  stream: MediaStream;
}

export default function Room({ params }: { params: { id: string } }) {
  const { socket } = useContext(SocketContext);

  const userCam = useRef<HTMLVideoElement>(null);
  const peerConnections = useRef<Record<string, RTCPeerConnection>>({});
  const [remoteStreams, setRemoteStreams] = useState<IDataStream[]>([]);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    socket?.on("connect", async () => {
      socket?.emit("subscribe", { 
        roomId: params.id,
        socketId: socket.id
      });
      await initLocalCamera();
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

    socket?.on("ice candidates", data => {
      handleIceCandidates(data);
    });
  }, [socket]);

  async function createPeerConnection(socketId: string, createOffer?: boolean) {
    const config = { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] };
    const peer = new RTCPeerConnection(config);
    peerConnections.current[socketId] = peer;

    const peerConnection = peerConnections.current[socketId];

    if (localStream) {
      localStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStream);
      });
    } else {
      const video = await initRemoteCamera();
      video.getTracks().forEach(track => {
        peerConnection.addTrack(track, video);
      });
    }

    if (createOffer) {
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);

      socket?.emit('sdp', {
        to: socketId,
        sender: socket?.id,
        description: peerConnection.localDescription,
      });
    }

    peerConnection.ontrack = (event) => {
      const remoteStream = event.streams[0];

      const dataStream: IDataStream = {
        id: socketId,
        stream: remoteStream
      };

      setRemoteStreams((prevState: IDataStream[]) => {
        if (!prevState.some((stream) => stream.id === socketId)) {
          return [...prevState, dataStream];
        }
        return prevState;
      });
    };

    peer.onicecandidate = event => {
      if (event.candidate) {
        socket?.emit("ice candidates", {
          to: socketId,
          sender: socket.id,
          candidate: event.candidate,
        });
      }
    };
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

  async function handleIceCandidates(data: ICandidate) {
    const peerConnection = peerConnections.current[data.sender];
    if (data.candidate) {
      await peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
    }
  }

  async function initLocalCamera() {
    const video = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: { noiseSuppression: true, echoCancellation: true },
    });
    setLocalStream(video);
    if (userCam.current) userCam.current.srcObject = video;
  }

  async function initRemoteCamera() {
    const video = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: { noiseSuppression: true, echoCancellation: true },
    });
    return video;
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

            {remoteStreams.map((stream, index) => {
              return (
                <div className="bg-gray-950 w-full rounded-md h-full p-2 relative" key={index}>
                  <video
                    className="h-full w-full"
                    ref={(video) => {
                      if (video && video.srcObject !== stream.stream)
                      video.srcObject = stream.stream;
                    }}
                    autoPlay
                  />
                  <span className="absolute bottom-3">Clara</span>
                </div>
              );
            })}
          </div>
        </div>
        <Chat roomId={params.id} />
      </div>
      <Footer />
    </div>
  );
}