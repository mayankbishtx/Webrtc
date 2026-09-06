import { useEffect, useRef } from "react";

export const Receiver = () => {
    const pc = useRef<RTCPeerConnection | null>(null);
    const videoRef = useRef<HTMLVideoElement | null>(null);

    useEffect(() => {
        const socket = new WebSocket("ws://localhost:8080");

        socket.onopen = () => {
            console.log("Receiver connected");

            socket.send(JSON.stringify({ type: "receiver" }));
        };

        socket.onmessage = async (event) => {
            const message = JSON.parse(event.data);

            if (message.type === "offer") {
                pc.current = new RTCPeerConnection();

                pc.current.ontrack = (event) => {
                    console.log("Received track: ", event);
                    if (videoRef.current) {
                        videoRef.current.srcObject = event.streams[0];

                        videoRef.current.play().catch(console.error);
                    }
                }

                pc.current.onicecandidate = (event) => {
                    console.log(event.candidate);

                    if (event.candidate) {
                        socket.send(
                            JSON.stringify({ type: "iceCandidate", candidate: event.candidate })
                        );
                    }
                };

                await pc.current.setRemoteDescription(message.sdp);

                const answer = await pc.current.createAnswer();
                await pc.current.setLocalDescription(answer);

                socket.send(
                    JSON.stringify({ type: "createAnswer", sdp: pc.current.localDescription })
                );
            }

            else if (message.type === "iceCandidate") {
                if (pc.current) {
                    await pc.current.addIceCandidate(message.candidate);
                }
            }
        };

        socket.onerror = (error) => {
            console.error("WebSocket error:", error);
        };

        socket.onclose = () => {
            console.log("Receiver WebSocket closed");
            pc.current?.close();
        };

        return () => {
            socket.close();
            pc.current?.close();
        };
    }, []);

    return <div>
        Receiver
        <video 
            ref={videoRef}
            autoPlay 
            playsInline 
            style={{ width: "640px", height: "480px", background: "black" }}
        />
    </div>;
};