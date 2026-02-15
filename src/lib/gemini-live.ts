import WebSocket from 'ws';

/**
 * Manages a bidirectional real-time session with Gemini.
 * Handles WebSocket lifecycle, audio streaming, and session setup.
 */
export class GeminiLiveSession {
  private ws: WebSocket | null = null;
  private url: string;
  public isConnected: boolean = false;

  constructor(model: string = "gemini-2.0-flash-exp") {
    // Construct the BidiGenerateContent WebSocket URL
    const host = "generativelanguage.googleapis.com";
    const path = `/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent`;
    const params = `?key=${process.env.GOOGLE_API_KEY}`;
    this.url = `wss://${host}${path}${params}`;
  }

  /**
   * Establishes the WebSocket connection and sends initial setup config.
   * @param onMessage - Callback for receiving audio/text from model.
   * @param onError - Callback for errors.
   */
  connect(onMessage: (data: any) => void, onError: (err: Error) => void) {
    if (this.ws) {
      console.warn("Session already active.");
      return;
    }

    try {
      this.ws = new WebSocket(this.url);

      this.ws.on('open', () => {
        this.isConnected = true;
        console.log("Gemini Live Session Connected");
        this.sendSetupConfig();
      });

      this.ws.on('message', (data: Buffer) => {
        try {
          const response = JSON.parse(data.toString());
          onMessage(response);
        } catch (e) {
          console.error("Failed to parse Live API message", e);
        }
      });

      this.ws.on('error', (err) => {
        console.error("Gemini Live Socket Error:", err);
        this.isConnected = false;
        onError(err);
      });

      this.ws.on('close', () => {
        console.log("Gemini Live Session Closed");
        this.isConnected = false;
      });

    } catch (error) {
      onError(error as Error);
    }
  }

  /**
   * Sends the initial configuration payload to define voice and modalities.
   */
  private sendSetupConfig() {
    const setupMessage = {
      setup: {
        model: "models/gemini-2.0-flash-exp",
        generation_config: {
          response_modalities: ["AUDIO"],
          speech_config: {
            voice_config: { prebuilt_voice_config: { voice_name: "Aoede" } } // Styles: Puck, Charon, Aoede, etc.
          }
        }
      }
    };
    this.send(setupMessage);
  }

  /**
   * Streams Real-time Input (Audio/Video) to the model.
   * @param base64Data - Raw PCM audio data (base64 encoded).
   * @param mimeType - usually "audio/pcm;rate=16000"
   */
  sendRealtimeInput(base64Data: string, mimeType: string = "audio/pcm;rate=16000") {
    const realtimeMessage = {
      realtime_input: {
        media_chunks: [{
          mime_type: mimeType,
          data: base64Data
        }]
      }
    };
    this.send(realtimeMessage);
  }

  /**
   * Sends a text message to interrupt or steer the conversation.
   */
  sendText(text: string) {
    const clientContent = {
      client_content: {
        turns: [{ role: "user", parts: [{ text: text }] }],
        turn_complete: true
      }
    };
    this.send(clientContent);
  }

  private send(data: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    } else {
      console.warn("WebSocket not open. Cannot send message.");
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
      this.isConnected = false;
    }
  }
}
