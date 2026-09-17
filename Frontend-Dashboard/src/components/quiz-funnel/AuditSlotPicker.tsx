"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import BrandHeader from "@/components/quiz-funnel/BrandHeader";
import {
  bookAuditSlot,
  fetchAuditSlots,
  type AuditBookingSlot,
  type ExistingAuditBooking,
} from "@/lib/quizFunnelApi";
import {
  type CityTimezone,
  formatTimezoneLabel,
  refineCityTimezone,
  resolveDefaultCity,
  searchCities,
} from "@/lib/timezoneApi";

const NEON_ACCENTS = ["cyan", "fuchsia", "amber", "emerald", "violet"] as const;
type NeonAccent = (typeof NEON_ACCENTS)[number];

function accentForIndex(index: number): NeonAccent {
  return NEON_ACCENTS[index % NEON_ACCENTS.length];
}

type DayGroup = {
  key: string;
  label: string;
  weekday: string;
  dateLabel: string;
  slots: AuditBookingSlot[];
  accent: NeonAccent;
};

function formatInTz(
  iso: string,
  options: Intl.DateTimeFormatOptions,
  timeZone: string,
): string {
  try {
    return new Intl.DateTimeFormat("en-GB", { ...options, timeZone }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function dayKey(iso: string, timeZone: string): string {
  return formatInTz(iso, { year: "numeric", month: "2-digit", day: "2-digit" }, timeZone);
}

function groupSlotsByDay(slots: AuditBookingSlot[], userTimeZone: string): DayGroup[] {
  const map = new Map<string, AuditBookingSlot[]>();
  for (const slot of slots) {
    const key = dayKey(slot.start, userTimeZone);
    const list = map.get(key) || [];
    list.push(slot);
    map.set(key, list);
  }
  const groups: DayGroup[] = [];
  let idx = 0;
  for (const [key, daySlots] of map) {
    const sample = daySlots[0]?.start;
    if (!sample) continue;
    groups.push({
      key,
      accent: accentForIndex(idx),
      label: formatInTz(sample, { weekday: "short", day: "numeric", month: "short" }, userTimeZone),
      weekday: formatInTz(sample, { weekday: "long" }, userTimeZone),
      dateLabel: formatInTz(sample, { day: "numeric", month: "long" }, userTimeZone),
      slots: daySlots.slice().sort((a, b) => a.start.localeCompare(b.start)),
    });
    idx += 1;
  }
  return groups.sort((a, b) => a.key.localeCompare(b.key));
}

function formatSlotRange(start: string, end: string, timeZone: string): string {
  const day = formatInTz(start, { weekday: "long", day: "numeric", month: "long" }, timeZone);
  const t0 = formatInTz(start, { hour: "2-digit", minute: "2-digit", hour12: true }, timeZone);
  const t1 = formatInTz(end, { hour: "2-digit", minute: "2-digit", hour12: true }, timeZone);
  return `${day} · ${t0} – ${t1}`;
}

function UserTimeSummary({
  slotStart,
  slotEnd,
  userTimeZone,
  userCityLabel,
}: {
  slotStart: string;
  slotEnd: string;
  userTimeZone: string;
  userCityLabel: string;
}) {
  return (
    <div className="quiz-intake-booking__dual">
      <div className="quiz-intake-booking__dual-row quiz-intake-booking__dual-row--user">
        <p className="quiz-intake-booking__confirm-label">Your time</p>
        <p className="quiz-intake-booking__confirm-when">
          {formatSlotRange(slotStart, slotEnd, userTimeZone)}
        </p>
        <p className="quiz-intake-booking__confirm-tz">
          {userCityLabel || formatTimezoneLabel(userTimeZone)} · 30 minutes
        </p>
      </div>
    </div>
  );
}

function BookingSuccess({
  firstName,
  booking,
  userTimeZone,
  userCityLabel,
}: {
  firstName: string;
  booking: ExistingAuditBooking;
  userTimeZone: string;
  userCityLabel: string;
}) {
  const meet = (booking.meet_link || "").trim();

  return (
    <section className="quiz-intake-card quiz-intake-card--success quiz-intake-booking">
      <BrandHeader
        subtitle={
          firstName ? `${firstName} — your audit is booked.` : "Your audit call is booked."
        }
      />
      <p className="quiz-intake-intro quiz-intake-booking__intro">
        Save this time. Join with the Google Meet link below when it starts.
      </p>
      <div className="quiz-intake-booking__confirm-card quiz-intake-booking__confirm-card--done">
        <UserTimeSummary
          slotStart={booking.slot_start}
          slotEnd={booking.slot_end}
          userTimeZone={userTimeZone}
          userCityLabel={userCityLabel}
        />
      </div>
      {meet ? (
        <a
          className="quiz-intake-submit quiz-intake-booking__meet"
          href={meet}
          target="_blank"
          rel="noopener noreferrer"
        >
          Open Google Meet
        </a>
      ) : (
        <p className="quiz-intake-thanks">
          Your booking is saved. The Meet link will arrive by email / WhatsApp shortly.
        </p>
      )}
    </section>
  );
}

function CityTimezonePicker({
  city,
  onSelect,
}: {
  city: CityTimezone | null;
  onSelect: (next: CityTimezone) => void;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<CityTimezone[]>([]);
  const [searchError, setSearchError] = useState("");
  const debounceRef = useRef<number | undefined>(undefined);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  useEffect(() => {
    window.clearTimeout(debounceRef.current);
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      setSearchError("");
      return;
    }
    debounceRef.current = window.setTimeout(() => {
      void (async () => {
        setSearching(true);
        setSearchError("");
        try {
          const rows = await searchCities(q);
          setResults(rows);
          setOpen(true);
          if (!rows.length) setSearchError("No cities found — try another spelling.");
        } catch (err: unknown) {
          setResults([]);
          setSearchError(err instanceof Error ? err.message : "Search failed.");
        } finally {
          setSearching(false);
        }
      })();
    }, 320);
    return () => window.clearTimeout(debounceRef.current);
  }, [query]);

  return (
    <div
      ref={wrapRef}
      className="quiz-intake-booking__section quiz-intake-field quiz-intake-field--violet quiz-intake-booking__city"
    >
      <span className="quiz-intake-field__num">CITY</span>
      <span className="quiz-intake-field__label">Your city / region</span>
      {city ? (
        <p className="quiz-intake-booking__city-current">
          Showing times for <strong>{city.label}</strong>
        </p>
      ) : null}
      <input
        type="search"
        className="quiz-intake-field__input quiz-intake-booking__city-input"
        placeholder="Search city (e.g. London, Dubai, Karachi)"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => {
          if (results.length) setOpen(true);
        }}
        autoComplete="off"
        aria-label="Search your city"
      />
      {searching ? <p className="quiz-intake-booking__city-hint">Searching…</p> : null}
      {searchError ? <p className="quiz-intake-booking__city-error">{searchError}</p> : null}
      {open && results.length ? (
        <ul className="quiz-intake-booking__city-results" role="listbox">
          {results.map((row) => (
            <li key={row.id}>
              <button
                type="button"
                role="option"
                className="quiz-intake-booking__city-option"
                onClick={() => {
                  void (async () => {
                    const refined = await refineCityTimezone(row);
                    onSelect(refined);
                    setQuery("");
                    setOpen(false);
                    setResults([]);
                  })();
                }}
              >
                <span className="quiz-intake-booking__city-option-name">{row.label}</span>
                <span className="quiz-intake-booking__city-option-tz">
                  {formatTimezoneLabel(row.timezone)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

type Props = {
  intakeRef?: string;
  email?: string;
  firstName?: string;
};

export default function AuditSlotPicker({ intakeRef = "", email = "", firstName = "" }: Props) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [founderTimeZone, setFounderTimeZone] = useState("Asia/Karachi");
  const [userCity, setUserCity] = useState<CityTimezone | null>(null);
  const [cityReady, setCityReady] = useState(false);
  const [slots, setSlots] = useState<AuditBookingSlot[]>([]);
  const [existing, setExisting] = useState<ExistingAuditBooking | null>(null);
  const [selectedDayKey, setSelectedDayKey] = useState("");
  const [selectedSlot, setSelectedSlot] = useState<AuditBookingSlot | null>(null);
  const [booking, setBooking] = useState(false);
  const [bookError, setBookError] = useState("");
  const [confirmed, setConfirmed] = useState<ExistingAuditBooking | null>(null);

  const userTimeZone = userCity?.timezone || "UTC";

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const detected = await resolveDefaultCity();
        if (!cancelled) setUserCity(detected);
      } finally {
        if (!cancelled) setCityReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const loadSlots = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchAuditSlots({ ref: intakeRef, email });
      setFounderTimeZone(data.timezone || "Asia/Karachi");
      if (data.existing_booking?.slot_start) {
        setExisting(data.existing_booking);
        setConfirmed(data.existing_booking);
        setSlots([]);
        return;
      }
      setExisting(null);
      setSlots(data.slots || []);
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not load available times. Please refresh and try again.",
      );
      setSlots([]);
    } finally {
      setLoading(false);
    }
  }, [intakeRef, email]);

  useEffect(() => {
    void loadSlots();
  }, [loadSlots]);

  const dayGroups = useMemo(
    () => groupSlotsByDay(slots, userTimeZone),
    [slots, userTimeZone],
  );

  useEffect(() => {
    if (!dayGroups.length) {
      setSelectedDayKey("");
      return;
    }
    setSelectedDayKey((prev) => {
      if (prev && dayGroups.some((d) => d.key === prev)) return prev;
      return dayGroups[0].key;
    });
  }, [dayGroups]);

  const activeDay = dayGroups.find((d) => d.key === selectedDayKey) || dayGroups[0] || null;

  const handleBook = useCallback(async () => {
    if (!selectedSlot || booking) return;
    setBooking(true);
    setBookError("");
    try {
      const result = await bookAuditSlot({
        ref: intakeRef || undefined,
        email: email || undefined,
        slot_start: selectedSlot.start,
        slot_end: selectedSlot.end,
        user_timezone: userTimeZone,
      });
      if (!result.ok || !result.slot_start || !result.slot_end) {
        throw new Error(result.error || "Booking failed.");
      }
      const saved: ExistingAuditBooking = {
        slot_start: result.slot_start,
        slot_end: result.slot_end,
        timezone: result.timezone || userTimeZone || founderTimeZone,
        meet_link: result.meet_link || "",
        status: "booked",
      };
      setConfirmed(saved);
      setExisting(saved);
    } catch (err: unknown) {
      setBookError(
        err instanceof Error ? err.message : "Could not book that slot. Please try another.",
      );
      void loadSlots();
    } finally {
      setBooking(false);
    }
  }, [selectedSlot, booking, intakeRef, email, userTimeZone, founderTimeZone, loadSlots]);

  if ((confirmed || existing) && cityReady) {
    return (
      <BookingSuccess
        firstName={firstName}
        booking={confirmed || existing!}
        userTimeZone={userTimeZone}
        userCityLabel={userCity?.label || formatTimezoneLabel(userTimeZone)}
      />
    );
  }

  if (loading || !cityReady) {
    return (
      <section className="quiz-intake-card quiz-intake-booking">
        <BrandHeader subtitle="Loading audit times…" />
        <p className="quiz-intake-loading">Finding open slots for you…</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="quiz-intake-card quiz-intake-card--error quiz-intake-booking">
        <BrandHeader subtitle="Could not load times" />
        <p className="quiz-intake-error">{error}</p>
        <button type="button" className="quiz-intake-submit" onClick={() => void loadSlots()}>
          Try again
        </button>
      </section>
    );
  }

  return (
    <section className="quiz-intake-card quiz-intake-booking">
      <BrandHeader
        subtitle={
          firstName
            ? `${firstName} — book your founder audit.`
            : "Book your founder audit call."
        }
      />
      <p className="quiz-intake-intro quiz-intake-booking__intro">
        Pick a 30-minute slot in <strong>your local time</strong>. Times adjust when you change
        city.
      </p>

      <CityTimezonePicker city={userCity} onSelect={setUserCity} />

      {!dayGroups.length ? (
        <div className="quiz-intake-booking__empty quiz-intake-field quiz-intake-field--amber">
          <p className="quiz-intake-booking__empty-title">No open slots right now</p>
          <p className="quiz-intake-booking__empty-body">
            Check back soon, or refresh — new times appear as the calendar frees up.
          </p>
          <button type="button" className="quiz-intake-submit" onClick={() => void loadSlots()}>
            Refresh times
          </button>
        </div>
      ) : (
        <>
          <div className="quiz-intake-booking__section quiz-intake-field quiz-intake-field--cyan">
            <span className="quiz-intake-field__num">DAY</span>
            <span className="quiz-intake-field__label">Choose a day</span>
            <div className="quiz-intake-booking__days" role="listbox" aria-label="Available days">
              {dayGroups.map((day) => {
                const active = day.key === (activeDay?.key || "");
                return (
                  <button
                    key={day.key}
                    type="button"
                    role="option"
                    aria-selected={active}
                    className={`quiz-intake-booking__day quiz-intake-booking__day--${day.accent}${active ? " is-active" : ""}`}
                    onClick={() => {
                      setSelectedDayKey(day.key);
                      setSelectedSlot(null);
                      setBookError("");
                    }}
                  >
                    <span className="quiz-intake-booking__day-week">{day.weekday.slice(0, 3)}</span>
                    <span className="quiz-intake-booking__day-date">{day.dateLabel}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="quiz-intake-booking__section quiz-intake-field quiz-intake-field--fuchsia">
            <span className="quiz-intake-field__num">TIME</span>
            <span className="quiz-intake-field__label">
              {activeDay ? `Times · ${activeDay.weekday}` : "Choose a time"}
            </span>
            <div className="quiz-intake-booking__times" role="listbox" aria-label="Available times">
              {(activeDay?.slots || []).map((slot, slotIndex) => {
                const active = selectedSlot?.start === slot.start;
                const accent = accentForIndex(slotIndex + (activeDay ? dayGroups.indexOf(activeDay) : 0));
                const label = formatInTz(
                  slot.start,
                  { hour: "2-digit", minute: "2-digit", hour12: true },
                  userTimeZone,
                );
                return (
                  <button
                    key={slot.start}
                    type="button"
                    role="option"
                    aria-selected={active}
                    className={`quiz-intake-booking__time quiz-intake-booking__time--${accent}${active ? " is-active" : ""}`}
                    onClick={() => {
                      setSelectedSlot(slot);
                      setBookError("");
                    }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {selectedSlot ? (
            <div className="quiz-intake-booking__confirm-card quiz-intake-field quiz-intake-field--emerald">
              <p className="quiz-intake-booking__confirm-label">Selected</p>
              <UserTimeSummary
                slotStart={selectedSlot.start}
                slotEnd={selectedSlot.end}
                userTimeZone={userTimeZone}
                userCityLabel={userCity?.label || formatTimezoneLabel(userTimeZone)}
              />
            </div>
          ) : null}

          {bookError ? <p className="quiz-intake-submit-error">{bookError}</p> : null}

          <button
            type="button"
            className="quiz-intake-submit"
            disabled={!selectedSlot || booking}
            onClick={() => void handleBook()}
          >
            {booking ? "Booking…" : "Confirm audit call"}
          </button>
        </>
      )}
    </section>
  );
}
