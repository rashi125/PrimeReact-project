import React, { useEffect, useRef, useState } from "react";
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
}

const ArtworkTable: React.FC = () => {
  const [data, setData] = useState<Artwork[]>([]);
  const [selectedRows, setSelectedRows] = useState<Artwork[]>([]);
  const [rowsToSelect, setRowsToSelect] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  // Pagination states
  const [first, setFirst] = useState(0);
  const [rows, setRows] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);

  const overlayRef = useRef<OverlayPanel>(null);

  const fetchData = async (page: number, number: number) => {
    try {
      setLoading(true);
      const res = await fetchArtworks(page, number);
      setData(res.data); // current page data only
      setTotalRecords(res.total); // total count from API
    } catch (error) {
      console.error("API Fetch Error:", error);
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    const page = first / rows + 1;
    fetchData(page, rows);
  }, [first, rows]);

  // Custom bulk row select
  const handleCustomRowSelect = () => {
    if (!rowsToSelect || rowsToSelect <= 0) return;
    const allowedCount = Math.min(rowsToSelect, data.length);
    const rowsToBeSelected = data.slice(0, allowedCount);
    setSelectedRows(rowsToBeSelected);
    overlayRef.current?.hide();
  };

  // Header with checkbox + dropdown
  const headerWithDropdown = () => {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        {/* Select All (Current Page Only) */}
        <input
          type="checkbox"
          checked={data.length > 0 && selectedRows.length === data.length}
          onChange={(e) => {
            if (e.target.checked) {
              setSelectedRows(data);
            } else {
              setSelectedRows([]);
            }
          }}
        />

        {/* Dropdown icon */}
        <div
          onClick={(e) => overlayRef.current?.toggle(e)}
          className="dropdown-icon"
        >
          <i className="pi pi-chevron-down"></i>
        </div>

        {/* Overlay panel */}
        <OverlayPanel ref={overlayRef}>
          <div style={{ padding: "12px", minWidth: "260px", backgroundColor: "whitesmoke" }}>
            <h4 style={{ margin: "0 0 6px 0", color: "black" }}>Select Multiple Rows</h4>
            <p style={{ fontSize: "13px", color: "#6b7280", marginBottom: "12px" }}>
              Enter number of rows you want (current page only)
            </p>
            <div style={{ display: "flex", gap: "8px" }}>
              <InputNumber
                value={rowsToSelect || undefined}
                onValueChange={(e) => setRowsToSelect(e.value || null)}
                min={1}
                max={rows}
                placeholder="Enter rows"
                style={{ width: "140px", backgroundColor: "white" }}
              />
              <Button label="Select" onClick={handleCustomRowSelect} />
            </div>
          </div>
        </OverlayPanel>
      </div>
    );
  };

  // Pagination handler
  const onPageChange = (event: DataTablePageEvent) => {
    setFirst(event.first);
    setRows(event.rows);
    setSelectedRows([]); // reset selection on page change
  };

  return (
    <div className="card">
      <div style={{ marginBottom: "10px", fontWeight: 500 }}>
        Selected: {selectedRows.length} rows
      </div>

      {/* Table without internal paginator */}
      <DataTable
        value={data}
        loading={loading}
        lazy
        first={first}
        rows={rows}
        totalRecords={totalRecords}
        selection={selectedRows}
        onSelectionChange={(e) => setSelectedRows(e.value)}
        dataKey="id"
      >
        <Column header={headerWithDropdown} selectionMode="multiple" style={{ width: "5rem" }} />
        <Column field="title" header="TITLE" />
        <Column field="place_of_origin" header="PLACE OF ORIGIN" />
        <Column field="artist_display" header="ARTIST" />
      </DataTable>

      {/* External paginator below table */}
      <Paginator
        first={first}
        rows={rows}
        totalRecords={totalRecords}
        rowsPerPageOptions={[10, 20, 50]}
        onPageChange={onPageChange}
        template="CurrentPageReport FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown"
        currentPageReportTemplate="Showing {first} to {last} of {totalRecords} entries"
      />
    </div>
  );
};

export default ArtworkTable;
