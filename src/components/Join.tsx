'use client'
import { useRef, FormEvent } from 'react';
import { Button } from './Button';
import { Input } from './Input';

export function JoinRoom() {
  const name = useRef<HTMLInputElement>(null);
  const id = useRef<HTMLInputElement>(null);

  function handleJoinRoom(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (name.current && name.current.value !== '' && id.current && id.current.value !== '') {
      sessionStorage.setItem("username", name.current.value);
      const roomId = id.current.value;
      window.location.href = `/room/${roomId}`;
    }
  }

  return (
    <form onSubmit={(e) => handleJoinRoom(e)} className="space-y-8">
      <Input placeholder="Seu nome" type="text" ref={name} />
      <Input placeholder="ID da reunião" type="text" ref={id} />

      <Button title="Entrar" type="submit" />
    </form>
  );
}