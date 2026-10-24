"use client";

/**
 * MapCore — react-map-gl (mapbox-gl v3, style Standard) yang berisi:
 * marker glass ber-ikon, popup glass, fly-to kamera, dan preset Siang/Malam.
 * Dipisah dari InteractiveMap agar bisa dynamic ssr:false dengan props biasa.
 */

import { useCallback, useEffect, useMemo, useRef } from "react";
import { createElement } from "react";
import Map, {
  MapRef, Marker, NavigationControl, Popup,
} from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import {
  BadgeCheck, MapPin, MessageCircle, Navigation, Star, X,
} from "lucide-react";
import { useReducedMotion } from "framer-motion";
import type { DirectoryProvider } from "@/lib/data";
import { initials } from "@/lib/data";
import { trackWaClick } from "@/lib/track";
import { MAP_CENTER, providerCoords } from "@/lib/map-coords";
import { iconForCategory } from "@/lib/category-icons";

export type MapPreset = "day" | "dusk";

interface MapCoreProps {
  providers: DirectoryProvider[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  preset: MapPreset;
}

/* ------------------------------ Popup glass ------------------------------ */

function PopupCard({
  p,
  onClose,
}: {
  p: DirectoryProvider;
  onClose: () => void;
}) {
  return (
    <div className="map-pop w-[264px] overflow-hidden rounded-2xl border border-white/25 bg-emerald-950/80 shadow-[0_18px_50px_-12px_rgba(0,0,0,.55)] backdrop-blur-xl">
      {p.images && p.images.length > 0 ? (
        <img
          src={p.images[0]}
          alt={`Foto usaha ${p.name}`}
          className="h-28 w-full object-cover"
        />
      ) : (
        <div className="grid h-20 w-full place-items-center bg-gradient-to-br from-emerald-900 to-emerald-800">
          <span className="font-serif text-2xl italic text-amber-300/80">
            {initials(p.name)}
          </span>
        </div>
      )}

      <div className="space-y-2 p-3.5 text-white">
        <div className="flex items-start gap-1.5">
          <h3 className="min-w-0 flex-1 truncate text-[15px] font-semibold tracking-tight" title={p.name}>
            {p.name}
          </h3>
          {p.verified && (
            <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" aria-label="Terverifikasi" />
          )}
        </div>

        <p className="flex items-center gap-1 truncate text-xs text-white/60">
          <MapPin className="h-3 w-3 shrink-0" /> {p.cat} · Kec. {p.district}
        </p>

        <p className="flex items-center gap-1.5 font-mono text-xs tabular-nums text-white/80">
          {p.rating !== null ? (
            <>
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              {p.rating.toFixed(1)}
              <span className="text-white/40">({p.reviews} ulasan)</span>
            </>
          ) : (
            <span className="text-amber-300">Mitra baru</span>
          )}
        </p>

        <div className="flex items-center gap-2 pt-1">
          {/* KPI PRD — tracking klik WA TIDAK diubah: /api/track, source "direktori" */}
          <a
            href={`https://wa.me/${p.wa}?text=${encodeURIComponent(p.msg)}`}
            target="_blank" rel="noopener noreferrer"
            onClick={() => trackWaClick(p.id, "direktori")}
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-amber-500 px-3 py-2.5 text-xs font-bold text-emerald-950 transition hover:bg-amber-400"
          >
            <MessageCircle className="h-3.5 w-3.5" /> Hubungi via WA
          </a>
          <a
            href={`/usaha/${p.id}`}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-white/20 text-white/80 transition hover:bg-white/10"
            aria-label={`Profil lengkap ${p.name}`}
            title="Profil lengkap"
          >
            <Navigation className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>

      <button
        type="button"
        onClick={onClose}
        className="absolute right-1.5 top-1.5 grid h-7 w-7 place-items-center rounded-full bg-emerald-950/70 text-white/80 backdrop-blur transition hover:text-white"
        aria-label="Tutup kartu usaha"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

/* --------------------------------- Peta --------------------------------- */

export default function MapCore({
  providers, selectedId, onSelect, preset,
}: MapCoreProps) {
  const mapRef = useRef<MapRef>(null);
  const reduce = useReducedMotion();
  const introDone = useRef(false);

  const selected = useMemo(
    () => providers.find((p) => p.id === selectedId) ?? null,
    [providers, selectedId]
  );
  const selectedCoords = useMemo(
    () => (selected ? providerCoords(selected.id, selected.district) : null),
    [selected]
  );

  /** Terbang halus ke titik (virtual tour). */
  const flyTo = useCallback(
    (lng: number, lat: number, zoom: number, pitch: number, duration: number) => {
      mapRef.current?.flyTo({
        center: [lng, lat], zoom, pitch,
        bearing: -14, duration: reduce ? 0 : duration, essential: true, curve: 1.55,
      });
    },
    [reduce]
  );

  /* Saat pin/kartu dipilih → kamera terbang ke usaha. */
  useEffect(() => {
    if (!selected || !selectedCoords) return;
    flyTo(selectedCoords.lng, selectedCoords.lat, 15.1, 58, 1500);
  }, [selected, selectedCoords, flyTo]);

  /* Gaya cahaya Standard style (Siang/Malam). */
  useEffect(() => {
    try {
      mapRef.current?.setConfigProperty("basemap", "lightPreset", preset);
    } catch {
      /* style belum siap / bukan Standard — abaikan */
    }
  }, [preset]);

  const handleLoad = useCallback(() => {
    try {
      mapRef.current?.setConfigProperty("basemap", "lightPreset", preset);
    } catch { /* noop */ }

    /* Dolly intro: dari pandangan luas menyelam ke kota — rasa "tur museum".
       Hanya sekali, dan dilewati bila pengguna memilih reduce-motion. */
    if (!introDone.current && !reduce) {
      introDone.current = true;
      window.setTimeout(() => {
        mapRef.current?.flyTo({
          center: [MAP_CENTER.lng, MAP_CENTER.lat],
          zoom: 12.7, pitch: 54, bearing: -16,
          duration: 2400, essential: false, curve: 1.4,
        });
      }, 350);
    }
  }, [preset, reduce]);

  const handleClose = useCallback(() => {
    onSelect(null);
    /* Kembali ke pandangan kota agar pengguna tidak "tersesat" di zoom gedung */
    mapRef.current?.flyTo({
      center: [MAP_CENTER.lng, MAP_CENTER.lat],
      zoom: 12.5, pitch: 52, bearing: -16,
      duration: reduce ? 0 : 1000, essential: false,
    });
  }, [onSelect, reduce]);

  return (
    <Map
      ref={mapRef}
      mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
      mapStyle="mapbox://styles/mapbox/standard"
      initialViewState={{
        longitude: MAP_CENTER.lng, latitude: MAP_CENTER.lat,
        zoom: 11.7, pitch: 46, bearing: -20,
      }}
      /* Satu jari = scroll halaman, dua jari = gerak/miring peta (iPhone XR).
         Desktop: ctrl+scroll untuk zoom, drag untuk look-around. */
      cooperativeGestures
      dragRotate
      touchPitch
      onLoad={handleLoad}
      style={{ width: "100%", height: "100%" }}
      attributionControl={true}
    >
      <NavigationControl visualizePitch showCompass position="bottom-right" />

      {providers.map((p) => {
        const c = providerCoords(p.id, p.district);
        const isSel = p.id === selectedId;
        return (
          <Marker
            key={p.id}
            longitude={c.lng} latitude={c.lat}
            anchor="center"
            style={{ zIndex: isSel ? 3 : 1 }}
          >
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSelect(isSel ? null : p.id);
              }}
              aria-label={`Lihat ${p.name} di peta`}
              aria-pressed={isSel}
              className={[
                "relative grid h-10 w-10 place-items-center rounded-full border backdrop-blur-md transition-all duration-300",
                isSel
                  ? "scale-[1.28] border-amber-300 bg-amber-400 shadow-[0_10px_28px_-6px_rgba(245,158,11,.65)]"
                  : "border-white/25 bg-emerald-950/60 shadow-[0_8px_22px_-6px_rgba(0,0,0,.5)] hover:scale-110 hover:border-amber-300/60",
              ].join(" ")}
            >
              {createElement(iconForCategory(p.cat), {
                className: isSel ? "h-4.5 w-4.5 text-emerald-950" : "h-4 w-4 text-amber-300",
              })}
              {isSel && (
                <span
                  aria-hidden
                  className="absolute inset-0 animate-ping rounded-full border-2 border-amber-300/50"
                />
              )}
            </button>
          </Marker>
        );
      })}

      {selected && selectedCoords && (
        <Popup
          longitude={selectedCoords.lng}
          latitude={selectedCoords.lat}
          anchor="bottom"
          offset={34}
          closeOnClick={false}
          closeButton={false}
          maxWidth="280px"
          className="map-popup-glass"
        >
          <PopupCard p={selected} onClose={handleClose} />
        </Popup>
      )}
    </Map>
  );
}
