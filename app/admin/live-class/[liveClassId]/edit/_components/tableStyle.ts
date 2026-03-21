import styled from "@emotion/styled";

export const StyleWrapper = styled.div`
  /* calendar font */
  .fc {
    font-family: inherit;
    color: hsl(var(--foreground));
  }

  .fc .fc-col-header-cell {
    background: #747f8a !important;
  }

  /* remove ugly borders */
  .fc-theme-standard td,
  .fc-theme-standard th {
    // border-color: hsl(var(--border)) !important;
  }

  /* header (Mon Tue Wed etc) */
  .fc-col-header-cell {
    background: hsl(var(--muted));
    color: hsl(var(--foreground));
    font-weight: 500;
    padding: 8px 0;
  }

  /* day cells */
  .fc-daygrid-day {
    background: hsl(var(--background));
  }

  /* today highlight */
  .fc-day-today {
    // background: hsl(var(--accent));
  }

  /* day numbers */
  .fc-daygrid-day-number {
    color: hsl(var(--foreground));
    font-size: 0.875rem;
  }

  /* event style */
  .fc .fc-daygrid-event {
    border-bottom: 2px solid hsl(var(--primary)) !important;
  }
  .fc-event {
    background: #3788d8 !important;
    background: hsl(var(--primary));
    border: none;
    color: hsl(var(--primary-foreground));
    border-radius: 6px;
    padding: 2px 6px;
    font-size: 0.75rem;
  }

  /* event hover */
  .fc-event:hover {
    opacity: 0.9;
  }

  /* toolbar */
  .fc-toolbar-title {
    font-size: 1rem;
    font-weight: 600;
  }

  /* buttons */
  .fc-button {
    background: hsl(var(--background));
    border: 1px solid hsl(var(--border));
    color: hsl(var(--foreground));
    padding: 6px 10px;
    font-size: 0.875rem;
    border-radius: 6px;
    box-shadow: none;
  }

  /* button hover */
  .fc-button:hover {
    background: hsl(var(--accent));
  }

  /* active button */
  .fc-button-active {
    background: hsl(var(--primary));
    color: hsl(var(--primary-foreground));
  }

  /* remove ugly focus outline */
  .fc-button:focus {
    box-shadow: none;
  }

  /* grid height spacing */
  .fc-daygrid-day-frame {
    padding: 4px;
  }

  /* scrollbars (week view) */
  .fc-scroller {
    scrollbar-width: thin;
  }
`;
