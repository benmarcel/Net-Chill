import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import basicSsl from '@vitejs/plugin-basic-ssl'
export default defineConfig({
  plugins: [
    tailwindcss(),
    // basicSsl()
  ],
  server: {
    port: 5173,
    allowedHosts: [
      "fattenable-hadlee-unpossessable.ngrok-free.dev"
    ]
  }
  
})