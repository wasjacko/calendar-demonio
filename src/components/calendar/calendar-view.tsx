"use client";

import * as React from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import listPlugin from "@fullcalendar/list";
import multiMonthPlugin from "@fullcalendar/multimonth";
import interactionPlugin from "@fullcalendar/interaction";
import frLocale from "@fullcalendar/core/locales/fr";
import type {
  EventClickArg,
  EventDropArg,
  EventInput,
  DateSelectArg,
  EventMountArg,
} from "@fullcalendar/core";
import { useDataStore, useUIStore } from "@/lib/store";
import { reschedulePost } from "@/lib/posts";
import { toast } from "sonner";
import { FORMATS, CONTENT_TYPES } from "@/lib/types";
import type { Post } from "@/lib/types";

export function CalendarView() {
  const calendarRef = React.useRef<FullCalendar | null>(null);
  const posts = useDataStore((s) => s.posts);
  const upsertPost = useDataStore((s) => s.upsertPost);
  const { viewMode, filters, openEditor } = useUIStore();

  const events: EventInput[] = React.useMemo(() => {
    return posts
      .filter((p) => p.scheduled_for !== null)
      .filter((p) => filters.contentType.length === 0 || (p.content_type !== null && filters.contentType.includes(p.content_type)))
      .filter((p) => filters.status.length === 0 || filters.status.includes(p.status))
      .filter((p) =>
        filters.search.trim() === "" ||
        p.title.toLowerCase().includes(filters.search.toLowerCase()) ||
        (p.caption ?? "").toLowerCase().includes(filters.search.toLowerCase()) ||
        (p.hook ?? "").toLowerCase().includes(filters.search.toLowerCase())
      )
      .map((p) => ({
        id: p.id,
        title: `${FORMATS[p.format].emoji} ${p.title}`,
        start: p.scheduled_for!,
        allDay: !p.scheduled_for!.includes("T") || p.scheduled_for!.endsWith("T00:00:00.000Z"),
        classNames: [
          p.content_type ? `fc-event-${p.content_type.toLowerCase()}` : "",
          `fc-event-status-${p.status.toLowerCase()}`,
          p.visual_url ? "fc-event-with-image" : "",
        ].filter(Boolean),
        extendedProps: { post: p, image: p.visual_url },
      }));
  }, [posts, filters]);

  const fcView = React.useMemo(() => {
    switch (viewMode) {
      case "month": return "dayGridMonth";
      case "week": return "timeGridWeek";
      case "day": return "timeGridDay";
      case "list": return "listWeek";
      case "multimonth": return "multiMonth2Months";
      default: return "dayGridMonth";
    }
  }, [viewMode]);

  React.useEffect(() => {
    if (calendarRef.current) {
      calendarRef.current.getApi().changeView(fcView);
    }
  }, [fcView]);

  const handleEventDrop = async (arg: EventDropArg) => {
    const post = arg.event.extendedProps.post as Post;
    if (!arg.event.start) {
      arg.revert();
      return;
    }
    try {
      const updated = await reschedulePost(post.id, arg.event.start);
      upsertPost(updated);
      toast.success("Post déplacé", {
        description: `${post.title} → ${arg.event.start.toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}`,
      });
    } catch (err) {
      arg.revert();
      toast.error("Impossible de déplacer le post");
      console.error(err);
    }
  };

  const handleEventClick = (arg: EventClickArg) => {
    const post = arg.event.extendedProps.post as Post;
    openEditor(post.id);
  };

  const handleDateSelect = (arg: DateSelectArg) => {
    openEditor(null, arg.start.toISOString());
    arg.view.calendar.unselect();
  };

  const handleEventDidMount = (arg: EventMountArg) => {
    const post = arg.event.extendedProps.post as Post | undefined;
    if (!post) return;
    arg.el.setAttribute("data-content-type", post.content_type ?? "");
    arg.el.setAttribute("data-status", post.status);
    const typeLabel = post.content_type ? CONTENT_TYPES[post.content_type].label : "—";
    arg.el.setAttribute("title", `${typeLabel} · ${FORMATS[post.format].label} · ${post.status}`);

    if (post.visual_url) {
      const titleEl = arg.el.querySelector(".fc-event-title") as HTMLElement | null;
      if (titleEl && !titleEl.querySelector(".fc-thumb")) {
        const img = document.createElement("img");
        img.src = post.visual_url;
        img.alt = "";
        img.className = "fc-thumb";
        img.loading = "lazy";
        img.onerror = () => img.remove();
        titleEl.parentElement?.insertBefore(img, titleEl);
      }
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card p-3 md:p-4 shadow-sm">
      <FullCalendar
        ref={calendarRef}
        plugins={[dayGridPlugin, timeGridPlugin, listPlugin, multiMonthPlugin, interactionPlugin]}
        initialView={fcView}
        locale={frLocale}
        firstDay={1}
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "",
        }}
        height="auto"
        dayMaxEvents={3}
        weekNumbers
        weekText="S"
        nowIndicator
        editable
        droppable
        selectable
        selectMirror
        eventDisplay="block"
        events={events}
        eventDrop={handleEventDrop}
        eventClick={handleEventClick}
        select={handleDateSelect}
        eventDidMount={handleEventDidMount}
        slotMinTime="06:00:00"
        slotMaxTime="24:00:00"
        scrollTime="08:00:00"
        views={{
          multiMonth2Months: {
            type: "multiMonth",
            duration: { months: 2 },
            multiMonthMaxColumns: 2,
          },
          timeGridWeek: {
            slotDuration: "01:00:00",
          },
          listWeek: {
            listDayFormat: { weekday: "long", day: "numeric", month: "long" },
            noEventsContent: "Aucun post planifié sur cette période.",
          },
        }}
        buttonText={{
          today: "Aujourd'hui",
          month: "Mois",
          week: "Semaine",
          day: "Jour",
          list: "Liste",
        }}
      />
    </div>
  );
}
