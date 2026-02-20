import React, { useEffect, useRef, useState } from "react";
import { PrimeReactProvider } from "primereact/api";
import { DataTable } from "primereact/datatable";
import type { DataTablePageEvent } from "primereact/datatable";
import { Column } from "primereact/column";
import { OverlayPanel } from "primereact/overlaypanel";
import { InputNumber } from "primereact/inputnumber";
import { Button } from "primereact/button";
import { Paginator } from "primereact/paginator";
import { fetchArtworks } from "./service/api";

import "./App.css";

interface Artwork {
  id: number;
  title: string;
  place_of_origin: string;
  artist_display: string;
  date_start?: number;
  date_end?: number;
  inscriptions?: string;
}

const ArtworkTable: React.FC = () => {
  // Current page data (only store the rows for the page we fetched)
  const [data, setData] = useState<Artwork[]>([]);

  // The rows currently selected on the visible page (array of Artwork objects)
  const [selectedRows, setSelectedRows] = useState<Artwork[]>([]);

  // Persistent selection tracking by page number.
  // Key: page number (1-based). Value: array of selected row IDs for that page.
  // We store IDs only (not full objects) to avoid prefetching or mass memory usage.
  const [selectedIdsByPage, setSelectedIdsByPage] = useState<Record<number, number[]>>({});

  // Value entered in the overlay panel to select N rows on the current page
  const [rowsToSelect, setRowsToSelect] = useState<number | null>(null);

  // Loading indicator for API calls
  const [loading, setLoading] = useState(false);

  // Paginator state: index of first record and rows per page
  const [first, setFirst] = useState(0);
  const [rows, setRows] = useState(10);

  // Total records reported by the API (used by paginator)
  const [totalRecords, setTotalRecords] = useState(0);

  // OverlayPanel ref to programmatically hide/show the custom selection panel
  const overlayRef = useRef<OverlayPanel>(null);

  // Fetch page data from the API (server-side pagination)
  const fetchData = async (page: number, pageSize: number) => {
    try {
      setLoading(true);
      const res = await fetchArtworks(page, pageSize);
      // API contract: res.data is the array of artworks for this page, res.total is total count
      setData(res.data);
      setTotalRecords(res.total);
    } catch (error) {
      // Log and clear data on error so UI doesn't show stale rows
      console.error("API Fetch Error:", error);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  // When paginator state changes, fetch the corresponding page from server
  useEffect(() => {
    const page = first / rows + 1; // convert zero-based first to 1-based page
    fetchData(page, rows);
  }, [first, rows]);

  // When the page data arrives (or when page changes), restore selection for that page.
  // We only restore selections for the current page using IDs stored in selectedIdsByPage.
  useEffect(() => {
    const currentPage = Math.floor(first / rows) + 1;
    const ids = selectedIdsByPage[currentPage] || [];

    // If nothing selected on this page, clear the visible selection array
    if (ids.length === 0) {
      setSelectedRows([]);
      return;
    }

    // Rebuild selectedRows from the current page's data using stored IDs.
    // This avoids storing objects from other pages and prevents prefetching.
    const restored = data.filter((d) => ids.includes(d.id));
    setSelectedRows(restored);
  }, [data, first, rows, selectedIdsByPage]);

  // A ref to the header checkbox so we can set its indeterminate state reliably.
  // Using a ref + effect is more robust than setting indeterminate inline in JSX.
  const checkboxRef = useRef<HTMLInputElement>(null);

  // Update header checkbox visual state (checked / indeterminate) whenever selection changes.
  useEffect(() => {
    if (checkboxRef.current) {
      const currentPage = Math.floor(first / rows) + 1;
      const currentSelectedIds = selectedIdsByPage[currentPage] || [];

      // allSelected: every row on the current page is selected
      const allSelected = data.length > 0 && currentSelectedIds.length === data.length;

      // partiallySelected: some rows selected but not all
      const partiallySelected = currentSelectedIds.length > 0 && !allSelected;

      checkboxRef.current.indeterminate = partiallySelected;
      checkboxRef.current.checked = allSelected;
    }
  }, [data, first, rows, selectedIdsByPage]);

  // Clean up overlay when component unmounts
  useEffect(() => {
    return () => {
      overlayRef.current?.hide();
    };
  }, []);

  // Handler for the overlay "Apply" button: select first N rows on the current page.
  // Important: this only operates on the current page's data and never fetches other pages.
  const handleCustomRowSelect = () => {
    if (!rowsToSelect || rowsToSelect <= 0) return;

    // Only select up to the number of rows available on the current page
    const count = Math.min(rowsToSelect, data.length);
    const rowsToBeSelected = data.slice(0, count);

    const currentPage = Math.floor(first / rows) + 1;

    // Update visible selection and persist IDs for this page
    setSelectedRows(rowsToBeSelected);
    setSelectedIdsByPage((prev) => ({
      ...prev,
      [currentPage]: rowsToBeSelected.map((r) => r.id),
    }));

    // Close overlay and reset input
    overlayRef.current?.hide();
    setRowsToSelect(null);
  };

  // Header renderer for the selection column. Shows a tri-state checkbox and the overlay trigger.
  // We compute the header state from selectedIdsByPage so it reflects persisted selections.
  const selectionHeader = () => {
    const currentPage = Math.floor(first / rows) + 1;
    const currentSelectedIds = selectedIdsByPage[currentPage] || [];

    const allSelected = data.length > 0 && currentSelectedIds.length === data.length;
    const partiallySelected = currentSelectedIds.length > 0 && !allSelected;

    return (
      <div className="header-container" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        {/* Header checkbox controls selection for the current page only.
            We use a ref in the outer effect to set indeterminate; here we still set onChange behavior. */}
        <input
          type="checkbox"
          ref={(el) => {
            // Keep this inline setter minimal; the authoritative visual state is set in the effect above.
            if (el) el.indeterminate = partiallySelected;
          }}
          onChange={(e) => {
            const currentPage = Math.floor(first / rows) + 1;
            if (e.target.checked) {
              // Select all rows on the current page: store IDs only
              const ids = data.map((d) => d.id);
              setSelectedRows([...data]);
              setSelectedIdsByPage((prev) => ({ ...prev, [currentPage]: ids }));
            } else {
              // Deselect all on this page: remove the page key from the map
              setSelectedRows([]);
              setSelectedIdsByPage((prev) => {
                const copy = { ...prev };
                delete copy[currentPage];
                return copy;
              });
            }
          }}
        />

        {/* Small trigger to open the custom selection overlay */}
        <div className="dropdown-trigger" style={{ cursor: "pointer" }} onClick={(e) => overlayRef.current?.toggle(e)}>
          <i className="pi pi-chevron-down" style={{ backgroundColor: "#f3f4f6", padding: "2px", borderRadius: "2px" }}></i>
        </div>
      </div>
    );
  };

  // Paginator change handler: update first and rows which triggers fetchData effect
  const onPageChange = (event: DataTablePageEvent) => {
    setFirst(event.first);
    setRows(event.rows);
  };

  return (
    <PrimeReactProvider>
      <div className="card">
        {/* Simple status line so users know how many rows are selected on the visible page */}
        <div className="selected-heading" style={{ padding: "1rem", fontWeight: "bold" }}>
          Selected Rows: {selectedRows.length}
        </div>

        {/* DataTable configured for server-side pagination and multiple selection.
            Note: selectionMode is applied on the Column; DataTable receives the selection array. */}
        <DataTable
          value={data}
          loading={loading}
          lazy
          dataKey="id"
          selectionMode="multiple"
          selection={selectedRows}
          onSelectionChange={(e) => {
            // e.value is the new selection for the current page; treat it as an array of Artwork
            const selected: Artwork[] = e.value || [];
            setSelectedRows(selected);

            // Persist selected IDs for the current page so selection survives navigation
            const currentPage = Math.floor(first / rows) + 1;
            setSelectedIdsByPage((prev) => ({
              ...prev,
              [currentPage]: selected.map((s) => s.id),
            }));
          }}
          responsiveLayout="scroll"
        >
          {/* Column with custom header (checkbox + overlay trigger) and built-in row checkboxes */}
          <Column header={selectionHeader} selectionMode="multiple" style={{ width: "4rem" }} />
          <Column field="title" header="TITLE" />
          <Column field="place_of_origin" header="PLACE OF ORIGIN" />
          <Column field="artist_display" header="ARTIST" />
          <Column field="inscriptions" header="INSCRIPTIONS" />
          <Column field="date_start" header="START DATE" />
          <Column field="date_end" header="END DATE" />
        </DataTable>

        {/* Paginator wired to server-side fetch */}
        <Paginator
          first={first}
          rows={rows}
          totalRecords={totalRecords}
          rowsPerPageOptions={[10, 20, 50]}
          onPageChange={onPageChange}
          template="RowsPerPageDropdown PrevPageLink PageLinks NextPageLink CurrentPageReport"
        />

        {/* Overlay panel for custom selection (select first N rows on current page only) */}
        <OverlayPanel
          ref={overlayRef}
          appendTo={typeof document !== "undefined" ? document.body : null}
          style={{ backgroundColor: "whitesmoke", padding: "1.5rem", borderRadius: "8px", boxShadow: "0 4px 12px rgba(0,0,0,0.15)" }}
        >
          <div className="custom-panel" style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <h4 className="panel-title" style={{ color: "#333", margin: 0 }}>Select Rows</h4>
            <p className="panel-subtitle" style={{ color: "#666", fontSize: "12px", margin: 0 }}>
              Selection applies to current page only
            </p>

            {/* InputNumber restricts the value to the number of rows currently loaded */}
            <InputNumber
              value={rowsToSelect ?? undefined}
              onValueChange={(e) => setRowsToSelect(e.value ?? null)}
              min={1}
              max={data.length}
              placeholder="Enter No of rows to select"
              style={{ width: "100%" }}
            />

            <Button label="Apply" icon="pi pi-check" onClick={handleCustomRowSelect} className="p-button-sm" />
          </div>
        </OverlayPanel>
      </div>
    </PrimeReactProvider>
  );
};

export default ArtworkTable;
