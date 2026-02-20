import React, { useEffect, useRef, useState } from "react";
import { PrimeReactProvider } from "primereact/api";
import { DataTable } from "primereact/datatable";
import type {
  DataTablePageEvent,
  DataTableSelectionMultipleChangeEvent,
} from "primereact/datatable";
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
  const [data, setData] = useState<Artwork[]>([]);
  const [selectedRows, setSelectedRows] = useState<Artwork[]>([]);

  const [selectedIdsByPage, setSelectedIdsByPage] = useState<
    Record<number, number[]>
  >({});
  const [rowsToSelect, setRowsToSelect] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const [first, setFirst] = useState(0);
  const [rows, setRows] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);

  const overlayRef = useRef<OverlayPanel>(null);

  const fetchData = async (page: number, pageSize: number) => {
    try {
      setLoading(true);
      const res = await fetchArtworks(page, pageSize);
      setData(res.data);
      setTotalRecords(res.total);
    } catch (error) {
      console.error("API Fetch Error:", error);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const page = first / rows + 1;
    fetchData(page, rows);
  }, [first, rows]);

  useEffect(() => {
    const currentPage = Math.floor(first / rows) + 1;
    const ids = selectedIdsByPage[currentPage] || [];
    if (ids.length === 0) {
      setSelectedRows([]);
      return;
    }
    const restored = data.filter((d) => ids.includes(d.id));
    setSelectedRows(restored);
  }, [data, first, rows, selectedIdsByPage]);

  const checkboxRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (checkboxRef.current) {
      const currentPage = Math.floor(first / rows) + 1;
      const currentSelectedIds = selectedIdsByPage[currentPage] || [];
      const allSelected =
        data.length > 0 && currentSelectedIds.length === data.length;
      const partiallySelected = currentSelectedIds.length > 0 && !allSelected;

      checkboxRef.current.indeterminate = partiallySelected;
      checkboxRef.current.checked = allSelected;
    }
  }, [data, first, rows, selectedIdsByPage]);

  useEffect(() => {
    return () => {
      overlayRef.current?.hide();
    };
  }, []);

  const handleCustomRowSelect = () => {
    if (!rowsToSelect || rowsToSelect <= 0) return;

    const count = Math.min(rowsToSelect, data.length);
    const rowsToBeSelected = data.slice(0, count);

    const currentPage = Math.floor(first / rows) + 1;
    setSelectedRows(rowsToBeSelected);
    setSelectedIdsByPage((prev) => ({
      ...prev,
      [currentPage]: rowsToBeSelected.map((r) => r.id),
    }));
    overlayRef.current?.hide();
    setRowsToSelect(null);
  };

  const selectionHeader = () => {
    const currentPage = Math.floor(first / rows) + 1;
    const currentSelectedIds = selectedIdsByPage[currentPage] || [];

    const allSelected =
      data.length > 0 && currentSelectedIds.length === data.length;
    const partiallySelected = currentSelectedIds.length > 0 && !allSelected;

    return (
      <div
        className="header-container"
        style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
      >
        <input
          type="checkbox"
          ref={(el) => {
            if (el) el.indeterminate = partiallySelected;
          }}
          onChange={(e) => {
            const currentPage = Math.floor(first / rows) + 1;
            if (e.target.checked) {
              const ids = data.map((d) => d.id);
              setSelectedRows([...data]);
              setSelectedIdsByPage((prev) => ({ ...prev, [currentPage]: ids }));
            } else {
              setSelectedRows([]);
              setSelectedIdsByPage((prev) => {
                const copy = { ...prev };
                delete copy[currentPage];
                return copy;
              });
            }
          }}
        />

        <div
          className="dropdown-trigger"
          style={{ cursor: "pointer" }}
          onClick={(e) => overlayRef.current?.toggle(e)}
        >
          <i
            className="pi pi-chevron-down"
            style={{
              backgroundColor: "#f3f4f6",
              padding: "2px",
              borderRadius: "2px",
            }}
          ></i>
        </div>
      </div>
    );
  };

  const onSelectionChange = (
    e: DataTableSelectionMultipleChangeEvent<Artwork[]>
  ) => {
    const selected = e.value ?? [];
    setSelectedRows(selected);
    const currentPage = Math.floor(first / rows) + 1;
    setSelectedIdsByPage((prev) => ({
      ...prev,
      [currentPage]: selected.map((s) => s.id),
    }));
  };

  const onPageChange = (event: DataTablePageEvent) => {
    setFirst(event.first);
    setRows(event.rows);
  };

  return (
    <PrimeReactProvider>
      <div className="card">
        <div
          className="selected-heading"
          style={{ padding: "1rem", fontWeight: "bold" }}
        >
          Selected Rows: {selectedRows.length}
        </div>

        <DataTable
          value={data}
          loading={loading}
          lazy
          dataKey="id"
          selection={selectedRows}
          onSelectionChange={onSelectionChange}
          responsiveLayout="scroll"
        >
          <Column
            header={selectionHeader}
            selectionMode="multiple"
            style={{ width: "4rem" }}
          />
          <Column field="title" header="TITLE" />
          <Column field="place_of_origin" header="PLACE OF ORIGIN" />
          <Column field="artist_display" header="ARTIST" />
          <Column field="inscriptions" header="INSCRIPTIONS" />
          <Column field="date_start" header="START DATE" />
          <Column field="date_end" header="END DATE" />
        </DataTable>

        <Paginator
          first={first}
          rows={rows}
          totalRecords={totalRecords}
          rowsPerPageOptions={[10, 20, 50]}
          onPageChange={onPageChange}
          template="RowsPerPageDropdown PrevPageLink PageLinks NextPageLink CurrentPageReport"
        />

        <OverlayPanel
          ref={overlayRef}
          appendTo={typeof document !== "undefined" ? document.body : null}
          style={{
            backgroundColor: "whitesmoke",
            padding: "1.5rem",
            borderRadius: "8px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          }}
        >
          <div
            className="custom-panel"
            style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}
          >
            <h4 className="panel-title" style={{ color: "#333", margin: 0 }}>
              Select Rows
            </h4>
            <p
              className="panel-subtitle"
              style={{ color: "#666", fontSize: "12px", margin: 0 }}
            >
              Selection applies to current page only
            </p>

            <InputNumber
              value={rowsToSelect ?? undefined}
              onValueChange={(e) => setRowsToSelect(e.value ?? null)}
              min={1}
              max={data.length}
              placeholder="Enter No of rows to select"
              style={{ width: "100%" }}
            />

            <Button
              label="Apply"
              icon="pi pi-check"
              onClick={handleCustomRowSelect}
              className="p-button-sm"
            />
          </div>
        </OverlayPanel>
      </div>
    </PrimeReactProvider>
  );
};

export default ArtworkTable;