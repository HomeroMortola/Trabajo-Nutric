import http from 'k6/http';
import { sleep } from 'k6';

export const options = {
  stages: [
    { duration: '5s', target: 100 }, // Subida violenta a 100 usuarios en 5 seg
    { duration: '20s', target: 100 }, // Se mantienen 20 segundos
    { duration: '5s', target: 0 },    // Bajan a 0 rápido
  ],
};

export default function () {
  // Reemplaza esto con la URL real de tu proyecto en Vercel
  http.get('https://project-3436t.vercel.app/');

  // Pausa de 1 segundo entre cada petición del usuario
  sleep(1);
}