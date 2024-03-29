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
  username: string;
}

export default function Room({ params }: { params: { id: string } }) {
  const { socket } = useContext(SocketContext);

  const userCam = useRef<HTMLVideoElement>(null);
  const peerConnections = useRef<Record<string, RTCPeerConnection>>({});
  const [remoteStreams, setRemoteStreams] = useState<IDataStream[]>([]);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    const username = sessionStorage.getItem('username');
    socket?.on("connect", async () => {
      socket?.emit("subscribe", { 
        roomId: params.id,
        socketId: socket.id,
        username: username
      });
      await initLocalCamera();
    });

    socket?.on("new user", data => {
      createPeerConnection(data.socketId, false, data.username);

      socket.emit("new user connected", {
        to: data.socketId,
        sender: socket.id,
        username: username
      });
    });

    socket?.on("new user connected", data => {
      createPeerConnection(data.sender, true, data.username);
    });

    socket?.on("sdp", data => {
      handleAnswer(data);
    });

    socket?.on("ice candidates", data => {
      handleIceCandidates(data);
    });
  }, [socket]);

  async function createPeerConnection(socketId: string, createOffer?: boolean, username?: string) {
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
        stream: remoteStream,
        username: username as string
      };

      setRemoteStreams((prevState: IDataStream[]) => {
        if (!prevState.some((stream) => stream.id === socketId)) {
          return [...prevState, dataStream];
        }
        return prevState;
      });
    };

    peerConnection.onicecandidate = event => {
      if (event.candidate) {
        socket?.emit("ice candidates", {
          to: socketId,
          sender: socket.id,
          candidate: event.candidate,
        });
      }
    };

    peerConnection.onsignalingstatechange = event => {
      if (peerConnection.signalingState === "closed") {
        setRemoteStreams((prevState) =>
          prevState.filter((stream) => stream.id !== socketId),
        );
      }
    };

    peerConnection.onconnectionstatechange = event => {
      const statuses = ["closed", "disconnected", "failed"];
      if (statuses.includes(peerConnection.connectionState)) {
        setRemoteStreams((prevState) =>
          prevState.filter((stream) => stream.id !== socketId),
        );
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

  function logout() {
    localStream?.getTracks().forEach(track => {
      track.stop();
    });
    Object.values(peerConnections.current).forEach(peerConnection =>
      peerConnection.close(),
    );
    socket?.disconnect();
    window.location.href = `/`;
  }

  return (
    <div className="h-screen">
      <Header />
      <div className="flex h-[82%] p-4 space-x-4">
        <div className="flex-1 h-full w-full overflow-auto">
          <div className="flex flex-wrap justify-center gap-5 mb-5">
            <div className="bg-gray-950 flex-auto max-w-[600px] max-h-[300px] rounded-md p-2 relative">
              <video
                className="h-full w-full -scale-x-100 object-cover"
                ref={userCam}
                autoPlay
              />
              <span className="absolute bottom-3">{sessionStorage.getItem("username")}</span>
            </div>

            {remoteStreams.map((stream, index) => {
              return (
                <div className="bg-gray-950 flex-auto max-w-[600px] max-h-[300px] rounded-md p-2 relative" key={index}>
                  <video
                    className="h-full w-full object-cover"
                    ref={(video) => {
                      if (video && video.srcObject !== stream.stream)
                      video.srcObject = stream.stream;
                    }}
                    autoPlay
                  />
                  <span className="absolute bottom-3">{stream.username}</span>
                </div>
              );
            })}
          </div>
        </div>
        <Chat roomId={params.id} />
      </div>
      <Footer
        localStream={localStream}
        peerConnections={peerConnections}
        userCam={userCam}
        logout={logout}
        initLocalCamera={initLocalCamera}
      />
    </div>
  );
}