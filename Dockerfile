# Aracı sunucu — yalnızca server/ klasörü. React Native uygulaması bu imaja girmiyor.
#
# TypeScript build aşamasında JavaScript'e derleniyor; çalışma zamanında Node'un
# deneysel tip sıyırma özelliğine güvenmiyoruz, sürümler arasında davranışı değişiyor.

FROM node:24-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
# Sunucunun çalışma zamanı bağımlılığı yok; yalnızca derleyici gerekiyor.
RUN npm install --no-save typescript@~6.0.0

COPY server ./server
RUN npx tsc -p server/tsconfig.build.json

FROM node:24-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8080

COPY --from=build /app/dist-server ./dist-server
# Cikti ESM; Node'un bunu bilmesi icin modul tanimi yanina konuyor.
COPY server/package.json ./dist-server/package.json

# Kök olmayan kullanıcı; node imajında hazır geliyor.
USER node

EXPOSE 8080
CMD ["node", "dist-server/server.js"]
