"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Box, Fab, Paper, Typography, IconButton, Collapse } from "@mui/material";
import MicIcon from "@mui/icons-material/Mic";
import MicOffIcon from "@mui/icons-material/MicOff";
import CloseIcon from "@mui/icons-material/Close";
import GraphicEqIcon from "@mui/icons-material/GraphicEq";
import { GoogleGenAI, Modality, LiveServerMessage, Type, FunctionDeclaration } from "@google/genai";

const MODEL = "models/gemini-2.5-flash-native-audio-preview-12-2025";

function encode(bytes: Uint8Array) {
  let binary = "";
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

export default function VoiceAgent() {
  const [isActive, setIsActive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcription, setTranscription] = useState("");
  
  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const nextStartTimeRef = useRef(0);
  const audioSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;

  const toolDeclarations: FunctionDeclaration[] = [
    {
      name: 'add_event',
      parameters: {
        type: Type.OBJECT,
        description: 'Add a new calendar event.',
        properties: {
          title: { type: Type.STRING },
          start: { type: Type.STRING, description: 'ISO 8601 date string' },
          end: { type: Type.STRING, description: 'ISO 8601 date string' },
          description: { type: Type.STRING },
          location: { type: Type.STRING },
        },
        required: ['title', 'start'],
      },
    },
    {
      name: 'add_task',
      parameters: {
        type: Type.OBJECT,
        description: 'Add a new todo task.',
        properties: {
          title: { type: Type.STRING },
          notes: { type: Type.STRING }
        },
        required: ['title'],
      },
    },
    {
      name: 'get_events',
      parameters: {
        type: Type.OBJECT,
        description: 'Get all upcoming calendar events to answer questions about the user\'s schedule.',
        properties: {},
      },
    },
    {
      name: 'get_tasks',
      parameters: {
        type: Type.OBJECT,
        description: 'Get the list of all todo tasks.',
        properties: {},
      },
    },
    {
      name: 'update_task',
      parameters: {
        type: Type.OBJECT,
        description: 'Update an existing task status, title, or notes.',
        properties: {
          taskId: { type: Type.STRING },
          taskListId: { type: Type.STRING },
          accountId: { type: Type.STRING },
          status: { type: Type.STRING, enum: ['needsAction', 'completed'] },
          title: { type: Type.STRING },
          notes: { type: Type.STRING }
        },
        required: ['taskId'],
      },
    },
    {
      name: 'delete_task',
      parameters: {
        type: Type.OBJECT,
        description: 'Delete a task by ID.',
        properties: {
          taskId: { type: Type.STRING },
          taskListId: { type: Type.STRING },
          accountId: { type: Type.STRING }
        },
        required: ['taskId'],
      },
    },
    {
      name: 'delete_event',
      parameters: {
        type: Type.OBJECT,
        description: 'Delete a calendar event by ID.',
        properties: {
          eventId: { type: Type.STRING },
          accountId: { type: Type.STRING }
        },
        required: ['eventId'],
      },
    }
  ];

  const handleToolCall = useCallback(async (fc: any, session: any) => {
    let result: any = "ok";
    const args = fc.args || {};
    try {
            if (fc.name === 'add_event') {
              const res = await fetch("/api/calendar/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  summary: args.title,
                  start: args.start,
                  end: args.end || args.start,
                  description: args.description,
                  location: args.location
                })
              });
              if (res.ok) {
                result = "Event added successfully";
                const data = await res.json();
                window.dispatchEvent(new CustomEvent('hub-ai-update', { detail: { type: 'calendar', id: data.id } }));
              } else {
                result = "Failed to add event";
              }
                  } else if (fc.name === 'add_task') {
                    const res = await fetch("/api/tasks/create", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ title: args.title, notes: args.notes })
                    });
                    if (res.ok) {
                      result = "Task added successfully";
                      const data = await res.json();
                      window.dispatchEvent(new CustomEvent('hub-ai-update', { detail: { type: 'task', id: data.id } }));
                    } else {
                      result = "Failed to add task";
                    }
                  }
             else if (fc.name === 'get_events') {
        const res = await fetch("/api/calendar/events");
        result = await res.json();
      } else if (fc.name === 'get_tasks') {
        const res = await fetch("/api/tasks/list");
        result = await res.json();
            } else if (fc.name === 'update_task') {
              const res = await fetch("/api/tasks/update", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(args)
              });
              if (res.ok) {
                result = "Task updated successfully";
                window.dispatchEvent(new CustomEvent('hub-ai-update', { detail: { type: 'task', id: args.taskId } }));
              } else {
                result = "Failed to update task";
              }
                  } else if (fc.name === 'delete_task') {
                    const res = await fetch(`/api/tasks/delete?taskId=${args.taskId}&taskListId=${args.taskListId || ''}&accountId=${args.accountId || ''}`, {
                      method: "DELETE"
                    });
                    if (res.ok) {
                      result = "Task deleted successfully";
                      window.dispatchEvent(new CustomEvent('hub-ai-update', { detail: { type: 'task' } }));
                    } else {
                      result = "Failed to delete task";
                    }
                        } else if (fc.name === 'delete_event') {
                          const res = await fetch(`/api/calendar/delete?eventId=${args.eventId}&accountId=${args.accountId || ''}`, {
                            method: "DELETE"
                          });
                          if (res.ok) {
                            result = "Event deleted successfully";
                            window.dispatchEvent(new CustomEvent('hub-ai-update', { detail: { type: 'calendar' } }));
                          } else {
                            result = "Failed to delete event";
                          }
                        }
                  
    } catch (e) {
      result = `Error: ${e}`;
    }

    session.sendToolResponse({
      functionResponses: [{
        id: fc.id,
        name: fc.name,
        response: { result },
      }],
    });
  }, []);

  const stopSession = useCallback(async () => {
    setIsActive(false);
    setIsConnecting(false);
    setIsSpeaking(false);
    setTranscription("");

    if (sessionPromiseRef.current) {
      const session = await sessionPromiseRef.current;
      session.close();
      sessionPromiseRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    audioSourcesRef.current.forEach(source => {
      try { source.stop(); } catch(e) {}
    });
    audioSourcesRef.current.clear();

    if (inputAudioContextRef.current) {
      await inputAudioContextRef.current.close();
      inputAudioContextRef.current = null;
    }
    if (outputAudioContextRef.current) {
      await outputAudioContextRef.current.close();
      outputAudioContextRef.current = null;
    }
  }, []);

  const startSession = async () => {
    if (!apiKey) return alert("API Key missing");
    setIsConnecting(true);

    try {
      const ai = new GoogleGenAI({ apiKey });
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      inputAudioContextRef.current = inputCtx;
      outputAudioContextRef.current = outputCtx;

      const sessionPromise = ai.live.connect({
        model: MODEL,
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
          systemInstruction: `You are the Family Hub Assistant. Today is ${new Date().toLocaleString()}. 
          You have access to the user's calendar and tasks. 
          - When a user asks about their schedule or what they have to do, ALWAYS use 'get_events' or 'get_tasks' before answering.
          - You can add, update, and delete tasks and events. 
          - To update or delete an item, you MUST first fetch the list to find its ID (taskId, eventId, etc.).
          Help users manage their family schedule efficiently. Be warm and brief.`,
          tools: [{ functionDeclarations: toolDeclarations }],
        },
        callbacks: {
          onopen: () => {
            setIsConnecting(false);
            setIsActive(true);
            const source = inputCtx.createMediaStreamSource(stream);
            const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const int16 = new Int16Array(inputData.length);
              for (let i = 0; i < inputData.length; i++) int16[i] = inputData[i] * 32768;
              const pcmBlob = { data: encode(new Uint8Array(int16.buffer)), mimeType: 'audio/pcm;rate=16000' };
              sessionPromise.then(session => session.sendRealtimeInput({ media: pcmBlob }));
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputCtx.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            console.log("Gemini Live Message:", message);
            
            if (message.serverContent?.modelTurn?.parts) {
              for (const part of message.serverContent.modelTurn.parts) {
                if (part.inlineData?.data) {
                  setIsSpeaking(true);
                  const buffer = await decodeAudioData(decode(part.inlineData.data), outputCtx, 24000, 1);
                  const source = outputCtx.createBufferSource();
                  source.buffer = buffer;
                  source.connect(outputCtx.destination);
                  nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputCtx.currentTime);
                  source.start(nextStartTimeRef.current);
                  nextStartTimeRef.current += buffer.duration;
                  audioSourcesRef.current.add(source);
                  source.onended = () => {
                    audioSourcesRef.current.delete(source);
                    if (audioSourcesRef.current.size === 0) setIsSpeaking(false);
                  };
                }
              }
            }

            if (message.toolCall?.functionCalls) {
              const session = await sessionPromise;
              for (const fc of message.toolCall.functionCalls) {
                await handleToolCall(fc, session);
              }
            }

            if (message.serverContent?.interrupted) {
              audioSourcesRef.current.forEach(s => { try { s.stop(); } catch(e) {} });
              audioSourcesRef.current.clear();
              nextStartTimeRef.current = 0;
              setIsSpeaking(false);
            }
          },
          onerror: (e) => console.error('Live API Error:', e),
          onclose: () => stopSession(),
        },
      });

      sessionPromiseRef.current = sessionPromise;
    } catch (err) {
      console.error('Failed to start session:', err);
      setIsConnecting(false);
    }
  };

  const toggle = () => isActive ? stopSession() : startSession();

  return (
    <Box sx={{ position: "fixed", bottom: 32, right: 32, zIndex: 2000, display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
      <Collapse in={isActive}>
        <Paper 
          sx={{ 
            mb: 2, 
            p: 2, 
            width: 300, 
            borderRadius: 4, 
            bgcolor: "rgba(0,0,0,0.85)", 
            backdropFilter: "blur(10px)",
            color: "white",
            display: "flex",
            alignItems: "center",
            gap: 2,
            boxShadow: "0 8px 32px rgba(0,0,0,0.2)"
          }}
        >
          <Box sx={{ 
            width: 48, 
            height: 48, 
            borderRadius: "50%", 
            bgcolor: isSpeaking ? "#4285f4" : "#ea4335",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.3s",
            animation: isSpeaking ? "pulse 1.5s infinite" : "none",
            "@keyframes pulse": {
              "0%": { transform: "scale(1)", boxShadow: "0 0 0 0 rgba(66, 133, 244, 0.7)" },
              "70%": { transform: "scale(1.1)", boxShadow: "0 0 0 10px rgba(66, 133, 244, 0)" },
              "100%": { transform: "scale(1)", boxShadow: "0 0 0 0 rgba(66, 133, 244, 0)" }
            }
          }}>
            <GraphicEqIcon sx={{ color: "white" }} />
          </Box>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="subtitle2" fontWeight="bold">
              {isSpeaking ? "Gemini Speaking" : "Listening..."}
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.7, display: "block" }}>
              Family Hub AI
            </Typography>
          </Box>
          <IconButton onClick={stopSession} size="small" sx={{ color: "rgba(255,255,255,0.5)" }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Paper>
      </Collapse>

      <Fab 
        color={isActive ? "secondary" : "primary"} 
        onClick={toggle}
        sx={{ 
          width: 72, 
          height: 72,
          boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
          bgcolor: isActive ? "#ea4335" : "#4285f4",
          "&:hover": { bgcolor: isActive ? "#d32f2f" : "#1976d2" }
        }}
      >
        {isConnecting ? <GraphicEqIcon /> : isActive ? <MicOffIcon /> : <MicIcon sx={{ fontSize: 32 }} />}
      </Fab>
    </Box>
  );
}
