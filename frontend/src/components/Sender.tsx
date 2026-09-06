import { useEffect, useRef } from "react"

export const Sender = () => {
    const socket = useRef<WebSocket | null>(null);

    useEffect(() => {
        socket.current = new WebSocket('ws://localhost:8080');
        socket.current.onopen = () => {
            console.log("webSocket connect...");
            socket.current?.send(JSON.stringify({ type: 'sender' }));
        }

        return () => {
            console.log("Cleaning up webSocket...")
            socket.current?.close();
        }
    }, []);

    async function startSendingVideo() {
        if (!socket.current) return;

        const pc = new RTCPeerConnection();

        pc.onnegotiationneeded = async () => {
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            socket.current?.send(JSON.stringify({ type: "createOffer", sdp: pc.localDescription }));
        }

        pc.onicecandidate = (event) => {
            console.log(event.candidate);
            if (event.candidate) {
                socket.current?.send(JSON.stringify({ type: "iceCandidate", candidate: event.candidate }));
            }
        }

        socket.current.onmessage = async (event) => {
            const data = JSON.parse(event.data);

            if (data.type === "createAnswer") {
                await pc.setRemoteDescription(data.sdp);

            } else if (data.type === "iceCandidate") {
                await pc.addIceCandidate(data.candidate);
            }
        } 

        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        // const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
        pc.addTrack(stream.getVideoTracks()[0], stream);

    }

    return <div>
        Sender
        <button onClick={startSendingVideo}> Send video </button>
    </div>
}