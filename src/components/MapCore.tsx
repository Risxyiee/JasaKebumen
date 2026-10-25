"use client";

/**
 * MapCore — react-map-gl (mapbox-gl v3, style Standard) versi PERFORMA.
 *
 * Aturan anti-lag yang diterapkan ketat:
 * 1. PIN RINGAN — pin & klaster digambar sebagai LAYER GPU (symbol/circle),
 *    bukan elemen DOM. Nol backdrop-blur, nol CSS transition, nol
 *    framer-motion di atas canvas. Ikon Lucide dirasterisasi SEKALI ke
 *    canvas saat load (dot + ikon dalam satu tekstur) lalu dipakai ulang.
 * 2. GEDUNG 3D — layer fill-extrusion milik sendiri dengan minzoom 15
 *    KETAT; 3D bawaan style Standard dimatikan (show3dObjects=false)
 *    supaya GPU tidak menggambar geometri 3D dobel / saat zoom jauh.
 * 3. CLUSTERING — native mapbox-gl (supercluster internal, tanpa paket
 *    tambahan): pin berdekatan digabung lingkaran berangka dan pecah
 *    sendiri saat zoom mendekat (clusterMaxZoom 14).
 *
 * Yang dipertahankan dari versi sebelumnya:
 * - Popup glass DOM (di luar canvas — boleh "mahal") + tombol "Hubungi via
 *   WA" dengan tracking /api/track (trackWaClick) UTUH.
 * - lightPreset Siang/Malam, intro flyTo, cooperativeGestures (satu jari
 *   menggulir halaman, dua jari pan/pitch — iPhone XR), touchPitch,
 *   dragRotate.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createElement } from "react";
import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";
import Map, {
  MapRef, NavigationControl, Popup,
} from "react-map-gl/mapbox";
import type { GeoJSONSource, Map as MbMap } from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import {
  BadgeCheck, MapPin, MessageCircle, Navigation, Star, X,
  type LucideIcon,
} from "lucide-react";
import { useReducedMotion } from "framer-motion";
import type { DirectoryProvider } from "@/lib/data";
import { initials } from "@/lib/data";
import { trackWaClick } from "@/lib/track";
import { MAP_CENTER, providerCoords } from "@/lib/map-coords";
import { iconForCategory } from "@/lib/category-icons";
import { REF_CATEGORIES } from "@/lib/reference";

export type MapPreset = "day" | "dusk";

interface MapCoreProps {
  providers: DirectoryProvider[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  preset: MapPreset;
  /** Token runtime (diteruskan server → client). Fallback: NEXT_PUBLIC
   *  inline build-time. Dengan jalur runtime, set Secret di dashboard CF
   *  langsung menghidupkan peta TANPA rebuild. */
  mapboxToken?: string;
}

/** Resolusi kanvas pin (dikirim dengan pixelRatio 2 → tampil 42px). */
const PIN_PX = 84;
/** ATURAN KETAT spesifikasi: geometri 3D hanya hidup di zoom ≥ nilai ini. */
const BUILDING_MINZOOM = 15;

/* ------------------------------------------------------------------ */
/* Rasterisasi ikon → tekstur GPU (sekali saat load, bukan per-frame)  */
/* ------------------------------------------------------------------ */

function svgStringFor(Icon: LucideIcon, color: string): string {
  const host = document.createElement("div");
  const root = createRoot(host);
  let svg = "";
  try {
    flushSync(() => {
      root.render(
        createElement(Icon, {
          size: 34, color, strokeWidth: 2.4, "aria-hidden": true,
        })
      );
    });
    svg = host.innerHTML;
  } catch {
    svg = "";
  } finally {
    root.unmount();
  }
  return svg;
}

function svgToImage(svg: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  });
}

/** Pin = dot emerald + ring putih + ikon — SEMUA dibake ke satu kanvas.
    Statis total: tidak ada animasi/blur yang dieksekusi GPU per-frame. */
async function rasterizePin(
  Icon: LucideIcon,
  opts: { fill: string; ring: string; icon: string }
): Promise<ImageData | null> {
  try {
    const canvas = document.createElement("canvas");
    canvas.width = PIN_PX;
    canvas.height = PIN_PX;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    const cx = PIN_PX / 2;
    const r = PIN_PX * 0.44;

    // Bayangan lembut statis di bawah pin (sekali gambar, bukan blur CSS)
    ctx.beginPath();
    ctx.ellipse(cx, PIN_PX - 6, r * 0.5, r * 0.16, 0, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(1, 30, 22, 0.30)";
    ctx.fill();

    // Badan pin
    ctx.beginPath();
    ctx.arc(cx, cx, r, 0, Math.PI * 2);
    ctx.fillStyle = opts.fill;
    ctx.fill();
    ctx.lineWidth = 5; // @2x → ring 2.5px
    ctx.strokeStyle = opts.ring;
    ctx.stroke();

    // Ikon Lucide di tengah
    const svg = svgStringFor(Icon, opts.icon);
    if (svg) {
      const img = await svgToImage(svg);
      const s = PIN_PX * 0.46;
      ctx.drawImage(img, cx - s / 2, cx - s / 2, s, s);
    }
    return ctx.getImageData(0, 0, PIN_PX, PIN_PX);
  } catch {
    return null;
  }
}

/** Semua variasi pin (semua kategori × normal/aktif + fallback) ditambahkan
    SEKALI saat style siap — symbol layer tinggal mereferensikan namanya. */
async function addPinImages(map: MbMap): Promise<void> {
  const jobs: Promise<void>[] = [];
  const add = (key: string, data: ImageData | null) => {
    if (data && !map.hasImage(key)) {
      map.addImage(key, data, { pixelRatio: 2 });
    }
  };
  const push = (key: string, Icon: LucideIcon, active: boolean) =>
    jobs.push(
      rasterizePin(Icon, active
        ? { fill: "#F59E0B", ring: "rgba(255,255,255,.95)", icon: "#022C22" }
        : { fill: "#0B4A38", ring: "rgba(255,255,255,.95)", icon: "#FCD34D" }
      ).then((d) => add(key, d))
    );

  push("pin-def", MapPin, false);
  push("pinA-def", MapPin, true);
  for (const c of REF_CATEGORIES) {
    const Icon = iconForCategory(c.name);
    push(`pin-${c.slug}`, Icon, false);
    push(`pinA-${c.slug}`, Icon, true);
  }
  await Promise.all(jobs);
}

/** slug kategori → nama tekstur ("Kuliner & makanan khas" → "kuliner"). */
function slugForCat(catName: string): string {
  return REF_CATEGORIES.find((c) => c.name === catName)?.slug ?? "def";
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
  providers, selectedId, onSelect, preset, mapboxToken,
}: MapCoreProps) {
  const mapRef = useRef<MapRef>(null);
  const reduce = useReducedMotion();
  const introDone = useRef(false);
  const [mapReady, setMapReady] = useState(false);

  /* latest-ref: handler layer mapbox menunjuk nilai terbaru tanpa
     registrasi ulang listener (anti memory-leak & stale closure).
     Ditulis via useEffect — React melarang update ref saat render. */
  const onSelectRef = useRef(onSelect);
  const selectedIdRef = useRef(selectedId);
  useEffect(() => {
    onSelectRef.current = onSelect;
    selectedIdRef.current = selectedId;
  }, [onSelect, selectedId]);

  const selected = useMemo(
    () => providers.find((p) => p.id === selectedId) ?? null,
    [providers, selectedId]
  );
  const selectedCoords = useMemo(
    () => (selected ? providerCoords(selected.id, selected.district) : null),
    [selected]
  );

  /* GeoJSON sumber clustering — dibangun ulang hanya saat daftar berubah. */
  const geojson = useMemo(
    () => ({
      type: "FeatureCollection" as const,
      features: providers.map((p) => {
        const c = providerCoords(p.id, p.district);
        return {
          type: "Feature" as const,
          geometry: { type: "Point" as const, coordinates: [c.lng, c.lat] },
          properties: { id: p.id, slug: slugForCat(p.cat) },
        };
      }),
    }),
    [providers]
  );
  const geojsonRef = useRef(geojson);
  useEffect(() => {
    geojsonRef.current = geojson;
  }, [geojson]);

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

  /* Data filter berubah (kategori/kecamatan/cari) → perbarui sumber cluster.
     setData hanya mengganti GeoJSON — tidak membuat ulang layer. */
  useEffect(() => {
    if (!mapReady) return;
    const src = mapRef.current?.getMap().getSource("jd-providers") as
      | GeoJSONSource
      | undefined;
    if (src) src.setData(geojson);
  }, [geojson, mapReady]);

  /* ------------------------- Setup sekali saat load ------------------------- */

  const handleLoad = useCallback(() => {
    const map = mapRef.current?.getMap();
    if (!map) return;

    try {
      map.setConfigProperty("basemap", "lightPreset", preset);
    } catch { /* noop */ }

    /* [1] GEDUNG 3D — layer sendiri, minzoom 15 KETAT (hemat GPU/baterai
       saat zoom kota/wilayah). Style Standard TIDAK mengekspos source
       "composite" di runtime (sistem style-fragments), jadi kita pasang
       source vector sendiri; tile streets hanya diunduh di z>=15 karena
       satu-satunya pemakainya adalah layer minzoom-15 ini. */
    try {
      if (!map.getSource("jd-buildings")) {
        map.addSource("jd-buildings", {
          type: "vector",
          url: "mapbox://mapbox.mapbox-streets-v8",
        });
      }
      map.addLayer({
        id: "jd-3d-buildings",
        type: "fill-extrusion",
        source: "jd-buildings",
        "source-layer": "building",
        minzoom: BUILDING_MINZOOM,
        paint: {
          "fill-extrusion-color": [
            "interpolate", ["linear"],
            ["coalesce", ["get", "render_height"], ["get", "height"], 12],
            0, "#0d5c44", 60, "#127054", 160, "#1c8a69",
          ],
          "fill-extrusion-height": [
            "interpolate", ["linear"], ["zoom"],
            BUILDING_MINZOOM, 0, BUILDING_MINZOOM + 1,
            ["coalesce", ["get", "render_height"], ["get", "height"], 10],
          ],
          "fill-extrusion-base": ["coalesce", ["get", "render_min_height"], ["get", "min_height"], 0],
          "fill-extrusion-opacity": 0.93,
          "fill-extrusion-vertical-gradient": true,
        },
      });
      /* 3D bawaan Standard (gedung + landmark) dimatikan — geometri 3D
         tidak digambar dobel; layer kita yang mengambil alih di >= z15.
         HANYA setelah layer sendiri pasti terpasang. */
      try {
        map.setConfigProperty("basemap", "show3dObjects", false);
      } catch { /* properti tak tersedia — biarkan */ }
    } catch { /* tileset tak terjangkau → pakai 3D bawaan style */ }

    /* [2] Sumber GeoJSON ber-clustering (supercluster internal mapbox-gl). */
    map.addSource("jd-providers", {
      type: "geojson",
      data: geojsonRef.current,
      cluster: true,
      clusterRadius: 56,
      clusterMaxZoom: 14,
      clusterMinPoints: 2,
    });

    /* [3] Klaster: lingkaran kaca-emerald berangka — layer GPU statis. */
    map.addLayer({
      id: "jd-clusters",
      type: "circle",
      source: "jd-providers",
      filter: ["has", "point_count"],
      paint: {
        "circle-color": [
          "step", ["get", "point_count"],
          "rgba(6, 78, 59, 0.55)", 10, "rgba(6, 78, 59, 0.68)", 40, "rgba(6, 78, 59, 0.82)",
        ],
        "circle-radius": [
          "step", ["get", "point_count"], 17, 10, 23, 40, 30,
        ],
        "circle-stroke-width": 2,
        "circle-stroke-color": "rgba(255, 255, 255, 0.85)",
        "circle-stroke-opacity": 0.9,
      },
    });
    map.addLayer({
      id: "jd-cluster-count",
      type: "symbol",
      source: "jd-providers",
      filter: ["has", "point_count"],
      layout: {
        "text-field": ["get", "point_count_abbreviated"],
        "text-font": ["DIN Pro Bold", "Noto Sans Bold", "Arial Unicode MS Bold"],
        "text-size": 13,
      },
      paint: { "text-color": "#FFFBEF" },
    });

    /* [4] Ikon pin dirasterisasi sekali, lalu symbol layer pin (GPU).
       Ekspresi icon-image memilih tekstur normal/aktif per kategori. */
    void addPinImages(map).then(() => {
      if (!mapRef.current) return; // komponen sudah unmount
      map.addLayer({
        id: "jd-pins",
        type: "symbol",
        source: "jd-providers",
        filter: ["!", ["has", "point_count"]],
        layout: {
          "icon-image": [
            "case",
            ["==", ["get", "id"], ["literal", selectedIdRef.current ?? ""]],
            ["concat", "pinA-", ["get", "slug"]],
            ["concat", "pin-", ["get", "slug"]],
          ],
          "icon-size": 1,
          "icon-allow-overlap": true,
          "icon-ignore-placement": true,
        },
      });
      setMapReady(true);
    });

    /* [5] Interaksi — didaftarkan SEKALI; lewat latest-ref agar selalu
       memanggil callback terbaru. Tipe fitur mapbox v3 longgar → cast
       lokal, nilai properti divalidasi manual (aman, bukan any-leak). */
    map.on("click", "jd-clusters", (e) => {
      const f = map.queryRenderedFeatures(e.point, {
        layers: ["jd-clusters"],
      })[0] as unknown as { properties?: Record<string, unknown> | null; geometry: { coordinates: [number, number] } } | undefined;
      const clusterId = f?.properties?.cluster_id;
      if (!f || typeof clusterId !== "number") return;
      const src = map.getSource("jd-providers") as GeoJSONSource | undefined;
      if (!src) return;
      const center = f.geometry.coordinates;
      const recenter = (zoom: number) =>
        map.easeTo({ center, zoom, duration: 750, essential: true });
      /* v3: versi promise TANPA callback; bentuk callback tetap didukung
         dan itulah yang dijanjikan tipe — pakai keduanya dengan aman. */
      const maybe = src.getClusterExpansionZoom(clusterId, (err, z) => {
        if (err || typeof z !== "number") recenter(BUILDING_MINZOOM + 0.5);
        else recenter(Math.min(z + 0.3, 16.5));
      }) as unknown;
      if (maybe && typeof (maybe as Promise<number>).then === "function") {
        (maybe as Promise<number>)
          .then((z) => recenter(Math.min(z + 0.3, 16.5)))
          .catch(() => recenter(BUILDING_MINZOOM + 0.5));
      }
    });

    map.on("click", "jd-pins", (e) => {
      const props = (e.features?.[0] as
        | { properties?: { id?: unknown } | null }
        | undefined)?.properties;
      const id = props?.id;
      if (typeof id === "string" && id) onSelectRef.current(id);
    });

    /* Kursor pointer di atas klaster/pin (desktop) — tanpa animasi hover. */
    for (const layer of ["jd-clusters", "jd-pins"]) {
      map.on("mouseenter", layer, () => { map.getCanvas().style.cursor = "pointer"; });
      map.on("mouseleave", layer, () => { map.getCanvas().style.cursor = ""; });
    }

    /* Dolly intro: dari pandangan luas menyelam ke kota — rasa "tur museum".
       Hanya sekali, dilewati bila pengguna memilih reduce-motion. */
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

  /* Pin terpilih → tekstur varian AMBER (pinA-) via layout expression.
     setLayoutProperty murah: hanya evaluasi ulang ekspresi, tanpa refetch. */
  useEffect(() => {
    if (!mapReady) return;
    const map = mapRef.current?.getMap();
    if (!map || !map.getLayer("jd-pins")) return;
    map.setLayoutProperty("jd-pins", "icon-image", [
      "case",
      ["==", ["get", "id"], ["literal", selectedId ?? ""]],
      ["concat", "pinA-", ["get", "slug"]],
      ["concat", "pin-", ["get", "slug"]],
    ]);
  }, [selectedId, mapReady]);

  return (
    <Map
      ref={mapRef}
      mapboxAccessToken={mapboxToken ?? process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
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
