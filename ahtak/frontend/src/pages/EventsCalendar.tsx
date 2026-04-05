import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';

import { events as eventsApi, type Event } from '../lib/api';

type CalendarEvent = {
  id: string;
  title: string;
  start: string;
  end?: string;
  url?: string;
  classNames?: string[];
  extendedProps?: { isCpd?: boolean; cpdPoints?: number };
};

function asDate(d: string | undefined) {
  if (!d) return null;
  const dt = new Date(d);
  return isNaN(dt.getTime()) ? null : dt;
}

export default function EventsCalendar() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCpdOnly, setShowCpdOnly] = useState(false);

  useEffect(() => {
    eventsApi
      .list({ status: 'published' })
      .then((d) => setEvents((d as { results?: Event[] }).results ?? []))
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  }, []);

  const upcomingCount = useMemo(() => {
    const now = new Date();
    return events.filter((e) => {
      const start = asDate(e.start_date);
      return start ? start >= now : false;
    }).length;
  }, [events]);

  const calendarEvents: CalendarEvent[] = useMemo(() => {
    const now = new Date();
    return events
      .filter((e) => {
        const start = asDate(e.start_date);
        if (!start) return false;
        if (showCpdOnly && (e.cpd_points ?? 0) <= 0) return false;
        // show upcoming + recent past (last 30 days) so calendar isn't empty
        const days = (start.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
        return days >= -30;
      })
      .map((e) => {
        const isCpd = (e.cpd_points ?? 0) > 0;
        return {
          id: String(e.id),
          title: isCpd ? `${e.title} (CPD)` : e.title,
          start: e.start_date,
          end: e.end_date || undefined,
          url: `/events/${e.id}`,
          classNames: [isCpd ? 'ahtak-event-cpd' : 'ahtak-event-standard'],
          extendedProps: { isCpd, cpdPoints: e.cpd_points ?? 0 },
        };
      });
  }, [events, showCpdOnly]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Events Calendar</h1>
          <p className="mt-2 text-slate-600">
            See all upcoming events in a calendar view. Click an event to view details.
          </p>
          <p className="mt-1 text-sm text-slate-500">{upcomingCount} upcoming event(s)</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 shadow-sm">
            <input
              type="checkbox"
              checked={showCpdOnly}
              onChange={(e) => setShowCpdOnly(e.target.checked)}
              className="h-4 w-4 accent-emerald-600"
            />
            CPD only
          </label>
          <Link
            to="/events"
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:shadow"
          >
            Back to events →
          </Link>
        </div>
      </div>

      <div className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <div className="p-10 text-center text-slate-500">Loading calendar…</div>
        ) : (
          <div className="p-3 sm:p-6">
            <FullCalendar
              plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
              initialView="dayGridMonth"
              headerToolbar={{
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,listMonth',
              }}
              height="auto"
              nowIndicator
              weekends
              events={calendarEvents}
              eventClick={(info) => {
                // Use client-side navigation by preventing FullCalendar default.
                info.jsEvent.preventDefault();
                const url = info.event.url;
                if (url) window.location.assign(url);
              }}
              eventDidMount={(arg) => {
                const isCpd = Boolean(arg.event.extendedProps?.isCpd);
                if (isCpd) {
                  arg.el.setAttribute(
                    'title',
                    `CPD event (${arg.event.extendedProps?.cpdPoints ?? 0} points)`
                  );
                }
              }}
            />
          </div>
        )}
      </div>

      <style>{`
        /* FullCalendar minimal styling to match site */
        .fc {
          --fc-border-color: rgb(226 232 240);
          --fc-today-bg-color: rgba(16,185,129,0.08);
          --fc-neutral-bg-color: rgb(248 250 252);
          --fc-page-bg-color: transparent;
          --fc-button-bg-color: rgb(15 23 42);
          --fc-button-border-color: rgb(15 23 42);
          --fc-button-hover-bg-color: rgb(30 41 59);
          --fc-button-hover-border-color: rgb(30 41 59);
          --fc-button-active-bg-color: rgb(22 101 52);
          --fc-button-active-border-color: rgb(22 101 52);
        }
        .fc .fc-toolbar-title {
          font-size: 1.1rem;
          font-weight: 700;
          color: rgb(15 23 42);
        }
        .ahtak-event-standard {
          background: rgba(15, 23, 42, 0.92) !important;
          border: rgba(15, 23, 42, 0.92) !important;
        }
        .ahtak-event-cpd {
          background: rgba(16, 185, 129, 0.92) !important;
          border: rgba(16, 185, 129, 0.92) !important;
          color: rgb(6 78 59) !important;
        }
        .fc .fc-event {
          border-radius: 8px;
          padding: 2px 6px;
          font-weight: 600;
        }
      `}</style>
    </div>
  );
}

