import React, { useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Filter,
  MapPin,
  Calendar,
  Tag,
  Plus,
  X,
  User,
  Pencil,
  Trash2,
  Upload,
  Download,
} from "lucide-react";

const START_YEAR = 1850;
const CURRENT_YEAR = new Date().getFullYear();
const STORAGE_KEY = "timeline-items-v1";

/* ---------------------- helpers ---------------------- */
function getYear(dateStr) {
  const y = parseInt(dateStr?.slice(0, 4), 10);
  return Number.isFinite(y) ? y : START_YEAR;
}

function formatDate(d) {
  try {
    if (/^\d{4}$/.test(d)) return d;
    const dt = new Date(d);
    return dt.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: dt.getUTCDate() === 1 ? undefined : "2-digit",
    });
  } catch {
    return d;
  }
}

function youtubeEmbed(url) {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu")) {
      const id = u.searchParams.get("v") || u.pathname.replace("/", "");
      return `https://www.youtube.com/embed/${id}`;
    }
    return url;
  } catch {
    return url;
  }
}

function vimeoEmbed(url) {
  try {
    const u = new URL(url);
    if (u.hostname.includes("vimeo")) {
      const id = u.pathname.split("/").filter(Boolean).pop();
      return `https://player.vimeo.com/video/${id}`;
    }
    return url;
  } catch {
    return url;
  }
}

/* ---------------------- data load/save ---------------------- */
function getInitialItems() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/* ---------------------- views ---------------------- */
const VIEW = { DATE: "Date", PLACE: "Place", EVENT: "Event", PERSON: "Person" };

/* ---------------------- media ---------------------- */
function MediaRenderer({ media }) {
  if (!media?.length) return null;
  return (
    <div className="mt-4 grid grid-cols-1 gap-4">
      {media.map((m, idx) => {
        if (m.type === "image") {
          return (
            <figure key={idx} className="rounded-2xl overflow-hidden shadow">
              <img
                src={m.url}
                alt={m.caption || "media"}
                className="w-full h-auto object-cover"
              />
              {m.caption ? (
                <figcaption className="text-sm text-gray-500 p-2">
                  {m.caption}
                </figcaption>
              ) : null}
            </figure>
          );
        }
        if (m.type === "video") {
          const isYouTube = /youtu/.test(m.url);
          const isVimeo = /vimeo/.test(m.url);
          const src = isYouTube ? youtubeEmbed(m.url) : isVimeo ? vimeoEmbed(m.url) : m.url;
          const isEmbeddable = isYouTube || isVimeo;
          return (
            <div key={idx} className="rounded-2xl overflow-hidden shadow">
              {isEmbeddable ? (
                <div className="aspect-video w-full">
                  <iframe
                    className="w-full h-full"
                    src={src}
                    title="Embedded video"
                    loading="lazy"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              ) : (
                <video controls className="w-full">
                  <source src={m.url} />
                  Your browser does not support the video tag.
                </video>
              )}
              {m.caption ? (
                <div className="text-sm text-gray-500 p-2">{m.caption}</div>
              ) : null}
            </div>
          );
        }
        return null;
      })}
    </div>
  );
}

/* ---------------------- filters ---------------------- */
function useFilters(items) {
  const [query, setQuery] = useState("");
  const [view, setView] = useState(VIEW.DATE);
  const [yearFrom, setYearFrom] = useState(START_YEAR);
  const [yearTo, setYearTo] = useState(CURRENT_YEAR);
  const [place, setPlace] = useState("All");
  const [event, setEvent] = useState("All");
  const [person, setPerson] = useState("All");

  const places = useMemo(
    () => ["All", ...Array.from(new Set(items.map((i) => i.place).filter(Boolean))).sort((a, b) => a.localeCompare(b))],
    [items]
  );
  const events = useMemo(
    () => ["All", ...Array.from(new Set(items.map((i) => i.event).filter(Boolean))).sort((a, b) => a.localeCompare(b))],
    [items]
  );
  const persons = useMemo(
    () => ["All", ...Array.from(new Set(items.map((i) => i.person).filter(Boolean))).sort((a, b) => a.localeCompare(b))],
    [items]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let out = items.filter((i) => {
      const y = getYear(i.date);
      const inYear = y >= yearFrom && y <= yearTo;
      const inPlace = place === "All" || i.place === place;
      const inEvent = event === "All" || i.event === event;
      const inPerson = person === "All" || i.person === person;
      const inQuery =
        !q ||
        i.title?.toLowerCase().includes(q) ||
        i.description?.toLowerCase().includes(q) ||
        i.place?.toLowerCase().includes(q) ||
        i.event?.toLowerCase().includes(q) ||
        i.person?.toLowerCase().includes(q) ||
        i.date?.includes(q);
      return inYear && inPlace && inEvent && inPerson && inQuery;
    });

    if (view === VIEW.DATE) {
      out.sort((a, b) => new Date(a.date) - new Date(b.date));
    } else if (view === VIEW.PLACE) {
      out.sort((a, b) => a.place.localeCompare(b.place) || new Date(a.date) - new Date(b.date));
    } else if (view === VIEW.EVENT) {
      out.sort((a, b) => a.event.localeCompare(b.event) || new Date(a.date) - new Date(b.date));
    } else if (view === VIEW.PERSON) {
      out.sort((a, b) => (a.person || "").localeCompare(b.person || "") || new Date(a.date) - new Date(b.date));
    }
    return out;
  }, [items, query, yearFrom, yearTo, place, event, person, view]);

  return {
    view, setView,
    query, setQuery,
    yearFrom, setYearFrom,
    yearTo, setYearTo,
    place, setPlace, places,
    event, setEvent, events,
    person, setPerson, persons,
    filtered,
  };
}

/* ---------------------- right rail ---------------------- */
function RightRail({
  items, view, setView,
  query, setQuery,
  yearFrom, setYearFrom,
  yearTo, setYearTo,
  place, setPlace, places,
  event, setEvent, events,
  person, setPerson, persons,
  selectedId, onSelect
}) {
  return (
    <aside className="sticky top-0 h-screen overflow-y-auto border-l border-gray-200 bg-white/70 backdrop-blur p-4">
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-1 text-sm font-medium">
          <Filter className="w-4 h-4" /> Filters
        </div>
        <div className="inline-flex rounded-2xl border bg-white shadow-sm overflow-hidden">
          {Object.values(VIEW).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-3 py-1.5 text-sm flex items-center gap-1 ${view === v ? "bg-gray-900 text-white" : "hover:bg-gray-100"}`}
              title={`View by ${v}`}
            >
              {v === "Date" && <Calendar className="w-4 h-4" />}
              {v === "Place" && <MapPin className="w-4 h-4" />}
              {v === "Event" && <Tag className="w-4 h-4" />}
              {v === "Person" && <User className="w-4 h-4" />}
              {v}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search title, place, event, person…"
          className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gray-300"
        />

        <div className="grid grid-cols-2 gap-2 text-sm">
          <label className="flex flex-col gap-1">
            <span className="text-gray-500">From</span>
            <input
              type="number" min={START_YEAR} max={CURRENT_YEAR}
              value={yearFrom} onChange={(e) => setYearFrom(Number(e.target.value))}
              className="rounded-xl border px-2 py-1.5"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-gray-500">To</span>
            <input
              type="number" min={START_YEAR} max={CURRENT_YEAR}
              value={yearTo} onChange={(e) => setYearTo(Number(e.target.value))}
              className="rounded-xl border px-2 py-1.5"
            />
          </label>
        </div>

        <label className="flex flex-col gap-1">
          <span className="text-gray-500">Place</span>
          <select
            value={place}
            onChange={(e) => setPlace(e.target.value)}
            className="w-full rounded-xl border px-3 py-2 text-sm"
          >
            {places.map((p) => (<option key={p} value={p}>{p}</option>))}
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-gray-500">Event</span>
          <select
            value={event}
            onChange={(e) => setEvent(e.target.value)}
            className="w-full rounded-xl border px-3 py-2 text-sm"
          >
            {events.map((t) => (<option key={t} value={t}>{t}</option>))}
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-gray-500">Person</span>
          <select
            value={person}
            onChange={(e) => setPerson(e.target.value)}
            className="w-full rounded-xl border px-3 py-2 text-sm"
          >
            {persons.map((t) => (<option key={t} value={t}>{t}</option>))}
          </select>
        </label>
      </div>

      <div className="mt-6">
        <div className="text-xs uppercase tracking-wide text-gray-400 mb-2">Timeline</div>
        <ol className="relative border-s-2 border-gray-200 ml-3">
          <AnimatePresence initial={false}>
            {items.map((item) => {
              const active = item.id === selectedId;
              return (
                <motion.li
                  key={item.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.15 }}
                  className="mb-5 ms-4"
                >
                  <span className={`absolute -start-1.5 flex h-3 w-3 rounded-full ${active ? "bg-gray-900" : "bg-gray-300"} border border-white`}></span>
                  <button
                    onClick={() => onSelect(item.id)}
                    className={`text-left block w-full rounded-xl px-3 py-2 ${active ? "bg-gray-900 text-white" : "hover:bg-gray-50"}`}
                    title={item.title}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-sm font-semibold truncate">{item.title}</div>
                      <div className="text-xs whitespace-nowrap opacity-70">{getYear(item.date)}</div>
                    </div>
                    <div className="text-xs opacity-70 truncate">
                      {item.place} • {item.event}{item.person ? ` • ${item.person}` : ""}
                    </div>
                  </button>
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ol>
      </div>
    </aside>
  );
}

/* ---------------------- detail + quick add/edit ---------------------- */
function Detail({ item, onPrev, onNext, showAdd, setShowAdd, onAdd, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false);

  // Empty state still shows "Add entry"
  if (!item) {
    return (
      <div className="p-6">
        <div className="flex items-start justify-between gap-2">
          <p className="text-gray-500">Use <b>Add entry</b> to add your first item.</p>
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="inline-flex items-center gap-1 rounded-xl border px-3 py-2 text-sm hover:bg-gray-50"
          >
            {showAdd ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />} {showAdd ? "Close" : "Add entry"}
          </button>
        </div>

        <AnimatePresence>
          {showAdd && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="mt-6 p-4 rounded-2xl border bg-white shadow-sm"
            >
              <h2 className="text-lg font-semibold mb-3">Quick add your first entry</h2>
              <QuickAdd onAdd={onAdd} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  if (editing) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Edit entry</h2>
          <button
            onClick={() => setEditing(false)}
            className="inline-flex items-center gap-1 rounded-xl border px-3 py-2 text-sm hover:bg-gray-50"
          >
            <X className="w-4 h-4" /> Cancel
          </button>
        </div>
        <EditForm
          item={item}
          onCancel={() => setEditing(false)}
          onSave={(updated) => { onUpdate(updated); setEditing(false); }}
        />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-sm text-gray-500">
            {formatDate(item.date)} • {item.place} • {item.event}{item.person ? ` • ${item.person}` : ""}
          </div>
          <h1 className="text-2xl font-bold mt-1">{item.title}</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="inline-flex items-center gap-1 rounded-xl border px-3 py-2 text-sm hover:bg-gray-50"
            title="Add entry"
          >
            <Plus className="w-4 h-4" /> Add entry
          </button>
          <button
            onClick={() => setEditing(true)}
            className="inline-flex items-center gap-1 rounded-xl border px-3 py-2 text-sm hover:bg-gray-50"
            title="Edit"
          >
            <Pencil className="w-4 h-4" /> Edit
          </button>
          <button
            onClick={() => {
              if (confirm("Delete this entry?")) onDelete(item.id);
            }}
            className="inline-flex items-center gap-1 rounded-xl border px-3 py-2 text-sm hover:bg-red-50 text-red-600 border-red-300"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" /> Delete
          </button>
          <div className="inline-flex rounded-xl overflow-hidden border">
            <button onClick={onPrev} className="px-3 py-2 hover:bg-gray-50" title="Previous">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button onClick={onNext} className="px-3 py-2 hover:bg-gray-50" title="Next">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <p className="mt-4 leading-7 text-gray-800">{item.description}</p>
      <MediaRenderer media={item.media} />

      <AnimatePresence>
        {showAdd && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="mt-8 p-4 rounded-2xl border bg-white shadow-sm"
          >
            <h2 className="text-lg font-semibold mb-3">Quick add a new entry</h2>
            <QuickAdd onAdd={onAdd} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function QuickAdd({ onAdd }) {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("1900-01-01");
  const [place, setPlace] = useState("");
  const [event, setEvent] = useState("");
  const [person, setPerson] = useState("");
  const [description, setDescription] = useState("");

  // image via URL or upload
  const [imageUrl, setImageUrl] = useState("");
  const [imageData, setImageData] = useState(""); // data URL from file
  const [videoUrl, setVideoUrl] = useState("");

  function onPickImage(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImageData(String(reader.result));
    reader.readAsDataURL(file);
  }

  function submit(e) {
    e.preventDefault();
    const id = `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}-${Date.now()}`;

    const media = [];
    if (imageData) media.push({ type: "image", url: imageData });
    else if (imageUrl) media.push({ type: "image", url: imageUrl });
    if (videoUrl) media.push({ type: "video", url: videoUrl });

    onAdd({ id, title, date, place, event, person, description, media });

    // reset
    setTitle(""); setDate("1900-01-01");
    setPlace(""); setEvent(""); setPerson("");
    setDescription(""); setImageUrl(""); setImageData(""); setVideoUrl("");
    const fileInput = document.getElementById("image-file-input");
    if (fileInput) fileInput.value = "";
  }

  return (
    <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
      <label className="flex flex-col gap-1">
        <span className="text-gray-500">Title</span>
        <input value={title} onChange={(e) => setTitle(e.target.value)} required className="rounded-xl border px-3 py-2" />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-gray-500">Date</span>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required className="rounded-xl border px-3 py-2" />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-gray-500">Place</span>
        <input value={place} onChange={(e) => setPlace(e.target.value)} required className="rounded-xl border px-3 py-2" />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-gray-500">Event (category)</span>
        <input value={event} onChange={(e) => setEvent(e.target.value)} required className="rounded-xl border px-3 py-2" />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-gray-500">Person</span>
        <input value={person} onChange={(e) => setPerson(e.target.value)} className="rounded-xl border px-3 py-2" placeholder="e.g., Juan Perón" />
      </label>
      <label className="flex flex-col gap-1 md:col-span-2">
        <span className="text-gray-500">Description</span>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} className="rounded-xl border px-3 py-2" />
      </label>

      {/* Image by URL */}
      <label className="flex flex-col gap-1">
        <span className="text-gray-500">Image URL (optional)</span>
        <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} className="rounded-xl border px-3 py-2" placeholder="https://…" />
        <span className="text-xs text-gray-400 mt-1">Or upload a file →</span>
      </label>

      {/* Image by upload */}
      <label className="flex flex-col gap-1">
        <span className="text-gray-500">Upload image (optional)</span>
        <input id="image-file-input" type="file" accept="image/*" onChange={onPickImage} className="rounded-xl border px-3 py-2" />
        {imageData && <span className="text-xs text-gray-500">✓ Image attached</span>}
      </label>

      {/* Video (URL) */}
      <label className="flex flex-col gap-1 md:col-span-2">
        <span className="text-gray-500">Video URL (optional)</span>
        <input value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} className="rounded-xl border px-3 py-2" placeholder="YouTube/Vimeo/MP4" />
      </label>

      <div className="md:col-span-2 flex justify-end">
        <button type="submit" className="rounded-xl bg-gray-900 text-white px-4 py-2 hover:bg-black">Add</button>
      </div>
    </form>
  );
}

function EditForm({ item, onSave, onCancel }) {
  const existingImage = item.media?.find((m) => m.type === "image") || null;
  const existingVideo = item.media?.find((m) => m.type === "video") || null;

  const [title, setTitle] = useState(item.title);
  const [date, setDate] = useState(item.date);
  const [place, setPlace] = useState(item.place || "");
  const [event, setEvent] = useState(item.event || "");
  const [person, setPerson] = useState(item.person || "");
  const [description, setDescription] = useState(item.description || "");

  const [imageUrl, setImageUrl] = useState(
    existingImage && !String(existingImage.url).startsWith("data:") ? existingImage.url : ""
  );
  const [imageData, setImageData] = useState(""); // new data URL from file
  const [keepExistingImage, setKeepExistingImage] = useState(!!existingImage);

  const [videoUrl, setVideoUrl] = useState(existingVideo?.url || "");

  function onPickImage(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setImageData(String(reader.result));
      setKeepExistingImage(false);
    };
    reader.readAsDataURL(file);
  }

  function submit(e) {
    e.preventDefault();
    const media = [];

    if (imageData) {
      media.push({ type: "image", url: imageData });
    } else if (imageUrl) {
      media.push({ type: "image", url: imageUrl });
    } else if (keepExistingImage && existingImage) {
      media.push(existingImage);
    }

    if (videoUrl) media.push({ type: "video", url: videoUrl });

    onSave({
      ...item,
      title,
      date,
      place,
      event,
      person,
      description,
      media,
    });
  }

  return (
    <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
      <label className="flex flex-col gap-1">
        <span className="text-gray-500">Title</span>
        <input value={title} onChange={(e) => setTitle(e.target.value)} required className="rounded-xl border px-3 py-2" />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-gray-500">Date</span>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required className="rounded-xl border px-3 py-2" />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-gray-500">Place</span>
        <input value={place} onChange={(e) => setPlace(e.target.value)} required className="rounded-xl border px-3 py-2" />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-gray-500">Event (category)</span>
        <input value={event} onChange={(e) => setEvent(e.target.value)} required className="rounded-xl border px-3 py-2" />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-gray-500">Person</span>
        <input value={person} onChange={(e) => setPerson(e.target.value)} className="rounded-xl border px-3 py-2" />
      </label>
      <label className="flex flex-col gap-1 md:col-span-2">
        <span className="text-gray-500">Description</span>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} className="rounded-xl border px-3 py-2" />
      </label>

      {/* Image by URL */}
      <label className="flex flex-col gap-1">
        <span className="text-gray-500">Image URL</span>
        <input
          value={imageUrl}
          onChange={(e) => {
            setImageUrl(e.target.value);
            setKeepExistingImage(false);
          }}
          className="rounded-xl border px-3 py-2"
          placeholder="https://…"
        />
        {existingImage && (
          <label className="mt-1 inline-flex items-center gap-2 text-xs text-gray-600">
            <input
              type="checkbox"
              checked={keepExistingImage && !imageData && !imageUrl}
              onChange={(e) => setKeepExistingImage(e.target.checked)}
            />
            Keep current image (if no new file/URL)
          </label>
        )}
      </label>

      {/* Image upload */}
      <label className="flex flex-col gap-1">
        <span className="text-gray-500">Upload image</span>
        <input
          id="edit-image-file-input"
          type="file"
          accept="image/*"
          onChange={onPickImage}
          className="rounded-xl border px-3 py-2"
        />
        {(imageData || (keepExistingImage && existingImage)) && (
          <span className="text-xs text-gray-500">✓ Image will be saved</span>
        )}
      </label>

      {/* Video URL */}
      <label className="flex flex-col gap-1 md:col-span-2">
        <span className="text-gray-500">Video URL</span>
        <input
          value={videoUrl}
          onChange={(e) => setVideoUrl(e.target.value)}
          className="rounded-xl border px-3 py-2"
          placeholder="YouTube/Vimeo/MP4"
        />
      </label>

      <div className="md:col-span-2 flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="rounded-xl border px-4 py-2 hover:bg-gray-50">
          Cancel
        </button>
        <button type="submit" className="rounded-xl bg-gray-900 text-white px-4 py-2 hover:bg-black">
          Save
        </button>
      </div>
    </form>
  );
}

/* ---------------------- app ---------------------- */
export default function TimelineApp() {
  const [items, setItems] = useState(getInitialItems());

  // persist to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {}
  }, [items]);

  const {
    view, setView,
    query, setQuery,
    yearFrom, setYearFrom,
    yearTo, setYearTo,
    place, setPlace, places,
    event, setEvent, events,
    person, setPerson, persons,
    filtered,
  } = useFilters(items);

  const [selectedId, setSelectedId] = useState(null);
  const selectedIndex = useMemo(
    () => filtered.findIndex((i) => i.id === selectedId),
    [filtered, selectedId]
  );
  const selected = filtered[selectedIndex] || filtered[0] || null;

  useEffect(() => {
    if (!selectedId && filtered[0]) setSelectedId(filtered[0].id);
  }, [filtered, selectedId]);

  function handleSelect(id) {
    setSelectedId(id);
  }
  function handlePrev() {
    if (!filtered.length) return;
    const idx = selectedIndex <= 0 ? filtered.length - 1 : selectedIndex - 1;
    setSelectedId(filtered[idx].id);
  }
  function handleNext() {
    if (!filtered.length) return;
    const idx = selectedIndex >= filtered.length - 1 ? 0 : selectedIndex + 1;
    setSelectedId(filtered[idx].id);
  }

  const [showAdd, setShowAdd] = useState(false);
  function handleAdd(newItem) {
    setItems((prev) => [...prev, newItem]);
    setShowAdd(false);
    setSelectedId(newItem.id);
  }

  function handleUpdate(updated) {
    setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
    setSelectedId(updated.id);
  }

  function handleDelete(id) {
    setItems((prev) => prev.filter((i) => i.id !== id));
    setSelectedId(null);
  }

  /* ---------- export / import ---------- */

  function exportJSON() {
    try {
      const data = JSON.stringify(items, null, 2);
      const blob = new Blob([data], { type: "application/json" });
      const ts = new Date();
      const yyyy = ts.getFullYear();
      const mm = String(ts.getMonth() + 1).padStart(2, "0");
      const dd = String(ts.getDate()).padStart(2, "0");
      const hh = String(ts.getHours()).padStart(2, "0");
      const mi = String(ts.getMinutes()).padStart(2, "0");
      const ss = String(ts.getSeconds()).padStart(2, "0");
      const filename = `timeline-${yyyy}${mm}${dd}-${hh}${mi}${ss}.json`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert("Export failed: " + e?.message || e);
    }
  }

  function coerceItem(raw) {
    const safe = typeof raw === "object" && raw ? { ...raw } : {};
    safe.title = String(safe.title ?? "").trim();
    safe.date = String(safe.date ?? "").trim();
    safe.place = String(safe.place ?? "");
    safe.event = String(safe.event ?? "");
    safe.person = String(safe.person ?? "");
    safe.description = String(safe.description ?? "");
    // id
    if (!safe.id) {
      const slug = (safe.title || "item")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
      safe.id = `${slug}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    } else {
      safe.id = String(safe.id);
    }
    // media
    const media = Array.isArray(safe.media) ? safe.media : [];
    safe.media = media
      .map((m) => ({
        type: m?.type === "video" ? "video" : "image",
        url: String(m?.url ?? ""),
        caption: m?.caption ? String(m.caption) : undefined,
      }))
      .filter((m) => !!m.url);
    return safe;
  }

  function importFromText(jsonText, mode = "merge") {
    const parsed = JSON.parse(jsonText);
    if (!Array.isArray(parsed)) throw new Error("File must contain a JSON array");
    const incoming = parsed.map(coerceItem);

    if (mode === "replace") {
      setItems(incoming);
      setSelectedId(incoming[0]?.id ?? null);
      return incoming.length;
    } else {
      // merge by id (file wins)
      setItems((prev) => {
        const map = new Map(prev.map((i) => [i.id, i]));
        for (const it of incoming) map.set(it.id, it);
        const merged = Array.from(map.values());
        // keep current selection if still present
        const still = merged.find((i) => i.id === selectedId);
        if (!still) setSelectedId(merged[0]?.id ?? null);
        return merged;
      });
      return incoming.length;
    }
  }

  function onChooseImportFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const replace = confirm(
      "Import JSON\n\nOK = REPLACE current items with file\nCancel = MERGE with current items"
    );
    const mode = replace ? "replace" : "merge";
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const count = importFromText(String(reader.result), mode);
        alert(`Imported ${count} item(s) (${mode}).`);
      } catch (err) {
        alert("Import failed: " + (err?.message || err));
      } finally {
        e.target.value = "";
      }
    };
    reader.readAsText(file);
  }

  function triggerImport() {
    const input = document.getElementById("import-json-input");
    if (input) input.click();
  }

  const timelineList = filtered;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-xl font-bold">Dynamic Timeline · 1850—{CURRENT_YEAR}</h1>
            <p className="text-sm text-gray-500 truncate">
              Four views: Date · Place · Event · Person. Timeline docked on the right.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="hidden md:inline text-sm text-gray-500">{timelineList.length} items</span>

            <button
              onClick={exportJSON}
              className="inline-flex items-center gap-1 rounded-xl border px-3 py-2 text-sm hover:bg-gray-50"
              title="Export JSON"
            >
              <Download className="w-4 h-4" /> Export
            </button>

            <button
              onClick={triggerImport}
              className="inline-flex items-center gap-1 rounded-xl border px-3 py-2 text-sm hover:bg-gray-50"
              title="Import JSON"
            >
              <Upload className="w-4 h-4" /> Import
            </button>

            {/* hidden file input for import */}
            <input
              id="import-json-input"
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={onChooseImportFile}
            />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-0">
        <section className="md:col-span-8 lg:col-span-9 bg-white">
          <Detail
            item={selected}
            onPrev={handlePrev}
            onNext={handleNext}
            showAdd={showAdd}
            setShowAdd={setShowAdd}
            onAdd={handleAdd}
            onUpdate={handleUpdate}
            onDelete={handleDelete}
          />
        </section>

        <section className="md:col-span-4 lg:col-span-3">
          <RightRail
            items={timelineList}
            view={view}
            setView={setView}
            query={query}
            setQuery={setQuery}
            yearFrom={yearFrom}
            setYearFrom={setYearFrom}
            yearTo={yearTo}
            setYearTo={setYearTo}
            place={place}
            setPlace={setPlace}
            places={places}
            event={event}
            setEvent={setEvent}
            events={events}
            person={person}
            setPerson={setPerson}
            persons={persons}
            selectedId={selected?.id}
            onSelect={handleSelect}
          />
        </section>
      </main>

      <footer className="border-t bg-white/60 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 py-3 text-xs text-gray-500 flex flex-wrap items-center gap-3">
          <span>Add, edit, delete entries. Import/Export JSON to move data between devices. Images can be uploaded or linked.</span>
        </div>
      </footer>
    </div>
  );
}
