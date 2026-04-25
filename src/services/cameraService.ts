import { PackageIcon, History, Camera, LayoutDashboard, Database, RefreshCw, ZoomIn, ZoomOut, ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react';

export interface CameraStream {
  id: string;
  name: string;
  url: string;
  status: 'ONLINE' | 'OFFLINE' | 'ERROR';
  model: string;
  lastEvent?: string;
}

export interface CameraAction {
  cameraId: string;
  action: 'PTZ_UP' | 'PTZ_DOWN' | 'PTZ_LEFT' | 'PTZ_RIGHT' | 'ZOOM_IN' | 'ZOOM_OUT';
}

class CameraService {
  private mockCameras: CameraStream[] = [
    { id: 'cam-1', name: 'Portaria Principal', url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', status: 'ONLINE', model: 'Hikvision DS-2CD (HLS)', lastEvent: 'Movimento detectado há 12s' },
    { id: 'cam-2', name: 'Garagem G1', url: 'https://bitdash-a.akamaihd.net/content/MI201109210084_1/m3u8s/f08e80da-bf1d-4e3d-8899-f0f6155f6efa.m3u8', status: 'ONLINE', model: 'Intelbras VIP 1230', lastEvent: 'Livre' },
    { id: 'cam-3', name: 'Piscina / Área Lazer', url: 'https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8', status: 'ONLINE', model: 'Dahua IPC-HFW', lastEvent: 'Sem eventos' },
    { id: 'cam-4', name: 'Salão de Festas', url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', status: 'ONLINE', model: 'Hikvision DS-2CD', lastEvent: 'Movimento há 10min' },
    { id: 'cam-5', name: 'Corredor Bloco A', url: 'https://picsum.photos/seed/corridor/800/450', status: 'OFFLINE', model: 'Genérico IP Cam', lastEvent: 'Perda de sinal' },
  ];

  async getCameras(): Promise<CameraStream[]> {
    // Simulating API call
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (Math.random() > 0.05) {
          resolve(this.mockCameras);
        } else {
          reject(new Error("Falha na conexão com o servidor de câmeras."));
        }
      }, 1000);
    });
  }

  async executePTZ(action: CameraAction): Promise<void> {
    console.log(`Executing PTZ: ${action.action} on camera ${action.cameraId}`);
    return new Promise((resolve) => setTimeout(resolve, 500));
  }
}

export const cameraService = new CameraService();
