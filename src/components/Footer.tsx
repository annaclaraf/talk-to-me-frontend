'use client'
import { useState } from 'react';
import { Camera, Computer, Mic, NoCamera, NoComputer, NoMic, Phone } from '@/Icons';
import Container from './Container';

export default function Footer() {
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  const date = new Date();
  const hours = date.getHours().toString().padStart(2, '0') + ':';
  const minutes = date.getMinutes().toString().padStart(2, '0');


  return (
    <div className="fixed bottom-0 bg-black py-6 w-full">
      <Container>
        <div className="grid grid-cols-3">
          <div className="flex items-center justify-center">
            <span className="text-xl">{hours + minutes}</span>
          </div>
          <div className="flex justify-center space-x-4">
            {isMuted ? 
              <NoMic className="w-16 h-12 p-2 cursor-pointer bg-red-500 rounded-md" onClick={() => setIsMuted(!isMuted)} /> : 
              <Mic className="w-16 h-12 p-2 cursor-pointer bg-gray-950 rounded-md" onClick={() => setIsMuted(!isMuted)} />
            }
            {isCameraOff ? 
              <NoCamera className="w-16 h-12 cursor-pointer bg-red-500 rounded-md" onClick={() => setIsCameraOff(!isCameraOff)} /> : 
              <Camera className="w-16 h-12 p-2 cursor-pointer bg-gray-950 rounded-md" onClick={() => setIsCameraOff(!isCameraOff)} />
            }
            {isScreenSharing ? 
              <NoComputer className="w-16 h-12 p-2 cursor-pointer bg-red-500 rounded-md" onClick={() => setIsScreenSharing(!isScreenSharing)} /> : 
              <Computer className="w-16 h-12 p-2 cursor-pointer bg-gray-950 rounded-md" onClick={() => setIsScreenSharing(!isScreenSharing)} />
            }

            <Phone className="w-16 h-12 p-2 cursor-pointer bg-primary hover:bg-red-500 rounded-md" />
          </div>
        </div>
      </Container>
    </div>
  )
}
