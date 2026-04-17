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
    { id: 'cam-1', name: 'Entrada Principal', url: 'https://picsum.photos/seed/entry/800/450', status: 'ONLINE', model: 'Hikvision DS-2CD', lastEvent: 'Movimento há 2min' },
    { id: 'cam-2', name: 'Garagem G1', url: 'https://picsum.photos/seed/garage/800/450', status: 'ONLINE', model: 'Intelbras VIP 1230', lastEvent: 'Sem eventos' },
    { id: 'cam-3', name: 'Piscina', url: 'https://picsum.photos/seed/pool/800/450', status: 'OFFLINE', model: 'Dahua IPC-HFW', lastEvent: 'Perda de sinal há 1h' },
    { id: 'cam-4', name: 'Salão de Festas', url: 'https://picsum.photos/seed/party/800/450', status: 'ONLINE', model: 'Hikvision DS-2CD', lastEvent: 'Movimento há 10min' },
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
